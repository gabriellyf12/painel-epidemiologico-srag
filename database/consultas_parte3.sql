-- Consultas da Parte 3 (versao entregue no relatorio).

-- Q1: total de notificacoes confirmadas com Influenza tipo B
select count(distinct notificacao.numero_notificacao) as qtd_flu_b
from notificacao
join detecta on detecta.numero_notificacao = notificacao.numero_notificacao
where sigla_agente = 'FLU_B';

-- Q2: municipios com numero de obitos acima da media
select nome, uf, COUNT(*) as total
from notificacao
join municipio on municipio_notificacao = codigo_ibge
where evolucao = 2
group by codigo_ibge, nome, uf
having COUNT(*) > (
    select avg(total_mun)
    from (
        select COUNT(*) as total_mun
        from notificacao
        where evolucao = 2 and municipio_notificacao is not null
        group by municipio_notificacao
    ) as sub
)
ORDER BY total DESC;

-- Q3: frequencia de todos os sintomas em casos que evoluiram para obito
select sigla, descricao, count(notificacao.numero_notificacao) as total_casos
from sintoma
left join apresenta on sigla_sintoma = sigla and resposta_sintoma = 1
left join notificacao on apresenta.numero_notificacao = notificacao.numero_notificacao
    and evolucao = 2
group by sigla, descricao
order by total_casos desc;

-- Q4: notificacoes registradas no mesmo municipio de residencia
select numero_notificacao, nome
from municipio
join notificacao on codigo_ibge = municipio_notificacao
where municipio_notificacao = municipio_residencia;

-- Q5: media de idade por obitos
select ROUND(AVG(TIMESTAMPDIFF(YEAR, data_nascimento, data_primeiros_sintomas)), 1) as media_idade
from notificacao
where data_nascimento is not null and evolucao = 2;

-- Q6: ficha geral da notificacao
select distinct notificacao.numero_notificacao,
    data_notificacao, sexo, raca_cor, data_nascimento,
    agente.sigla, agente.descricao, possui.sigla_comorbidade,
    municipio.nome, municipio.uf, evolucao
from notificacao
left join possui on possui.numero_notificacao = notificacao.numero_notificacao
    and resposta = 1
left join detecta on detecta.numero_notificacao = notificacao.numero_notificacao
left join agente on detecta.sigla_agente = agente.sigla
left join municipio on municipio_notificacao = codigo_ibge;
