#!/usr/bin/env python3
"""
Aplicação principal Thaolundra RPG
"""
import os
from dotenv import load_dotenv
load_dotenv()

import sys
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from flask import Flask, render_template, abort, redirect, url_for
from flask_login import LoginManager, login_required, current_user
from database import get_db_connection
from constants import NIVEIS_CREDENCIAL, pode_acessar_recurso

from blueprints.auth import auth_bp, load_user as auth_load_user
from blueprints.main_page import main_bp
from blueprints.criar_ficha import criar_ficha_bp
from blueprints.gerenciar_conteudo import gerenciar_bp
from blueprints.gerenciar_usuarios import usuarios_bp
from blueprints.mesa import mesa_bp
from blueprints.progressao_exp import progressao_exp_bp
from blueprints.view_sheet import view_bp
from blueprints.editor_ficha import editor_ficha_bp
from blueprints.especializacao import especializacao_bp

# ============================================
# CONFIGURAÇÃO DA APLICAÇÃO
# ============================================

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'dev-key-change-in-production')


# ============================================
# REGISTRO DOS BLUEPRINTS
# ============================================

app.register_blueprint(auth_bp)
app.register_blueprint(main_bp)
app.register_blueprint(criar_ficha_bp)
app.register_blueprint(view_bp)
app.register_blueprint(mesa_bp, url_prefix='/mesa')
app.register_blueprint(gerenciar_bp)
app.register_blueprint(usuarios_bp)
app.register_blueprint(especializacao_bp)
app.register_blueprint(editor_ficha_bp)
app.register_blueprint(progressao_exp_bp)


# ============================================
# LOGIN MANAGER
# ============================================

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login'
login_manager.login_message = 'Por favor, faça login para acessar esta página.'
login_manager.login_message_category = 'warning'


@login_manager.user_loader
def load_user(user_id):
    """Carrega usuário pelo ID para o Flask-Login"""
    return auth_load_user(user_id)


# ============================================
# HANDLERS DE ERRO
# ============================================

@app.errorhandler(401)
def unauthorized_page(error):
    return render_template('errors/401.html', description=error.description), 401

@app.errorhandler(403)
def forbidden_page(error):
    return render_template('errors/403.html', description=error.description), 403

@app.errorhandler(404)
def not_found_page(error):
    return render_template('errors/404.html', description=error.description), 404

@app.errorhandler(500)
def internal_error_page(error):
    return render_template('errors/500.html', description='Erro interno do servidor. Tente novamente mais tarde.'), 500


# ============================================
# ROTAS
# ============================================

@app.route('/health')
def health_check():
    import datetime
    return {
        'status': 'ok',
        'timestamp': datetime.datetime.now().isoformat(),
        'version': '1.0.0'
    }

@app.route('/mesas/minhas')
@login_required
def minhas_mesas():
    return redirect(url_for('mesa.listar_mesas'))

@app.route('/gerenciar-mesas')
@login_required
def gerenciar_mesas():
    if current_user.nivel_credencial < 7:
        abort(403, description="Acesso negado - Nível 7+ requerido")
    return render_template('gerenciar_mesas.html', user=current_user)

@app.route('/config')
@login_required
def configuracao():
    return render_template('config.html', user=current_user)

@app.route('/painel')
@login_required
def painel():
    if current_user.nivel_credencial < 7:
        abort(403, description="Acesso negado - Nível 7+ requerido")
    return render_template('painel.html', user=current_user)

@app.route('/desenvolvimento')
@login_required
def desenvolvimento():
    if current_user.nivel_credencial < 8:
        abort(403, description="Acesso negado - Nível 8+ requerido")
    return render_template('desenvolvimento.html', user=current_user)


@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('main.main_page'))
    return redirect(url_for('auth.login'))


# ============================================
# CONTEXTO GLOBAL
# ============================================

@app.context_processor
def inject_global_variables():
    def pode_acessar(recurso):
        if not current_user.is_authenticated:
            return False
        return pode_acessar_recurso(current_user.nivel_credencial, recurso)

    return {
        'global_niveis': NIVEIS_CREDENCIAL,
        'global_user': current_user,
        'pode_acessar': pode_acessar,
        'app_name': 'Thaolundra RPG',
        'app_version': '1.0.0'
    }


# ============================================
# INICIALIZAÇÃO
# ============================================

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Thaolundra RPG - Iniciando aplicação...")
    print("=" * 50)
    print(f"📁 Diretório base: {current_dir}")
    print(f"🐍 Python: {sys.version}")
    print(f"🌐 Acesse: http://127.0.0.1:8000")
    print("=" * 50)

    app.run(
        debug=True,
        host='127.0.0.1',
        port=8000,
        threaded=True
    )