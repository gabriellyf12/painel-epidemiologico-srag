// Formatacao em portugues e cores dos graficos
const inteiro = new Intl.NumberFormat('pt-BR')
const decimal = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export const fmtInteiro = (valor: number) => inteiro.format(valor)
export const fmtDecimal = (valor: number | null) => (valor === null ? '—' : decimal.format(valor))
export const fmtPercentual = (valor: number | null) =>
  valor === null ? '—' : `${decimal.format(valor)}%`

// "2019-03-05" -> "05/03/2019" sem passar por Date, que aplicaria fuso horario
export const fmtData = (iso: string | null) => (iso ? iso.split('-').reverse().join('/') : '—')

export const SEXOS: Record<string, string> = { F: 'Feminino', M: 'Masculino', I: 'Ignorado' }

export const CORES = {
  azul: '#2a78d6',
  laranja: '#eb6834',
  verdeAgua: '#1baf7a',
  neutro: '#c3c2b7',
  superficie: '#fcfcfb',
  grade: '#e1e0d9',
  eixo: '#898781',
  texto: '#0b0b0b',
  semDados: '#f0efec',
  // Escala sequencial do mapa, do menor para o maior
  sequencial: ['#cde2fb', '#9ec5f4', '#6da7ec', '#2a78d6', '#184f95'],
}
