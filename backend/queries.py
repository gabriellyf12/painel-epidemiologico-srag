"""Consultas SQL usadas pela API (Q1 a Q6 da especificacao tecnica).

Os valores escolhidos pelo usuario NUNCA sao concatenados no SQL: eles vao
como parametros nomeados, no formato %(nome)s. Parametro nulo (None vira NULL)
significa "sem filtro". A concatenacao abaixo junta apenas trechos fixos.

Como o sinal de porcentagem marca os parametros, nao o use nos textos SQL.
"""

# ---------------------------------------------------------------------------
# Trechos comuns aos filtros globais
# ---------------------------------------------------------------------------

# As duas juncoes devolvem no maximo uma linha por notificacao, entao nao
# inflam contagens, somas e medias. Um JOIN direto com detecta repetiria a
# notificacao que tem mais de um resultado positivo.
_BASE = """
    from notificacao n
    left join municipio m on m.codigo_ibge = n.municipio_notificacao
    left join (
        select distinct numero_notificacao
        from detecta
        where sigla_agente = %(agente)s
    ) filtro_agente on filtro_agente.numero_notificacao = n.numero_notificacao
"""

# Todos os filtros, exceto o de UF
_FILTROS_SEM_UF = """
    (%(sexo)s is null or n.sexo = %(sexo)s)
    and (%(idade_min)s is null
         or timestampdiff(year, n.data_nascimento, n.data_primeiros_sintomas) >= %(idade_min)s)
    and (%(idade_max)s is null
         or timestampdiff(year, n.data_nascimento, n.data_primeiros_sintomas) <= %(idade_max)s)
    and (%(evolucao)s is null or n.evolucao = %(evolucao)s)
    and (%(agente)s is null or filtro_agente.numero_notificacao is not null)
"""

_FILTROS = _FILTROS_SEM_UF + """
    and (%(uf)s is null or m.uf = %(uf)s)
"""

# Letalidade: obitos por SRAG (evolucao = 2) sobre os casos com desfecho
# conhecido (1 cura, 2 obito, 3 obito por outras causas).
_LETALIDADE = """
    100 * sum(n.evolucao = 2) / nullif(sum(n.evolucao in (1, 2, 3)), 0)
"""

# ---------------------------------------------------------------------------
# Opcoes dos filtros (consultas auxiliares)
# ---------------------------------------------------------------------------

FILTRO_UFS = "select distinct uf from municipio where uf is not null order by uf"

FILTRO_SEXOS = "select distinct sexo from notificacao where sexo is not null order by sexo"

FILTRO_AGENTES = "select sigla, descricao from agente order by descricao"

# ---------------------------------------------------------------------------
# Q1: indicadores gerais (agregacao e multiplas juncoes)
# ---------------------------------------------------------------------------

Q1_KPIS = """
    select
        count(*) as total_notificacoes,
        coalesce(sum(n.uti = 1), 0) as internacoes_uti,
        coalesce(sum(n.evolucao = 2), 0) as obitos,
        round(""" + _LETALIDADE + """, 1) as letalidade,
        round(avg(timestampdiff(year, n.data_nascimento, n.data_primeiros_sintomas)), 1)
            as media_idade
""" + _BASE + " where " + _FILTROS

# ---------------------------------------------------------------------------
# Q2: panorama por UF de notificacao (GROUP BY e subconsultas escalares)
# ---------------------------------------------------------------------------

# As subconsultas calculam a referencia nacional: aplicam os mesmos filtros,
# menos o de UF.
Q2_PANORAMA_UF = """
    select
        m.uf,
        count(*) as total_casos,
        coalesce(sum(n.evolucao = 2), 0) as obitos,
        """ + _LETALIDADE + """ as letalidade,
        (select """ + _LETALIDADE + _BASE + """
         where m.uf is not null and """ + _FILTROS_SEM_UF + """
        ) as letalidade_nacional,
        (select count(*) / nullif(count(distinct m.uf), 0) """ + _BASE + """
         where m.uf is not null and """ + _FILTROS_SEM_UF + """
        ) as media_casos_por_uf
""" + _BASE + " where m.uf is not null and " + _FILTROS + """
    group by m.uf
    order by m.uf
"""

# ---------------------------------------------------------------------------
# Q3: frequencia dos sintomas (LEFT JOIN e GROUP BY)
# ---------------------------------------------------------------------------

# Os filtros ficam dentro da subconsulta, que conta os sintomas do recorte. O
# LEFT JOIN a partir de sintoma preserva os que nao tem ocorrencia, e o
# coalesce mostra zero. Filtrar em um WHERE externo eliminaria esses sintomas.
Q3_SINTOMAS = """
    select s.sigla, s.descricao, coalesce(contagem.total, 0) as total_casos
    from sintoma s
    left join (
        select a.sigla_sintoma, count(*) as total
""" + _BASE + """
        join apresenta a
            on a.numero_notificacao = n.numero_notificacao and a.resposta_sintoma = 1
        where """ + _FILTROS + """
        group by a.sigla_sintoma
    ) contagem on contagem.sigla_sintoma = s.sigla
    order by total_casos desc, s.descricao
"""

# ---------------------------------------------------------------------------
# Q4: agentes etiologicos por desfecho (juncoes entre 3+ tabelas e GROUP BY)
# ---------------------------------------------------------------------------

# count(distinct) evita contar duas vezes a notificacao positiva para o mesmo
# agente nos dois metodos (RT-PCR e antigeno).
Q4_AGENTES = """
    select
        ag.sigla,
        ag.descricao,
        count(distinct case when n.evolucao = 1 then n.numero_notificacao end) as cura,
        count(distinct case when n.evolucao = 2 then n.numero_notificacao end) as obito_srag,
        count(distinct case when n.evolucao = 3 then n.numero_notificacao end)
            as obito_outras_causas,
        count(distinct case when n.evolucao is null or n.evolucao = 9
                            then n.numero_notificacao end) as sem_desfecho,
        count(distinct n.numero_notificacao) as total_casos
""" + _BASE + """
    join detecta d on d.numero_notificacao = n.numero_notificacao
    join agente ag on ag.sigla = d.sigla_agente
    where (%(agente)s is null or ag.sigla = %(agente)s) and """ + _FILTROS + """
    group by ag.sigla, ag.descricao
    order by total_casos desc, ag.descricao
"""

# ---------------------------------------------------------------------------
# Q5: casos criticos, em UTI e sem agente detectado (NOT EXISTS)
# ---------------------------------------------------------------------------

_CONDICAO_CRITICOS = """
    n.uti = 1
    and not exists (
        select 1 from detecta d where d.numero_notificacao = n.numero_notificacao
    )
    and """ + _FILTROS

Q5_CASOS_CRITICOS_TOTAL = (
    "select count(*) as total " + _BASE + " where " + _CONDICAO_CRITICOS
)

Q5_CASOS_CRITICOS = """
    select
        n.numero_notificacao,
        n.data_notificacao,
        n.data_primeiros_sintomas,
        n.sexo,
        timestampdiff(year, n.data_nascimento, n.data_primeiros_sintomas) as idade,
        m.nome as municipio,
        m.uf,
        n.evolucao,
        n.suporte_ventilatorio,
        (select group_concat(c.descricao order by c.descricao separator ', ')
         from possui p
         join comorbidade c on c.sigla = p.sigla_comorbidade
         where p.numero_notificacao = n.numero_notificacao and p.resposta = 1
        ) as comorbidades
""" + _BASE + " where " + _CONDICAO_CRITICOS + """
    order by n.data_notificacao desc, n.numero_notificacao
"""

Q5_CASOS_CRITICOS_PAGINA = Q5_CASOS_CRITICOS + " limit %(limite)s offset %(deslocamento)s"

# ---------------------------------------------------------------------------
# Q6: casos e obitos por semana epidemiologica de 2019 (juncoes e GROUP BY)
# ---------------------------------------------------------------------------

# A semana vem da data dos primeiros sintomas. O modo 6 do yearweek comeca a
# semana no domingo e considera como semana 1 a primeira com 4 ou mais dias no
# ano. "obitos" conta os casos daquela semana que evoluiram para obito, e nao
# a data em que o obito ocorreu.
Q6_SAZONALIDADE = """
    select
        mod(yearweek(n.data_primeiros_sintomas, 6), 100) as semana,
        count(*) as notificacoes,
        coalesce(sum(n.evolucao = 2), 0) as obitos
""" + _BASE + """
    where yearweek(n.data_primeiros_sintomas, 6) between 201901 and 201952
    and """ + _FILTROS + """
    group by semana
    order by semana
"""
