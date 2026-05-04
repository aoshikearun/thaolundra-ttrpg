#!/usr/bin/env python3
"""
Blueprint de autenticação para Thaolundra RPG
Gerencia login, logout, registro e sessões de usuário
"""
from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from database import get_db_connection, execute_query
import hashlib
import re
from datetime import datetime
import logging

# Configuração de logging
logger = logging.getLogger(__name__)

# ============================================
# BLUEPRINT DE AUTENTICAÇÃO
# ============================================

auth_bp = Blueprint('auth', __name__)

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

# Configurações de segurança
SALT = "1000PAUNOCUDEQUEMFAZBRUTEFORCE"
MIN_PASSWORD_LENGTH = 6
MAX_PASSWORD_LENGTH = 100
MIN_USERNAME_LENGTH = 3
MAX_USERNAME_LENGTH = 50

# Regex para validação
USERNAME_REGEX = re.compile(r'^[a-zA-Z0-9_.-]+$')
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')


# ============================================
# FUNÇÕES AUXILIARES
# ============================================

def ascon_hash(password):
    """Gera hash SHA256 da senha com salt"""
    return hashlib.sha256(f"{password}{SALT}".encode()).hexdigest()


def get_nivel_nome(nivel):
    """Retorna o nome do nível de credencial"""
    return NIVEIS_CREDENCIAL.get(nivel, f"Desconhecido ({nivel})")


def validate_username(username):
    """Valida o nome de usuário"""
    if not username:
        return False, "Nome de usuário é obrigatório"

    if len(username) < MIN_USERNAME_LENGTH:
        return False, f"Nome de usuário deve ter pelo menos {MIN_USERNAME_LENGTH} caracteres"

    if len(username) > MAX_USERNAME_LENGTH:
        return False, f"Nome de usuário deve ter no máximo {MAX_USERNAME_LENGTH} caracteres"

    if not USERNAME_REGEX.match(username):
        return False, "Nome de usuário pode conter apenas letras, números, pontos, underlines e hífens"

    return True, ""


def validate_password(password):
    """Valida a senha"""
    if not password:
        return False, "Senha é obrigatória"

    if len(password) < MIN_PASSWORD_LENGTH:
        return False, f"Senha deve ter pelo menos {MIN_PASSWORD_LENGTH} caracteres"

    if len(password) > MAX_PASSWORD_LENGTH:
        return False, f"Senha deve ter no máximo {MAX_PASSWORD_LENGTH} caracteres"

    return True, ""


def validate_email(email):
    """Valida o email"""
    if not email:
        return False, "Email é obrigatório"

    if not EMAIL_REGEX.match(email):
        return False, "Email inválido"

    return True, ""


def is_username_taken(username):
    """Verifica se o nome de usuário já está em uso"""
    result = execute_query(
        "SELECT id FROM usuarios WHERE username = %s",
        (username,),
        fetch_one=True
    )
    return result is not None


def is_email_taken(email):
    """Verifica se o email já está em uso"""
    result = execute_query(
        "SELECT id FROM usuarios WHERE email = %s",
        (email,),
        fetch_one=True
    )
    return result is not None


def get_user_by_username(username):
    """Busca usuário pelo nome de usuário"""
    return execute_query(
        """
        SELECT id, username, email, senha_hash, nivel_credencial, 
               ativo, nome_real, nome_social, avatar_url, bio
        FROM usuarios 
        WHERE username = %s
        """,
        (username,),
        fetch_one=True
    )


def get_user_by_id(user_id):
    """Busca usuário pelo ID"""
    return execute_query(
        """
        SELECT id, username, email, senha_hash, nivel_credencial, 
               ativo, nome_real, nome_social, avatar_url, bio
        FROM usuarios 
        WHERE id = %s
        """,
        (user_id,),
        fetch_one=True
    )


def update_last_access(user_id):
    """Atualiza a data de último acesso do usuário"""
    execute_query(
        "UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = %s",
        (user_id,),
        commit=True
    )


# ============================================
# CLASSE USER PARA FLASK-LOGIN
# ============================================

class User(UserMixin):
    """Classe de usuário para Flask-Login"""

    def __init__(self, id, username, nivel_credencial, email=None, nome_real=None, avatar_url=None):
        self.id = id
        self.username = username
        self.nivel_credencial = nivel_credencial
        self.email = email
        self.nome_real = nome_real
        self.avatar_url = avatar_url

    def get_id(self):
        return str(self.id)

    def is_admin(self):
        return self.nivel_credencial >= 5

    def is_moderator(self):
        return self.nivel_credencial >= 4

    def is_narrator(self):
        return self.nivel_credencial >= 2

    def get_nivel_nome(self):
        return get_nivel_nome(self.nivel_credencial)


# ============================================
# FUNÇÃO LOAD_USER (para Flask-Login)
# ============================================

def load_user(user_id):
    """Carrega usuário pelo ID para o Flask-Login"""
    try:
        user_id_int = int(user_id)
        user_data = get_user_by_id(user_id_int)

        if user_data and user_data.get('ativo', 1):
            return User(
                id=user_data['id'],
                username=user_data['username'],
                nivel_credencial=user_data['nivel_credencial'],
                email=user_data.get('email'),
                nome_real=user_data.get('nome_real'),
                avatar_url=user_data.get('avatar_url')
            )
    except Exception as e:
        logger.error(f"Erro ao carregar usuário {user_id}: {e}")

    return None


# ============================================
# ROTAS DE AUTENTICAÇÃO
# ============================================

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """Página de login e processamento do formulário"""
    if current_user.is_authenticated:
        return redirect(url_for('main.main_page'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')

        if not username or not password:
            flash('Preencha todos os campos', 'error')
            return render_template('login.html')

        user_data = get_user_by_username(username)

        if user_data:
            if not user_data.get('ativo', 1):
                flash('Esta conta está desativada. Contate um administrador.', 'error')
                return render_template('login.html')

            if user_data['senha_hash'] == ascon_hash(password):
                user = User(
                    id=user_data['id'],
                    username=user_data['username'],
                    nivel_credencial=user_data['nivel_credencial'],
                    email=user_data.get('email'),
                    nome_real=user_data.get('nome_real'),
                    avatar_url=user_data.get('avatar_url')
                )

                login_user(user, remember=request.form.get('remember') == 'on')
                update_last_access(user.id)

                logger.info(f"Usuário {username} fez login")
                flash(f'Bem-vindo de volta, {username}!', 'success')

                next_page = request.args.get('next')
                if next_page:
                    return redirect(next_page)
                return redirect(url_for('main.main_page'))
            else:
                flash('Usuário ou senha inválidos', 'error')
        else:
            flash('Usuário ou senha inválidos', 'error')

    return render_template('login.html')


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """Página de registro e processamento do formulário"""
    if current_user.is_authenticated:
        return redirect(url_for('main.main_page'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        password_confirm = request.form.get('password_confirm', '')
        nome_real = request.form.get('nome_real', '').strip()
        nome_social = request.form.get('nome_social', '').strip()
        data_nascimento = request.form.get('data_nascimento', '')

        valid = True
        errors = []

        # Validar username
        is_valid, error = validate_username(username)
        if not is_valid:
            errors.append(error)
            valid = False
        elif is_username_taken(username):
            errors.append("Nome de usuário já está em uso")
            valid = False

        # Validar email
        is_valid, error = validate_email(email)
        if not is_valid:
            errors.append(error)
            valid = False
        elif is_email_taken(email):
            errors.append("Email já está cadastrado")
            valid = False

        # Validar senha
        is_valid, error = validate_password(password)
        if not is_valid:
            errors.append(error)
            valid = False
        elif password != password_confirm:
            errors.append("As senhas não coincidem")
            valid = False

        if not valid:
            for error in errors:
                flash(error, 'error')
            return render_template('register.html')

        # Criar usuário
        senha_hash = ascon_hash(password)

        result = execute_query(
            """
            INSERT INTO usuarios (
                username, email, senha_hash, nome_real, nome_social, 
                data_nascimento, nivel_credencial, ativo, data_criacao
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, 1, NOW())
            """,
            (username, email, senha_hash, nome_real, nome_social,
             data_nascimento if data_nascimento else None, 0),
            commit=True
        )

        if result:
            logger.info(f"Novo usuário registrado: {username}")
            flash('Conta criada com sucesso! Faça login para continuar.', 'success')
            return redirect(url_for('auth.login'))
        else:
            flash('Erro ao criar conta. Tente novamente mais tarde.', 'error')

    return render_template('register.html')


@auth_bp.route('/logout')
@login_required
def logout():
    """Logout do usuário"""
    username = current_user.username
    logout_user()
    flash(f'Você saiu da sua conta, {username}. Até logo!', 'info')
    logger.info(f"Usuário {username} fez logout")
    return redirect(url_for('auth.login'))


@auth_bp.route('/perfil')
@login_required
def perfil():
    """Página de perfil do usuário"""
    return render_template('perfil.html', user=current_user)


# ============================================
# API DO PERFIL (para o front-end)
# ============================================

@auth_bp.route('/api/perfil', methods=['GET'])
@login_required
def api_get_perfil():
    """Retorna dados do perfil do usuário atual"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de banco'}), 500

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT id, username, email, nome_real, nome_social, 
                   data_nascimento, avatar_url, discord_id, bio, 
                   fuso_horario, nivel_credencial, data_criacao, ultimo_acesso
            FROM usuarios 
            WHERE id = %s
        """, (current_user.id,))

        usuario = cursor.fetchone()

        if usuario:
            if usuario.get('data_nascimento'):
                usuario['data_nascimento'] = usuario['data_nascimento'].strftime('%Y-%m-%d')
            if usuario.get('data_criacao'):
                usuario['data_criacao'] = usuario['data_criacao'].strftime('%d/%m/%Y')
            if usuario.get('ultimo_acesso'):
                usuario['ultimo_acesso'] = usuario['ultimo_acesso'].strftime('%d/%m/%Y %H:%M')

            return jsonify({'success': True, 'usuario': usuario})
        else:
            return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 404

    except Exception as e:
        logger.error(f"Erro ao buscar perfil: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@auth_bp.route('/api/perfil', methods=['PUT'])
@login_required
def api_update_perfil():
    """Atualiza dados do perfil do usuário atual"""
    try:
        data = request.get_json()

        allowed_fields = ['nome_real', 'nome_social', 'avatar_url', 'discord_id', 'bio', 'fuso_horario']

        updates = []
        values = []

        for field in allowed_fields:
            if field in data:
                updates.append(f"{field} = %s")
                values.append(data[field])

        if not updates:
            return jsonify({'success': False, 'message': 'Nenhum campo para atualizar'}), 400

        values.append(current_user.id)

        result = execute_query(
            f"UPDATE usuarios SET {', '.join(updates)} WHERE id = %s",
            tuple(values),
            commit=True
        )

        if result is not None:
            return jsonify({'success': True, 'message': 'Perfil atualizado com sucesso'})
        else:
            return jsonify({'success': False, 'message': 'Erro ao atualizar perfil'}), 500

    except Exception as e:
        logger.error(f"Erro ao atualizar perfil: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@auth_bp.route('/api/alterar-senha', methods=['POST'])
@login_required
def api_alterar_senha():
    """Altera a senha do usuário atual"""
    try:
        data = request.get_json()
        senha_atual = data.get('senha_atual')
        nova_senha = data.get('nova_senha')
        confirmar_senha = data.get('confirmar_senha')

        if not senha_atual or not nova_senha or not confirmar_senha:
            return jsonify({'success': False, 'message': 'Todos os campos são obrigatórios'}), 400

        if nova_senha != confirmar_senha:
            return jsonify({'success': False, 'message': 'A nova senha e a confirmação não coincidem'}), 400

        is_valid, error = validate_password(nova_senha)
        if not is_valid:
            return jsonify({'success': False, 'message': error}), 400

        user_data = get_user_by_id(current_user.id)

        if not user_data or user_data['senha_hash'] != ascon_hash(senha_atual):
            return jsonify({'success': False, 'message': 'Senha atual incorreta'}), 400

        nova_senha_hash = ascon_hash(nova_senha)

        result = execute_query(
            "UPDATE usuarios SET senha_hash = %s WHERE id = %s",
            (nova_senha_hash, current_user.id),
            commit=True
        )

        if result is not None:
            logger.info(f"Senha alterada para usuário {current_user.username}")
            return jsonify({'success': True, 'message': 'Senha alterada com sucesso'})
        else:
            return jsonify({'success': False, 'message': 'Erro ao alterar senha'}), 500

    except Exception as e:
        logger.error(f"Erro ao alterar senha: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# CONTEXTO GLOBAL PARA TEMPLATES
# ============================================

@auth_bp.context_processor
def inject_auth_variables():
    """Injeta variáveis nos templates do blueprint de autenticação"""
    return {
        'niveis_credencial': NIVEIS_CREDENCIAL
    }