#!/usr/bin/env python3
"""
Blueprint para sistema de mesas do Thaolundra RPG
Gerencia mesas multiplayer, personagens ativos e interações
"""
from flask import Blueprint, render_template, jsonify, request, session
from flask_login import login_required, current_user
from database import get_db_connection, execute_query
import logging

logger = logging.getLogger(__name__)

mesa_bp = Blueprint('mesa', __name__, url_prefix='/mesa')


# ============================================
# PÁGINAS HTML
# ============================================

@mesa_bp.route('/')
@login_required
def listar_mesas():
    conn = get_db_connection()
    if not conn:
        return "Erro de banco de dados", 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT DISTINCT m.id, m.nome, m.descricao, m.capacidade, m.privada, m.ativa, m.imagem_fundo,
                   COUNT(DISTINCT mo.usuario_id) as participantes_atual,
                   u.username as narrador_nome,
                   -- sou_participante: está na mesa como qualquer tipo
                   CASE WHEN EXISTS (
                       SELECT 1 FROM mesa_online mo2 
                       WHERE mo2.mesa_id = m.id AND mo2.usuario_id = %s
                   ) THEN 1 ELSE 0 END as sou_participante,
                   -- sou_narrador: está na mesa como narrador
                   CASE WHEN EXISTS (
                       SELECT 1 FROM mesa_online mo3
                       WHERE mo3.mesa_id = m.id AND mo3.usuario_id = %s AND mo3.tipo = 'narrador'
                   ) THEN 1 ELSE 0 END as sou_narrador,
                   -- pode_entrar: baseado nas regras
                   CASE 
                       -- Narrador sempre pode entrar
                       WHEN EXISTS (
                           SELECT 1 FROM mesa_online mo3
                           WHERE mo3.mesa_id = m.id AND mo3.usuario_id = %s AND mo3.tipo = 'narrador'
                       ) THEN 1
                       -- Guardião+ sempre pode entrar
                       WHEN %s >= 6 THEN 1
                       -- Mesa privada: precisa estar na mesa como jogador
                       WHEN m.privada = 1 AND EXISTS (
                           SELECT 1 FROM mesa_online mo4
                           WHERE mo4.mesa_id = m.id AND mo4.usuario_id = %s AND mo4.tipo = 'jogador'
                       ) THEN 1
                       -- Mesa pública: só precisa estar ativa
                       WHEN m.privada = 0 AND m.ativa = 1 THEN 1
                       ELSE 0
                   END as pode_entrar,
                   -- pode_editar: narrador ou guardião+
                   CASE 
                       WHEN EXISTS (
                           SELECT 1 FROM mesa_online mo5
                           WHERE mo5.mesa_id = m.id AND mo5.usuario_id = %s AND mo5.tipo = 'narrador'
                       ) THEN 1
                       WHEN %s >= 6 THEN 1
                       ELSE 0
                   END as pode_editar,
                   -- pode_assistir: baseado nas regras
                   CASE 
                       -- Narrador sempre pode assistir
                       WHEN EXISTS (
                           SELECT 1 FROM mesa_online mo6
                           WHERE mo6.mesa_id = m.id AND mo6.usuario_id = %s AND mo6.tipo = 'narrador'
                       ) THEN 1
                       -- Moderador+ sempre pode assistir
                       WHEN %s >= 4 THEN 1
                       -- Mesa privada: precisa estar na mesa como espectador/jogador/narrador
                       WHEN m.privada = 1 AND EXISTS (
                           SELECT 1 FROM mesa_online mo7
                           WHERE mo7.mesa_id = m.id AND mo7.usuario_id = %s
                       ) THEN 1
                       -- Mesa pública: só precisa estar ativa
                       WHEN m.privada = 0 AND m.ativa = 1 THEN 1
                       ELSE 0
                   END as pode_assistir,
                   (SELECT COUNT(*) FROM mesa_online WHERE mesa_id = m.id) as total_conexoes,
                   CASE WHEN EXISTS (
                       SELECT 1 FROM mesa_convites WHERE mesa_id = m.id AND usuario_id = %s AND status = 'pendente'
                   ) THEN 1 ELSE 0 END as convite_pendente
            FROM mesas m
            LEFT JOIN mesa_online mo ON m.id = mo.mesa_id
            LEFT JOIN usuarios u ON mo.usuario_id = u.id AND mo.tipo = 'narrador'
            WHERE m.ativa = TRUE
            GROUP BY m.id
            ORDER BY m.nome
        """, (
            current_user.id,  # sou_participante
            current_user.id,  # sou_narrador
            current_user.id,  # pode_entrar - narrador
            current_user.nivel_credencial,  # pode_entrar - nivel
            current_user.id,  # pode_entrar - privada jogador
            current_user.id,  # pode_editar - narrador
            current_user.nivel_credencial,  # pode_editar - nivel
            current_user.id,  # pode_assistir - narrador
            current_user.nivel_credencial,  # pode_assistir - nivel
            current_user.id,  # pode_assistir - privada membro
            current_user.id   # convite_pendente
        ))
        mesas = cursor.fetchall()

        # Para cada mesa, buscar conexões
        for mesa in mesas:
            cursor.execute("""
                SELECT u.username as nome, mo.tipo as cargo
                FROM mesa_online mo
                JOIN usuarios u ON mo.usuario_id = u.id
                WHERE mo.mesa_id = %s
                ORDER BY mo.tipo = 'narrador' DESC, u.username
            """, (mesa['id'],))
            mesa['conexoes'] = cursor.fetchall()

        # Buscar minhas mesas (mesmo padrão)
        cursor.execute("""
            SELECT DISTINCT m.id, m.nome, m.descricao, m.capacidade, m.privada, m.ativa, m.imagem_fundo,
                   COUNT(DISTINCT mo.usuario_id) as participantes_atual,
                   u.username as narrador_nome,
                   1 as sou_narrador,
                   1 as pode_entrar,
                   1 as pode_editar,
                   1 as pode_assistir,
                   (SELECT COUNT(*) FROM mesa_online WHERE mesa_id = m.id) as total_conexoes
            FROM mesas m
            JOIN mesa_online mo ON m.id = mo.mesa_id AND mo.tipo = 'narrador'
            LEFT JOIN usuarios u ON mo.usuario_id = u.id
            WHERE mo.usuario_id = %s
            GROUP BY m.id
            ORDER BY m.nome
        """, (current_user.id,))
        minhas_mesas = cursor.fetchall()

        for mesa in minhas_mesas:
            cursor.execute("""
                SELECT u.username as nome, mo.tipo as cargo
                FROM mesa_online mo
                JOIN usuarios u ON mo.usuario_id = u.id
                WHERE mo.mesa_id = %s
                ORDER BY mo.tipo = 'narrador' DESC, u.username
            """, (mesa['id'],))
            mesa['conexoes'] = cursor.fetchall()

        return render_template('listar_mesas.html',
                               mesas=mesas,
                               minhas_mesas=minhas_mesas,
                               user=current_user)

    except Exception as e:
        logger.error(f"Erro ao listar mesas: {e}")
        return "Erro ao carregar mesas", 500
    finally:
        cursor.close()
        conn.close()


@mesa_bp.route('/<int:mesa_id>')
@login_required
def mesa(mesa_id):
    conn = get_db_connection()
    if not conn:
        return "Erro de banco de dados", 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT m.*, u.username as narrador_nome
            FROM mesas m
            LEFT JOIN mesa_online mo ON m.id = mo.mesa_id AND mo.tipo = 'narrador'
            LEFT JOIN usuarios u ON mo.usuario_id = u.id
            WHERE m.id = %s AND m.ativa = TRUE
        """, (mesa_id,))
        mesa = cursor.fetchone()

        if not mesa:
            return "Mesa não encontrada", 404

        cursor.execute("""
            SELECT mesa_id FROM mesa_online 
            WHERE mesa_id = %s AND usuario_id = %s AND tipo = 'narrador'
        """, (mesa_id, current_user.id))
        is_narrador = cursor.fetchone() is not None

        cursor.execute("""
            SELECT mesa_id FROM mesa_online 
            WHERE mesa_id = %s AND usuario_id = %s
        """, (mesa_id, current_user.id))
        is_participante = cursor.fetchone() is not None

        return render_template('mesa.html',
                               mesa=mesa,
                               is_narrador=is_narrador,
                               is_participante=is_participante,
                               user=current_user)

    except Exception as e:
        logger.error(f"Erro ao carregar mesa {mesa_id}: {e}")
        return "Erro ao carregar mesa", 500
    finally:
        cursor.close()
        conn.close()


@mesa_bp.route('/ativas')
@login_required
def mesas_ativas():
    conn = get_db_connection()
    if not conn:
        return "Erro de banco de dados", 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT m.id, m.nome, m.descricao, m.capacidade,
                   COUNT(DISTINCT mo.usuario_id) as participantes_atual,
                   u.username as narrador_nome
            FROM mesas m
            LEFT JOIN mesa_online mo ON m.id = mo.mesa_id
            LEFT JOIN usuarios u ON mo.usuario_id = u.id AND mo.tipo = 'narrador'
            WHERE m.ativa = TRUE AND m.privada = FALSE
            GROUP BY m.id
            ORDER BY m.nome
        """, ())
        mesas = cursor.fetchall()
        return render_template('listar_mesas.html', mesas=mesas, minhas_mesas=[], user=current_user)
    except Exception as e:
        logger.error(f"Erro ao listar mesas ativas: {e}")
        return "Erro ao carregar mesas", 500
    finally:
        cursor.close()
        conn.close()


@mesa_bp.route('/minhas')
@login_required
def minhas_mesas():
    conn = get_db_connection()
    if not conn:
        return "Erro de banco de dados", 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT DISTINCT m.id, m.nome, m.descricao, m.capacidade, m.privada, m.ativa,
                   COUNT(DISTINCT mo.usuario_id) as participantes_atual,
                   u.username as narrador_nome
            FROM mesas m
            LEFT JOIN mesa_online mo ON m.id = mo.mesa_id
            LEFT JOIN usuarios u ON mo.usuario_id = u.id AND mo.tipo = 'narrador'
            WHERE m.id IN (
                SELECT mesa_id FROM mesa_online WHERE usuario_id = %s
            )
            GROUP BY m.id
            ORDER BY m.ativa DESC, m.nome
        """, (current_user.id,))
        minhas_mesas = cursor.fetchall()
        return render_template('listar_mesas.html', mesas=[], minhas_mesas=minhas_mesas, user=current_user)
    except Exception as e:
        logger.error(f"Erro ao listar minhas mesas: {e}")
        return "Erro ao carregar mesas", 500
    finally:
        cursor.close()
        conn.close()


@mesa_bp.route('/criar', methods=['GET', 'POST'])
@login_required
def criar_mesa():
    if current_user.nivel_credencial < 5:
        if request.method == 'GET':
            return render_template('errors/403.html', description='Acesso negado - Nível 5+ requerido'), 403
        return jsonify({'success': False, 'message': 'Acesso negado - Nível 5+ requerido'}), 403

    if request.method == 'GET':
        return render_template('criar_mesa.html', user=current_user)

    data = request.get_json()
    nome = data.get('nome', '').strip()
    descricao = data.get('descricao', '').strip()
    capacidade = data.get('capacidade', 5)
    privada = data.get('privada', False)

    if not nome or len(nome) < 3:
        return jsonify({'success': False, 'message': 'Nome da mesa deve ter pelo menos 3 caracteres'}), 400

    try:
        result = execute_query(
            """
            INSERT INTO mesas (nome, descricao, capacidade, privada, ativa, data_criacao)
            VALUES (%s, %s, %s, %s, TRUE, NOW())
            """,
            (nome, descricao, capacidade, 1 if privada else 0),
            commit=True
        )

        if result:
            mesa_id = result
            execute_query(
                "INSERT INTO mesa_online (mesa_id, usuario_id, tipo) VALUES (%s, %s, 'narrador')",
                (mesa_id, current_user.id),
                commit=True
            )
            logger.info(f"Usuário {current_user.username} criou mesa '{nome}'")
            return jsonify({
                'success': True,
                'message': 'Mesa criada com sucesso',
                'mesa_id': mesa_id
            })
        else:
            return jsonify({'success': False, 'message': 'Erro ao criar mesa'}), 500

    except Exception as e:
        logger.error(f"Erro ao criar mesa: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# API - DADOS DA MESA
# ============================================

@mesa_bp.route('/api/<int:mesa_id>/dados')
@login_required
def api_dados_mesa(mesa_id):
    """Retorna dados completos da mesa para o modal de edição"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT mesa_id FROM mesa_online 
            WHERE mesa_id = %s AND usuario_id = %s AND tipo = 'narrador'
        """, (mesa_id, current_user.id))

        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Acesso negado'}), 403

        cursor.execute("""
            SELECT id, nome, descricao, capacidade, capacidade_espectadores,
                   ativa, privada, senha_jogadores, senha_espectadores,
                   imagem_fundo
            FROM mesas
            WHERE id = %s
        """, (mesa_id,))

        mesa = cursor.fetchone()

        if not mesa:
            return jsonify({'success': False, 'message': 'Mesa não encontrada'}), 404

        return jsonify({'success': True, 'mesa': mesa})

    except Exception as e:
        logger.error(f"Erro ao buscar dados da mesa {mesa_id}: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@mesa_bp.route('/api/<int:mesa_id>/config', methods=['PUT'])
@login_required
def api_atualizar_config_mesa(mesa_id):
    """Atualiza configurações da mesa"""
    data = request.get_json()

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT mesa_id FROM mesa_online 
            WHERE mesa_id = %s AND usuario_id = %s AND tipo = 'narrador'
        """, (mesa_id, current_user.id))

        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Acesso negado'}), 403

        cursor.execute("""
            UPDATE mesas SET
                nome = %s,
                descricao = %s,
                capacidade = %s,
                capacidade_espectadores = %s,
                ativa = %s,
                privada = %s,
                senha_jogadores = %s,
                senha_espectadores = %s,
                imagem_fundo = %s
            WHERE id = %s
        """, (
            data.get('nome'),
            data.get('descricao'),
            data.get('capacidade', 6),
            data.get('capacidade_espectadores', 10),
            1 if data.get('ativa') else 0,
            1 if data.get('privada') else 0,
            data.get('senha_jogadores'),
            data.get('senha_espectadores'),
            data.get('imagem_fundo'),
            mesa_id
        ))
        conn.commit()

        return jsonify({'success': True, 'message': 'Configurações atualizadas com sucesso'})

    except Exception as e:
        logger.error(f"Erro ao atualizar configurações da mesa {mesa_id}: {e}")
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ============================================
# API - MEMBROS
# ============================================

@mesa_bp.route('/api/<int:mesa_id>/membros')
@login_required
def api_membros_mesa(mesa_id):
    """Retorna lista de membros da mesa"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT mo.usuario_id, u.username, mo.tipo as papel
            FROM mesa_online mo
            JOIN usuarios u ON mo.usuario_id = u.id
            WHERE mo.mesa_id = %s
            ORDER BY mo.tipo = 'narrador' DESC, u.username
        """, (mesa_id,))
        membros = cursor.fetchall()

        return jsonify({'success': True, 'membros': membros})

    except Exception as e:
        logger.error(f"Erro ao buscar membros da mesa {mesa_id}: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@mesa_bp.route('/api/membros', methods=['DELETE'])
@login_required
def api_remover_membro():
    """Remove um membro da mesa"""
    data = request.get_json()
    mesa_id = data.get('mesa_id')
    usuario_id = data.get('usuario_id')

    if not mesa_id or not usuario_id:
        return jsonify({'success': False, 'message': 'Dados incompletos'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT mesa_id FROM mesa_online 
            WHERE mesa_id = %s AND usuario_id = %s AND tipo = 'narrador'
        """, (mesa_id, current_user.id))

        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Acesso negado'}), 403

        cursor.execute("""
            SELECT tipo FROM mesa_online 
            WHERE mesa_id = %s AND usuario_id = %s
        """, (mesa_id, usuario_id))
        membro = cursor.fetchone()

        if not membro:
            return jsonify({'success': False, 'message': 'Membro não encontrado'}), 404

        cursor.execute("""
            SELECT COUNT(*) as total FROM mesa_online 
            WHERE mesa_id = %s AND tipo = 'narrador'
        """, (mesa_id,))
        count = cursor.fetchone()

        if count['total'] <= 1 and membro['tipo'] == 'narrador':
            return jsonify({'success': False, 'message': 'Não pode remover o único narrador da mesa'}), 400

        cursor.execute("""
            DELETE FROM mesa_online 
            WHERE mesa_id = %s AND usuario_id = %s
        """, (mesa_id, usuario_id))
        conn.commit()

        return jsonify({'success': True, 'message': 'Membro removido com sucesso'})

    except Exception as e:
        logger.error(f"Erro ao remover membro: {e}")
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@mesa_bp.route('/api/membros/promover', methods=['PUT'])
@login_required
def api_promover_membro():
    """Promove um membro a Narrador"""
    data = request.get_json()
    mesa_id = data.get('mesa_id')
    usuario_id = data.get('usuario_id')
    novo_papel = data.get('novo_papel', 'Narrador')

    if not mesa_id or not usuario_id:
        return jsonify({'success': False, 'message': 'Dados incompletos'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT mesa_id FROM mesa_online 
            WHERE mesa_id = %s AND usuario_id = %s AND tipo = 'narrador'
        """, (mesa_id, current_user.id))

        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Acesso negado'}), 403

        cursor.execute("""
            SELECT tipo FROM mesa_online 
            WHERE mesa_id = %s AND usuario_id = %s
        """, (mesa_id, usuario_id))

        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Membro não encontrado'}), 404

        cursor.execute("""
            UPDATE mesa_online SET tipo = %s 
            WHERE mesa_id = %s AND usuario_id = %s
        """, (novo_papel.lower(), mesa_id, usuario_id))
        conn.commit()

        return jsonify({'success': True, 'message': 'Membro promovido com sucesso'})

    except Exception as e:
        logger.error(f"Erro ao promover membro: {e}")
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@mesa_bp.route('/api/membros/rebaixar', methods=['PUT'])
@login_required
def api_rebaixar_membro():
    """Rebaixa um membro a Espectador"""
    data = request.get_json()
    mesa_id = data.get('mesa_id')
    usuario_id = data.get('usuario_id')
    novo_papel = data.get('novo_papel', 'Espectador')

    if not mesa_id or not usuario_id:
        return jsonify({'success': False, 'message': 'Dados incompletos'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT mesa_id FROM mesa_online 
            WHERE mesa_id = %s AND usuario_id = %s AND tipo = 'narrador'
        """, (mesa_id, current_user.id))

        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Acesso negado'}), 403

        cursor.execute("""
            SELECT tipo FROM mesa_online 
            WHERE mesa_id = %s AND usuario_id = %s
        """, (mesa_id, usuario_id))

        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Membro não encontrado'}), 404

        cursor.execute("""
            UPDATE mesa_online SET tipo = %s 
            WHERE mesa_id = %s AND usuario_id = %s
        """, (novo_papel.lower(), mesa_id, usuario_id))
        conn.commit()

        return jsonify({'success': True, 'message': 'Membro rebaixado com sucesso'})

    except Exception as e:
        logger.error(f"Erro ao rebaixar membro: {e}")
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ============================================
# API - CONVITES
# ============================================

@mesa_bp.route('/api/convites', methods=['POST'])
@login_required
def api_criar_convite():
    """Cria um convite para um usuário entrar na mesa"""
    data = request.get_json()
    mesa_id = data.get('mesa_id')
    username = data.get('username', '').strip()
    papel = data.get('papel', 'jogador')

    if not mesa_id or not username:
        return jsonify({'success': False, 'message': 'Dados incompletos'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT mesa_id FROM mesa_online 
            WHERE mesa_id = %s AND usuario_id = %s AND tipo = 'narrador'
        """, (mesa_id, current_user.id))

        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Acesso negado'}), 403

        cursor.execute("SELECT id FROM usuarios WHERE username = %s", (username,))
        usuario = cursor.fetchone()

        if not usuario:
            return jsonify({'success': False, 'message': f'Usuário "{username}" não encontrado'}), 404

        cursor.execute("""
            SELECT mesa_id FROM mesa_online 
            WHERE mesa_id = %s AND usuario_id = %s
        """, (mesa_id, usuario['id']))

        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'Usuário já está na mesa'}), 400

        cursor.execute("""
            INSERT INTO mesa_online (mesa_id, usuario_id, tipo)
            VALUES (%s, %s, %s)
        """, (mesa_id, usuario['id'], papel))

        conn.commit()

        return jsonify({'success': True, 'message': 'Convite enviado com sucesso'})

    except Exception as e:
        logger.error(f"Erro ao criar convite: {e}")
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ============================================
# API - INSTÂNCIAS
# ============================================

@mesa_bp.route('/api/<int:mesa_id>/instancias')
@login_required
def api_instancias_mesa(mesa_id):
    """Retorna lista de instâncias da mesa"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT mi.id, mi.nome_completo, mi.nome_instancia,
                   mi.tipo_instancia as tipo, mi.ativo,
                   mi.forca_vital_atual as fv_atual,
                   mi.forca_vital_total as fv_total,
                   mi.poder_elemental_atual as pe_atual,
                   mi.poder_elemental_total as pe_total,
                   e.nome as especie_nome,
                   fp.nome_exibicao as fonte_nome
            FROM mesa_instancias mi
            LEFT JOIN especies e ON mi.especie_id = e.id
            LEFT JOIN fontes_de_poder fp ON mi.fonte_poder_id = fp.id
            WHERE mi.mesa_id = %s
            ORDER BY mi.tipo_instancia = 'jogador' DESC, mi.nome_instancia
        """, (mesa_id,))
        instancias = cursor.fetchall()

        return jsonify({'success': True, 'instancias': instancias})

    except Exception as e:
        logger.error(f"Erro ao buscar instâncias da mesa {mesa_id}: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ============================================
# API - EXCLUIR MESA
# ============================================

@mesa_bp.route('/api/<int:mesa_id>', methods=['DELETE'])
@login_required
def api_excluir_mesa(mesa_id):
    """Exclui uma mesa permanentemente"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT mesa_id FROM mesa_online 
            WHERE mesa_id = %s AND usuario_id = %s AND tipo = 'narrador'
        """, (mesa_id, current_user.id))

        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Acesso negado'}), 403

        cursor.execute("SELECT id FROM mesas WHERE id = %s", (mesa_id,))
        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Mesa não encontrada'}), 404

        cursor.execute("DELETE FROM mesas WHERE id = %s", (mesa_id,))
        conn.commit()

        return jsonify({'success': True, 'message': 'Mesa excluída com sucesso'})

    except Exception as e:
        logger.error(f"Erro ao excluir mesa {mesa_id}: {e}")
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ============================================
# API - ENTRAR NA MESA
# ============================================

@mesa_bp.route('/api/<int:mesa_id>/entrar', methods=['POST'])
@login_required
def api_entrar_mesa(mesa_id):
    """API: Entrar em uma mesa como jogador"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT id, capacidade FROM mesas 
            WHERE id = %s AND ativa = TRUE
        """, (mesa_id,))
        mesa = cursor.fetchone()

        if not mesa:
            return jsonify({'success': False, 'message': 'Mesa não encontrada'}), 404

        cursor.execute("""
            SELECT mesa_id FROM mesa_online 
            WHERE mesa_id = %s AND usuario_id = %s
        """, (mesa_id, current_user.id))
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'Você já está nesta mesa'}), 400

        cursor.execute("""
            SELECT COUNT(*) as total FROM mesa_online 
            WHERE mesa_id = %s
        """, (mesa_id,))
        count = cursor.fetchone()
        if count and count['total'] >= mesa['capacidade']:
            return jsonify({'success': False, 'message': 'Mesa está cheia'}), 400

        cursor.execute("""
            INSERT INTO mesa_online (mesa_id, usuario_id, tipo)
            VALUES (%s, %s, 'jogador')
        """, (mesa_id, current_user.id))
        conn.commit()

        return jsonify({
            'success': True,
            'message': 'Entrou na mesa com sucesso!'
        })

    except Exception as e:
        logger.error(f"Erro ao entrar na mesa {mesa_id}: {e}")
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ============================================
# API - ESTADO DA MESA
# ============================================

@mesa_bp.route('/api/<int:mesa_id>/estado')
@login_required
def api_estado_mesa(mesa_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT mesa_id FROM mesa_online 
            WHERE mesa_id = %s AND usuario_id = %s AND tipo = 'narrador'
        """, (mesa_id, current_user.id))
        is_narrador = cursor.fetchone() is not None

        if is_narrador:
            return jsonify({
                'success': True,
                'personagem_ativo': None,
                'personagens_disponiveis': [],
                'is_narrador': True
            })

        cursor.execute("""
            SELECT mesa_id FROM mesa_online 
            WHERE mesa_id = %s AND usuario_id = %s
        """, (mesa_id, current_user.id))

        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Acesso negado'}), 403

        cursor.execute("""
            SELECT personagem_id FROM mesa_online 
            WHERE mesa_id = %s AND usuario_id = %s
        """, (mesa_id, current_user.id))

        result = cursor.fetchone()
        personagem_ativo = None

        if result and result['personagem_id']:
            cursor.execute("""
                SELECT p.id, p.nome_completo, p.nivel, p.forca, p.destreza, p.inteligencia, 
                       p.constituicao, p.poder, p.aparencia, 
                       p.forca_vital_atual as fv_atual,
                       p.forca_vital_total as fv_max, 
                       p.poder_elemental_atual as pe_atual,
                       p.poder_elemental_total as pe_max, 
                       e.nome as especie_nome,
                       fp.nome_exibicao as fonte_nome, 
                       u.username as jogador_nome
                FROM personagens p
                JOIN especies e ON p.especie_id = e.id
                JOIN fontes_de_poder fp ON p.fonte_poder_id = fp.id
                JOIN usuarios u ON p.usuario_id = u.id
                WHERE p.id = %s
            """, (result['personagem_id'],))
            personagem_ativo = cursor.fetchone()

        cursor.execute("""
            SELECT p.id, p.nome_completo, p.nivel
            FROM personagens p
            WHERE p.usuario_id = %s AND p.npc = FALSE
            ORDER BY p.nome_completo
        """, (current_user.id,))
        personagens_disponiveis = cursor.fetchall()

        return jsonify({
            'success': True,
            'personagem_ativo': personagem_ativo,
            'personagens_disponiveis': personagens_disponiveis,
            'is_narrador': False
        })

    except Exception as e:
        logger.error(f"Erro na API estado da mesa {mesa_id}: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ============================================
# API - SELECIONAR PERSONAGEM
# ============================================

@mesa_bp.route('/api/<int:mesa_id>/selecionar-personagem', methods=['POST'])
@login_required
def api_selecionar_personagem(mesa_id):
    data = request.get_json()
    personagem_id = data.get('personagem_id')

    if not personagem_id:
        return jsonify({'success': False, 'message': 'Personagem não informado'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT id FROM personagens 
            WHERE id = %s AND usuario_id = %s
        """, (personagem_id, current_user.id))

        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Personagem não pertence ao jogador'}), 403

        cursor.execute("""
            SELECT mesa_id FROM mesa_online 
            WHERE mesa_id = %s AND usuario_id = %s
        """, (mesa_id, current_user.id))

        if cursor.fetchone():
            cursor.execute("""
                UPDATE mesa_online 
                SET personagem_id = %s
                WHERE mesa_id = %s AND usuario_id = %s
            """, (personagem_id, mesa_id, current_user.id))
        else:
            cursor.execute("""
                INSERT INTO mesa_online (mesa_id, usuario_id, personagem_id, tipo)
                VALUES (%s, %s, %s, 'jogador')
            """, (mesa_id, current_user.id, personagem_id))

        conn.commit()

        cursor.execute("""
            SELECT p.id, p.nome_completo, p.nivel, p.forca, p.destreza, p.inteligencia, 
                   p.constituicao, p.poder, p.aparencia, 
                   p.forca_vital_atual as fv_atual,
                   p.forca_vital_total as fv_max, 
                   p.poder_elemental_atual as pe_atual,
                   p.poder_elemental_total as pe_max, 
                   e.nome as especie_nome,
                   fp.nome_exibicao as fonte_nome, 
                   u.username as jogador_nome
            FROM personagens p
            JOIN especies e ON p.especie_id = e.id
            JOIN fontes_de_poder fp ON p.fonte_poder_id = fp.id
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.id = %s
        """, (personagem_id,))

        personagem = cursor.fetchone()

        return jsonify({
            'success': True,
            'message': 'Personagem selecionado com sucesso',
            'personagem': personagem})

    except Exception as e:
        logger.error(f"Erro ao selecionar personagem na mesa {mesa_id}: {e}")
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ============================================
# API - PERSONAGENS DA FICHA
# ============================================

@mesa_bp.route('/api/personagens/<int:personagem_id>/ficha')
@login_required
def api_ficha_personagem(personagem_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT id FROM personagens 
            WHERE id = %s AND usuario_id = %s
        """, (personagem_id, current_user.id))

        if not cursor.fetchone():
            cursor.execute("""
                SELECT m.id FROM mesa_online mo
                JOIN mesa_online mj ON mo.mesa_id = mj.mesa_id
                WHERE mo.usuario_id = %s AND mo.tipo = 'narrador' AND mj.personagem_id = %s
            """, (current_user.id, personagem_id))

            if not cursor.fetchone():
                return jsonify({'success': False, 'message': 'Acesso negado'}), 403

        cursor.execute("""
            SELECT p.id, p.nome_completo, p.nivel, p.ocupacao, p.forca, p.destreza, 
                   p.inteligencia, p.constituicao, p.poder, p.aparencia,
                   p.forca_vital_atual as fv_atual, p.forca_vital_total as fv_max,
                   p.poder_elemental_atual as pe_atual, p.poder_elemental_total as pe_max,
                   e.nome as especie_nome, fp.nome_exibicao as fonte_nome,
                   (SELECT pontos FROM personagem_pericias WHERE personagem_id = p.id AND pericia_id = 51 LIMIT 1) as autocontrole,
                   (SELECT SUM(pontos) FROM personagem_pericias WHERE personagem_id = p.id) as total_pericias
            FROM personagens p
            JOIN especies e ON p.especie_id = e.id
            JOIN fontes_de_poder fp ON p.fonte_poder_id = fp.id
            WHERE p.id = %s
        """, (personagem_id,))

        personagem = cursor.fetchone()

        if not personagem:
            return jsonify({'success': False, 'message': 'Personagem não encontrado'}), 404

        cursor.execute("""
            SELECT per.id, per.nome, per.categoria, pp.pontos
            FROM personagem_pericias pp
            JOIN pericias per ON pp.pericia_id = per.id
            WHERE pp.personagem_id = %s
        """, (personagem_id,))
        personagem['pericias'] = cursor.fetchall()

        cursor.execute("""
            SELECT tec.id, tec.nome, tec.categoria, pt.pontos
            FROM personagem_tecnicas pt
            JOIN tecnicas tec ON pt.tecnica_id = tec.id
            WHERE pt.personagem_id = %s
        """, (personagem_id,))
        personagem['tecnicas'] = cursor.fetchall()

        agilidade = ((personagem['destreza'] + (personagem['forca'] / 2) + (personagem['inteligencia'] / 2)) / 2) * 5
        personagem['agilidade'] = int(agilidade)

        return jsonify({
            'success': True,
            'personagem': personagem
        })

    except Exception as e:
        logger.error(f"Erro ao buscar ficha do personagem {personagem_id}: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ============================================
# API - GRUPO DA MESA
# ============================================

@mesa_bp.route('/api/<int:mesa_id>/grupo')
@login_required
def api_grupo_mesa(mesa_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT p.id, p.nome_completo, p.nivel, 
                   p.forca_vital_atual as fv_atual,
                   p.forca_vital_total as fv_max, 
                   u.username as jogador_nome
            FROM mesa_online mj
            JOIN personagens p ON mj.personagem_id = p.id
            JOIN usuarios u ON mj.usuario_id = u.id
            WHERE mj.mesa_id = %s AND mj.usuario_id != %s
        """, (mesa_id, current_user.id))

        personagens = cursor.fetchall()

        return jsonify({
            'success': True,
            'personagens': personagens
        })

    except Exception as e:
        logger.error(f"Erro ao buscar grupo da mesa {mesa_id}: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ============================================
# API - INTERAÇÕES DA MESA
# ============================================

@mesa_bp.route('/api/<int:mesa_id>/interacoes')
@login_required
def api_interacoes_mesa(mesa_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT id, nome, tipo, icone, distancia, descricao
            FROM mesa_interacoes
            WHERE mesa_id = %s AND ativa = TRUE
            ORDER BY distancia ASC
        """, (mesa_id,))

        interacoes = cursor.fetchall()

        if not interacoes:
            interacoes = []

        return jsonify({
            'success': True,
            'interacoes': interacoes
        })

    except Exception as e:
        logger.error(f"Erro ao buscar interações da mesa {mesa_id}: {e}")
        return jsonify({
            'success': True,
            'interacoes': []
        })

    finally:
        cursor.close()
        conn.close()


# ============================================
# API - ATUALIZAR STATUS (FV/PE)
# ============================================

@mesa_bp.route('/api/personagens/<int:personagem_id>/status', methods=['PUT'])
@login_required
def api_atualizar_status(personagem_id):
    data = request.get_json()

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT p.id, p.usuario_id
            FROM personagens p
            WHERE p.id = %s
        """, (personagem_id,))

        personagem = cursor.fetchone()

        if not personagem:
            return jsonify({'success': False, 'message': 'Personagem não encontrado'}), 404

        is_owner = personagem['usuario_id'] == current_user.id
        is_narrator = False

        if not is_owner:
            cursor.execute("""
                SELECT mn.mesa_id FROM mesa_online mn
                JOIN mesa_online mj ON mn.mesa_id = mj.mesa_id
                WHERE mn.usuario_id = %s AND mn.tipo = 'narrador' AND mj.personagem_id = %s
            """, (current_user.id, personagem_id))
            is_narrator = cursor.fetchone() is not None

        if not is_owner and not is_narrator:
            return jsonify({'success': False, 'message': 'Acesso negado'}), 403

        updates = []
        params = []

        if 'fv_atual' in data:
            updates.append("forca_vital_atual = %s")
            params.append(data['fv_atual'])

        if 'pe_atual' in data:
            updates.append("poder_elemental_atual = %s")
            params.append(data['pe_atual'])

        if not updates:
            return jsonify({'success': False, 'message': 'Nenhum campo para atualizar'}), 400

        params.append(personagem_id)

        cursor.execute(f"""
            UPDATE personagens SET {', '.join(updates)} WHERE id = %s
        """, tuple(params))

        conn.commit()

        return jsonify({
            'success': True,
            'message': 'Status atualizado com sucesso'
        })

    except Exception as e:
        logger.error(f"Erro ao atualizar status do personagem {personagem_id}: {e}")
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ============================================
# ADMIN - GERENCIAR MESAS (NÍVEL 7+)
# ============================================

@mesa_bp.route('/api/admin/todas')
@login_required
def api_admin_todas_mesas():
    """
    API: Listar todas as mesas para administração
    O front espera: { success, mesas }
    """
    if current_user.nivel_credencial < 7:
        return jsonify({'success': False, 'message': 'Acesso negado - Nível 7+ requerido'}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco de dados'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                m.id,
                m.nome,
                m.descricao,
                m.ativa,
                m.capacidade,
                m.privada,
                m.data_criacao,
                (SELECT COUNT(*) FROM mesa_online WHERE mesa_id = m.id) as participantes_atual,
                (SELECT COUNT(*) FROM mesa_online WHERE mesa_id = m.id AND tipo = 'espectador') as espectadores_atual,
                u.username as narrador_nome
            FROM mesas m
            LEFT JOIN mesa_online mo ON m.id = mo.mesa_id AND mo.tipo = 'narrador'
            LEFT JOIN usuarios u ON mo.usuario_id = u.id
            ORDER BY m.data_criacao DESC
        """)

        mesas = cursor.fetchall()

        # Formatar datas
        for mesa in mesas:
            if mesa.get('data_criacao'):
                mesa['data_criacao'] = mesa['data_criacao'].strftime('%d/%m/%Y %H:%M')

        return jsonify({
            'success': True,
            'mesas': mesas,
            'total': len(mesas)
        })

    except Exception as e:
        logger.error(f"Erro na API admin mesas: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@mesa_bp.route('/api/admin/<int:mesa_id>', methods=['PUT'])
@login_required
def api_admin_atualizar_mesa(mesa_id):
    """
    API: Atualizar mesa (admin)
    O front espera: { success, message }
    """
    if current_user.nivel_credencial < 7:
        return jsonify({'success': False, 'message': 'Acesso negado - Nível 7+ requerido'}), 403

    data = request.get_json()

    if not data:
        return jsonify({'success': False, 'message': 'Dados não enviados'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco de dados'}), 500

    cursor = conn.cursor()

    try:
        # Verificar se a mesa existe
        cursor.execute("SELECT id FROM mesas WHERE id = %s", (mesa_id,))
        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Mesa não encontrada'}), 404

        # Atualizar campos permitidos
        updates = []
        params = []

        if 'nome' in data and data['nome']:
            updates.append("nome = %s")
            params.append(data['nome'])

        if 'descricao' in data:
            updates.append("descricao = %s")
            params.append(data['descricao'])

        if 'ativa' in data:
            updates.append("ativa = %s")
            params.append(1 if data['ativa'] else 0)

        if 'capacidade' in data:
            updates.append("capacidade = %s")
            params.append(int(data['capacidade']))

        if 'privada' in data:
            updates.append("privada = %s")
            params.append(1 if data['privada'] else 0)

        if not updates:
            return jsonify({'success': False, 'message': 'Nenhum campo para atualizar'}), 400

        params.append(mesa_id)

        cursor.execute(f"""
            UPDATE mesas SET {', '.join(updates)} WHERE id = %s
        """, tuple(params))

        conn.commit()

        logger.info(f"Admin {current_user.username} atualizou mesa {mesa_id}")

        return jsonify({
            'success': True,
            'message': 'Mesa atualizada com sucesso'
        })

    except Exception as e:
        logger.error(f"Erro ao atualizar mesa {mesa_id}: {e}")
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@mesa_bp.route('/api/admin/<int:mesa_id>', methods=['DELETE'])
@login_required
def api_admin_excluir_mesa(mesa_id):
    """
    API: Excluir mesa (admin)
    O front espera: { success, message }
    """
    if current_user.nivel_credencial < 7:
        return jsonify({'success': False, 'message': 'Acesso negado - Nível 7+ requerido'}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco de dados'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        # Verificar se a mesa existe
        cursor.execute("SELECT nome FROM mesas WHERE id = %s", (mesa_id,))
        mesa = cursor.fetchone()

        if not mesa:
            return jsonify({'success': False, 'message': 'Mesa não encontrada'}), 404

        nome_mesa = mesa['nome']

        # Remover todas as conexões
        cursor.execute("DELETE FROM mesa_online WHERE mesa_id = %s", (mesa_id,))
        cursor.execute("DELETE FROM mesa_convites WHERE mesa_id = %s", (mesa_id,))
        cursor.execute("DELETE FROM mesa_interacoes WHERE mesa_id = %s", (mesa_id,))
        cursor.execute("DELETE FROM mesa_instancias WHERE mesa_id = %s", (mesa_id,))

        # Remover a mesa
        cursor.execute("DELETE FROM mesas WHERE id = %s", (mesa_id,))

        conn.commit()

        logger.warning(f"Admin {current_user.username} excluiu mesa '{nome_mesa}' (ID: {mesa_id})")

        return jsonify({
            'success': True,
            'message': f'Mesa "{nome_mesa}" excluída com sucesso'
        })

    except Exception as e:
        logger.error(f"Erro ao excluir mesa {mesa_id}: {e}")
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@mesa_bp.route('/api/<int:mesa_id>/convite/aceitar', methods=['POST'])
@login_required
def api_aceitar_convite(mesa_id):
    """
    API: Aceitar convite pendente para uma mesa
    O front espera: { success, message }
    """
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco de dados'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        # Verificar se a mesa existe e está ativa
        cursor.execute("""
            SELECT id, capacidade, ativa
            FROM mesas 
            WHERE id = %s
        """, (mesa_id,))
        mesa = cursor.fetchone()

        if not mesa:
            return jsonify({'success': False, 'message': 'Mesa não encontrada'}), 404

        if not mesa['ativa']:
            return jsonify({'success': False, 'message': 'Mesa não está ativa'}), 400

        # Verificar se o convite existe
        cursor.execute("""
            SELECT id, status FROM mesa_convites
            WHERE mesa_id = %s AND usuario_id = %s
        """, (mesa_id, current_user.id))
        convite = cursor.fetchone()

        if not convite:
            return jsonify({'success': False, 'message': 'Convite não encontrado'}), 404

        if convite['status'] != 'pendente':
            return jsonify({'success': False, 'message': f'Convite já foi {convite["status"]}'}), 400

        # Verificar se a mesa está cheia
        cursor.execute("""
            SELECT COUNT(*) as total FROM mesa_online
            WHERE mesa_id = %s
        """, (mesa_id,))
        count = cursor.fetchone()

        if count and count['total'] >= mesa['capacidade']:
            return jsonify({'success': False, 'message': 'Mesa está cheia'}), 400

        # Verificar se o usuário já está na mesa
        cursor.execute("""
            SELECT mesa_id FROM mesa_online
            WHERE mesa_id = %s AND usuario_id = %s
        """, (mesa_id, current_user.id))
        if cursor.fetchone():
            # Já está na mesa, apenas atualiza o convite
            cursor.execute("""
                UPDATE mesa_convites SET status = 'aceito'
                WHERE id = %s
            """, (convite['id'],))
            conn.commit()
            return jsonify({
                'success': True,
                'message': 'Você já está nesta mesa!'
            })

        # Aceitar convite - adicionar à mesa
        cursor.execute("""
            INSERT INTO mesa_online (mesa_id, usuario_id, tipo)
            VALUES (%s, %s, 'jogador')
        """, (mesa_id, current_user.id))

        # Atualizar status do convite
        cursor.execute("""
            UPDATE mesa_convites SET status = 'aceito'
            WHERE id = %s
        """, (convite['id'],))

        conn.commit()

        logger.info(f"Usuário {current_user.username} aceitou convite para mesa {mesa_id}")

        return jsonify({
            'success': True,
            'message': 'Convite aceito com sucesso!'
        })

    except Exception as e:
        logger.error(f"Erro ao aceitar convite para mesa {mesa_id}: {e}")
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()