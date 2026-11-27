import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { montarQuery, type Filtros, type Sintoma } from '../services/api'
import { CORES, fmtInteiro } from '../services/formato'
import { useDados } from '../services/useDados'
import { Painel, TabelaDados } from './Painel'

export default function SymptomsChart({ filtros }: { filtros: Filtros }) {
  const estado = useDados<Sintoma[]>(`/api/sintomas${montarQuery(filtros)}`)

  return (
    <Painel
      titulo="Frequência dos sintomas"
      descricao="Notificações do recorte com resposta “sim” para cada sintoma. Sintomas sem ocorrência aparecem com zero."
      estado={estado}
    >
      {(sintomas) => (
        <>
          <ResponsiveContainer width="100%" height={sintomas.length * 40 + 20}>
            <BarChart data={sintomas} layout="vertical" margin={{ right: 64 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="descricao"
                width={200}
                interval={0}
                tickLine={false}
                tick={{ fill: CORES.texto, fontSize: 12 }}
              />
              <Tooltip formatter={(v) => fmtInteiro(Number(v))} />
              <Bar
                dataKey="total_casos"
                name="Notificações"
                fill={CORES.azul}
                barSize={20}
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="total_casos"
                  position="right"
                  formatter={(v: number) => fmtInteiro(v)}
                  style={{ fill: CORES.texto, fontSize: 12 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <TabelaDados
            colunas={['Sintoma', 'Notificações']}
            linhas={sintomas.map((s) => [s.descricao, fmtInteiro(s.total_casos)])}
          />
        </>
      )}
    </Painel>
  )
}
