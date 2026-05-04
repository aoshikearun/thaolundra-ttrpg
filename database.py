#!/usr/bin/env python3
"""
Conexão com banco de dados MariaDB/MySQL para Thaolundra RPG
"""
import mysql.connector
from mysql.connector import Error
import logging
import time
from functools import wraps

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================
# CONFIGURAÇÕES DO BANCO DE DADOS
# ============================================

DB_CONFIG = {
    'host': '192.168.0.9',
    'database': 'thaolundra_rpg',
    'user': 'pysserver',
    'password': 'pqpvtnc',
    'port': 3306,
    'use_pure': True,
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci',
    'autocommit': False,
    'pool_name': 'thaolundra_pool',
    'pool_size': 5,
    'pool_reset_session': True
}

# Configuração de fallback (opcional)
BACKUP_DB_CONFIG = {
    'host': 'localhost',
    'database': 'thaolundra_rpg',
    'user': 'root',
    'password': '',
    'port': 3306,
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci',
    'autocommit': False
}

# Cache de conexão
_connection_cache = None
_connection_attempts = 0
_MAX_ATTEMPTS = 3
_RETRY_DELAY = 2


# ============================================
# DECORATOR PARA RETRY
# ============================================

def retry_connection(max_attempts=_MAX_ATTEMPTS, delay=_RETRY_DELAY):
    """Decorator para tentar reconectar em caso de falha"""

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            global _connection_attempts

            for attempt in range(max_attempts):
                try:
                    result = func(*args, **kwargs)
                    _connection_attempts = 0
                    return result
                except Error as e:
                    _connection_attempts += 1
                    logger.warning(f"Tentativa {attempt + 1}/{max_attempts} falhou: {e}")

                    if attempt < max_attempts - 1:
                        time.sleep(delay)
                        continue
                    else:
                        logger.error(f"Todas as {max_attempts} tentativas falharam")
                        raise
            return None

        return wrapper

    return decorator


# ============================================
# FUNÇÃO PRINCIPAL DE CONEXÃO
# ============================================

@retry_connection()
def get_db_connection(use_backup=False):
    """
    Estabelece conexão com o banco de dados

    Args:
        use_backup (bool): Se True, tenta usar configuração de backup

    Returns:
        mysql.connector.MySQLConnection or None
    """
    global _connection_cache, _connection_attempts

    # Reutilizar conexão em cache se ainda estiver viva
    if _connection_cache is not None and _connection_cache.is_connected():
        try:
            _connection_cache.ping(reconnect=True)
            return _connection_cache
        except Error:
            _connection_cache = None

    config = BACKUP_DB_CONFIG if use_backup else DB_CONFIG

    try:
        logger.info(f"Conectando ao banco em {config['host']}:{config['port']}")

        connection = mysql.connector.connect(**config)

        if connection.is_connected():
            db_info = connection.get_server_info()
            logger.info(f"✅ Conectado ao MariaDB/MySQL versão {db_info}")

            # Configurar sessão
            cursor = connection.cursor()
            cursor.execute("SET time_zone = '+00:00'")
            cursor.execute("SET NAMES utf8mb4")
            cursor.close()

            _connection_cache = connection
            _connection_attempts = 0

            return connection

    except Error as e:
        logger.error(f"❌ Erro ao conectar: {e}")

        if not use_backup and _connection_attempts < _MAX_ATTEMPTS:
            logger.info("🔄 Tentando conexão de backup...")
            return get_db_connection(use_backup=True)

        return None


# ============================================
# FUNÇÃO SIMPLES PARA EXECUTAR QUERIES
# ============================================

def execute_query(query, params=None, fetch_one=False, fetch_all=False, commit=False):
    """
    Função utilitária para executar queries

    Args:
        query (str): Query SQL
        params (tuple/dict): Parâmetros
        fetch_one (bool): Retorna um registro
        fetch_all (bool): Retorna todos os registros
        commit (bool): Faz commit

    Returns:
        mixed: Resultado ou None
    """
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        if not connection:
            logger.error("Não foi possível obter conexão")
            return None

        cursor = connection.cursor(dictionary=True)

        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)

        if commit:
            connection.commit()

        if fetch_one:
            return cursor.fetchone()
        elif fetch_all:
            return cursor.fetchall()
        else:
            return cursor.lastrowid if cursor.lastrowid else True

    except Error as e:
        logger.error(f"Erro na query: {e}")
        logger.error(f"Query: {query}")
        if params:
            logger.error(f"Params: {params}")

        if connection and commit:
            connection.rollback()

        return None

    finally:
        if cursor:
            cursor.close()


def close_connection():
    """Fecha a conexão em cache"""
    global _connection_cache

    if _connection_cache and _connection_cache.is_connected():
        _connection_cache.close()
        logger.info("🔒 Conexão fechada")
        _connection_cache = None


def test_connection():
    """Testa a conexão"""
    try:
        connection = get_db_connection()
        if connection and connection.is_connected():
            cursor = connection.cursor()
            cursor.execute("SELECT 1 as test")
            result = cursor.fetchone()
            cursor.close()

            if result and result.get('test') == 1:
                logger.info("✅ Conexão OK")
                return True
    except Exception as e:
        logger.error(f"❌ Falha: {e}")

    return False


# Registrar limpeza na saída
import atexit

atexit.register(close_connection)

# ============================================
# TESTE RÁPIDO
# ============================================

if __name__ == '__main__':
    print("=" * 50)
    print("🧪 Teste de conexão")
    print("=" * 50)

    if test_connection():
        print("✅ Banco conectado com sucesso!")
    else:
        print("❌ Falha na conexão!")

    print("=" * 50)
    close_connection()