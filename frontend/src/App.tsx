import { useEffect, useState } from 'react'
import AgentsChart from './components/AgentsChart'
import BrazilMap from './components/BrazilMap'
import CasesTable from './components/CasesTable'
import FilterSidebar from './components/FilterSidebar'
import KpiCards from './components/KpiCards'
import SymptomsChart from './components/SymptomsChart'
import TimelineChart from './components/TimelineChart'
import { montarQuery, SEM_FILTROS, type Filtros, type OpcoesFiltros } from './services/api'
import { useDados } from './services/useDados'

const ABAS = [
  { id: 'mapa', nome: 'Mapa e UF' },
  { id: 'sintomas', nome: 'Sintomas' },
  { id: 'agentes', nome: 'Agentes' },
  { id: 'criticos', nome: 'Casos críticos' },
] as const

type Aba = (typeof ABAS)[number]['id']

export default function App() {
  const [filtros, setFiltros] = useState<Filtros>(SEM_FILTROS)
  // Filtros usados nas consultas: mudam apos uma pausa, para nao consultar o
  // banco a cada tecla digitada na faixa etaria
  const [aplicados, setAplicados] = useState<Filtros>(SEM_FILTROS)
  const [aba, setAba] = useState<Aba>('mapa')
  const opcoes = useDados<OpcoesFiltros>('/api/filtros')

  const erroIdade =
    filtros.idade_min !== '' &&
    filtros.idade_max !== '' &&
    Number(filtros.idade_min) > Number(filtros.idade_max)
      ? 'A idade mínima é maior que a máxima.'
      : null

  useEffect(() => {
    if (erroIdade) return
    const espera = setTimeout(() => setAplicados(filtros), 400)
    return () => clearTimeout(espera)
  }, [filtros, erroIdade])

  const criticos = aba === 'criticos'
  // Nos casos criticos, cartoes e tabela ignoram o filtro de agente
  const consulta = criticos ? { ...aplicados, agente: '' } : aplicados

  return (
    <div className="min-h-screen lg:flex">
      <FilterSidebar
        filtros={filtros}
        aoMudar={setFiltros}
        opcoes={opcoes}
        semAgente={criticos}
        erroIdade={erroIdade}
      />
      <main className="min-w-0 flex-1 space-y-4 p-4">
        <h1 className="text-xl font-semibold">
          Painel Epidemiológico SRAG – SIVEP-Gripe 2019
        </h1>
        <KpiCards filtros={consulta} />
        <nav className="flex flex-wrap gap-1 border-b border-black/10" aria-label="Seções">
          {ABAS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={aba === item.id ? 'page' : undefined}
              onClick={() => setAba(item.id)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                aba === item.id ? 'border-black' : 'border-transparent text-[#52514e]'
              }`}
            >
              {item.nome}
            </button>
          ))}
        </nav>
        {aba === 'mapa' && (
          <>
            <BrazilMap filtros={consulta} />
            <TimelineChart filtros={consulta} />
          </>
        )}
        {aba === 'sintomas' && <SymptomsChart filtros={consulta} />}
        {aba === 'agentes' && <AgentsChart filtros={consulta} />}
        {criticos && <CasesTable key={montarQuery(consulta)} filtros={consulta} />}
      </main>
    </div>
  )
}
