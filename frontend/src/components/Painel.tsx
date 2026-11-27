// Elementos compartilhados: cartao com estados de carga e tabela de apoio
import type { ReactNode } from 'react'
import type { Estado } from '../services/useDados'

interface PropsPainel<T> {
  titulo: string
  descricao?: string
  estado: Estado<T>
  children: (dados: T) => ReactNode
}

export function Painel<T>({ titulo, descricao, estado, children }: PropsPainel<T>) {
  return (
    <section className="rounded-lg border border-black/10 bg-[#fcfcfb] p-4">
      <h2 className="text-base font-semibold">{titulo}</h2>
      {descricao && <p className="mt-1 text-sm text-[#52514e]">{descricao}</p>}
      <div className="mt-3">
        {estado.erro ? (
          <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">
            {estado.erro}
          </p>
        ) : estado.dados === null ? (
          <p className="text-sm text-[#52514e]">Carregando…</p>
        ) : (
          <div className={estado.carregando ? 'opacity-50' : ''} aria-busy={estado.carregando}>
            {children(estado.dados)}
          </div>
        )}
      </div>
    </section>
  )
}

// O texto da legenda usa a cor padrao; a identidade fica no marcador colorido
export const textoDaLegenda = (nome: string) => <span className="text-[#0b0b0b]">{nome}</span>

export function TabelaDados({ colunas, linhas }: { colunas: string[]; linhas: ReactNode[][] }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-[#52514e]">Ver os dados em tabela</summary>
      <div className="mt-2 max-h-72 overflow-auto">
        <table className="w-full text-left tabular-nums">
          <thead>
            <tr>
              {colunas.map((coluna) => (
                <th key={coluna} className="border-b border-black/10 py-1 pr-3 font-medium">
                  {coluna}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha, i) => (
              <tr key={i}>
                {linha.map((celula, j) => (
                  <td key={j} className="border-b border-black/5 py-1 pr-3">
                    {celula}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
