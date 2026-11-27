import { useState } from 'react'
import { montarQuery, urlExportacao, type Filtros, type PaginaCasos } from '../services/api'
import { fmtData, fmtInteiro } from '../services/formato'
import { useDados } from '../services/useDados'
import { Painel } from './Painel'

const TAMANHO = 20

const EVOLUCAO: Record<number, string> = {
  1: 'Cura',
  2: 'Óbito',
  3: 'Óbito por outras causas',
  9: 'Ignorado',
}

const SUPORTE: Record<number, string> = {
  1: 'Invasivo',
  2: 'Não invasivo',
  3: 'Não usou',
  9: 'Ignorado',
}

const COLUNAS = [
  'Nº da notificação',
  'Primeiros sintomas',
  'Notificado em',
  'Sexo',
  'Idade',
  'Município / UF',
  'Evolução',
  'Suporte ventilatório',
  'Comorbidades',
]

const BOTAO = 'rounded border border-black/20 px-3 py-1.5 text-sm disabled:opacity-40'

// O App recria este componente quando os filtros mudam, voltando a pagina 1
export default function CasesTable({ filtros }: { filtros: Filtros }) {
  const [pagina, setPagina] = useState(1)
  const estado = useDados<PaginaCasos>(
    `/api/casos-criticos${montarQuery(filtros, { pagina, tamanho: TAMANHO })}`,
  )

  return (
    <Painel
      titulo="Casos críticos"
      descricao="Pacientes internados em UTI sem agente etiológico detectado."
      estado={estado}
    >
      {({ total, itens }) => {
        const paginas = Math.max(1, Math.ceil(total / TAMANHO))
        return (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm">{fmtInteiro(total)} casos no recorte</p>
              {total > 0 && (
                <a className={BOTAO} href={urlExportacao(filtros)}>
                  Exportar CSV (todos os casos)
                </a>
              )}
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm tabular-nums">
                <thead>
                  <tr>
                    {COLUNAS.map((c) => (
                      <th key={c} className="border-b border-black/10 py-2 pr-3 font-medium">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {itens.map((caso) => (
                    <tr key={caso.numero_notificacao} className="border-b border-black/5 align-top">
                      <td className="py-1.5 pr-3">{caso.numero_notificacao}</td>
                      <td className="pr-3">{fmtData(caso.data_primeiros_sintomas)}</td>
                      <td className="pr-3">{fmtData(caso.data_notificacao)}</td>
                      <td className="pr-3">{caso.sexo ?? '—'}</td>
                      <td className="pr-3">{caso.idade ?? '—'}</td>
                      <td className="pr-3">
                        {caso.municipio ? `${caso.municipio} / ${caso.uf ?? '—'}` : '—'}
                      </td>
                      <td className="pr-3">
                        {caso.evolucao === null ? '—' : EVOLUCAO[caso.evolucao]}
                      </td>
                      <td className="pr-3">
                        {caso.suporte_ventilatorio === null
                          ? '—'
                          : SUPORTE[caso.suporte_ventilatorio]}
                      </td>
                      <td>{caso.comorbidades ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                className={BOTAO}
                disabled={pagina <= 1}
                onClick={() => setPagina(pagina - 1)}
              >
                Anterior
              </button>
              <span className="text-sm">
                Página {fmtInteiro(pagina)} de {fmtInteiro(paginas)}
              </span>
              <button
                type="button"
                className={BOTAO}
                disabled={pagina >= paginas}
                onClick={() => setPagina(pagina + 1)}
              >
                Próxima
              </button>
            </div>
          </>
        )
      }}
    </Painel>
  )
}
