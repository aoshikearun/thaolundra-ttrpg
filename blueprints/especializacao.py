#!/usr/bin/env python3
"""
Blueprint para sistema de especialização do Thaolundra RPG
Gerencia criação, listagem e aplicação de especializações
"""
from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user
from database import get_db_connection, execute_query
import logging

logger = logging.getLogger(__name__)

especializacao_bp = Blueprint('especializacao', __name__, url_prefix='/api/especializacao')


# ============================================
# CONSTANTES
# ============================================

CUSTO_ESPECIALIZACAO_BASE = 2000
ESPECIE_HUMANO_ID = 2  # Humano tem 50% de desconto


# ============================================
# API - LISTAR ITENS SELECIONADOS
# ============================================

@especializacao_bp.route('/itens-selecionados', methods=['GET'])
@login_required
def api_itens_selecionados():
    """
    API: Retorna a lista de perícias e técnicas selecionadas para especialização
    O front espera: { success, itens, total }
    """
    try:
        # Em produção, isso viria do banco com os IDs dos itens marcados
        # Simulação para exemplo
        itens = [
            {'id': 1, 'nome': 'Luta com Espada Longa', 'tipo': 'pericia', 'fonte': None},
            {'id': 2, 'nome': 'Bola de Fogo', 'tipo': 'tecnica', 'fonte': 'Fogo'},
            {'id': 3, 'nome': 'Furtividade', 'tipo': 'pericia', 'fonte': None}
        ]

        return jsonify({
            'success': True,
            'itens': itens,
            'total': len(itens)
        })

    except Exception as e:
        logger.error(f"Erro ao listar itens selecionados: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# API - LISTAR ESPECIALIZAÇÕES DISPONÍVEIS
# ============================================

@especializacao_bp.route('/disponiveis', methods=['GET'])
@login_required
def api_especializacoes_disponiveis():
    """
    API: Retorna a lista de especializações disponíveis
    O front espera: { success, especializacoes }
    """
    try:
        # Em produção, viria do banco
        especializacoes = [
            {'id': 1, 'nome': 'Mestre Espadachim', 'descricao': 'Ataques com espada causam +2d6 de dano adicional. Além disso, você pode realizar um ataque extra como ação bônus uma vez por rodada.'},
            {'id': 2, 'nome': 'Piromante Avançado', 'descricao': 'Magias de fogo custam -2 PE. Além disso, você ganha resistência a dano de fogo.'},
            {'id': 3, 'nome': 'Sombra Veloz', 'descricao': '+10 em testes de furtividade. Você pode se mover silenciosamente mesmo em terreno difícil.'},
            {'id': 4, 'nome': 'Lâmina Elemental', 'descricao': 'Ataques causam dano elemental adicional baseado na sua fonte de poder principal.'}
        ]

        return jsonify({
            'success': True,
            'especializacoes': especializacoes,
            'total': len(especializacoes)
        })

    except Exception as e:
        logger.error(f"Erro ao listar especializações: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# API - CRIAR ESPECIALIZAÇÃO
# ============================================

@especializacao_bp.route('/criar', methods=['POST'])
@login_required
def api_criar_especializacao():
    """
    API: Cria uma nova especialização
    O front espera: { success, message, especializacao }
    """
    data = request.get_json()

    nome = data.get('nome', '').strip()
    descricao = data.get('descricao', '').strip()

    if not nome:
        return jsonify({'success': False, 'message': 'Nome é obrigatório'}), 400

    if not descricao:
        return jsonify({'success': False, 'message': 'Descrição é obrigatória'}), 400

    try:
        # Em produção, salvar no banco
        # cursor.execute("INSERT INTO especializacoes (nome, descricao, criado_por) VALUES (%s, %s, %s)", ...)

        logger.info(f"Usuário {current_user.username} criou especialização '{nome}'")

        return jsonify({
            'success': True,
            'message': 'Especialização criada com sucesso',
            'especializacao': {
                'id': 999,  # ID gerado pelo banco
                'nome': nome,
                'descricao': descricao
            }
        })

    except Exception as e:
        logger.error(f"Erro ao criar especialização: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# API - CALCULAR CUSTO
# ============================================

@especializacao_bp.route('/calcular-custo', methods=['POST'])
@login_required
def api_calcular_custo():
    """
    API: Calcula o custo de especialização
    O front espera: { success, total, humano, por_item }
    """
    data = request.get_json()
    itens_ids = data.get('itens_ids', [])

    if not itens_ids:
        return jsonify({'success': False, 'message': 'Nenhum item selecionado'}), 400

    try:
        # Buscar espécie do usuário para verificar se é humano
        usuario = execute_query(
            "SELECT especie_id FROM usuarios WHERE id = %s",
            (current_user.id,),
            fetch_one=True
        )

        is_humano = usuario and usuario.get('especie_id') == ESPECIE_HUMANO_ID

        total_itens = len(itens_ids)
        custo_total = total_itens * CUSTO_ESPECIALIZACAO_BASE
        custo_humano = custo_total // 2 if is_humano else custo_total

        return jsonify({
            'success': True,
            'total': custo_total,
            'humano': custo_humano if is_humano else None,
            'por_item': CUSTO_ESPECIALIZACAO_BASE,
            'is_humano': is_humano
        })

    except Exception as e:
        logger.error(f"Erro ao calcular custo: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# API - APLICAR ESPECIALIZAÇÃO
# ============================================

@especializacao_bp.route('/aplicar', methods=['POST'])
@login_required
def api_aplicar_especializacao():
    """
    API: Aplica uma especialização aos itens selecionados
    O front espera: { success, message }
    """
    data = request.get_json()

    especializacao_id = data.get('especializacao_id')
    itens_ids = data.get('itens_ids', [])

    if not especializacao_id:
        return jsonify({'success': False, 'message': 'Especialização não informada'}), 400

    if not itens_ids:
        return jsonify({'success': False, 'message': 'Nenhum item selecionado'}), 400

    try:
        # Em produção, salvar a relação personagem_especializacao
        # e marcar os itens como especializados

        logger.info(f"Usuário {current_user.username} aplicou especialização {especializacao_id} em {len(itens_ids)} itens")

        return jsonify({
            'success': True,
            'message': 'Especialização aplicada com sucesso!'
        })

    except Exception as e:
        logger.error(f"Erro ao aplicar especialização: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# CONTEXTO GLOBAL PARA TEMPLATES
# ============================================

@especializacao_bp.context_processor
def inject_especializacao_variables():
    """Injeta variáveis nos templates do blueprint"""
    return {
        'custo_especializacao_base': CUSTO_ESPECIALIZACAO_BASE,
        'especie_humano_id': ESPECIE_HUMANO_ID
    }