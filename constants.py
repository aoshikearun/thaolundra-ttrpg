#!/usr/bin/env python3
"""
Arquivo de constantes centralizadas para Thaolundra RPG
Define níveis de credencial, acesso de recursos e configurações globais
"""

# ============================================
# NÍVEIS DE CREDENCIAL (0-9)
# ============================================

NIVEIS_CREDENCIAL = {
    0: "Espectador",
    1: "Jogador",
    2: "Veterano",
    3: "Parceiro",
    4: "VIP",
    5: "Narrador",
    6: "Guardião",
    7: "Moderador",
    8: "Desenvolvedor",
    9: "Administrador"
}

# Cores para badges de credencial
NIVEIS_CORES = {
    0: "secondary",  # Cinza
    1: "info",  # Azul
    2: "primary",  # Azul escuro
    3: "success",  # Verde
    4: "warning",  # Laranja
    5: "success",  # Verde para Narrador
    6: "info",  # Azul para Guardião
    7: "warning",  # Laranja para Moderador
    8: "danger",  # Vermelho para Desenvolvedor
    9: "danger"  # Vermelho para Admin
}

# ============================================
# ACESSO A RECURSOS (MENU)
# ============================================

# Define qual nível mínimo pode acessar cada recurso
RECURSOS_ACESSO = {
    'galeria_personagens': 0,  # Todos podem ver
    'criar_personagem': 1,  # Jogador+
    'meus_personagens': 1,  # Jogador+
    'mesas_ativas': 0,  # Todos podem ver
    'minhas_mesas': 1,  # Jogador+
    'criar_mesa': 5,  # Narrador+
    'gerenciar_conteudo': 6,  # Guardião+
    'gerenciar_usuarios': 7,  # Moderador+
    'gerenciar_mesas': 7,  # Moderador+
    'desenvolvimento': 8  # Desenvolvedor+
}

# ============================================
# ACESSO A MESAS
# ============================================

# Regras de acesso a mesas por nível
MESA_ACESSO = {
    'assistir_publicas': 0,  # Espectador+ pode assistir mesas públicas
    'assistir_privadas': 1,  # Jogador+ pode assistir privadas
    'participar_publicas': 1,  # Jogador+ pode jogar em públicas
    'participar_privadas': 1,  # Jogador+ pode jogar em privadas (se convidado)
    'criar_mesas': 5  # Narrador+ pode criar mesas
}


# ============================================
# FUNÇÕES DE VERIFICAÇÃO DE ACESSO
# ============================================

def pode_acessar_recurso(nivel_credencial, recurso):
    """
    Verifica se um usuário com determinado nível pode acessar um recurso

    Args:
        nivel_credencial (int): Nível de credencial do usuário (0-9)
        recurso (str): Nome do recurso a verificar

    Returns:
        bool: True se pode acessar, False caso contrário
    """
    nivel_minimo = RECURSOS_ACESSO.get(recurso)
    if nivel_minimo is None:
        return False
    return nivel_credencial >= nivel_minimo


def pode_assistir_mesa(nivel_credencial, mesa_privada=False):
    """
    Verifica se um usuário pode assistir uma mesa

    Args:
        nivel_credencial (int): Nível de credencial do usuário
        mesa_privada (bool): Se a mesa é privada

    Returns:
        bool: True se pode assistir
    """
    if mesa_privada:
        return nivel_credencial >= MESA_ACESSO['assistir_privadas']
    else:
        return nivel_credencial >= MESA_ACESSO['assistir_publicas']


def pode_participar_mesa(nivel_credencial, mesa_privada=False, foi_convidado=False):
    """
    Verifica se um usuário pode participar (jogar) em uma mesa

    Args:
        nivel_credencial (int): Nível de credencial do usuário
        mesa_privada (bool): Se a mesa é privada
        foi_convidado (bool): Se o usuário foi convidado (para mesas privadas)

    Returns:
        bool: True se pode participar
    """
    if nivel_credencial < MESA_ACESSO['participar_publicas']:
        return False

    if mesa_privada:
        # Para mesas privadas, precisa estar convidado E ter nível mínimo
        return foi_convidado and nivel_credencial >= MESA_ACESSO['participar_privadas']

    return True


def pode_criar_mesa(nivel_credencial):
    """
    Verifica se um usuário pode criar mesas

    Args:
        nivel_credencial (int): Nível de credencial do usuário

    Returns:
        bool: True se pode criar mesas
    """
    return nivel_credencial >= MESA_ACESSO['criar_mesas']


def pode_gerenciar_usuarios(nivel_credencial):
    """Verifica se pode gerenciar usuários (Moderador+)"""
    return nivel_credencial >= 7


def pode_gerenciar_conteudo(nivel_credencial):
    """Verifica se pode gerenciar conteúdo (Guardião+)"""
    return nivel_credencial >= 6


def pode_gerenciar_mesas(nivel_credencial):
    """Verifica se pode gerenciar mesas (Moderador+)"""
    return nivel_credencial >= 7


def pode_acessar_desenvolvimento(nivel_credencial):
    """Verifica se pode acessar painel de desenvolvimento (Desenvolvedor+)"""
    return nivel_credencial >= 8


def eh_administrador(nivel_credencial):
    """Verifica se é administrador (nível 9)"""
    return nivel_credencial >= 9


def eh_desenvolvedor(nivel_credencial):
    """Verifica se é desenvolvedor ou admin (nível 8+)"""
    return nivel_credencial >= 8


def eh_moderador(nivel_credencial):
    """Verifica se é moderador ou maior (nível 7+)"""
    return nivel_credencial >= 7


def eh_guardian(nivel_credencial):
    """Verifica se é guardião ou maior (nível 6+)"""
    return nivel_credencial >= 6


def eh_narrador(nivel_credencial):
    """Verifica se é narrador ou maior (nível 5+)"""
    return nivel_credencial >= 5


# ============================================
# CONFIGURAÇÕES DE SEGURANÇA
# ============================================

SALT = "1000PAUNOCUDEQUEMFAZBRUTEFORCE"
MIN_PASSWORD_LENGTH = 6
MAX_PASSWORD_LENGTH = 100
MIN_USERNAME_LENGTH = 3
MAX_USERNAME_LENGTH = 50

# ============================================
# VALIDAÇÃO POR REGEX
# ============================================

import re

USERNAME_REGEX = re.compile(r'^[a-zA-Z0-9_.-]+$')
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

# ============================================
# CONFIGURAÇÕES DE MESAS
# ============================================

TIPO_MESA = {
    'publica': 0,
    'privada': 1
}

STATUS_MESA = {
    'preparacao': 0,
    'ativa': 1,
    'pausada': 2,
    'encerrada': 3
}