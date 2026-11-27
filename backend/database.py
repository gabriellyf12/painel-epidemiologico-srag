"""Pool de conexoes MySQL e executor de consultas."""
import os
from pathlib import Path
from threading import BoundedSemaphore, Lock

from dotenv import load_dotenv
from mysql.connector.pooling import MySQLConnectionPool

load_dotenv(Path(__file__).with_name(".env"))

TAMANHO_DO_POOL = 5

_pool = None
_trava_criacao = Lock()
# O pool do mysql-connector gera erro quando se esgota. O semaforo faz a
# requisicao excedente esperar uma conexao ser devolvida.
_vagas = BoundedSemaphore(TAMANHO_DO_POOL)


def _obter_pool():
    """Cria o pool na primeira consulta e o reutiliza nas seguintes."""
    global _pool
    with _trava_criacao:
        if _pool is None:
            _pool = MySQLConnectionPool(
                pool_name="srag",
                pool_size=TAMANHO_DO_POOL,
                host=os.getenv("DB_HOST", "localhost"),
                port=int(os.getenv("DB_PORT", "3306")),
                user=os.getenv("DB_USER"),
                password=os.getenv("DB_PASSWORD"),
                database=os.getenv("DB_NAME", "influ_db"),
            )
    return _pool


def execute_query(sql, parametros=()):
    """Executa um SELECT e devolve uma lista de dicionarios (coluna: valor)."""
    with _vagas:
        conexao = _obter_pool().get_connection()
        try:
            cursor = conexao.cursor(dictionary=True)
            try:
                cursor.execute(sql, parametros)
                return cursor.fetchall()
            finally:
                cursor.close()
        finally:
            # Em uma conexao de pool, close() a devolve ao pool
            conexao.close()
