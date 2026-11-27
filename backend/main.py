"""API REST do Painel Epidemiologico de SRAG."""
import csv
import io
import logging
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from mysql.connector import Error as ErroMySQL

import queries
from database import execute_query

logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="Painel Epidemiológico de SRAG")

# Permite que o frontend (Vite) acesse a API. Somente leitura.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET"],
)

# Codigos do dicionario de dados. Nao ha tabela de dominio para a evolucao.
EVOLUCOES = {
    1: "Cura",
    2: "Óbito",
    3: "Óbito por outras causas",
    9: "Ignorado",
}


def consultar(sql, parametros=()):
    """Executa a consulta e converte falhas do banco em resposta HTTP 503."""
    try:
        return execute_query(sql, parametros)
    except ErroMySQL:
        # O detalhe do erro fica no log do servidor, nao vai para o navegador
        logger.exception("Falha ao consultar o banco")
        raise HTTPException(status_code=503, detail="Banco de dados indisponível")


def filtros_globais(
    uf: Annotated[str | None, Query(pattern="^[A-Z]{2}$")] = None,
    sexo: Annotated[str | None, Query(pattern="^[MFI]$")] = None,
    idade_min: Annotated[int | None, Query(ge=0, le=130)] = None,
    idade_max: Annotated[int | None, Query(ge=0, le=130)] = None,
    agente: Annotated[str | None, Query(max_length=10)] = None,
    evolucao: Annotated[int | None, Query(ge=1, le=9)] = None,
):
    """Query parameters opcionais, compartilhados pelas rotas Q1 a Q6."""
    if idade_min is not None and idade_max is not None and idade_min > idade_max:
        raise HTTPException(
            status_code=422, detail="idade_min não pode ser maior que idade_max"
        )
    return {
        "uf": uf,
        "sexo": sexo,
        "idade_min": idade_min,
        "idade_max": idade_max,
        "agente": agente,
        "evolucao": evolucao,
    }


Filtros = Annotated[dict, Depends(filtros_globais)]


def decimal_para_float(valor, casas=1):
    """O MySQL devolve Decimal; sem dados, devolve NULL (None)."""
    return None if valor is None else round(float(valor), casas)


@app.get("/api/filtros")
def opcoes_dos_filtros():
    """Opcoes exibidas na barra de filtros."""
    return {
        "ufs": [linha["uf"] for linha in consultar(queries.FILTRO_UFS)],
        "sexos": [linha["sexo"] for linha in consultar(queries.FILTRO_SEXOS)],
        "agentes": consultar(queries.FILTRO_AGENTES),
        "evolucoes": [
            {"codigo": codigo, "descricao": descricao}
            for codigo, descricao in EVOLUCOES.items()
        ],
    }


@app.get("/api/kpis")
def kpis(filtros: Filtros):
    """Q1: indicadores gerais do recorte."""
    linha = consultar(queries.Q1_KPIS, filtros)[0]
    return {
        "total_notificacoes": int(linha["total_notificacoes"]),
        "internacoes_uti": int(linha["internacoes_uti"]),
        "obitos": int(linha["obitos"]),
        "letalidade": decimal_para_float(linha["letalidade"]),
        "media_idade": decimal_para_float(linha["media_idade"]),
    }


@app.get("/api/panorama-uf")
def panorama_uf(filtros: Filtros):
    """Q2: casos e letalidade por UF, comparados com a referencia nacional."""
    resultado = []
    for linha in consultar(queries.Q2_PANORAMA_UF, filtros):
        letalidade = linha["letalidade"]
        nacional = linha["letalidade_nacional"]
        media_casos = linha["media_casos_por_uf"]
        resultado.append(
            {
                "uf": linha["uf"],
                "total_casos": int(linha["total_casos"]),
                "obitos": int(linha["obitos"]),
                "letalidade": decimal_para_float(letalidade),
                "letalidade_nacional": decimal_para_float(nacional),
                "media_casos_por_uf": decimal_para_float(media_casos),
                # Compara antes de arredondar
                "letalidade_acima_da_media": (
                    letalidade is not None
                    and nacional is not None
                    and letalidade > nacional
                ),
                "casos_acima_da_media": linha["total_casos"] > media_casos,
            }
        )
    return resultado


@app.get("/api/sintomas")
def sintomas(filtros: Filtros):
    """Q3: frequencia de cada sintoma, inclusive os sem ocorrencia."""
    return consultar(queries.Q3_SINTOMAS, filtros)


@app.get("/api/agentes")
def agentes(filtros: Filtros):
    """Q4: desfechos por agente etiologico."""
    return consultar(queries.Q4_AGENTES, filtros)


@app.get("/api/casos-criticos")
def casos_criticos(
    filtros: Filtros,
    pagina: Annotated[int, Query(ge=1)] = 1,
    tamanho: Annotated[int, Query(ge=1, le=100)] = 20,
):
    """Q5: lista paginada de casos em UTI sem agente detectado."""
    total = consultar(queries.Q5_CASOS_CRITICOS_TOTAL, filtros)[0]["total"]
    itens = consultar(
        queries.Q5_CASOS_CRITICOS_PAGINA,
        {**filtros, "limite": tamanho, "deslocamento": (pagina - 1) * tamanho},
    )
    return {"total": total, "pagina": pagina, "tamanho": tamanho, "itens": itens}


@app.get("/api/casos-criticos/exportar")
def exportar_casos_criticos(filtros: Filtros):
    """Q5: todos os casos criticos do recorte em CSV."""
    linhas = consultar(queries.Q5_CASOS_CRITICOS, filtros)
    colunas = [
        "numero_notificacao",
        "data_notificacao",
        "data_primeiros_sintomas",
        "sexo",
        "idade",
        "municipio",
        "uf",
        "evolucao",
        "suporte_ventilatorio",
        "comorbidades",
    ]
    arquivo = io.StringIO()
    # Ponto e virgula e a marca BOM facilitam a abertura no Excel em portugues
    escritor = csv.DictWriter(arquivo, fieldnames=colunas, delimiter=";")
    escritor.writeheader()
    escritor.writerows(linhas)
    return Response(
        content=arquivo.getvalue().encode("utf-8-sig"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="casos_criticos.csv"'},
    )


@app.get("/api/sazonalidade")
def sazonalidade(filtros: Filtros):
    """Q6: notificacoes e obitos por semana epidemiologica de 2019."""
    return [
        {
            "semana": int(linha["semana"]),
            "notificacoes": int(linha["notificacoes"]),
            "obitos": int(linha["obitos"]),
        }
        for linha in consultar(queries.Q6_SAZONALIDADE, filtros)
    ]
