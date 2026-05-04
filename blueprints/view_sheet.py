#!/usr/bin/env python3
"""
Blueprint para visualização de fichas de personagem do Thaolundra RPG
"""
from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user
from database import get_db_connection, execute_query
import logging

logger = logging.getLogger(__name__)

view_bp = Blueprint('view', __name__)


# ============================================
# FUNÇÕES AUXILIARES
# ============================================

def calcular_nivel(personagem):
    """Calcula o nível do personagem baseado nos atributos e habilidades"""
    poder_valor = personagem.get('poder') or 1
    maior_pericia_valor = personagem.get('maior_pericia') or 1
    maior_tecnica_valor = personagem.get('maior_tecnica') or 1
    pe_valor = personagem.get('poder_elemental_atual') or 0
    fe_valor = personagem.get('favores_elementais') or 0

    poder_nivel = poder_valor // 10
    maior_atributo = max(
        personagem.get('forca') or 1,
        personagem.get('destreza') or 1,
        personagem.get('inteligencia') or 1,
        personagem.get('constituicao') or 1
    )
    pericia_nivel = maior_pericia_valor // 10
    tecnica_nivel = maior_tecnica_valor // 10
    pe_nivel = pe_valor // 50
    fe_nivel = fe_valor // 50

    return max(poder_nivel, maior_atributo, pericia_nivel, tecnica_nivel, pe_nivel, fe_nivel)


def calcular_testes(personagem):
    """Calcula os testes derivados (Físicos, Agilidade, Mentais, Vitalidade)"""
    forca = personagem.get('forca', 1)
    destreza = personagem.get('destreza', 1)
    inteligencia = personagem.get('inteligencia', 1)
    constituicao = personagem.get('constituicao', 1)
    poder = personagem.get('poder', 1)

    fisicos = int((((forca + (destreza / 2) + (constituicao / 2)) / 2) * 5))
    agilidade = int((((destreza + (forca / 2) + (inteligencia / 2)) / 2) * 5))
    mentais = int((((inteligencia + (destreza / 2) + (poder / 20)) / 2) * 5))
    vitalidade = int((((forca + constituicao) / 2) * 5))

    return {
        'fisicos': fisicos,
        'agilidade': agilidade,
        'mentais': mentais,
        'vitalidade': vitalidade
    }


def calcular_combate(personagem, testes):
    """Calcula estatísticas de combate"""
    dano_base = testes['fisicos'] // 2
    armadura = testes['vitalidade'] // 2
    resistencia_magica = personagem.get('poder', 1) // 10

    return {
        'dano_base': dano_base,
        'armadura': armadura,
        'resistencia_magica': resistencia_magica
    }


def calcular_status(personagem, testes):
    """Calcula status (FV e PE)"""
    fv = testes['vitalidade'] * 2
    pe = testes['mentais'] * 2

    return {
        'fv': fv,
        'pe': pe
    }


# ============================================
# ROTAS HTML (o front espera rotas que retornam HTML)
# ============================================

@view_bp.route('/personagem/<int:id>')
@login_required
def visualizar_personagem(id):
    """
    Página de visualização da ficha completa
    O front carrega esta página via fetch e extrai o conteúdo
    """
    conn = get_db_connection()
    if not conn:
        return "Erro de banco de dados", 500

    cursor = conn.cursor(dictionary=True)

    try:
        # 1. Dados principais do personagem
        cursor.execute("""
            SELECT p.*, e.nome as especie_nome, fp.nome_exibicao as fonte_poder,
                   u.username as jogador_nome, f.nome as faccao_nome, a.nome as aura_nome,
                   (SELECT MAX(pontos) FROM personagem_pericias WHERE personagem_id = p.id) as maior_pericia,
                   (SELECT MAX(pontos) FROM personagem_tecnicas WHERE personagem_id = p.id) as maior_tecnica
            FROM personagens p
            LEFT JOIN especies e ON p.especie_id = e.id
            LEFT JOIN fontes_de_poder fp ON p.fonte_poder_id = fp.id
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            LEFT JOIN faccoes f ON p.faccao_id = f.id
            LEFT JOIN auras a ON p.aura_id = a.id
            WHERE p.id = %s
        """, (id,))

        personagem = cursor.fetchone()

        if not personagem:
            cursor.close()
            conn.close()
            return "Personagem não encontrado", 404

        # Verificar permissão de visualização
        if personagem.get('privado') and personagem.get('usuario_id') != current_user.id:
            if current_user.nivel_credencial < 4:
                cursor.close()
                conn.close()
                return "Acesso negado - Personagem privado", 403

        # Calcular estatísticas
        testes = calcular_testes(personagem)
        combate = calcular_combate(personagem, testes)
        status = calcular_status(personagem, testes)

        personagem['testes'] = testes
        personagem['combate'] = combate
        personagem['status'] = status
        personagem['nivel'] = calcular_nivel(personagem)

        # 2. Perícias
        cursor.execute("""
            SELECT per.id, per.nome, per.categoria, pp.pontos, pp.arma_id, lc.nome as arma_nome
            FROM personagem_pericias pp
            JOIN pericias per ON pp.pericia_id = per.id
            LEFT JOIN lutacomarmas lc ON pp.arma_id = lc.id
            WHERE pp.personagem_id = %s
            ORDER BY per.categoria, per.nome
        """, (id,))
        pericias = cursor.fetchall()

        # 3. Técnicas
        cursor.execute("""
            SELECT tec.id, tec.nome, tec.categoria, pt.pontos
            FROM personagem_tecnicas pt
            JOIN tecnicas tec ON pt.tecnica_id = tec.id
            WHERE pt.personagem_id = %s
            ORDER BY tec.categoria, tec.nome
        """, (id,))
        tecnicas = cursor.fetchall()

        # 4. Qualidades
        cursor.execute("""
            SELECT c.id, c.nome, c.categoria, c.score, c.descricao
            FROM personagem_caracteristicas pc
            JOIN caracteristicas c ON pc.caracteristica_id = c.id
            WHERE pc.personagem_id = %s AND c.categoria = 'Qualidade'
        """, (id,))
        qualidades = cursor.fetchall()

        # 5. Defeitos
        cursor.execute("""
            SELECT c.id, c.nome, c.categoria, c.score, c.descricao
            FROM personagem_caracteristicas pc
            JOIN caracteristicas c ON pc.caracteristica_id = c.id
            WHERE pc.personagem_id = %s AND c.categoria = 'Defeito'
        """, (id,))
        defeitos = cursor.fetchall()

        # 6. Títulos
        cursor.execute("""
            SELECT t.id, t.nome, t.descricao, t.bonus
            FROM personagem_titulos pt
            JOIN titulos t ON pt.titulo_id = t.id
            WHERE pt.personagem_id = %s
        """, (id,))
        titulos = cursor.fetchall()

        # 7. Equipamento (mapeado por posição)
        cursor.execute("""
            SELECT pe.posicao, i.id as item_id, i.nome as item_nome, i.modificador_dano, 
                   i.modificador_armadura, i.modificador_resistencia_magica,
                   i.slot_equipavel, i.categoria, i.durabilidade
            FROM personagem_equipamento pe
            LEFT JOIN itens i ON pe.item_id = i.id
            WHERE pe.personagem_id = %s
        """, (id,))
        equipamentos = cursor.fetchall()
        equipamento_dict = {}
        for eq in equipamentos:
            equipamento_dict[eq['posicao']] = eq

        # 8. Itens do inventário (não equipados)
        cursor.execute("""
            SELECT i.id, i.nome, pi.quantidade, i.descricao, i.categoria,
                   i.modificador_dano, i.modificador_armadura,
                   i.modificador_resistencia_magica, pi.durabilidade_atual, i.durabilidade
            FROM personagem_itens pi
            JOIN itens i ON pi.item_id = i.id
            WHERE pi.personagem_id = %s AND (pi.equipado = 0 OR pi.equipado IS NULL)
            ORDER BY i.categoria, i.nome
        """, (id,))
        itens_inventario = cursor.fetchall()

        # 9. Encantamentos
        cursor.execute("""
            SELECT e.id, e.nome, e.nivel, e.categoria, pe.fonte,
                   e.modificador_dano, e.modificador_armadura,
                   e.modificador_resistencia_magica, e.modificador_forca_vital,
                   e.modificador_poder_elemental
            FROM personagem_encantamentos pe
            JOIN encantamentos e ON pe.encantamento_id = e.id
            WHERE pe.personagem_id = %s
        """, (id,))
        encantamentos = cursor.fetchall()

        # 10. Pets
        cursor.execute("""
            SELECT id, nome, especie, descricao
            FROM personagem_pets
            WHERE personagem_id = %s
        """, (id,))
        pets = cursor.fetchall()

        show_exp_button = (current_user.id == personagem['usuario_id'])

        return render_template('view_sheet.html',
                               personagem=personagem,
                               pericias=pericias,
                               tecnicas=tecnicas,
                               qualidades=qualidades,
                               defeitos=defeitos,
                               titulos=titulos,
                               equipamento=equipamento_dict,
                               itens_inventario=itens_inventario,
                               encantamentos=encantamentos,
                               pets=pets,
                               show_exp_button=show_exp_button)

    except Exception as e:
        logger.error(f"Erro ao carregar personagem {id}: {e}")
        return f"Erro ao carregar personagem: {str(e)}", 500

    finally:
        cursor.close()
        conn.close()


# ============================================
# LISTAGEM DE PERSONAGENS (GALERIA)
# ============================================

@view_bp.route('/personagens')
@login_required
def listar_personagens():
    """Página de galeria de todos os personagens públicos"""
    conn = get_db_connection()
    if not conn:
        return "Erro de banco de dados", 500

    cursor = conn.cursor(dictionary=True)

    try:
        if current_user.nivel_credencial >= 4:
            cursor.execute("""
                SELECT p.id, p.nome_completo, p.nivel, p.ocupacao, p.forca, p.destreza,
                       p.inteligencia, p.constituicao, p.poder, p.aparencia,
                       p.poder_elemental_atual, p.favores_elementais,
                       e.nome as especie_nome, u.username as jogador_nome,
                       (SELECT MAX(pontos) FROM personagem_pericias WHERE personagem_id = p.id) as maior_pericia,
                       (SELECT MAX(pontos) FROM personagem_tecnicas WHERE personagem_id = p.id) as maior_tecnica
                FROM personagens p
                JOIN especies e ON p.especie_id = e.id
                JOIN usuarios u ON p.usuario_id = u.id
                WHERE p.privado = 0 OR p.usuario_id = %s
                ORDER BY p.id DESC
            """, (current_user.id,))
        else:
            cursor.execute("""
                SELECT p.id, p.nome_completo, p.nivel, p.ocupacao, p.forca, p.destreza,
                       p.inteligencia, p.constituicao, p.poder, p.aparencia,
                       p.poder_elemental_atual, p.favores_elementais,
                       e.nome as especie_nome, u.username as jogador_nome,
                       (SELECT MAX(pontos) FROM personagem_pericias WHERE personagem_id = p.id) as maior_pericia,
                       (SELECT MAX(pontos) FROM personagem_tecnicas WHERE personagem_id = p.id) as maior_tecnica
                FROM personagens p
                JOIN especies e ON p.especie_id = e.id
                JOIN usuarios u ON p.usuario_id = u.id
                WHERE p.privado = 0
                ORDER BY p.id DESC
            """, ())

        personagens = cursor.fetchall()

        for p in personagens:
            p['nivel'] = calcular_nivel(p)

        return render_template('personagens.html', personagens=personagens)

    except Exception as e:
        logger.error(f"Erro ao listar personagens: {e}")
        return "Erro ao carregar personagens", 500

    finally:
        cursor.close()
        conn.close()


# ============================================
# MEUS PERSONAGENS
# ============================================

@view_bp.route('/meus-personagens')
@login_required
def meus_personagens():
    """Página de listagem dos personagens do usuário atual"""
    conn = get_db_connection()
    if not conn:
        return "Erro de banco de dados", 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT p.id, p.nome_completo, p.nivel, p.ocupacao, p.forca, p.destreza,
                   p.inteligencia, p.constituicao, p.poder, p.aparencia,
                   p.poder_elemental_atual, p.favores_elementais, p.privado,
                   e.nome as especie_nome, u.username as jogador_nome,
                   (SELECT MAX(pontos) FROM personagem_pericias WHERE personagem_id = p.id) as maior_pericia,
                   (SELECT MAX(pontos) FROM personagem_tecnicas WHERE personagem_id = p.id) as maior_tecnica
            FROM personagens p
            JOIN especies e ON p.especie_id = e.id
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.usuario_id = %s
            ORDER BY p.nome_completo
        """, (current_user.id,))

        personagens = cursor.fetchall()

        for p in personagens:
            p['nivel'] = calcular_nivel(p)

        return render_template('meus_personagens.html', personagens=personagens)

    except Exception as e:
        logger.error(f"Erro ao carregar meus personagens: {e}")
        return "Erro ao carregar personagens", 500

    finally:
        cursor.close()
        conn.close()


# ============================================
# API - EXCLUIR PERSONAGEM
# ============================================

@view_bp.route('/api/personagens/<int:personagem_id>/excluir', methods=['DELETE'])
@login_required
def api_excluir_personagem(personagem_id):
    """
    API: Excluir personagem
    O front espera: { success, message }
    """
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco de dados'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        # Verificar se o personagem existe e pertence ao usuário
        cursor.execute("SELECT usuario_id, nome_completo FROM personagens WHERE id = %s", (personagem_id,))
        result = cursor.fetchone()

        if not result:
            return jsonify({'success': False, 'message': 'Personagem não encontrado'}), 404

        if result['usuario_id'] != current_user.id and current_user.nivel_credencial < 4:
            return jsonify({'success': False, 'message': 'Acesso negado'}), 403

        nome_personagem = result['nome_completo']

        # Excluir todas as relações
        cursor.execute("DELETE FROM personagem_pericias WHERE personagem_id = %s", (personagem_id,))
        cursor.execute("DELETE FROM personagem_tecnicas WHERE personagem_id = %s", (personagem_id,))
        cursor.execute("DELETE FROM personagem_itens WHERE personagem_id = %s", (personagem_id,))
        cursor.execute("DELETE FROM personagem_caracteristicas WHERE personagem_id = %s", (personagem_id,))
        cursor.execute("DELETE FROM personagem_equipamento WHERE personagem_id = %s", (personagem_id,))
        cursor.execute("DELETE FROM personagem_titulos WHERE personagem_id = %s", (personagem_id,))
        cursor.execute("DELETE FROM personagem_encantamentos WHERE personagem_id = %s", (personagem_id,))
        cursor.execute("DELETE FROM personagem_relacionamentos WHERE personagem_id = %s", (personagem_id,))
        cursor.execute("DELETE FROM personagem_pets WHERE personagem_id = %s", (personagem_id,))

        # Remover da mesa (se estiver em alguma)
        cursor.execute("DELETE FROM mesa_jogadores_ativos WHERE personagem_id = %s", (personagem_id,))

        # Excluir o personagem
        cursor.execute("DELETE FROM personagens WHERE id = %s", (personagem_id,))

        conn.commit()

        logger.info(f"Personagem '{nome_personagem}' (ID: {personagem_id}) excluído por {current_user.username}")

        return jsonify({'success': True, 'message': 'Personagem excluído com sucesso'})

    except Exception as e:
        logger.error(f"Erro ao excluir personagem {personagem_id}: {e}")
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ============================================
# CONTEXTO GLOBAL PARA TEMPLATES
# ============================================

@view_bp.context_processor
def inject_view_variables():
    """Injeta variáveis nos templates do blueprint"""
    return {
        'calcular_nivel': calcular_nivel,
        'calcular_testes': calcular_testes,
        'calcular_combate': calcular_combate,
        'calcular_status': calcular_status
    }