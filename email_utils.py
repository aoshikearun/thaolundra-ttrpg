#!/usr/bin/env python3
"""
Utilitários para envio de emails usando Resend API
"""
import os
import logging
from dotenv import load_dotenv
from flask import render_template

# Carregar variáveis de ambiente ANTES de qualquer coisa
load_dotenv()

logger = logging.getLogger(__name__)

# Tentar importar Resend
try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False
    resend = None  # <-- DEFINIDO AQUI
    logger.warning("Resend não instalado. pip install resend")


def send_email(to_email, subject, html_content, from_email=None):
    """
    Envia um email usando Resend API
    """
    if not RESEND_AVAILABLE:
        return {
            'success': False,
            'message': 'Resend não está instalado. Execute: pip install resend'
        }

    api_key = os.environ.get('RESEND_API_KEY')
    if not api_key:
        return {
            'success': False,
            'message': 'RESEND_API_KEY não configurada no .env'
        }

    if from_email is None:
        from_email = os.environ.get('RESEND_FROM_EMAIL', 'onboarding@resend.dev')

    try:
        resend.api_key = api_key

        params = {
            'from': f'Poinar Saura <{from_email}>',
            'to': [to_email],
            'subject': subject,
            'html': html_content
        }

        response = resend.Emails.send(params)

        logger.info(f"Email enviado para {to_email}: {response}")

        return {
            'success': True,
            'message': 'Email enviado com sucesso',
            'data': response
        }

    except Exception as e:
        logger.error(f"Erro ao enviar email: {e}")
        return {
            'success': False,
            'message': str(e),
            'data': None
        }


# ============================================
# TEMPLATE 1: RESTAURAÇÃO DE SENHA
# ============================================

def send_password_reset_email(to_email, username, reset_token):
    """Envia email de recuperação de senha"""
    return send_email(
        to_email,
        "🔐 Recuperação de senha - Thaolundra RPG",
        render_template('emails/password_reset.html',
                       username=username,
                       reset_token=reset_token)
    )


# ============================================
# TEMPLATE 2: CONVITE PARA JOGAR
# ============================================

def send_invite_play_email(to_email, username, mesa_nome, mesa_descricao,
                           narradores, capacidade, convite_token, remetente=None):
    """Envia convite para jogar em uma mesa"""
    return send_email(
        to_email,
        "🗺 Você foi convocado para uma aventura!",
        render_template('emails/invite_play.html',
                       username=username,
                       mesa_nome=mesa_nome,
                       mesa_descricao=mesa_descricao,
                       narradores=narradores,
                       capacidade=capacidade,
                       convite_token=convite_token,
                       remetente=remetente or "um dos nossos narradores")
    )


# ============================================
# TEMPLATE 3: CONVITE PARA ASSISTIR
# ============================================

def send_invite_watch_email(to_email, username, mesa_nome, mesa_descricao,
                            narradores, jogadores, convite_token, remetente=None,
                            papel_remetente="jogador"):
    """Envia convite para assistir uma mesa"""
    return send_email(
        to_email,
        "👀 Você foi convidado para assistir!",
        render_template('emails/invite_watch.html',
                       username=username,
                       mesa_nome=mesa_nome,
                       mesa_descricao=mesa_descricao,
                       narradores=narradores,
                       jogadores=jogadores,
                       convite_token=convite_token,
                       remetente=remetente or "um dos nossos aventureiros",
                       papel_remetente=papel_remetente)
    )


# ============================================
# TEMPLATE 4: LEMBRETE DE SESSÃO
# ============================================

def send_sessao_lembrete_email(to_email, username, mesa_nome, data, horario, local, token):
    """Envia lembrete de sessão marcada"""
    return send_email(
        to_email,
        f"⏳ Lembrete de sessão — {mesa_nome}",
        render_template('emails/sessao_lembrete.html',
                       username=username,
                       mesa_nome=mesa_nome,
                       data=data,
                       horario=horario,
                       local=local,
                       token=token)
    )


# ============================================
# TEMPLATE 5: MENSAGEM DO NARRADOR
# ============================================

def send_mensagem_narrador_email(to_email, username, mesa_nome, narrador_nome, conteudo):
    """Envia mensagem do narrador para os jogadores"""
    return send_email(
        to_email,
        f"📜 Mensagem do narrador — {mesa_nome}",
        render_template('emails/mensagem_narrador.html',
                       username=username,
                       mesa_nome=mesa_nome,
                       narrador_nome=narrador_nome,
                       conteudo=conteudo)
    )


# ============================================
# TEMPLATE 6: BOAS-VINDAS (CRIAÇÃO DE CONTA)
# ============================================

def send_boas_vindas_email(to_email, username):
    """Envia email de boas-vindas ao criar conta"""
    return send_email(
        to_email,
        "🐉 Bem-vindo ao PMUP — Thaolundra RPG",
        render_template('emails/boas_vindas.html',
                       username=username)
    )


# ============================================
# TEMPLATE 7: NOVO NÍVEL
# ============================================

def send_novo_nivel_email(to_email, username, nivel_anterior, nivel_novo,
                          nome_anterior, nome_novo, capacidades):
    """Envia notificação de novo nível"""
    return send_email(
        to_email,
        "⬆️ Você subiu de nível! — Thaolundra RPG",
        render_template('emails/novo_nivel.html',
                       username=username,
                       nivel_anterior=nivel_anterior,
                       nivel_novo=nivel_novo,
                       nome_anterior=nome_anterior,
                       nome_novo=nome_novo,
                       capacidades=capacidades)
    )


# ============================================
# TEMPLATE 8: RESTRIÇÃO DE CONTA
# ============================================

def send_restricao_email(to_email, username, motivo, data_inicio, data_fim, impacto):
    """Envia notificação de restrição de conta"""
    return send_email(
        to_email,
        "⚠️ Restrição de conta — Thaolundra RPG",
        render_template('emails/restricao.html',
                       username=username,
                       motivo=motivo,
                       data_inicio=data_inicio,
                       data_fim=data_fim,
                       impacto=impacto)
    )


# ============================================
# TESTE
# ============================================

def send_test_email(to_email):
    """Envia um email de teste"""
    return send_email(
        to_email,
        "🧪 Teste - Sistema de emails Thaolundra",
        render_template('emails/teste.html')
    )