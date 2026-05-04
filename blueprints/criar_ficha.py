#!/usr/bin/env python3
"""
Blueprint para criação de fichas de personagem do Thaolundra RPG
Gerencia o wizard de criação com 9 passos
"""
from flask import Blueprint, render_template, jsonify, request, session
from flask_login import login_required, current_user
from database import get_db_connection, execute_query
import random
import json
import logging

logger = logging.getLogger(__name__)

criar_ficha_bp = Blueprint('criar_ficha', __name__)


# ============================================
# PÁGINA PRINCIPAL
# ============================================

@criar_ficha_bp.route('/criar-ficha')
@login_required
def criar_ficha():
    """Página de criação de ficha"""
    return render_template('criar_ficha.html', user=current_user)


# ============================================
# API - CATEGORIAS
# ============================================

@criar_ficha_bp.route('/api/ficha/categorias')
@login_required
def api_categorias_ficha():
    """API: Listar categorias de personagem"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT id, nome, nome_exibicao, credencial_minima, 
                   permite_racas_avancadas, permite_fontes_hibridas,
                   pode_transferir_atributos, atributos_bonus, poder_bonus,
                   poder_roll_dice, limites_pericias, tecnicas_avancadas_max,
                   tecnicas_ultimas_max, experiencia_inicial, fv_bonus, pe_bonus,
                   descricao
            FROM categorias_personagem
            WHERE ativo = TRUE
            ORDER BY id
        """)

        categorias = cursor.fetchall()

        # Converter limites_pericias de JSON string para objeto
        for cat in categorias:
            if cat.get('limites_pericias'):
                if isinstance(cat['limites_pericias'], str):
                    try:
                        cat['limites_pericias'] = json.loads(cat['limites_pericias'])
                    except:
                        cat['limites_pericias'] = {}
            else:
                cat['limites_pericias'] = {}

        return jsonify({'success': True, 'categorias': categorias})

    except Exception as e:
        logger.error(f"Erro na API de categorias: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@criar_ficha_bp.route('/api/ficha/categorias/<int:categoria_id>')
@login_required
def api_categoria_by_id(categoria_id):
    """API: Retorna uma categoria específica"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT id, nome, nome_exibicao, credencial_minima, 
                   permite_racas_avancadas, permite_fontes_hibridas,
                   pode_transferir_atributos, atributos_bonus, poder_bonus,
                   poder_roll_dice, limites_pericias, tecnicas_avancadas_max,
                   tecnicas_ultimas_max, experiencia_inicial, fv_bonus, pe_bonus,
                   descricao
            FROM categorias_personagem
            WHERE id = %s AND ativo = TRUE
        """, (categoria_id,))

        categoria = cursor.fetchone()

        if not categoria:
            return jsonify({'success': False, 'message': 'Categoria não encontrada'}), 404

        if categoria.get('limites_pericias') and isinstance(categoria['limites_pericias'], str):
            try:
                categoria['limites_pericias'] = json.loads(categoria['limites_pericias'])
            except:
                categoria['limites_pericias'] = {}

        return jsonify({'success': True, 'categoria': categoria})

    except Exception as e:
        logger.error(f"Erro na API de categoria {categoria_id}: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ============================================
# API - ESPÉCIES
# ============================================

@criar_ficha_bp.route('/api/ficha/especies')
@login_required
def api_especies_ficha():
    """API: Listar todas as espécies para o carrossel"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT id, nome, minimo_poder, maximo_poder, descricao, 
                   especificidades_mecanicas, advanced, ordem
            FROM especies 
            ORDER BY advanced ASC, ordem
        """)

        especies = cursor.fetchall()
        return jsonify({'success': True, 'especies': especies})

    except Exception as e:
        logger.error(f"Erro na API de espécies: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@criar_ficha_bp.route('/api/ficha/especies-por-categoria')
@login_required
def api_especies_por_categoria():
    """API: Listar espécies filtradas por categoria"""
    categoria_id = request.args.get('categoria_id', type=int)

    if not categoria_id:
        return jsonify({'success': False, 'message': 'Categoria não informada'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        # Buscar categoria para saber se permite raças avançadas
        cursor.execute("""
            SELECT permite_racas_avancadas 
            FROM categorias_personagem 
            WHERE id = %s
        """, (categoria_id,))

        categoria = cursor.fetchone()

        if not categoria:
            return jsonify({'success': False, 'message': 'Categoria não encontrada'}), 404

        permite_avancadas = categoria['permite_racas_avancadas']

        # Buscar espécies filtradas
        if permite_avancadas:
            cursor.execute("""
                SELECT id, nome, minimo_poder, maximo_poder, descricao, 
                       especificidades_mecanicas, advanced, ordem
                FROM especies 
                ORDER BY advanced ASC, ordem
            """)
        else:
            cursor.execute("""
                SELECT id, nome, minimo_poder, maximo_poder, descricao, 
                       especificidades_mecanicas, advanced, ordem
                FROM especies 
                WHERE advanced = 0
                ORDER BY ordem
            """)

        especies = cursor.fetchall()
        return jsonify({'success': True, 'especies': especies, 'permite_avancadas': permite_avancadas})

    except Exception as e:
        logger.error(f"Erro na API de espécies por categoria: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ============================================
# API - FONTES DE PODER
# ============================================

# Mapeamento de espécie_id para lista de fonte_ids permitidos
FONTES_POR_ESPECIE = {
    1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 15, 16],  # Bestial
    2: [1, 2, 3, 4, 5, 6, 7, 8, 9, 15, 16],  # Humano
    3: [1, 2, 3, 4, 5, 6, 7, 8, 9, 15, 16],  # Klaveck
    4: [1, 2, 3, 4, 5, 6, 7, 8, 9, 15, 16],  # Darch
    5: [1, 2, 3, 4, 5, 6, 7, 8, 9, 15, 16],  # Sombra
    6: [14],  # Mecha
    7: [10],  # Rokan
    8: [13],  # Yun-hai
    9: [13],  # Kyongun
    10: [11],  # Demônio
    11: [12],  # Anjo
}


@criar_ficha_bp.route('/api/ficha/fontes-poder')
@login_required
def api_fontes_poder_ficha():
    """API: Listar fontes de poder (com opção de filtrar por espécie)"""
    especie_id = request.args.get('especie_id', type=int)

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        if especie_id and especie_id in FONTES_POR_ESPECIE:
            fontes_ids = FONTES_POR_ESPECIE[especie_id]
            placeholders = ','.join(['%s'] * len(fontes_ids))
            cursor.execute(f"""
                SELECT id, nome_exibicao, categoria, descricao_curta, hybrid, fontes_componentes, ordem
                FROM fontes_de_poder 
                WHERE id IN ({placeholders})
                ORDER BY hybrid ASC, ordem
            """, tuple(fontes_ids))
        else:
            cursor.execute("""
                SELECT id, nome_exibicao, categoria, descricao_curta, hybrid, fontes_componentes, ordem
                FROM fontes_de_poder 
                ORDER BY hybrid DESC, nome_exibicao
            """)

        fontes = cursor.fetchall()

        # Converter fontes_componentes de string para lista
        for fonte in fontes:
            if fonte.get('fontes_componentes') and isinstance(fonte['fontes_componentes'], str):
                try:
                    fonte['fontes_componentes'] = json.loads(fonte['fontes_componentes'])
                except:
                    fonte['fontes_componentes'] = None
            else:
                fonte['fontes_componentes'] = None

        return jsonify({'success': True, 'fontes': fontes})

    except Exception as e:
        logger.error(f"Erro na API de fontes: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@criar_ficha_bp.route('/api/ficha/fontes-por-categoria')
@login_required
def api_fontes_por_categoria():
    """API: Listar fontes filtradas por categoria e espécie"""
    categoria_id = request.args.get('categoria_id', type=int)
    especie_id = request.args.get('especie_id', type=int)

    if not categoria_id:
        return jsonify({'success': False, 'message': 'Categoria não informada'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        # Buscar categoria para saber se permite fontes híbridas
        cursor.execute("""
            SELECT permite_fontes_hibridas 
            FROM categorias_personagem 
            WHERE id = %s
        """, (categoria_id,))

        categoria = cursor.fetchone()

        if not categoria:
            return jsonify({'success': False, 'message': 'Categoria não encontrada'}), 404

        permite_hibridas = categoria['permite_fontes_hibridas']

        # Buscar fontes da espécie (se informada)
        if especie_id and especie_id in FONTES_POR_ESPECIE:
            fontes_ids = FONTES_POR_ESPECIE[especie_id]
            placeholders = ','.join(['%s'] * len(fontes_ids))

            if permite_hibridas:
                cursor.execute(f"""
                    SELECT id, nome_exibicao, categoria, descricao_curta, hybrid, fontes_componentes, ordem
                    FROM fontes_de_poder 
                    WHERE id IN ({placeholders})
                    ORDER BY hybrid ASC, ordem
                """, tuple(fontes_ids))
            else:
                cursor.execute(f"""
                    SELECT id, nome_exibicao, categoria, descricao_curta, hybrid, fontes_componentes, ordem
                    FROM fontes_de_poder 
                    WHERE id IN ({placeholders}) AND hybrid = 0
                    ORDER BY ordem
                """, tuple(fontes_ids))
        else:
            if permite_hibridas:
                cursor.execute("""
                    SELECT id, nome_exibicao, categoria, descricao_curta, hybrid, fontes_componentes, ordem
                    FROM fontes_de_poder 
                    ORDER BY hybrid DESC, ordem
                """)
            else:
                cursor.execute("""
                    SELECT id, nome_exibicao, categoria, descricao_curta, hybrid, fontes_componentes, ordem
                    FROM fontes_de_poder 
                    WHERE hybrid = 0
                    ORDER BY ordem
                """)

        fontes = cursor.fetchall()

        for fonte in fontes:
            if fonte.get('fontes_componentes') and isinstance(fonte['fontes_componentes'], str):
                try:
                    fonte['fontes_componentes'] = json.loads(fonte['fontes_componentes'])
                except:
                    fonte['fontes_componentes'] = None

        return jsonify({'success': True, 'fontes': fontes, 'permite_hibridas': permite_hibridas})

    except Exception as e:
        logger.error(f"Erro na API de fontes por categoria: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ============================================
# API - TÉCNICAS
# ============================================

@criar_ficha_bp.route('/api/ficha/tecnicas/<int:fonte_id>')
@login_required
def api_tecnicas_por_fonte(fonte_id):
    """API: Listar técnicas por fonte de poder"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT t.id, t.nome, t.categoria, t.descricao_geral, t.custo, t.efetividade
            FROM tecnicas t
            WHERE t.fonte_de_poder_id = %s
            ORDER BY 
                CASE t.categoria
                    WHEN 'Inata' THEN 1
                    WHEN 'Básica' THEN 2
                    WHEN 'Avançada' THEN 3
                    WHEN 'Última' THEN 4
                END,
                t.nome
        """, (fonte_id,))

        tecnicas = cursor.fetchall()

        return jsonify({
            'success': True,
            'tecnicas': tecnicas
        })

    except Exception as e:
        logger.error(f"Erro na API de técnicas por fonte {fonte_id}: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ============================================
# API - PERÍCIAS
# ============================================

@criar_ficha_bp.route('/api/ficha/pericias')
@login_required
def api_pericias_ficha():
    """API: Listar perícias para ficha com limites por categoria"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT id, nome, categoria, descricao_geral, especializacao
            FROM pericias
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

        # Agrupar por categoria para frontend
        categorias = {
            'Combate': [],
            'Ofício': [],
            'Conhecimento': [],
            'Vontade': [],
            'Simples': [],
            'Sociais': []
        }

        for pericia in pericias:
            if pericia['categoria'] in categorias:
                categorias[pericia['categoria']].append(pericia)

        return jsonify({
            'success': True,
            'pericias': pericias,
            'categorias': categorias,
            'limites': {
                'Combate': 2,
                'Ofício': 2,
                'Conhecimento': 3,
                'Vontade': 1,
                'Simples': 200,
                'Sociais': 200
            }
        })

    except Exception as e:
        logger.error(f"Erro na API de perícias: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ============================================
# API - FACÇÕES E AURAS
# ============================================

@criar_ficha_bp.route('/api/ficha/faccoes')
@login_required
def api_faccoes_ficha():
    """API: Listar facções para ficha"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT id, nome, bandeira_url, manifesto
            FROM faccoes 
            ORDER BY nome
        """)

        faccoes = cursor.fetchall()

        return jsonify({
            'success': True,
            'faccoes': faccoes
        })

    except Exception as e:
        logger.error(f"Erro na API de facções: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@criar_ficha_bp.route('/api/ficha/auras')
@login_required
def api_auras_ficha():
    """API: Listar auras para ficha"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT id, nome, descricao, ilustracao_url
            FROM auras 
            ORDER BY nome
        """)

        auras = cursor.fetchall()

        return jsonify({
            'success': True,
            'auras': auras
        })

    except Exception as e:
        logger.error(f"Erro na API de auras: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@criar_ficha_bp.route('/api/ficha/criar-faccao', methods=['POST'])
@login_required
def api_criar_faccao():
    """API: Criar facção rapidamente"""
    try:
        data = request.get_json()

        if not data.get('nome'):
            return jsonify({'success': False, 'message': 'Nome da facção é obrigatório'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO faccoes (nome, bandeira_url, manifesto)
            VALUES (%s, %s, %s)
        """, (
            data['nome'],
            data.get('bandeira_url', ''),
            data.get('manifesto', '')
        ))

        faccao_id = cursor.lastrowid
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Facção criada com sucesso',
            'faccao_id': faccao_id
        })

    except Exception as e:
        logger.error(f"Erro ao criar facção: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@criar_ficha_bp.route('/api/ficha/criar-aura', methods=['POST'])
@login_required
def api_criar_aura():
    """API: Criar aura rapidamente"""
    try:
        data = request.get_json()

        if not data.get('nome'):
            return jsonify({'success': False, 'message': 'Nome da aura é obrigatório'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO auras (nome, descricao, ilustracao_url)
            VALUES (%s, %s, %s)
        """, (
            data['nome'],
            data.get('descricao', ''),
            data.get('ilustracao_url', '')
        ))

        aura_id = cursor.lastrowid
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Aura criada com sucesso',
            'aura_id': aura_id
        })

    except Exception as e:
        logger.error(f"Erro ao criar aura: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# API - ROLAGENS
# ============================================

@criar_ficha_bp.route('/api/ficha/rolar-atributos', methods=['POST'])
@login_required
def api_rolar_atributos():
    """API: Rolar atributos (4d10 descarta menor)"""
    data = request.get_json()
    tentativa = data.get('tentativa', 1)

    if tentativa > 3:
        return jsonify({'success': False, 'message': 'Máximo de 3 tentativas'}), 400

    resultados_completos = []

    for _ in range(4):
        dados = [random.randint(1, 10) for _ in range(4)]
        dados.sort()
        menor = dados[0]
        dados_restantes = dados[1:]
        soma = sum(dados_restantes)
        valor_final = soma // 3

        resultados_completos.append({
            'dados': dados,
            'menor': menor,
            'soma': soma,
            'valor': valor_final
        })

    return jsonify({
        'success': True,
        'resultados': resultados_completos,
        'tentativa': tentativa,
        'tentativas_restantes': 3 - tentativa
    })


@criar_ficha_bp.route('/api/ficha/rolar-poder', methods=['POST'])
@login_required
def api_rolar_poder():
    """API: Rolar poder (d100 com multiplicador)"""
    try:
        if not request.is_json:
            return jsonify({'success': False, 'message': 'Content-Type deve ser application/json'}), 400

        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Corpo da requisição vazio'}), 400

        tentativa = data.get('tentativa', 1)
        roll_amount = data.get('roll_amount', 1)

        if tentativa < 1 or tentativa > 3:
            tentativa = 1

        if roll_amount < 1:
            roll_amount = 1

        poder = 0
        for _ in range(roll_amount):
            poder += random.randint(1, 100)

        return jsonify({
            'success': True,
            'poder': poder,
            'tentativa': tentativa,
            'tentativas_restantes': 3 - tentativa
        })

    except Exception as e:
        logger.error(f"Erro na API rolar-poder: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@criar_ficha_bp.route('/api/ficha/rolar-aparencia', methods=['POST'])
@login_required
def api_rolar_aparencia():
    """API: Rolar aparência (1d20)"""
    aparencia = random.randint(1, 20)

    return jsonify({
        'success': True,
        'aparencia': aparencia
    })


# ============================================
# API - CÁLCULOS
# ============================================

@criar_ficha_bp.route('/api/ficha/calcular-pontos', methods=['POST'])
@login_required
def api_calcular_pontos():
    """API: Calcular pontos baseado nos atributos"""
    data = request.get_json()

    inteligencia = data.get('inteligencia', 1)
    destreza = data.get('destreza', 1)
    poder = data.get('poder', 1)
    forca = data.get('forca', 1)
    constituicao = data.get('constituicao', 1)

    mentais_base = ((inteligencia + (destreza / 2) + (poder / 20)) / 2) * 5
    pontos_pericias = int(mentais_base * 3)
    pontos_tecnicas = int(poder * 2)
    forca_vital = int((((forca + constituicao) / 2) * 5) * 2)
    poder_elemental = int(mentais_base * 2)

    return jsonify({
        'success': True,
        'pontos': {
            'pericias': max(1, pontos_pericias),
            'tecnicas': max(1, pontos_tecnicas),
            'forca_vital': max(10, forca_vital),
            'poder_elemental': max(5, poder_elemental)
        },
        'formulas': {
            'mentais_base': round(mentais_base, 2),
            'forca_vital_base': round(((forca + constituicao) / 2) * 5, 2)
        }
    })


# ============================================
# API - ARMAS (LUTA)
# ============================================

@criar_ficha_bp.route('/api/armas-luta', methods=['GET'])
@login_required
def api_armas_luta():
    """API: Listar armas para perícia Luta"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT id, nome FROM lutacomarmas ORDER BY nome")
        armas = cursor.fetchall()

        return jsonify({'success': True, 'armas': armas})

    except Exception as e:
        logger.error(f"Erro na API de armas: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@criar_ficha_bp.route('/api/armas-luta', methods=['POST'])
@login_required
def api_criar_arma_luta():
    """API: Criar nova arma para Luta"""
    data = request.get_json()
    nome = data.get('nome', '').strip()

    if not nome:
        return jsonify({'success': False, 'message': 'Nome da arma é obrigatório'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor()

    try:
        cursor.execute("INSERT INTO lutacomarmas (nome) VALUES (%s)", (nome,))
        arma_id = cursor.lastrowid
        conn.commit()

        return jsonify({'success': True, 'message': 'Arma criada', 'arma_id': arma_id})

    except Exception as e:
        logger.error(f"Erro ao criar arma: {e}")
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ============================================
# API - SALVAR FICHA
# ============================================

@criar_ficha_bp.route('/api/ficha/salvar', methods=['POST'])
@login_required
def api_salvar_ficha():
    """API: Salvar ficha completa com todas as relações"""
    try:
        data = request.get_json()

        # Validar dados obrigatórios
        required_fields = ['nome_completo', 'especie_id', 'fonte_poder_id',
                           'forca', 'destreza', 'inteligencia', 'constituicao',
                           'poder', 'aparencia']

        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'Campo obrigatório: {field}'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Erro de banco'}), 500

        cursor = conn.cursor(dictionary=True)

        # Verificar poder dentro dos limites da espécie
        cursor.execute("SELECT minimo_poder, maximo_poder FROM especies WHERE id = %s", (data['especie_id'],))
        especie = cursor.fetchone()

        if not especie:
            return jsonify({'success': False, 'message': 'Espécie não encontrada'}), 404

        if data['poder'] < especie['minimo_poder'] or data['poder'] > especie['maximo_poder']:
            return jsonify({
                'success': False,
                'message': f'Poder deve estar entre {especie["minimo_poder"]} e {especie["maximo_poder"]}'
            }), 400

        # Tratar IDs opcionais
        faccao_id = data.get('faccao_id', 0) or 0
        aura_id = data.get('aura_id', None) or None

        # Inserir personagem
        cursor.execute("""
            INSERT INTO personagens (
                nome_completo, usuario_id, especie_id, faccao_id, aura_id, fonte_poder_id,
                categoria_personagem_id, nivel, forca, destreza, inteligencia, constituicao,
                poder, aparencia, forca_vital_atual, forca_vital_total,
                poder_elemental_atual, poder_elemental_total,
                ocupacao, moradia, npc, privado, muny, renda, experiencia, 
                favores_elementais, anotacoes, data_criacao
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW()
            )
        """, (
            data['nome_completo'],
            current_user.id,
            data['especie_id'],
            faccao_id,
            aura_id,
            data['fonte_poder_id'],
            data.get('categoria_personagem_id', 1),
            data.get('nivel', 1),
            data['forca'],
            data['destreza'],
            data['inteligencia'],
            data['constituicao'],
            data['poder'],
            data['aparencia'],
            data.get('forca_vital', 0),
            data.get('forca_vital', 0),
            data.get('poder_elemental', 0),
            data.get('poder_elemental', 0),
            data.get('ocupacao', ''),
            data.get('moradia', ''),
            data.get('npc', False),
            data.get('privado', False),
            data.get('muny', 0),
            data.get('renda', 0),
            data.get('experiencia', 0),
            data.get('favores_elementais', 0),
            data.get('anotacoes', '')
        ))

        personagem_id = cursor.lastrowid

        # Inserir perícias
        pericias = data.get('pericias', [])
        for pericia in pericias:
            cursor.execute("""
                INSERT INTO personagem_pericias (personagem_id, pericia_id, pontos, arma_id)
                VALUES (%s, %s, %s, %s)
            """, (
                personagem_id,
                pericia['pericia_id'],
                pericia.get('pontos', 1),
                pericia.get('arma_id')
            ))

        # Inserir técnicas
        tecnicas = data.get('tecnicas', [])
        for tecnica in tecnicas:
            cursor.execute("""
                INSERT INTO personagem_tecnicas (personagem_id, tecnica_id, pontos)
                VALUES (%s, %s, %s)
            """, (
                personagem_id,
                tecnica['tecnica_id'],
                tecnica.get('pontos', 1)
            ))

        # Inserir características (qualidades, defeitos, outras)
        caracteristicas = data.get('caracteristicas', {})
        todas_carac = []
        todas_carac.extend(caracteristicas.get('qualidades', []))
        todas_carac.extend(caracteristicas.get('defeitos', []))
        todas_carac.extend(caracteristicas.get('outras', []))

        for carac in todas_carac:
            cursor.execute("SELECT id FROM caracteristicas WHERE nome = %s", (carac['nome'],))
            existing = cursor.fetchone()

            if existing:
                caract_id = existing['id']
            else:
                cursor.execute("""
                    INSERT INTO caracteristicas (nome, descricao, categoria, score, ativo)
                    VALUES (%s, %s, %s, %s, 1)
                """, (carac['nome'], carac.get('descricao', ''), carac['categoria'], carac.get('score', 0)))
                caract_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO personagem_caracteristicas (personagem_id, caracteristica_id)
                VALUES (%s, %s)
            """, (personagem_id, caract_id))

        conn.commit()

        logger.info(f"Personagem '{data['nome_completo']}' criado por {current_user.username} (ID: {personagem_id})")

        return jsonify({
            'success': True,
            'message': 'Ficha criada com sucesso!',
            'personagem_id': personagem_id
        })

    except Exception as e:
        logger.error(f"Erro ao salvar ficha: {e}")
        import traceback
        traceback.print_exc()
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()