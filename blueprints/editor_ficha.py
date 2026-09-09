#!/usr/bin/env python3
"""
Blueprint para editor de ficha do Thaolundra RPG
"""
from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user
from database import get_db_connection, execute_query
import logging

logger = logging.getLogger(__name__)

editor_ficha_bp = Blueprint('editor_ficha', __name__, url_prefix='/api/editor-ficha')


# ============================================
# API - CARREGAR DADOS DA FICHA
# ============================================

@editor_ficha_bp.route('/carregar/<int:personagem_id>', methods=['GET'])
@login_required
def api_carregar_ficha(personagem_id):
    """
    API: Carrega todos os dados de um personagem para edição
    O front espera: { success, personagem, pericias, tecnicas, ... }
    """
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        # 1. Dados principais
        cursor.execute("""
            SELECT p.*, e.nome as especie_nome, fp.nome_exibicao as fonte_nome
            FROM personagens p
            LEFT JOIN especies e ON p.especie_id = e.id
            LEFT JOIN fontes_de_poder fp ON p.fonte_poder_id = fp.id
            WHERE p.id = %s AND p.usuario_id = %s
        """, (personagem_id, current_user.id))

        personagem = cursor.fetchone()

        if not personagem:
            return jsonify({'success': False, 'message': 'Personagem não encontrado'}), 404

        # 2. Perícias
        cursor.execute("""
            SELECT pp.id, pp.pericia_id, pp.pontos, pp.arma_id,
                   per.nome as pericia_nome, per.categoria as pericia_categoria,
                   lc.nome as arma_nome
            FROM personagem_pericias pp
            JOIN pericias per ON pp.pericia_id = per.id
            LEFT JOIN lutacomarmas lc ON pp.arma_id = lc.id
            WHERE pp.personagem_id = %s
        """, (personagem_id,))
        pericias = cursor.fetchall()

        # 3. Técnicas
        cursor.execute("""
            SELECT pt.id, pt.tecnica_id, pt.pontos,
                   tec.nome as tecnica_nome, tec.categoria as tecnica_categoria,
                   tec.fonte_de_poder_id
            FROM personagem_tecnicas pt
            JOIN tecnicas tec ON pt.tecnica_id = tec.id
            WHERE pt.personagem_id = %s
        """, (personagem_id,))
        tecnicas = cursor.fetchall()

        # 4. Características (Qualidades, Defeitos, Outras)
        cursor.execute("""
            SELECT pc.id, c.nome, c.descricao, c.categoria, c.score
            FROM personagem_caracteristicas pc
            JOIN caracteristicas c ON pc.caracteristica_id = c.id
            WHERE pc.personagem_id = %s
        """, (personagem_id,))
        caracteristicas = cursor.fetchall()

        # 5. Títulos
        cursor.execute("""
            SELECT pt.id, t.nome, t.descricao
            FROM personagem_titulos pt
            JOIN titulos t ON pt.titulo_id = t.id
            WHERE pt.personagem_id = %s
        """, (personagem_id,))
        titulos = cursor.fetchall()

        # Separar características por categoria
        qualidades = [c for c in caracteristicas if c['categoria'] == 'Qualidade']
        defeitos = [c for c in caracteristicas if c['categoria'] == 'Defeito']
        outras = [c for c in caracteristicas if c['categoria'] == 'Outras']

        return jsonify({
            'success': True,
            'personagem': personagem,
            'pericias': pericias,
            'tecnicas': tecnicas,
            'qualidades': qualidades,
            'defeitos': defeitos,
            'outras': outras,
            'titulos': titulos
        })

    except Exception as e:
        logger.error(f"Erro ao carregar ficha {personagem_id}: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ============================================
# API - SALVAR FICHA
# ============================================

@editor_ficha_bp.route('/salvar/<int:personagem_id>', methods=['PUT'])
@login_required
def api_salvar_ficha(personagem_id):
    """
    API: Salva todas as alterações da ficha
    O front espera: { success, message }
    """
    data = request.get_json()

    if not data:
        return jsonify({'success': False, 'message': 'Dados não enviados'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        # Verificar propriedade
        cursor.execute("SELECT id FROM personagens WHERE id = %s AND usuario_id = %s",
                       (personagem_id, current_user.id))
        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Acesso negado'}), 403

        # 1. Atualizar dados principais
        cursor.execute("""
            UPDATE personagens SET
                nome_completo = %s,
                ocupacao = %s,
                moradia = %s,
                especie_id = %s,
                fonte_poder_id = %s,
                forca = %s,
                destreza = %s,
                inteligencia = %s,
                constituicao = %s,
                poder = %s,
                aparencia = %s,
                forca_vital_total = %s,
                poder_elemental_total = %s,
                muny = %s,
                privado = %s,
                anotacoes = %s
            WHERE id = %s
        """, (
            data.get('nome'),
            data.get('ocupacao'),
            data.get('moradia'),
            data.get('especie_id'),
            data.get('fonte_poder_id'),
            data.get('forca'),
            data.get('destreza'),
            data.get('inteligencia'),
            data.get('constituicao'),
            data.get('poder'),
            data.get('aparencia'),
            data.get('fv_total'),
            data.get('pe_total'),
            data.get('muny'),
            data.get('privado'),
            data.get('anotacoes'),
            personagem_id
        ))
        conn.commit()

        # 2. Atualizar perícias (remover e reinserir)
        cursor.execute("DELETE FROM personagem_pericias WHERE personagem_id = %s", (personagem_id,))

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

        # 3. Atualizar técnicas
        cursor.execute("DELETE FROM personagem_tecnicas WHERE personagem_id = %s", (personagem_id,))

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

        # 4. Atualizar características
        cursor.execute("DELETE FROM personagem_caracteristicas WHERE personagem_id = %s", (personagem_id,))

        todas_carac = []
        todas_carac.extend(data.get('qualidades', []))
        todas_carac.extend(data.get('defeitos', []))
        todas_carac.extend(data.get('outras', []))

        for carac in todas_carac:
            # Verificar se a característica já existe
            cursor.execute("SELECT id FROM caracteristicas WHERE nome = %s AND categoria = %s",
                           (carac['nome'], carac.get('categoria', 'Outras')))
            existing = cursor.fetchone()

            if existing:
                caract_id = existing['id']
            else:
                cursor.execute("""
                    INSERT INTO caracteristicas (nome, descricao, categoria, score, ativo)
                    VALUES (%s, %s, %s, %s, 1)
                """, (
                    carac['nome'],
                    carac.get('descricao', ''),
                    carac.get('categoria', 'Outras'),
                    carac.get('score', 0)
                ))
                caract_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO personagem_caracteristicas (personagem_id, caracteristica_id)
                VALUES (%s, %s)
            """, (personagem_id, caract_id))

        # 5. Atualizar títulos
        cursor.execute("DELETE FROM personagem_titulos WHERE personagem_id = %s", (personagem_id,))

        titulos = data.get('titulos', [])
        for titulo in titulos:
            cursor.execute("SELECT id FROM titulos WHERE nome = %s", (titulo['nome'],))
            existing = cursor.fetchone()

            if existing:
                titulo_id = existing['id']
            else:
                cursor.execute("INSERT INTO titulos (nome, descricao) VALUES (%s, %s)",
                               (titulo['nome'], titulo.get('descricao', '')))
                titulo_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO personagem_titulos (personagem_id, titulo_id)
                VALUES (%s, %s)
            """, (personagem_id, titulo_id))

        conn.commit()

        logger.info(f"Ficha {personagem_id} atualizada por {current_user.username}")

        return jsonify({
            'success': True,
            'message': 'Ficha salva com sucesso!'
        })

    except Exception as e:
        logger.error(f"Erro ao salvar ficha {personagem_id}: {e}")
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ============================================
# CONTEXTO GLOBAL PARA TEMPLATES
# ============================================

@editor_ficha_bp.context_processor
def inject_editor_variables():
    """Injeta variáveis nos templates do blueprint"""
    return {
        'editor_version': '1.0.0'
    }