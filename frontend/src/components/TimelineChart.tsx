import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { montarQuery, type Filtros, type Semana } from '../services/api'
import { CORES, fmtInteiro } from '../services/formato'
import { useDados } from '../services/useDados'
import { Painel, TabelaDados, textoDaLegenda } from './Painel'

export default function TimelineChart({ filtros }: { filtros: Filtros }) {
  const estado = useDados<Semana[]>(`/api/sazonalidade${montarQuery(filtros)}`)

  return (
    <Painel
      titulo="Evolução por semana epidemiológica de 2019"
      descricao="Semana dos primeiros sintomas. Os óbitos são os casos daquela semana que evoluíram para óbito, não a data da morte."
      estado={estado}
    >
      {(semanas) =>
        semanas.length === 0 ? (
          <p className="text-sm text-[#52514e]">Nenhuma notificação neste recorte.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={semanas} margin={{ top: 8, right: 8, bottom: 16, left: 8 }}>
                <CartesianGrid stroke={CORES.grade} vertical={false} />
                <XAxis
                  dataKey="semana"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tick={{ fill: CORES.eixo, fontSize: 12 }}
                  label={{ value: 'Semana', position: 'insideBottom', offset: -8, fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: CORES.eixo, fontSize: 12 }}
                  tickFormatter={fmtInteiro}
                  width={56}
                />
                <Tooltip
                  formatter={(v) => fmtInteiro(Number(v))}
                  labelFormatter={(semana) => `Semana ${semana}`}
                />
                <Legend verticalAlign="top" formatter={textoDaLegenda} />
                <Line
                  dataKey="notificacoes"
                  name="Notificações"
                  stroke={CORES.azul}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  dataKey="obitos"
                  name="Óbitos"
                  stroke={CORES.laranja}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <TabelaDados
              colunas={['Semana', 'Notificações', 'Óbitos']}
              linhas={semanas.map((s) => [
                s.semana,
                fmtInteiro(s.notificacoes),
                fmtInteiro(s.obitos),
              ])}
            />
          </>
        )
      }
    </Painel>
  )
}
