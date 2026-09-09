#!/usr/bin/env python3
"""
Blueprint para gerenciamento de conteúdo do Thaolundra RPG
Gerencia espécies, perícias, técnicas e fontes de poder
"""
from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user
from database import get_db_connection, execute_query
import json
import logging

logger = logging.getLogger(__name__)

gerenciar_bp = Blueprint('gerenciar', __name__)


# ============================================
# PÁGINA PRINCIPAL
# ============================================

@gerenciar_bp.route('/gerenciar-conteudo')
@login_required
def gerenciar_conteudo():
    """Página principal de gerenciamento de conteúdo"""
    if current_user.nivel_credencial < 4:
        return "🔒 Acesso negado - Nível 4+ requerido", 403

    return render_template('gerenciar_conteudo.html', user=current_user)


# ============================================
# API PARA ESPÉCIES
# ============================================

@gerenciar_bp.route('/api/especies')
@login_required
def api_especies():
    """
    API: Listar todas as espécies
    O front espera: { success, especies, total }
    """
    if current_user.nivel_credencial < 4:
        return jsonify({'success': False, 'message': 'Acesso negado'}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                e.*,
                p1.nome_completo as notavel_1_nome,
                p2.nome_completo as notavel_2_nome,
                p3.nome_completo as notavel_3_nome
            FROM especies e
            LEFT JOIN personagens p1 ON e.notavel_1_id = p1.id
            LEFT JOIN personagens p2 ON e.notavel_2_id = p2.id
            LEFT JOIN personagens p3 ON e.notavel_3_id = p3.id
            ORDER BY e.nome
        """)

        especies = cursor.fetchall()

        return jsonify({
            'success': True,
            'especies': especies,
            'total': len(especies)
        })

    except Exception as e:
        logger.error(f"Erro na API de espécies: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@gerenciar_bp.route('/api/especies/<int:especie_id>')
@login_required
def api_especie_detalhes(especie_id):
    """
    API: Detalhes de uma espécie específica
    O front espera: { success, especie }
    """
    if current_user.nivel_credencial < 4:
        return jsonify({'success': False, 'message': 'Acesso negado'}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                e.*,
                p1.nome_completo as notavel_1_nome,
                p2.nome_completo as notavel_2_nome,
                p3.nome_completo as notavel_3_nome
            FROM especies e
            LEFT JOIN personagens p1 ON e.notavel_1_id = p1.id
            LEFT JOIN personagens p2 ON e.notavel_2_id = p2.id
            LEFT JOIN personagens p3 ON e.notavel_3_id = p3.id
            WHERE e.id = %s
        """, (especie_id,))

        especie = cursor.fetchone()

        if especie:
            return jsonify({
                'success': True,
                'especie': especie
            })
        else:
            return jsonify({'success': False, 'message': 'Espécie não encontrada'}), 404

    except Exception as e:
        logger.error(f"Erro na API de espécie detalhes: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@gerenciar_bp.route('/api/especies', methods=['POST'])
@login_required
def api_criar_especie():
    """API: Criar nova espécie"""
    if current_user.nivel_credencial < 4:
        return jsonify({'success': False, 'message': 'Acesso negado'}), 403

    try:
        data = request.get_json()

        required_fields = ['nome', 'minimo_poder', 'maximo_poder']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'Campo obrigatório: {field}'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO especies (
                nome, minimo_poder, maximo_poder, descricao, 
                descricao_adicional, especificidades_mecanicas, advanced,
                notavel_1_id, notavel_2_id, notavel_3_id
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data['nome'],
            int(data['minimo_poder']),
            int(data['maximo_poder']),
            data.get('descricao', ''),
            data.get('descricao_adicional', ''),
            data.get('especificidades_mecanicas', ''),
            int(data.get('advanced', 0)),
            data.get('notavel_1_id'),
            data.get('notavel_2_id'),
            data.get('notavel_3_id')
        ))

        especie_id = cursor.lastrowid
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Espécie criada com sucesso',
            'especie_id': especie_id
        })

    except Exception as e:
        logger.error(f"Erro ao criar espécie: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@gerenciar_bp.route('/api/especies/<int:especie_id>', methods=['PUT'])
@login_required
def api_atualizar_especie(especie_id):
    """API: Atualizar espécie existente"""
    if current_user.nivel_credencial < 4:
        return jsonify({'success': False, 'message': 'Acesso negado'}), 403

    try:
        data = request.get_json()

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE especies SET
                nome = %s,
                minimo_poder = %s,
                maximo_poder = %s,
                descricao = %s,
                descricao_adicional = %s,
                especificidades_mecanicas = %s,
                advanced = %s,
                notavel_1_id = %s,
                notavel_2_id = %s,
                notavel_3_id = %s
            WHERE id = %s
        """, (
            data.get('nome'),
            int(data.get('minimo_poder', 0)),
            int(data.get('maximo_poder', 0)),
            data.get('descricao', ''),
            data.get('descricao_adicional', ''),
            data.get('especificidades_mecanicas', ''),
            int(data.get('advanced', 0)),
            data.get('notavel_1_id'),
            data.get('notavel_2_id'),
            data.get('notavel_3_id'),
            especie_id
        ))

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Espécie atualizada com sucesso'
        })

    except Exception as e:
        logger.error(f"Erro ao atualizar espécie: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@gerenciar_bp.route('/api/especies/<int:especie_id>', methods=['DELETE'])
@login_required
def api_excluir_especie(especie_id):
    """API: Excluir espécie"""
    if current_user.nivel_credencial < 5:
        return jsonify({'success': False, 'message': 'Acesso negado - Nível 5 requerido'}), 403

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Verificar se há personagens usando esta espécie
        cursor.execute("SELECT COUNT(*) as total FROM personagens WHERE especie_id = %s", (especie_id,))
        result = cursor.fetchone()

        if result and result['total'] > 0:
            cursor.close()
            conn.close()
            return jsonify({
                'success': False,
                'message': f'Não é possível excluir. Há {result["total"]} personagens usando esta espécie.'
            }), 400

        cursor.execute("DELETE FROM especies WHERE id = %s", (especie_id,))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Espécie excluída com sucesso'
        })

    except Exception as e:
        logger.error(f"Erro ao excluir espécie: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# API PARA PERÍCIAS
# ============================================

@gerenciar_bp.route('/api/pericias')
@login_required
def api_pericias():
    """
    API: Listar todas as perícias com categorias agrupadas
    O front espera: { success, pericias, categorias, total }
    """
    if current_user.nivel_credencial < 4:
        return jsonify({'success': False, 'message': 'Acesso negado'}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT * FROM pericias
            ORDER BY 
                CASE categoria
                    WHEN 'Simples' THEN 1
                    WHEN 'Sociais' THEN 2
                    WHEN 'Combate' THEN 3
                    WHEN 'Conhecimento' THEN 4
                    WHEN 'Ofício' THEN 5
                    WHEN 'Vontade' THEN 6
                END,
                nome
        """)

        pericias = cursor.fetchall()

        # Contar por categoria
        cursor.execute("""
            SELECT categoria, COUNT(*) as total
            FROM pericias
            GROUP BY categoria
            ORDER BY 
                CASE categoria
                    WHEN 'Simples' THEN 1
                    WHEN 'Sociais' THEN 2
                    WHEN 'Combate' THEN 3
                    WHEN 'Conhecimento' THEN 4
                    WHEN 'Ofício' THEN 5
                    WHEN 'Vontade' THEN 6
                END
        """)

        categorias = cursor.fetchall()

        return jsonify({
            'success': True,
            'pericias': pericias,
            'categorias': categorias,
            'total': len(pericias)
        })

    except Exception as e:
        logger.error(f"Erro na API de perícias: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@gerenciar_bp.route('/api/pericias/<int:pericia_id>')
@login_required
def api_pericia_detalhes(pericia_id):
    """API: Detalhes de uma perícia específica"""
    if current_user.nivel_credencial < 4:
        return jsonify({'success': False, 'message': 'Acesso negado'}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM pericias WHERE id = %s", (pericia_id,))
        pericia = cursor.fetchone()

        if pericia:
            return jsonify({'success': True, 'pericia': pericia})
        else:
            return jsonify({'success': False, 'message': 'Perícia não encontrada'}), 404

    except Exception as e:
        logger.error(f"Erro na API de perícia detalhes: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@gerenciar_bp.route('/api/pericias', methods=['POST'])
@login_required
def api_criar_pericia():
    """API: Criar nova perícia"""
    if current_user.nivel_credencial < 4:
        return jsonify({'success': False, 'message': 'Acesso negado'}), 403

    try:
        data = request.get_json()

        required_fields = ['nome', 'categoria']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'Campo obrigatório: {field}'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Converter especializacao para boolean
        especializacao = data.get('especializacao', False)
        if isinstance(especializacao, str):
            especializacao = especializacao.lower() == 'true'

        cursor.execute("""
            INSERT INTO pericias (
                nome, categoria, descricao_geral, especializacao
            ) VALUES (%s, %s, %s, %s)
        """, (
            data['nome'],
            data['categoria'],
            data.get('descricao_geral', ''),
            especializacao
        ))

        pericia_id = cursor.lastrowid
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Perícia criada com sucesso',
            'pericia_id': pericia_id
        })

    except Exception as e:
        logger.error(f"Erro ao criar perícia: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@gerenciar_bp.route('/api/pericias/<int:pericia_id>', methods=['PUT'])
@login_required
def api_atualizar_pericia(pericia_id):
    """API: Atualizar perícia existente"""
    if current_user.nivel_credencial < 4:
        return jsonify({'success': False, 'message': 'Acesso negado'}), 403

    try:
        data = request.get_json()

        conn = get_db_connection()
        cursor = conn.cursor()

        especializacao = data.get('especializacao', False)
        if isinstance(especializacao, str):
            especializacao = especializacao.lower() == 'true'

        cursor.execute("""
            UPDATE pericias SET
                nome = %s,
                categoria = %s,
                descricao_geral = %s,
                especializacao = %s
            WHERE id = %s
        """, (
            data.get('nome'),
            data.get('categoria'),
            data.get('descricao_geral', ''),
            especializacao,
            pericia_id
        ))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Perícia atualizada com sucesso'
        })

    except Exception as e:
        logger.error(f"Erro ao atualizar perícia: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@gerenciar_bp.route('/api/pericias/<int:pericia_id>', methods=['DELETE'])
@login_required
def api_excluir_pericia(pericia_id):
    """API: Excluir perícia"""
    if current_user.nivel_credencial < 5:
        return jsonify({'success': False, 'message': 'Acesso negado - Nível 5 requerido'}), 403

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Verificar se há personagens usando esta perícia
        cursor.execute("SELECT COUNT(*) as total FROM personagem_pericias WHERE pericia_id = %s", (pericia_id,))
        result = cursor.fetchone()

        if result and result['total'] > 0:
            cursor.close()
            conn.close()
            return jsonify({
                'success': False,
                'message': f'Não é possível excluir. Há {result["total"]} personagens usando esta perícia.'
            }), 400

        cursor.execute("DELETE FROM pericias WHERE id = %s", (pericia_id,))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Perícia excluída com sucesso'
        })

    except Exception as e:
        logger.error(f"Erro ao excluir perícia: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# API PARA TÉCNICAS
# ============================================

@gerenciar_bp.route('/api/tecnicas')
@login_required
def api_tecnicas():
    """
    API: Listar todas as técnicas com fontes e categorias
    O front espera: { success, tecnicas, categorias, fontes, total }
    """
    if current_user.nivel_credencial < 4:
        return jsonify({'success': False, 'message': 'Acesso negado'}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                t.*,
                fp.nome_exibicao as fonte_nome,
                fp.categoria as fonte_categoria
            FROM tecnicas t
            JOIN fontes_de_poder fp ON t.fonte_de_poder_id = fp.id
            ORDER BY 
                CASE t.categoria
                    WHEN 'Inata' THEN 1
                    WHEN 'Básica' THEN 2
                    WHEN 'Avançada' THEN 3
                    WHEN 'Última' THEN 4
                END,
                fp.nome_exibicao,
                t.nome
        """)

        tecnicas = cursor.fetchall()

        # Contar por categoria
        cursor.execute("""
            SELECT 
                t.categoria,
                COUNT(*) as total
            FROM tecnicas t
            GROUP BY t.categoria
            ORDER BY 
                CASE t.categoria
                    WHEN 'Inata' THEN 1
                    WHEN 'Básica' THEN 2
                    WHEN 'Avançada' THEN 3
                    WHEN 'Última' THEN 4
                END
        """)

        categorias = cursor.fetchall()

        # Contar por fonte (para o filtro do front)
        cursor.execute("""
            SELECT 
                fp.nome_exibicao as fonte,
                COUNT(*) as total
            FROM tecnicas t
            JOIN fontes_de_poder fp ON t.fonte_de_poder_id = fp.id
            GROUP BY fp.nome_exibicao
            ORDER BY fp.nome_exibicao
        """)

        fontes = cursor.fetchall()

        return jsonify({
            'success': True,
            'tecnicas': tecnicas,
            'categorias': categorias,
            'fontes': fontes,
            'total': len(tecnicas)
        })

    except Exception as e:
        logger.error(f"Erro na API de técnicas: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@gerenciar_bp.route('/api/tecnicas/<int:tecnica_id>')
@login_required
def api_tecnica_detalhes(tecnica_id):
    """API: Detalhes de uma técnica específica"""
    if current_user.nivel_credencial < 4:
        return jsonify({'success': False, 'message': 'Acesso negado'}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT t.*, fp.nome_exibicao as fonte_nome
            FROM tecnicas t
            JOIN fontes_de_poder fp ON t.fonte_de_poder_id = fp.id
            WHERE t.id = %s
        """, (tecnica_id,))

        tecnica = cursor.fetchone()

        if tecnica:
            return jsonify({'success': True, 'tecnica': tecnica})
        else:
            return jsonify({'success': False, 'message': 'Técnica não encontrada'}), 404

    except Exception as e:
        logger.error(f"Erro na API de técnica detalhes: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@gerenciar_bp.route('/api/tecnicas', methods=['POST'])
@login_required
def api_criar_tecnica():
    """API: Criar nova técnica"""
    if current_user.nivel_credencial < 4:
        return jsonify({'success': False, 'message': 'Acesso negado'}), 403

    try:
        data = request.get_json()

        required_fields = ['nome', 'categoria', 'fonte_de_poder_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'Campo obrigatório: {field}'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Converter especializacao para boolean
        especializacao = data.get('especializacao', False)
        if isinstance(especializacao, str):
            especializacao = especializacao.lower() == 'true'

        cursor.execute("""
            INSERT INTO tecnicas (
                nome, descricao_geral, categoria, especializacao,
                fonte_de_poder_id, efetividade, custo
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            data['nome'],
            data.get('descricao_geral', ''),
            data['categoria'],
            especializacao,
            int(data['fonte_de_poder_id']),
            data.get('efetividade', ''),
            data.get('custo', '')
        ))

        tecnica_id = cursor.lastrowid
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Técnica criada com sucesso',
            'tecnica_id': tecnica_id
        })

    except Exception as e:
        logger.error(f"Erro ao criar técnica: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@gerenciar_bp.route('/api/tecnicas/<int:tecnica_id>', methods=['PUT'])
@login_required
def api_atualizar_tecnica(tecnica_id):
    """API: Atualizar técnica existente"""
    if current_user.nivel_credencial < 4:
        return jsonify({'success': False, 'message': 'Acesso negado'}), 403

    try:
        data = request.get_json()

        conn = get_db_connection()
        cursor = conn.cursor()

        especializacao = data.get('especializacao', False)
        if isinstance(especializacao, str):
            especializacao = especializacao.lower() == 'true'

        cursor.execute("""
            UPDATE tecnicas SET
                nome = %s,
                descricao_geral = %s,
                categoria = %s,
                especializacao = %s,
                fonte_de_poder_id = %s,
                efetividade = %s,
                custo = %s
            WHERE id = %s
        """, (
            data.get('nome'),
            data.get('descricao_geral', ''),
            data.get('categoria'),
            especializacao,
            int(data.get('fonte_de_poder_id', 0)),
            data.get('efetividade', ''),
            data.get('custo', ''),
            tecnica_id
        ))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Técnica atualizada com sucesso'
        })

    except Exception as e:
        logger.error(f"Erro ao atualizar técnica: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@gerenciar_bp.route('/api/tecnicas/<int:tecnica_id>', methods=['DELETE'])
@login_required
def api_excluir_tecnica(tecnica_id):
    """API: Excluir técnica"""
    if current_user.nivel_credencial < 5:
        return jsonify({'success': False, 'message': 'Acesso negado - Nível 5 requerido'}), 403

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Verificar se há personagens usando esta técnica
        cursor.execute("SELECT COUNT(*) as total FROM personagem_tecnicas WHERE tecnica_id = %s", (tecnica_id,))
        result = cursor.fetchone()

        if result and result['total'] > 0:
            cursor.close()
            conn.close()
            return jsonify({
                'success': False,
                'message': f'Não é possível excluir. Há {result["total"]} personagens usando esta técnica.'
            }), 400

        cursor.execute("DELETE FROM tecnicas WHERE id = %s", (tecnica_id,))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Técnica excluída com sucesso'
        })

    except Exception as e:
        logger.error(f"Erro ao excluir técnica: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# API PARA FONTES DE PODER
# ============================================

@gerenciar_bp.route('/api/fontes-poder')
@login_required
def api_fontes_poder():
    """
    API: Listar todas as fontes de poder
    O front espera: { success, fontes }
    """
    if current_user.nivel_credencial < 4:
        return jsonify({'success': False, 'message': 'Acesso negado'}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT * FROM fontes_de_poder 
            ORDER BY 
                CASE categoria
                    WHEN 'Natural' THEN 1
                    WHEN 'Artificial' THEN 2
                    WHEN 'Divina' THEN 3
                    WHEN 'Mecânica' THEN 4
                END,
                nome_exibicao
        """)

        fontes = cursor.fetchall()

        # Converter fontes_componentes de JSON string para lista
        for fonte in fontes:
            if fonte.get('fontes_componentes') and isinstance(fonte['fontes_componentes'], str):
                try:
                    fonte['fontes_componentes'] = json.loads(fonte['fontes_componentes'])
                except:
                    fonte['fontes_componentes'] = None

        return jsonify({
            'success': True,
            'fontes': fontes
        })

    except Exception as e:
        logger.error(f"Erro na API de fontes de poder: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@gerenciar_bp.route('/api/fontes-poder/<int:fonte_id>')
@login_required
def api_fonte_poder_detalhes(fonte_id):
    """API: Detalhes de uma fonte de poder específica"""
    if current_user.nivel_credencial < 4:
        return jsonify({'success': False, 'message': 'Acesso negado'}), 403

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM fontes_de_poder WHERE id = %s", (fonte_id,))
        fonte = cursor.fetchone()

        if fonte:
            if fonte.get('fontes_componentes') and isinstance(fonte['fontes_componentes'], str):
                try:
                    fonte['fontes_componentes'] = json.loads(fonte['fontes_componentes'])
                except:
                    fonte['fontes_componentes'] = None

            return jsonify({'success': True, 'fonte': fonte})
        else:
            return jsonify({'success': False, 'message': 'Fonte não encontrada'}), 404

    except Exception as e:
        logger.error(f"Erro na API de fonte detalhes: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@gerenciar_bp.route('/api/fontes-poder/<int:fonte_id>', methods=['PUT'])
@login_required
def api_atualizar_fonte_poder(fonte_id):
    """API: Atualizar fonte de poder"""
    if current_user.nivel_credencial < 4:
        return jsonify({'success': False, 'message': 'Acesso negado'}), 403

    try:
        data = request.get_json()

        conn = get_db_connection()
        cursor = conn.cursor()

        # Converter fontes_componentes para JSON string se for lista
        fontes_componentes = data.get('fontes_componentes')
        if isinstance(fontes_componentes, list):
            fontes_componentes = json.dumps(fontes_componentes)

        cursor.execute("""
            UPDATE fontes_de_poder SET
                nome_exibicao = %s,
                descricao_curta = %s,
                categoria = %s,
                hybrid = %s,
                fontes_componentes = %s,
                simbolo_marca_url = %s
            WHERE id = %s
        """, (
            data.get('nome_exibicao'),
            data.get('descricao_curta', ''),
            data.get('categoria', 'Natural'),
            int(data.get('hybrid', 0)),
            fontes_componentes,
            data.get('simbolo_marca_url', ''),
            fonte_id
        ))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Fonte de poder atualizada com sucesso'
        })

    except Exception as e:
        logger.error(f"Erro ao atualizar fonte de poder: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# API AUXILIAR (Lista de personagens para selects)
# ============================================

@gerenciar_bp.route('/api/personagens/lista')
@login_required
def api_personagens_lista():
    """API: Lista simples de personagens (para selects)"""
    if current_user.nivel_credencial < 4:
        return jsonify({'success': False, 'message': 'Acesso negado'}), 403

    try:
        personagens = execute_query("""
            SELECT id, nome_completo, nivel
            FROM personagens 
            WHERE npc = FALSE
            ORDER BY nome_completo
            LIMIT 100
        """, fetch_all=True)

        return jsonify({
            'success': True,
            'personagens': personagens or []
        })

    except Exception as e:
        logger.error(f"Erro na API de lista de personagens: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500