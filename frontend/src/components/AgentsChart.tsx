import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { montarQuery, type Agente, type Filtros } from '../services/api'
import { CORES, fmtDecimal, fmtInteiro } from '../services/formato'
import { useDados } from '../services/useDados'
import { Painel, TabelaDados, textoDaLegenda } from './Painel'

// A cor acompanha o desfecho, mesmo quando os filtros mudam
const DESFECHOS = [
  { chave: 'cura', nome: 'Cura', cor: CORES.azul },
  { chave: 'obito_srag', nome: 'Óbito por SRAG', cor: CORES.laranja },
  { chave: 'obito_outras_causas', nome: 'Óbito por outras causas', cor: CORES.verdeAgua },
  { chave: 'sem_desfecho', nome: 'Ignorado ou em branco', cor: CORES.neutro },
] as const

export default function AgentsChart({ filtros }: { filtros: Filtros }) {
  const estado = useDados<Agente[]>(`/api/agentes${montarQuery(filtros)}`)

  return (
    <Painel
      titulo="Desfechos por agente etiológico"
      descricao="Proporção dos desfechos em cada agente. Uma notificação com mais de um agente aparece em cada um deles."
      estado={estado}
    >
      {(agentes) =>
        agentes.length === 0 ? (
          <p className="text-sm text-[#52514e]">Nenhum agente detectado neste recorte.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={agentes.length * 36 + 90}>
              <BarChart data={agentes} layout="vertical" stackOffset="expand">
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
                  tick={{ fill: CORES.eixo, fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="descricao"
                  width={200}
                  interval={0}
                  tickLine={false}
                  tick={{ fill: CORES.texto, fontSize: 12 }}
                />
                <Tooltip
                  formatter={(v, _nome, item) =>
                    `${fmtInteiro(Number(v))} (${fmtDecimal(
                      (100 * Number(v)) / item.payload.total_casos,
                    )}%)`
                  }
                />
                <Legend verticalAlign="top" formatter={textoDaLegenda} />
                {DESFECHOS.map((d) => (
                  <Bar
                    key={d.chave}
                    dataKey={d.chave}
                    name={d.nome}
                    stackId="desfechos"
                    fill={d.cor}
                    stroke={CORES.superficie}
                    strokeWidth={2}
                    barSize={22}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
            <TabelaDados
              colunas={['Agente', ...DESFECHOS.map((d) => d.nome), 'Total']}
              linhas={agentes.map((a) => [
                a.descricao,
                ...DESFECHOS.map((d) => fmtInteiro(a[d.chave])),
                fmtInteiro(a.total_casos),
              ])}
            />
          </>
        )
      }
    </Painel>
  )
}
