import type { ReactNode } from 'react'
import { SEM_FILTROS, type Filtros, type OpcoesFiltros } from '../services/api'
import { SEXOS } from '../services/formato'
import type { Estado } from '../services/useDados'

interface Props {
  filtros: Filtros
  aoMudar: (filtros: Filtros) => void
  opcoes: Estado<OpcoesFiltros>
  // Na aba de casos criticos o filtro de agente nao se aplica
  semAgente: boolean
  erroIdade: string | null
}

const CAMPO =
  'mt-1 w-full rounded border border-black/20 bg-white px-2 py-1.5 text-sm disabled:bg-black/5'

function Rotulo({ texto, children }: { texto: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {texto}
      {children}
    </label>
  )
}

export default function FilterSidebar({ filtros, aoMudar, opcoes, semAgente, erroIdade }: Props) {
  const mudar = (campo: keyof Filtros, valor: string) => aoMudar({ ...filtros, [campo]: valor })
  const dados = opcoes.dados

  return (
    <aside className="space-y-4 border-b border-black/10 bg-[#fcfcfb] p-4 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <h2 className="text-sm font-semibold uppercase tracking-wide">Filtros globais</h2>
      {opcoes.erro && (
        <p role="alert" className="text-sm text-red-800">
          {opcoes.erro}
        </p>
      )}

      <Rotulo texto="UF de notificação">
        <select className={CAMPO} value={filtros.uf} onChange={(e) => mudar('uf', e.target.value)}>
          <option value="">Todas</option>
          {dados?.ufs.map((uf) => (
            <option key={uf}>{uf}</option>
          ))}
        </select>
      </Rotulo>

      <Rotulo texto="Sexo">
        <select
          className={CAMPO}
          value={filtros.sexo}
          onChange={(e) => mudar('sexo', e.target.value)}
        >
          <option value="">Todos</option>
          {dados?.sexos.map((sexo) => (
            <option key={sexo} value={sexo}>
              {SEXOS[sexo] ?? sexo}
            </option>
          ))}
        </select>
      </Rotulo>

      <fieldset>
        <legend className="text-sm font-medium">Faixa etária (anos)</legend>
        <div className="flex gap-2">
          {(['idade_min', 'idade_max'] as const).map((campo) => (
            <input
              key={campo}
              type="number"
              min={0}
              max={130}
              className={CAMPO}
              aria-label={campo === 'idade_min' ? 'Idade mínima' : 'Idade máxima'}
              placeholder={campo === 'idade_min' ? 'mín.' : 'máx.'}
              value={filtros[campo]}
              // Aceita apenas inteiros de 0 a 130, o intervalo valido na API
              onChange={(e) => {
                const texto = e.target.value
                if (texto === '' || (/^\d+$/.test(texto) && Number(texto) <= 130)) {
                  mudar(campo, texto)
                }
              }}
            />
          ))}
        </div>
        {erroIdade && <p className="mt-1 text-sm text-red-800">{erroIdade}</p>}
      </fieldset>

      <Rotulo texto="Agente etiológico">
        <select
          className={CAMPO}
          disabled={semAgente}
          value={semAgente ? '' : filtros.agente}
          onChange={(e) => mudar('agente', e.target.value)}
        >
          <option value="">Todos</option>
          {dados?.agentes.map((agente) => (
            <option key={agente.sigla} value={agente.sigla}>
              {agente.descricao}
            </option>
          ))}
        </select>
      </Rotulo>
      {semAgente && (
        <p className="!mt-1 text-xs text-[#52514e]">
          Não se aplica aos casos críticos, que não têm agente detectado.
        </p>
      )}

      <Rotulo texto="Evolução do caso">
        <select
          className={CAMPO}
          value={filtros.evolucao}
          onChange={(e) => mudar('evolucao', e.target.value)}
        >
          <option value="">Todas</option>
          {dados?.evolucoes.map((evolucao) => (
            <option key={evolucao.codigo} value={evolucao.codigo}>
              {evolucao.descricao}
            </option>
          ))}
        </select>
      </Rotulo>

      <button
        type="button"
        className="w-full rounded border border-black/20 px-3 py-2 text-sm font-medium hover:bg-black/5"
        onClick={() => aoMudar(SEM_FILTROS)}
      >
        Limpar filtros
      </button>
    </aside>
  )
}
