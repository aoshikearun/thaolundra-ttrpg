#!/usr/bin/env python3
"""
Blueprint para sistema de progressão de experiência (EXP) do Thaolundra RPG
Gerencia cálculos de custo para aumento de atributos, perícias, técnicas, FV e PE
"""
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from database import get_db_connection, execute_query
import json
import logging

logger = logging.getLogger(__name__)

progressao_exp_bp = Blueprint('progressao_exp', __name__, url_prefix='/api/progressao')


# ============================================
# CONSTANTES E CONFIGURAÇÕES
# ============================================

def get_tabela_por_tipo(tipo=None):
    """Retorna a configuração da tabela para cada tipo de progressão"""
    tabelas = {
        'atributo': {
            'tabela': 'progressao_atributos',
            'maximo_config': 'atributo_maximo',
            'intervalo_padrao': 5
        },
        'pericia': {
            'tabela': 'progressao_pericias',
            'maximo_config': 'pericia_maximo',
            'intervalo_padrao': 50
        },
        'tecnica': {
            'tabela': 'progressao_tecnicas',
            'maximo_config': 'tecnica_maximo',
            'intervalo_padrao': 50
        },
        'fv_pe': {
            'tabela': 'progressao_fv_pe',
            'maximo_config': 'fv_pe_maximo',
            'intervalo_padrao': 100
        }
    }

    if tipo is None:
        return tabelas
    return tabelas.get(tipo)


def get_valor_maximo_base(tipo):
    """Retorna o valor máximo base da tabela config"""
    config = get_tabela_por_tipo(tipo)
    if not config:
        return None

    result = execute_query(
        "SELECT valor FROM progressao_config WHERE nome = %s",
        (config['maximo_config'],),
        fetch_one=True
    )

    return result['valor'] if result else None


def calcular_custo_progressao(valor_atual, tipo):
    """
    Calcula o custo para o próximo nível de um atributo/perícia/técnica/FV/PE

    Args:
        valor_atual (int): Valor atual do item
        tipo (str): 'atributo', 'pericia', 'tecnica', 'fv_pe'

    Returns:
        dict or None: {
            'custo': int,
            'proximo_valor': int,
            'faixa_inicio': int,
            'faixa_fim': int,
            'extrapolado': bool
        }
    """
    config = get_tabela_por_tipo(tipo)
    if not config:
        return None

    conn = get_db_connection()
    if not conn:
        return None

    cursor = conn.cursor(dictionary=True)

    try:
        # Buscar faixa que contém o valor atual
        cursor.execute(f"""
            SELECT faixa_inicio, faixa_fim, custo, multiplicador_proximo
            FROM {config['tabela']}
            WHERE faixa_inicio <= %s AND faixa_fim >= %s
            AND ativo = TRUE
        """, (valor_atual, valor_atual))

        faixa = cursor.fetchone()

        if faixa:
            return {
                'custo': faixa['custo'],
                'proximo_valor': valor_atual + 1,
                'faixa_inicio': faixa['faixa_inicio'],
                'faixa_fim': faixa['faixa_fim'],
                'extrapolado': False
            }

        # Buscar última faixa para extrapolação
        cursor.execute(f"""
            SELECT faixa_inicio, faixa_fim, custo, multiplicador_proximo
            FROM {config['tabela']}
            WHERE ativo = TRUE
            ORDER BY faixa_fim DESC
            LIMIT 1
        """)

        ultima_faixa = cursor.fetchone()

        if ultima_faixa:
            intervalo = ultima_faixa['faixa_fim'] - ultima_faixa['faixa_inicio'] + 1
            passos = (valor_atual - ultima_faixa['faixa_fim']) // intervalo + 1
            multiplicador = ultima_faixa['multiplicador_proximo'] ** passos
            custo = ultima_faixa['custo'] * multiplicador

            return {
                'custo': int(custo),
                'proximo_valor': valor_atual + 1,
                'faixa_inicio': ultima_faixa['faixa_fim'] + 1,
                'faixa_fim': ultima_faixa['faixa_fim'] + intervalo,
                'extrapolado': True
            }

        return None

    except Exception as e:
        logger.error(f"Erro ao calcular custo de progressão: {e}")
        return None

    finally:
        cursor.close()
        conn.close()


def calcular_custo_multiplos(valor_atual, tipo, quantidade):
    """
    Calcula o custo para aumentar um item múltiplas vezes

    Args:
        valor_atual (int): Valor atual
        tipo (str): Tipo de progressão
        quantidade (int): Número de aumentos

    Returns:
        dict or None: {
            'custo_total': int,
            'novo_valor': int,
            'detalhes': list
        }
    """
    if quantidade > 100:
        return None

    custo_total = 0
    valor_temp = valor_atual
    detalhes = []

    for i in range(quantidade):
        resultado = calcular_custo_progressao(valor_temp, tipo)
        if not resultado:
            break
        custo_total += resultado['custo']
        detalhes.append({
            'de': valor_temp,
            'para': resultado['proximo_valor'],
            'custo': resultado['custo']
        })
        valor_temp = resultado['proximo_valor']

    return {
        'custo_total': custo_total,
        'novo_valor': valor_temp,
        'detalhes': detalhes,
        'quantidade': len(detalhes)
    }


# ============================================
# APIS
# ============================================

@progressao_exp_bp.route('/custo', methods=['POST'])
@login_required
def api_calcular_custo():
    """
    Calcula o custo para aumentar um item em 1 nível
    O front espera: { success, custo, proximo_valor, faixa_inicio, faixa_fim, extrapolado }
    """
    data = request.get_json()
    valor_atual = data.get('valor_atual')
    tipo = data.get('tipo')

    if valor_atual is None or not tipo:
        return jsonify({'success': False, 'message': 'Parâmetros inválidos'}), 400

    # Mapear tipos que o front pode enviar
    tipo_mapping = {
        'atributo': 'atributo',
        'pericia': 'pericia',
        'tecnica': 'tecnica',
        'fv': 'fv_pe',
        'pe': 'fv_pe'
    }

    tipo_normalizado = tipo_mapping.get(tipo, tipo)

    resultado = calcular_custo_progressao(int(valor_atual), tipo_normalizado)

    if resultado:
        return jsonify({
            'success': True,
            'custo': resultado['custo'],
            'proximo_valor': resultado['proximo_valor'],
            'faixa_inicio': resultado['faixa_inicio'],
            'faixa_fim': resultado['faixa_fim'],
            'extrapolado': resultado['extrapolado']
        })
    else:
        return jsonify({'success': False, 'message': 'Erro ao calcular custo'}), 500


@progressao_exp_bp.route('/custos-multiplos', methods=['POST'])
@login_required
def api_calcular_custos_multiplos():
    """
    Calcula o custo para aumentar um item múltiplas vezes
    O front espera: { success, custo_total, novo_valor, detalhes, quantidade }
    """
    data = request.get_json()
    valor_atual = data.get('valor_atual')
    tipo = data.get('tipo')
    quantidade = data.get('quantidade', 1)

    if valor_atual is None or not tipo:
        return jsonify({'success': False, 'message': 'Parâmetros inválidos'}), 400

    if quantidade > 100:
        return jsonify({'success': False, 'message': 'Quantidade máxima de 100'}), 400

    # Mapear tipos que o front pode enviar
    tipo_mapping = {
        'atributo': 'atributo',
        'pericia': 'pericia',
        'tecnica': 'tecnica',
        'fv': 'fv_pe',
        'pe': 'fv_pe'
    }

    tipo_normalizado = tipo_mapping.get(tipo, tipo)

    resultado = calcular_custo_multiplos(int(valor_atual), tipo_normalizado, int(quantidade))

    if resultado:
        return jsonify({
            'success': True,
            'custo_total': resultado['custo_total'],
            'novo_valor': resultado['novo_valor'],
            'detalhes': resultado['detalhes'],
            'quantidade': resultado['quantidade']
        })
    else:
        return jsonify({'success': False, 'message': 'Erro ao calcular custos'}), 500


@progressao_exp_bp.route('/tabelas', methods=['GET'])
@login_required
def api_get_tabelas():
    """
    Retorna todas as tabelas de progressão e configurações
    O front espera: { success, dados: { atributo, pericia, tecnica, fv_pe, config } }
    """
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        resultado = {}
        tabelas = get_tabela_por_tipo(None)

        for tipo, config in tabelas.items():
            cursor.execute(f"""
                SELECT faixa_inicio, faixa_fim, custo, multiplicador_proximo
                FROM {config['tabela']}
                WHERE ativo = TRUE
                ORDER BY faixa_inicio
            """)
            resultado[tipo] = cursor.fetchall()

        # Buscar configurações
        cursor.execute("SELECT nome, valor FROM progressao_config")
        resultado['config'] = {row['nome']: row['valor'] for row in cursor.fetchall()}

        return jsonify({'success': True, 'dados': resultado})

    except Exception as e:
        logger.error(f"Erro ao buscar tabelas: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@progressao_exp_bp.route('/gastar', methods=['POST'])
@login_required
def api_gastar_experiencia():
    """
    Registra gasto de experiência em um item
    (Placeholder - o salvamento real é feito junto com a ficha)

    O front espera: { success, message }
    """
    data = request.get_json()

    # Estrutura esperada:
    # {
    #   "personagem_id": 123 (opcional),
    #   "rascunho_id": 456 (opcional),
    #   "gastos": {
    #       "atributos": {"forca": 5, "destreza": 3},
    #       "pericias": {1: 10, 2: 5},
    #       "tecnicas": {5: 8},
    #       "fv": 10,
    #       "pe": 5
    #   },
    #   "experiencia_gasta": 1250
    # }

    # Por enquanto, apenas valida e retorna sucesso
    # O salvamento real será feito junto com a ficha no criar_ficha.py

    logger.info(f"Usuário {current_user.username} registrou gasto de EXP: {data.get('experiencia_gasta', 0)}")

    return jsonify({
        'success': True,
        'message': 'Gastos registrados temporariamente'
    })


# ============================================
# API PARA VALIDAR GASTOS (opcional)
# ============================================

@progressao_exp_bp.route('/validar', methods=['POST'])
@login_required
def api_validar_gastos():
    """
    Valida se os gastos propostos são possíveis com a EXP disponível
    Útil para validação antes de salvar
    """
    data = request.get_json()
    experiencia_disponivel = data.get('experiencia_disponivel', 0)
    gastos = data.get('gastos', {})

    custo_total = 0
    detalhes_validacao = []

    try:
        # Validar atributos
        if 'atributos' in gastos:
            for attr, quantidade in gastos['atributos'].items():
                # Buscar valor base do atributo (precisa ser passado ou buscado)
                valor_base = data.get('valores_base', {}).get(attr, 1)
                resultado = calcular_custo_multiplos(valor_base, 'atributo', quantidade)
                if resultado:
                    custo_total += resultado['custo_total']
                    detalhes_validacao.append({
                        'tipo': 'atributo',
                        'id': attr,
                        'quantidade': quantidade,
                        'custo': resultado['custo_total']
                    })

        # Validar perícias
        if 'pericias' in gastos:
            for pericia_id, quantidade in gastos['pericias'].items():
                valor_base = data.get('valores_base', {}).get('pericias', {}).get(str(pericia_id), 1)
                resultado = calcular_custo_multiplos(valor_base, 'pericia', quantidade)
                if resultado:
                    custo_total += resultado['custo_total']
                    detalhes_validacao.append({
                        'tipo': 'pericia',
                        'id': pericia_id,
                        'quantidade': quantidade,
                        'custo': resultado['custo_total']
                    })

        # Validar técnicas
        if 'tecnicas' in gastos:
            for tecnica_id, quantidade in gastos['tecnicas'].items():
                valor_base = data.get('valores_base', {}).get('tecnicas', {}).get(str(tecnica_id), 1)
                resultado = calcular_custo_multiplos(valor_base, 'tecnica', quantidade)
                if resultado:
                    custo_total += resultado['custo_total']
                    detalhes_validacao.append({
                        'tipo': 'tecnica',
                        'id': tecnica_id,
                        'quantidade': quantidade,
                        'custo': resultado['custo_total']
                    })

        # Validar FV
        if 'fv' in gastos:
            valor_base = data.get('valores_base', {}).get('fv', 0)
            resultado = calcular_custo_multiplos(valor_base, 'fv_pe', gastos['fv'])
            if resultado:
                custo_total += resultado['custo_total']
                detalhes_validacao.append({
                    'tipo': 'fv',
                    'quantidade': gastos['fv'],
                    'custo': resultado['custo_total']
                })

        # Validar PE
        if 'pe' in gastos:
            valor_base = data.get('valores_base', {}).get('pe', 0)
            resultado = calcular_custo_multiplos(valor_base, 'fv_pe', gastos['pe'])
            if resultado:
                custo_total += resultado['custo_total']
                detalhes_validacao.append({
                    'tipo': 'pe',
                    'quantidade': gastos['pe'],
                    'custo': resultado['custo_total']
                })

        pode_gastar = custo_total <= experiencia_disponivel

        return jsonify({
            'success': True,
            'pode_gastar': pode_gastar,
            'custo_total': custo_total,
            'experiencia_restante': experiencia_disponivel - custo_total if pode_gastar else 0,
            'faltando': custo_total - experiencia_disponivel if not pode_gastar else 0,
            'detalhes': detalhes_validacao
        })

    except Exception as e:
        logger.error(f"Erro ao validar gastos: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500