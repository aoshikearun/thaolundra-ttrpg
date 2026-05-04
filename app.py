#!/usr/bin/env python3
"""
Aplicação principal Thaolundra RPG
"""
import os
import sys

# Adiciona o diretório atual ao path para imports absolutos
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from flask import Flask, render_template, abort, redirect, url_for
from flask_login import LoginManager, login_required, current_user
from database import get_db_connection

# Importar blueprints da pasta blueprints
from blueprints.auth import auth_bp, load_user as auth_load_user
from blueprints.main_page import main_bp
from blueprints.criar_ficha import criar_ficha_bp
from blueprints.gerenciar_conteudo import gerenciar_bp
from blueprints.gerenciar_usuarios import usuarios_bp
from blueprints.mesa import mesa_bp
from blueprints.progressao_exp import progressao_exp_bp
from blueprints.view_sheet import view_bp

# ============================================
# CONFIGURAÇÃO DA APLICAÇÃO
# ============================================

app = Flask(__name__)
app.secret_key = '8afd9cf4aba09cb2be0f6619bf47df762767699748d1adf6f6f2078022dbbf5f'

# ============================================
# REGISTRO DOS BLUEPRINTS
# ============================================

# Autenticação (rotas: /login, /register, /logout, /perfil)
app.register_blueprint(auth_bp)

# Página principal (rotas: /main)
app.register_blueprint(main_bp)

# Criação de fichas (rotas: /criar-ficha)
app.register_blueprint(criar_ficha_bp)

# Visualização de fichas (rotas: /personagem/<id>, /personagens, /meus-personagens)
app.register_blueprint(view_bp)

# Sistema de mesas (rotas com prefixo /mesa)
app.register_blueprint(mesa_bp, url_prefix='/mesa')

# Gerenciamento de conteúdo (rotas: /gerenciar-conteudo, /api/especies, etc.)
app.register_blueprint(gerenciar_bp)

# Gerenciamento de usuários (rotas: /gerenciar-usuarios, /api/usuarios)
app.register_blueprint(usuarios_bp)

# Sistema de progressão de EXP (rotas com prefixo /api/progressao)
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
    """Página de erro 401 - Não autorizado"""
    return render_template('errors/401.html', description=error.description), 401


@app.errorhandler(403)
def forbidden_page(error):
    """Página de erro 403 - Acesso proibido"""
    return render_template('errors/403.html', description=error.description), 403


@app.errorhandler(404)
def not_found_page(error):
    """Página de erro 404 - Não encontrado"""
    return render_template('errors/404.html', description=error.description), 404


@app.errorhandler(500)
def internal_error_page(error):
    """Página de erro 500 - Erro interno do servidor"""
    return render_template('errors/500.html', description='Erro interno do servidor. Tente novamente mais tarde.'), 500


# ============================================
# ROTAS DE TESTE E UTILITÁRIOS
# ============================================

@app.route('/test/error/<int:code>')
def test_error(code):
    """Rota para testar páginas de erro"""
    if code == 401:
        abort(401, description="Teste: Autenticação necessária")
    elif code == 403:
        abort(403, description="Teste: Acesso negado - Credencial insuficiente")
    elif code == 404:
        abort(404, description="Teste: Página não encontrada")
    elif code == 500:
        abort(500, description="Teste: Erro interno simulado")
    else:
        return f"Código {code} não configurado para teste", 400


@app.route('/health')
def health_check():
    """Endpoint para verificação de saúde da aplicação"""
    import datetime
    return {
        'status': 'ok',
        'timestamp': datetime.datetime.now().isoformat(),
        'version': '1.0.0'
    }


# ============================================
# ROTAS ADICIONAIS QUE O FRONT ESPERA
# ============================================

@app.route('/mesas/minhas')
@login_required
def minhas_mesas():
    """Página de mesas que o usuário narra"""
    return redirect(url_for('mesa.listar_mesas'))


@app.route('/gerenciar-mesas')
@login_required
def gerenciar_mesas():
    """Página de gerenciamento de mesas (admin)"""
    if current_user.nivel_credencial < 4:
        abort(403, description="Acesso negado - Nível 4+ requerido")
    return render_template('gerenciar_mesas.html', user=current_user)


@app.route('/config')
@login_required
def configuracao():
    """Página de configurações do usuário"""
    return render_template('config.html', user=current_user)


@app.route('/painel')
@login_required
def painel():
    """Painel de controle / dashboard avançado"""
    if current_user.nivel_credencial < 4:
        abort(403, description="Acesso negado - Nível 4+ requerido")
    return render_template('painel.html', user=current_user)


# ============================================
# ROTA PRINCIPAL
# ============================================

@app.route('/')
def index():
    """Página inicial - redireciona para dashboard ou login"""
    if current_user.is_authenticated:
        return redirect(url_for('main.main_page'))
    return redirect(url_for('auth.login'))


# ============================================
# CONTEXTO GLOBAL PARA TEMPLATES
# ============================================

@app.context_processor
def inject_global_variables():
    """Injeta variáveis globais em todos os templates"""
    niveis_credencial = {
        0: "Espectador",
        1: "Jogador",
        2: "Narrador",
        3: "Guardião",
        4: "Moderador",
        5: "Administrador"
    }

    return {
        'global_niveis': niveis_credencial,
        'global_user': current_user,
        'app_name': 'Thaolundra RPG',
        'app_version': '1.0.0'
    }


# ============================================
# INICIALIZAÇÃO DA APLICAÇÃO
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