# blueprints/__init__.py
"""
Blueprints do sistema Thaolundra RPG
"""

from blueprints.auth import auth_bp
from blueprints.main_page import main_bp
from blueprints.criar_ficha import criar_ficha_bp
from blueprints.gerenciar_conteudo import gerenciar_bp
from blueprints.gerenciar_usuarios import usuarios_bp
from blueprints.mesa import mesa_bp
from blueprints.progressao_exp import progressao_exp_bp
from blueprints.view_sheet import view_bp

__all__ = [
    'auth_bp',
    'main_bp',
    'criar_ficha_bp',
    'gerenciar_bp',
    'usuarios_bp',
    'mesa_bp',
    'progressao_exp_bp',
    'view_bp'
]