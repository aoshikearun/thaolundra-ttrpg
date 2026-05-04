#!/usr/bin/env python3
"""
Blueprint para gerenciamento de usuários do Thaolundra RPG
Níveis de acesso: Moderador (4+) e Administrador (5+)
"""
from flask import Blueprint, render_template, jsonify, request, flash, redirect, url_for
from flask_login import login_required, current_user
from database import get_db_connection, execute_query
import logging

# Configuração de logging
logger = logging.getLogger(__name__)

# ============================================
# BLUEPRINT DE GERENCIAMENTO DE USUÁRIOS
# ============================================

usuarios_bp = Blueprint('usuarios', __name__)

# ============================================
# CONSTANTES
# ============================================

NIVEIS_CREDENCIAL = {
    0: "Espectador",
    1: "Jogador",
    2: "Narrador",
    3: "Guardião",
    4: "Moderador",
    5: "Administrador"
}

NIVEL_CORES = {
    0: "secondary",
    1: "info",
    2: "success",
    3: "primary",
    4: "warning",
    5: "danger"
}


# ============================================
# FUNÇÕES AUXILIARES
# ============================================

def get_nivel_nome(nivel):
    """Retorna o nome do nível de credencial"""
    return NIVEIS_CREDENCIAL.get(nivel, f"Desconhecido ({nivel})")


def get_nivel_cor(nivel):
    """Retorna a classe CSS para o badge do nível"""
    return NIVEL_CORES.get(nivel, "secondary")


def pode_editar_usuario(usuario_id, usuario_nivel=None):
    """Verifica se o usuário atual pode editar outro usuário"""
    # Administrador pode tudo
    if current_user.nivel_credencial >= 5:
        return True, None

    # Moderador (nível 4) não pode editar admins
    if current_user.nivel_credencial >= 4:
        if usuario_nivel is not None and usuario_nivel >= 5:
            return False, "Moderadores não podem editar Administradores"
        return True, None

    return False, "Acesso negado"


# ============================================
# PÁGINA PRINCIPAL
# ============================================

@usuarios_bp.route('/gerenciar-usuarios')
@login_required
def gerenciar_usuarios():
    """Página de gerenciamento de usuários"""
    if current_user.nivel_credencial < 4:
        flash("Acesso negado - Nível 4+ requerido", "error")
        return redirect(url_for('main.main_page'))

    return render_template('gerenciar_usuarios.html', user=current_user)


# ============================================
# API - LISTAR USUÁRIOS
# ============================================

@usuarios_bp.route('/api/usuarios')
@login_required
def api_usuarios():
    """
    API: Listar todos os usuários
    O front espera: { success, usuarios }
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
                id, username, email, nome_real, nome_social,
                data_nascimento, nivel_credencial, ativo,
                avatar_url, discord_id, bio, fuso_horario,
                data_criacao, ultimo_acesso
            FROM usuarios 
            ORDER BY username
        """)

        usuarios = cursor.fetchall()

        # Formatar datas
        for usuario in usuarios:
            if usuario.get('data_criacao'):
                usuario['data_criacao'] = usuario['data_criacao'].strftime('%Y-%m-%d')
            if usuario.get('ultimo_acesso'):
                usuario['ultimo_acesso'] = usuario['ultimo_acesso'].strftime('%Y-%m-%d')
            if usuario.get('data_nascimento'):
                usuario['data_nascimento'] = usuario['data_nascimento'].strftime('%Y-%m-%d')

            # Adicionar dados derivados para o front
            usuario['nivel_nome'] = get_nivel_nome(usuario['nivel_credencial'])
            usuario['nivel_cor'] = get_nivel_cor(usuario['nivel_credencial'])
            usuario['status_texto'] = "Ativo" if usuario['ativo'] else "Inativo"
            usuario['status_cor'] = "success" if usuario['ativo'] else "danger"

        return jsonify({
            'success': True,
            'usuarios': usuarios,
            'total': len(usuarios)
        })

    except Exception as e:
        logger.error(f"Erro na API de usuários: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ============================================
# API - DETALHES DO USUÁRIO
# ============================================

@usuarios_bp.route('/api/usuarios/<int:usuario_id>')
@login_required
def api_usuario_detalhes(usuario_id):
    """
    API: Detalhes de um usuário específico
    O front espera: { success, usuario }
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
                id, username, email, nome_real, nome_social,
                data_nascimento, nivel_credencial, ativo,
                avatar_url, discord_id, bio, fuso_horario,
                data_criacao, ultimo_acesso
            FROM usuarios 
            WHERE id = %s
        """, (usuario_id,))

        usuario = cursor.fetchone()

        if usuario:
            # Formatar datas
            if usuario.get('data_criacao'):
                usuario['data_criacao'] = usuario['data_criacao'].strftime('%Y-%m-%d')
            if usuario.get('ultimo_acesso'):
                usuario['ultimo_acesso'] = usuario['ultimo_acesso'].strftime('%Y-%m-%d')
            if usuario.get('data_nascimento'):
                usuario['data_nascimento'] = usuario['data_nascimento'].strftime('%Y-%m-%d')

            # Adicionar dados derivados
            usuario['nivel_nome'] = get_nivel_nome(usuario['nivel_credencial'])

            return jsonify({
                'success': True,
                'usuario': usuario
            })
        else:
            return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 404

    except Exception as e:
        logger.error(f"Erro na API de usuário detalhes: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# ============================================
# API - ATUALIZAR USUÁRIO
# ============================================

@usuarios_bp.route('/api/usuarios/<int:usuario_id>', methods=['PUT'])
@login_required
def api_atualizar_usuario(usuario_id):
    """
    API: Atualizar usuário existente
    O front envia dados via PUT com Content-Type: application/json
    """
    if current_user.nivel_credencial < 4:
        return jsonify({'success': False, 'message': 'Acesso negado'}), 403

    try:
        data = request.get_json()

        # Buscar dados atuais do usuário
        usuario_atual = execute_query(
            "SELECT nivel_credencial, ativo, username FROM usuarios WHERE id = %s",
            (usuario_id,),
            fetch_one=True
        )

        if not usuario_atual:
            return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 404

        # Verificar permissão para editar
        pode, erro = pode_editar_usuario(usuario_id, usuario_atual['nivel_credencial'])
        if not pode:
            return jsonify({'success': False, 'message': erro}), 403

        # Preparar campos para atualização
        updates = []
        params = []

        # Campos básicos
        if 'username' in data:
            updates.append("username = %s")
            params.append(data['username'])

        if 'email' in data:
            updates.append("email = %s")
            params.append(data['email'])

        if 'nome_real' in data:
            updates.append("nome_real = %s")
            params.append(data['nome_real'])

        if 'nome_social' in data:
            updates.append("nome_social = %s")
            params.append(data['nome_social'])

        if 'data_nascimento' in data:
            updates.append("data_nascimento = %s")
            params.append(data['data_nascimento'] if data['data_nascimento'] else None)

        if 'avatar_url' in data:
            updates.append("avatar_url = %s")
            params.append(data['avatar_url'])

        if 'discord_id' in data:
            updates.append("discord_id = %s")
            params.append(data['discord_id'])

        if 'bio' in data:
            updates.append("bio = %s")
            params.append(data['bio'])

        if 'fuso_horario' in data:
            updates.append("fuso_horario = %s")
            params.append(data['fuso_horario'])

        # Nível de credencial (requer permissão especial)
        if 'nivel_credencial' in data:
            novo_nivel = int(data['nivel_credencial'])
            # Moderador não pode promover acima de 4
            if current_user.nivel_credencial < 5 and novo_nivel > 4:
                return jsonify({'success': False, 'message': 'Moderadores só podem promover até nível 4'}), 403
            # Não pode promover a si mesmo acima de 4 se for moderador
            if usuario_id == current_user.id and current_user.nivel_credencial < 5 and novo_nivel > current_user.nivel_credencial:
                return jsonify({'success': False,
                                'message': 'Moderadores não podem promover a si mesmos acima do nível atual'}), 403

            updates.append("nivel_credencial = %s")
            params.append(novo_nivel)
            logger.info(f"Admin {current_user.username} alterou nível do usuário {usuario_id} para {novo_nivel}")

        # Status ativo/inativo
        if 'ativo' in data:
            ativo_val = data['ativo']
            if isinstance(ativo_val, bool):
                ativo_int = 1 if ativo_val else 0
            elif isinstance(ativo_val, str):
                ativo_int = 1 if ativo_val.lower() in ['true', '1', 'yes', 'sim'] else 0
            else:
                ativo_int = int(ativo_val) if ativo_val else 1

            updates.append("ativo = %s")
            params.append(ativo_int)
            logger.info(
                f"Admin {current_user.username} alterou status do usuário {usuario_id} para {'Ativo' if ativo_int else 'Inativo'}")

        if not updates:
            return jsonify({'success': False, 'message': 'Nenhum campo para atualizar'}), 400

        params.append(usuario_id)

        result = execute_query(
            f"UPDATE usuarios SET {', '.join(updates)} WHERE id = %s",
            tuple(params),
            commit=True
        )

        if result is not None:
            logger.info(f"Usuário {usuario_id} atualizado por {current_user.username}")
            return jsonify({
                'success': True,
                'message': 'Usuário atualizado com sucesso'
            })
        else:
            return jsonify({'success': False, 'message': 'Erro ao atualizar usuário'}), 500

    except Exception as e:
        logger.error(f"Erro ao atualizar usuário: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Erro: {str(e)}'}), 500


# ============================================
# API - EXCLUIR USUÁRIO
# ============================================

@usuarios_bp.route('/api/usuarios/<int:usuario_id>', methods=['DELETE'])
@login_required
def api_excluir_usuario(usuario_id):
    """
    API: Excluir usuário (apenas Administradores)
    O front espera: { success, message }
    """
    if current_user.nivel_credencial < 5:
        return jsonify({'success': False, 'message': 'Acesso negado - Nível 5 requerido'}), 403

    # Não pode excluir a si mesmo
    if usuario_id == current_user.id:
        return jsonify({'success': False, 'message': 'Não pode excluir seu próprio usuário'}), 400

    try:
        # Buscar usuário antes de excluir
        usuario = execute_query(
            "SELECT username FROM usuarios WHERE id = %s",
            (usuario_id,),
            fetch_one=True
        )

        if not usuario:
            return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 404

        # Excluir relações do usuário
        # Personagens e suas relações
        personagens = execute_query(
            "SELECT id FROM personagens WHERE usuario_id = %s",
            (usuario_id,),
            fetch_all=True
        )

        if personagens:
            for p in personagens:
                p_id = p['id']
                execute_query("DELETE FROM personagem_pericias WHERE personagem_id = %s", (p_id,), commit=True)
                execute_query("DELETE FROM personagem_tecnicas WHERE personagem_id = %s", (p_id,), commit=True)
                execute_query("DELETE FROM personagem_itens WHERE personagem_id = %s", (p_id,), commit=True)
                execute_query("DELETE FROM personagem_caracteristicas WHERE personagem_id = %s", (p_id,), commit=True)
                execute_query("DELETE FROM personagem_equipamento WHERE personagem_id = %s", (p_id,), commit=True)
                execute_query("DELETE FROM personagem_titulos WHERE personagem_id = %s", (p_id,), commit=True)
                execute_query("DELETE FROM personagem_encantamentos WHERE personagem_id = %s", (p_id,), commit=True)
                execute_query("DELETE FROM personagem_pets WHERE personagem_id = %s", (p_id,), commit=True)

            execute_query("DELETE FROM personagens WHERE usuario_id = %s", (usuario_id,), commit=True)

        # Remover de mesas
        execute_query("DELETE FROM mesa_jogadores_ativos WHERE usuario_id = %s", (usuario_id,), commit=True)
        execute_query("DELETE FROM mesa_narradores WHERE usuario_id = %s", (usuario_id,), commit=True)

        # Finalmente, excluir o usuário
        execute_query("DELETE FROM usuarios WHERE id = %s", (usuario_id,), commit=True)

        logger.warning(f"Usuário {usuario['username']} (ID: {usuario_id}) foi excluído por {current_user.username}")

        return jsonify({
            'success': True,
            'message': f'Usuário {usuario["username"]} excluído com sucesso'
        })

    except Exception as e:
        logger.error(f"Erro ao excluir usuário: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# CONTEXTO GLOBAL PARA TEMPLATES
# ============================================

@usuarios_bp.context_processor
def inject_usuarios_variables():
    """Injeta variáveis nos templates do blueprint"""
    return {
        'niveis_credencial': NIVEIS_CREDENCIAL,
        'niveis_cores': NIVEL_CORES,
        'get_nivel_nome': get_nivel_nome,
        'get_nivel_cor': get_nivel_cor
    }