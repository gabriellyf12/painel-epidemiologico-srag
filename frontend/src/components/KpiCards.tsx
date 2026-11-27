import { montarQuery, type Filtros, type Kpis } from '../services/api'
import { fmtDecimal, fmtInteiro, fmtPercentual } from '../services/formato'
import { useDados } from '../services/useDados'

export default function KpiCards({ filtros }: { filtros: Filtros }) {
  const { dados, erro, carregando } = useDados<Kpis>(`/api/kpis${montarQuery(filtros)}`)

  // Filtrando pela evolucao, a letalidade vira 0% ou 100% por construcao
  const filtrouEvolucao = filtros.evolucao !== ''

  const cartoes = [
    { rotulo: 'Total de notificações', valor: dados && fmtInteiro(dados.total_notificacoes) },
    { rotulo: 'Internações em UTI', valor: dados && fmtInteiro(dados.internacoes_uti) },
    {
      rotulo: 'Letalidade',
      valor: dados && (filtrouEvolucao ? '—' : fmtPercentual(dados.letalidade)),
      nota: filtrouEvolucao
        ? 'Indisponível com filtro de evolução'
        : 'Óbitos por SRAG entre casos com desfecho',
    },
    { rotulo: 'Idade média (anos)', valor: dados && fmtDecimal(dados.media_idade) },
  ]

  return (
    <div>
      {erro && (
        <p role="alert" className="mb-2 rounded bg-red-50 p-3 text-sm text-red-800">
          {erro}
        </p>
      )}
      <dl className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-4 ${carregando ? 'opacity-50' : ''}`}>
        {cartoes.map((cartao) => (
          <div key={cartao.rotulo} className="rounded-lg border border-black/10 bg-[#fcfcfb] p-4">
            <dt className="text-sm text-[#52514e]">{cartao.rotulo}</dt>
            <dd className="mt-1 text-3xl font-semibold">{cartao.valor ?? '—'}</dd>
            {cartao.nota && <dd className="mt-1 text-xs text-[#52514e]">{cartao.nota}</dd>}
          </div>
        ))}
      </dl>
    </div>
  )
}
