#!/usr/bin/env python3
"""
Blueprint da página principal do Thaolundra RPG
Dashboard principal e APIs públicas do sistema
"""
from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user
from database import get_db_connection, execute_query
import logging
from datetime import datetime

# Configuração de logging
logger = logging.getLogger(__name__)

# ============================================
# BLUEPRINT DA PÁGINA PRINCIPAL
# ============================================

main_bp = Blueprint('main', __name__)


# ============================================
# FUNÇÕES AUXILIARES
# ============================================

def calcular_percentual(atual, maximo):
    """Calcula percentual para barras de progresso"""
    if not maximo or maximo <= 0:
        return 0
    return (atual / maximo) * 100


def get_status_icone(percentual):
    """Retorna ícone e classe CSS baseado no percentual"""
    if percentual >= 75:
        return {'icone': '🟢', 'classe': 'status-excelente'}
    elif percentual >= 50:
        return {'icone': '🟡', 'classe': 'status-bom'}
    elif percentual >= 25:
        return {'icone': '🟠', 'classe': 'status-atencao'}
    else:
        return {'icone': '🔴', 'classe': 'status-critico'}


# ============================================
# ROTAS PRINCIPAIS
# ============================================

@main_bp.route('/main')
@login_required
def main_page():
    """Página principal / Dashboard do usuário"""
    return render_template('main.html', user=current_user)


# ============================================
# APIs PÚBLICAS (o front-end espera estas rotas)
# ============================================

@main_bp.route('/api/personagens/todos')
@login_required
def api_todos_personagens():
    """
    API: Lista todos os personagens públicos
    O front espera: { success, personagens, paginacao }
    """
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco de dados'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        # Parâmetros de paginação
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')

        offset = (page - 1) * per_page

        # Query base
        query = """
            SELECT 
                p.id,
                p.nome_completo,
                p.nivel,
                p.forca_vital_atual,
                p.forca_vital_maxima,
                p.poder_elemental_atual,
                p.poder_elemental_maximo,
                p.npc,
                p.data_criacao,
                e.nome as especie_nome,
                e.id as especie_id,
                f.nome as faccao_nome,
                u.username as jogador_nome,
                u.id as jogador_id,
                fp.nome_exibicao as fonte_nome
            FROM personagens p
            LEFT JOIN especies e ON p.especie_id = e.id
            LEFT JOIN faccoes f ON p.faccao_id = f.id
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            LEFT JOIN fontes_de_poder fp ON p.fonte_poder_id = fp.id
            WHERE p.privado = 0 AND p.npc = 0
        """

        params = []

        if search:
            query += " AND p.nome_completo LIKE %s"
            params.append(f"%{search}%")

        # Query de contagem
        cursor.execute(f"""
            SELECT COUNT(*) as total FROM ({query}) as sub
        """, params)
        total_count = cursor.fetchone()
        total = total_count['total'] if total_count else 0

        # Query com paginação
        query += " ORDER BY p.nivel DESC, p.nome_completo LIMIT %s OFFSET %s"
        params.extend([per_page, offset])

        cursor.execute(query, params)
        personagens = cursor.fetchall()

        # Calcular percentuais
        for p in personagens:
            p['pv_percent'] = calcular_percentual(
                p.get('forca_vital_atual', 0),
                p.get('forca_vital_maxima', 1)
            )
            p['pe_percent'] = calcular_percentual(
                p.get('poder_elemental_atual', 0),
                p.get('poder_elemental_maximo', 1)
            )

            if p.get('data_criacao'):
                p['data_criacao'] = p['data_criacao'].strftime('%d/%m/%Y')

        return jsonify({
            'success': True,
            'personagens': personagens,
            'paginacao': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'total_pages': (total + per_page - 1) // per_page
            }
        })

    except Exception as e:
        logger.error(f"Erro na API de personagens: {e}")
        return jsonify({'success': False, 'message': 'Erro interno'}), 500

    finally:
        cursor.close()
        conn.close()


@main_bp.route('/api/personagens/meus')
@login_required
def api_meus_personagens():
    """
    API: Lista os personagens do usuário atual
    O front espera: { success, count, personagens }
    """
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco de dados'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT 
                p.id,
                p.nome_completo,
                p.nivel,
                p.npc,
                p.privado,
                p.data_criacao,
                p.data_atualizacao,
                p.forca_vital_atual,
                p.forca_vital_maxima,
                p.poder_elemental_atual,
                p.poder_elemental_maximo,
                e.nome as especie_nome,
                f.nome as faccao_nome,
                a.nome as aura_nome,
                fp.nome_exibicao as fonte_nome
            FROM personagens p
            LEFT JOIN especies e ON p.especie_id = e.id
            LEFT JOIN faccoes f ON p.faccao_id = f.id
            LEFT JOIN auras a ON p.aura_id = a.id
            LEFT JOIN fontes_de_poder fp ON p.fonte_poder_id = fp.id
            WHERE p.usuario_id = %s
            ORDER BY p.data_criacao DESC
        """, (current_user.id,))

        personagens = cursor.fetchall()

        for p in personagens:
            p['pv_percent'] = calcular_percentual(
                p.get('forca_vital_atual', 0),
                p.get('forca_vital_maxima', 1)
            )
            p['pe_percent'] = calcular_percentual(
                p.get('poder_elemental_atual', 0),
                p.get('poder_elemental_maximo', 1)
            )

            if p.get('data_criacao'):
                p['data_criacao'] = p['data_criacao'].strftime('%d/%m/%Y')
            if p.get('data_atualizacao'):
                p['data_atualizacao'] = p['data_atualizacao'].strftime('%d/%m/%Y')

        return jsonify({
            'success': True,
            'count': len(personagens),
            'personagens': personagens
        })

    except Exception as e:
        logger.error(f"Erro na API de meus personagens: {e}")
        return jsonify({'success': False, 'message': 'Erro interno'}), 500

    finally:
        cursor.close()
        conn.close()


@main_bp.route('/api/personagens/destaques')
@login_required
def api_personagens_destaques():
    """
    API: Retorna personagens em destaque
    O front espera: { success, top_nivel, recentes }
    """
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        # Top 5 por nível
        cursor.execute("""
            SELECT p.id, p.nome_completo, p.nivel, e.nome as especie_nome,
                   u.username as jogador_nome
            FROM personagens p
            JOIN especies e ON p.especie_id = e.id
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.privado = 0 AND p.npc = 0
            ORDER BY p.nivel DESC
            LIMIT 5
        """)
        top_nivel = cursor.fetchall()

        # 5 mais recentes
        cursor.execute("""
            SELECT p.id, p.nome_completo, p.nivel, e.nome as especie_nome,
                   u.username as jogador_nome, p.data_criacao
            FROM personagens p
            JOIN especies e ON p.especie_id = e.id
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.privado = 0 AND p.npc = 0
            ORDER BY p.data_criacao DESC
            LIMIT 5
        """)
        recentes = cursor.fetchall()

        for p in recentes:
            if p.get('data_criacao'):
                p['data_criacao'] = p['data_criacao'].strftime('%d/%m/%Y')

        return jsonify({
            'success': True,
            'top_nivel': top_nivel,
            'recentes': recentes
        })

    except Exception as e:
        logger.error(f"Erro na API de destaques: {e}")
        return jsonify({'success': False, 'message': 'Erro interno'}), 500

    finally:
        cursor.close()
        conn.close()


@main_bp.route('/api/especies/lista')
@login_required
def api_especies_lista():
    """API: Lista simples de espécies (para selects)"""
    try:
        especies = execute_query(
            """
            SELECT id, nome, minimo_poder, maximo_poder, advanced
            FROM especies 
            ORDER BY advanced ASC, nome
            """,
            fetch_all=True
        )

        return jsonify({
            'success': True,
            'especies': especies or []
        })

    except Exception as e:
        logger.error(f"Erro na API de lista de espécies: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@main_bp.route('/api/fontes/lista')
@login_required
def api_fontes_lista():
    """API: Lista simples de fontes de poder (para selects)"""
    try:
        fontes = execute_query(
            """
            SELECT id, nome_exibicao, categoria, hybrid
            FROM fontes_de_poder 
            ORDER BY nome_exibicao
            """,
            fetch_all=True
        )

        return jsonify({
            'success': True,
            'fontes': fontes or []
        })

    except Exception as e:
        logger.error(f"Erro na API de lista de fontes: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# CONTEXTO GLOBAL PARA TEMPLATES
# ============================================

@main_bp.context_processor
def inject_main_variables():
    """Injeta variáveis nos templates do blueprint principal"""

    def can_edit(personagem, user=None):
        """Verifica se o usuário pode editar um personagem"""
        if user is None:
            user = current_user
        if not user.is_authenticated:
            return False
        return personagem.get('usuario_id') == user.id or user.is_moderator()

    return {
        'can_edit': can_edit,
        'calcular_percentual': calcular_percentual,
        'get_status_icone': get_status_icone
    }