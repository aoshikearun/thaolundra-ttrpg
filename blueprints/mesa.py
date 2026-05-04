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
    """Página com lista de todas as mesas disponíveis"""
    conn = get_db_connection()
    if not conn:
        return "Erro de banco de dados", 500

    cursor = conn.cursor(dictionary=True)

    try:
        # Buscar mesas onde o usuário é participante ou narrador
        cursor.execute("""
            SELECT DISTINCT m.id, m.nome, m.descricao, m.capacidade, 
                   COUNT(DISTINCT mj.personagem_id) as participantes_atual,
                   u.username as narrador_nome,
                   (SELECT COUNT(*) FROM mesa_jogadores_ativos mja WHERE mja.mesa_id = m.id AND mja.usuario_id = %s) as sou_participante
            FROM mesas m
            LEFT JOIN mesa_jogadores_ativos mj ON m.id = mj.mesa_id
            LEFT JOIN mesa_narradores mn ON m.id = mn.mesa_id
            LEFT JOIN usuarios u ON mn.usuario_id = u.id
            WHERE m.ativa = TRUE
            GROUP BY m.id
            ORDER BY m.nome
        """, (current_user.id,))

        mesas = cursor.fetchall()

        return render_template('listar_mesas.html', mesas=mesas, user=current_user)

    except Exception as e:
        logger.error(f"Erro ao listar mesas: {e}")
        return "Erro ao carregar mesas", 500

    finally:
        cursor.close()
        conn.close()


@mesa_bp.route('/<int:mesa_id>')
@login_required
def mesa(mesa_id):
    """Página da mesa específica"""
    conn = get_db_connection()
    if not conn:
        return "Erro de banco de dados", 500

    cursor = conn.cursor(dictionary=True)

    try:
        # Verificar se o usuário tem acesso à mesa
        cursor.execute("""
            SELECT m.*, u.username as narrador_nome
            FROM mesas m
            LEFT JOIN mesa_narradores mn ON m.id = mn.mesa_id
            LEFT JOIN usuarios u ON mn.usuario_id = u.id
            WHERE m.id = %s AND m.ativa = TRUE
        """, (mesa_id,))

        mesa = cursor.fetchone()

        if not mesa:
            cursor.close()
            conn.close()
            return "Mesa não encontrada", 404

        return render_template('mesa.html', mesa=mesa, user=current_user)

    except Exception as e:
        logger.error(f"Erro ao carregar mesa {mesa_id}: {e}")
        return "Erro ao carregar mesa", 500

    finally:
        cursor.close()
        conn.close()


# ============================================
# API - ESTADO DA MESA
# ============================================

@mesa_bp.route('/api/<int:mesa_id>/estado')
@login_required
def api_estado_mesa(mesa_id):
    """
    API: Retorna o estado atual da mesa para o jogador
    O front espera: { success, personagem_ativo, personagens_disponiveis }
    """
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        # Verificar se o jogador tem acesso à mesa
        cursor.execute("""
            SELECT id FROM mesa_jogadores_ativos 
            WHERE mesa_id = %s AND usuario_id = %s
        """, (mesa_id, current_user.id))

        if not cursor.fetchone():
            # Se não estiver ativo, verificar se é narrador
            cursor.execute("""
                SELECT id FROM mesa_narradores 
                WHERE mesa_id = %s AND usuario_id = %s
            """, (mesa_id, current_user.id))

            if not cursor.fetchone():
                return jsonify({'success': False, 'message': 'Acesso negado'}), 403

        # Buscar personagem ativo do jogador nesta mesa
        cursor.execute("""
            SELECT personagem_id FROM mesa_jogadores_ativos 
            WHERE mesa_id = %s AND usuario_id = %s
        """, (mesa_id, current_user.id))

        result = cursor.fetchone()
        personagem_ativo = None

        if result and result['personagem_id']:
            cursor.execute("""
                SELECT p.id, p.nome_completo, p.nivel, p.forca, p.destreza, p.inteligencia, 
                       p.constituicao, p.poder, p.aparencia, 
                       p.forca_vital_atual as fv_atual,
                       p.forca_vital_maxima as fv_max, 
                       p.poder_elemental_atual as pe_atual,
                       p.poder_elemental_maximo as pe_max, 
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

        # Buscar personagens disponíveis do jogador para esta mesa
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
            'personagens_disponiveis': personagens_disponiveis
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
    """
    API: Seleciona o personagem ativo do jogador na mesa
    O front espera: { success, message, personagem }
    """
    data = request.get_json()
    personagem_id = data.get('personagem_id')

    if not personagem_id:
        return jsonify({'success': False, 'message': 'Personagem não informado'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        # Verificar se o personagem pertence ao jogador
        cursor.execute("""
            SELECT id FROM personagens 
            WHERE id = %s AND usuario_id = %s
        """, (personagem_id, current_user.id))

        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Personagem não pertence ao jogador'}), 403

        # Verificar se o jogador já está na mesa
        cursor.execute("""
            SELECT id FROM mesa_jogadores_ativos 
            WHERE mesa_id = %s AND usuario_id = %s
        """, (mesa_id, current_user.id))

        if cursor.fetchone():
            # Atualizar personagem ativo
            cursor.execute("""
                UPDATE mesa_jogadores_ativos 
                SET personagem_id = %s
                WHERE mesa_id = %s AND usuario_id = %s
            """, (personagem_id, mesa_id, current_user.id))
        else:
            # Inserir novo jogador na mesa
            cursor.execute("""
                INSERT INTO mesa_jogadores_ativos (mesa_id, usuario_id, personagem_id)
                VALUES (%s, %s, %s)
            """, (mesa_id, current_user.id, personagem_id))

        conn.commit()

        # Buscar dados completos do personagem
        cursor.execute("""
            SELECT p.id, p.nome_completo, p.nivel, p.forca, p.destreza, p.inteligencia, 
                   p.constituicao, p.poder, p.aparencia, 
                   p.forca_vital_atual as fv_atual,
                   p.forca_vital_maxima as fv_max, 
                   p.poder_elemental_atual as pe_atual,
                   p.poder_elemental_maximo as pe_max, 
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

        logger.info(
            f"Usuário {current_user.username} selecionou personagem {personagem['nome_completo']} na mesa {mesa_id}")

        return jsonify({
            'success': True,
            'message': 'Personagem selecionado com sucesso',
            'personagem': personagem
        })

    except Exception as e:
        logger.error(f"Erro ao selecionar personagem na mesa {mesa_id}: {e}")
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ============================================
# API - PERSONAGENS DA FICHA (para mesa)
# ============================================

@mesa_bp.route('/api/personagens/<int:personagem_id>/ficha')
@login_required
def api_ficha_personagem(personagem_id):
    """
    API: Retorna a ficha completa do personagem para a mesa
    O front espera: { success, personagem }
    """
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        # Verificar se o usuário tem acesso ao personagem
        # (jogador dono ou narrador da mesa)
        cursor.execute("""
            SELECT id FROM personagens 
            WHERE id = %s AND usuario_id = %s
        """, (personagem_id, current_user.id))

        if not cursor.fetchone():
            # Verificar se é narrador de alguma mesa que contém este personagem
            cursor.execute("""
                SELECT m.id FROM mesa_narradores mn
                JOIN mesa_jogadores_ativos mj ON mn.mesa_id = mj.mesa_id
                WHERE mn.usuario_id = %s AND mj.personagem_id = %s
            """, (current_user.id, personagem_id))

            if not cursor.fetchone():
                return jsonify({'success': False, 'message': 'Acesso negado'}), 403

        # Dados principais
        cursor.execute("""
            SELECT p.id, p.nome_completo, p.nivel, p.ocupacao, p.forca, p.destreza, 
                   p.inteligencia, p.constituicao, p.poder, p.aparencia,
                   p.forca_vital_atual as fv_atual, p.forca_vital_maxima as fv_max,
                   p.poder_elemental_atual as pe_atual, p.poder_elemental_maximo as pe_max,
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

        # Perícias
        cursor.execute("""
            SELECT per.id, per.nome, per.categoria, pp.pontos
            FROM personagem_pericias pp
            JOIN pericias per ON pp.pericia_id = per.id
            WHERE pp.personagem_id = %s
        """, (personagem_id,))
        personagem['pericias'] = cursor.fetchall()

        # Técnicas
        cursor.execute("""
            SELECT tec.id, tec.nome, tec.categoria, pt.pontos
            FROM personagem_tecnicas pt
            JOIN tecnicas tec ON pt.tecnica_id = tec.id
            WHERE pt.personagem_id = %s
        """, (personagem_id,))
        personagem['tecnicas'] = cursor.fetchall()

        # Atributos secundários calculados
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
    """
    API: Retorna os personagens do grupo (outros jogadores)
    O front espera: { success, personagens }
    """
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT p.id, p.nome_completo, p.nivel, 
                   p.forca_vital_atual as fv_atual,
                   p.forca_vital_maxima as fv_max, 
                   u.username as jogador_nome
            FROM mesa_jogadores_ativos mj
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
    """
    API: Retorna interações próximas (NPCs, objetos, etc)
    O front espera: { success, interacoes }
    """
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        # Buscar interações ativas na mesa
        cursor.execute("""
            SELECT id, nome, tipo, icone, distancia, descricao
            FROM mesa_interacoes
            WHERE mesa_id = %s AND ativa = TRUE
            ORDER BY distancia ASC
        """, (mesa_id,))

        interacoes = cursor.fetchall()

        # Se não houver interações configuradas, retornar lista vazia
        if not interacoes:
            interacoes = []

        return jsonify({
            'success': True,
            'interacoes': interacoes
        })

    except Exception as e:
        logger.error(f"Erro ao buscar interações da mesa {mesa_id}: {e}")
        # Retornar lista vazia em caso de erro (tabela pode não existir ainda)
        return jsonify({
            'success': True,
            'interacoes': []
        })

    finally:
        cursor.close()
        conn.close()


# ============================================
# API - ATUALIZAR STATUS (FV/PE) - opcional
# ============================================

@mesa_bp.route('/api/personagens/<int:personagem_id>/status', methods=['PUT'])
@login_required
def api_atualizar_status(personagem_id):
    """
    API: Atualiza FV e PE de um personagem (durante a mesa)
    """
    data = request.get_json()

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        # Verificar permissão (dono do personagem ou narrador da mesa)
        cursor.execute("""
            SELECT p.id, p.usuario_id
            FROM personagens p
            WHERE p.id = %s
        """, (personagem_id,))

        personagem = cursor.fetchone()

        if not personagem:
            return jsonify({'success': False, 'message': 'Personagem não encontrado'}), 404

        # Verificar se é dono ou narrador
        is_owner = personagem['usuario_id'] == current_user.id
        is_narrator = False

        if not is_owner:
            cursor.execute("""
                SELECT mn.id FROM mesa_narradores mn
                JOIN mesa_jogadores_ativos mj ON mn.mesa_id = mj.mesa_id
                WHERE mn.usuario_id = %s AND mj.personagem_id = %s
            """, (current_user.id, personagem_id))
            is_narrator = cursor.fetchone() is not None

        if not is_owner and not is_narrator:
            return jsonify({'success': False, 'message': 'Acesso negado'}), 403

        # Atualizar status
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