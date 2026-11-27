// Cliente HTTP e tipos das respostas da API
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// Texto vazio significa "sem filtro": o parametro nao e enviado
export interface Filtros {
  uf: string
  sexo: string
  idade_min: string
  idade_max: string
  agente: string
  evolucao: string
}

export const SEM_FILTROS: Filtros = {
  uf: '',
  sexo: '',
  idade_min: '',
  idade_max: '',
  agente: '',
  evolucao: '',
}

export interface OpcoesFiltros {
  ufs: string[]
  sexos: string[]
  agentes: { sigla: string; descricao: string }[]
  evolucoes: { codigo: number; descricao: string }[]
}

export interface Kpis {
  total_notificacoes: number
  internacoes_uti: number
  obitos: number
  letalidade: number | null
  media_idade: number | null
}

export interface PanoramaUf {
  uf: string
  total_casos: number
  obitos: number
  letalidade: number | null
  letalidade_nacional: number | null
  media_casos_por_uf: number | null
  letalidade_acima_da_media: boolean
  casos_acima_da_media: boolean
}

export interface Sintoma {
  sigla: string
  descricao: string
  total_casos: number
}

export interface Agente {
  sigla: string
  descricao: string
  cura: number
  obito_srag: number
  obito_outras_causas: number
  sem_desfecho: number
  total_casos: number
}

export interface CasoCritico {
  numero_notificacao: number
  data_notificacao: string | null
  data_primeiros_sintomas: string | null
  sexo: string | null
  idade: number | null
  municipio: string | null
  uf: string | null
  evolucao: number | null
  suporte_ventilatorio: number | null
  comorbidades: string | null
}

export interface PaginaCasos {
  total: number
  pagina: number
  tamanho: number
  itens: CasoCritico[]
}

export interface Semana {
  semana: number
  notificacoes: number
  obitos: number
}

export function montarQuery(filtros: Filtros, extras: Record<string, number> = {}): string {
  const parametros = new URLSearchParams()
  for (const [nome, valor] of Object.entries({ ...filtros, ...extras })) {
    if (valor !== '') parametros.set(nome, String(valor))
  }
  const texto = parametros.toString()
  return texto ? `?${texto}` : ''
}

export async function buscar<T>(caminho: string, signal?: AbortSignal): Promise<T> {
  const resposta = await fetch(BASE + caminho, { signal })
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null)
    const detalhe = typeof corpo?.detail === 'string' ? corpo.detail : null
    throw new Error(detalhe ?? `A API respondeu com o erro ${resposta.status}`)
  }
  return resposta.json() as Promise<T>
}

export const urlExportacao = (filtros: Filtros) =>
  `${BASE}/api/casos-criticos/exportar${montarQuery(filtros)}`
