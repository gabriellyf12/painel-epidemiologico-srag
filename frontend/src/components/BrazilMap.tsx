import { useState } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { montarQuery, type Filtros, type PanoramaUf } from '../services/api'
import { CORES, fmtDecimal, fmtInteiro, fmtPercentual } from '../services/formato'
import { useDados } from '../services/useDados'
import { Painel, TabelaDados } from './Painel'

// O glob permite abrir o painel mesmo sem o arquivo do mapa
const arquivos = import.meta.glob('../assets/br-states.json', {
  eager: true,
  import: 'default',
})
const malha = Object.values(arquivos)[0] as any

// Codigos de UF do IBGE (propriedade "codarea" da malha)
const UF_POR_CODIGO: Record<string, string> = {
  '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
  '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL',
  '28': 'SE', '29': 'BA', '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
  '41': 'PR', '42': 'SC', '43': 'RS',
  '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF',
}

// O d3-geo, usado pelo mapa, espera o contorno externo no sentido horario e os
// buracos no anti-horario. O padrao GeoJSON usa o contrario; sem esse ajuste,
// um estado pode aparecer preenchendo o mapa inteiro.
function ehHorario(anel: number[][]) {
  let soma = 0
  for (let i = 1; i < anel.length; i++) {
    soma += (anel[i][0] - anel[i - 1][0]) * (anel[i][1] + anel[i - 1][1])
  }
  return soma > 0
}

const orientar = (poligono: number[][][]) =>
  poligono.map((anel, i) => (ehHorario(anel) === (i === 0) ? anel : [...anel].reverse()))

// Ajuste valido para arquivos GeoJSON (TopoJSON nao e tratado aqui)
const mapa = malha && {
  ...malha,
  features: malha.features.map((f: any) => ({
    ...f,
    geometry: {
      ...f.geometry,
      coordinates:
        f.geometry.type === 'Polygon'
          ? orientar(f.geometry.coordinates)
          : f.geometry.coordinates.map(orientar),
    },
  })),
}

type Metrica = 'casos' | 'letalidade'

const METRICAS = {
  casos: {
    nome: 'Volume de notificações',
    valor: (l: PanoramaUf) => l.total_casos,
    acima: (l: PanoramaUf) => l.casos_acima_da_media,
    formatar: fmtInteiro,
  },
  letalidade: {
    nome: 'Taxa de letalidade',
    valor: (l: PanoramaUf) => l.letalidade,
    acima: (l: PanoramaUf) => l.letalidade_acima_da_media,
    formatar: (v: number) => fmtPercentual(v),
  },
}

// Cinco classes por quantis: com escala linear, Sao Paulo apagaria os demais
function classificar(linhas: PanoramaUf[], metrica: Metrica) {
  const valores = linhas
    .map(METRICAS[metrica].valor)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b)
  const cortes = [0.2, 0.4, 0.6, 0.8].map((q) => valores[Math.floor(q * (valores.length - 1))])
  const classe = (v: number) => cortes.filter((corte) => v > corte).length
  const legenda = CORES.sequencial.flatMap((cor, i) => {
    const grupo = valores.filter((v) => classe(v) === i)
    return grupo.length ? [{ cor, min: grupo[0], max: grupo[grupo.length - 1] }] : []
  })
  return { cor: (v: number) => CORES.sequencial[classe(v)], legenda }
}

function Conteudo({ linhas, filtroEvolucao }: { linhas: PanoramaUf[]; filtroEvolucao: boolean }) {
  const [escolhida, setEscolhida] = useState<Metrica>('casos')
  const [ativa, setAtiva] = useState<string | null>(null)
  const metrica: Metrica = filtroEvolucao ? 'casos' : escolhida
  const { nome, valor, acima, formatar } = METRICAS[metrica]

  if (linhas.length === 0) {
    return <p className="text-sm text-[#52514e]">Nenhuma notificação neste recorte.</p>
  }

  const porUf = new Map(linhas.map((l) => [l.uf, l]))
  const escala = classificar(linhas, metrica)
  const detalhe = ativa ? porUf.get(ativa) : undefined
  const nacional = linhas[0]

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Indicador do mapa">
        {(Object.keys(METRICAS) as Metrica[]).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={metrica === m}
            disabled={m === 'letalidade' && filtroEvolucao}
            onClick={() => setEscolhida(m)}
            className={`rounded border px-3 py-1 text-sm disabled:opacity-40 ${
              metrica === m ? 'border-black bg-black text-white' : 'border-black/20'
            }`}
          >
            {METRICAS[m].nome}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-[#52514e]">
        Contorno escuro: acima da referência nacional (
        {metrica === 'casos'
          ? `média de ${fmtDecimal(nacional.media_casos_por_uf)} notificações por UF`
          : `letalidade de ${fmtPercentual(nacional.letalidade_nacional)}`}
        ).
      </p>

      {mapa ? (
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [-54, -15], scale: 950 }}
          width={800}
          height={760}
          style={{ width: '100%', height: 'auto', maxHeight: '70vh' }}
          aria-label={`Mapa do Brasil por UF: ${nome}`}
        >
          <Geographies geography={mapa}>
            {({ geographies }) =>
              // Os estados destacados sao desenhados por ultimo, para o
              // contorno nao ficar encoberto pelos vizinhos
              geographies
                .map((geo: any) => {
                  const uf = UF_POR_CODIGO[geo.properties.codarea] ?? geo.properties.sigla
                  const linha = porUf.get(uf)
                  return { geo, uf, linha, destaque: linha ? acima(linha) : false }
                })
                .sort((a, b) => Number(a.destaque) - Number(b.destaque))
                .map(({ geo, uf, linha, destaque }) => {
                  const v = linha ? valor(linha) : null
                  const estilo = {
                    fill: v === null ? CORES.semDados : escala.cor(v),
                    stroke: destaque ? CORES.texto : CORES.eixo,
                    strokeWidth: destaque ? 2 : 0.5,
                    outline: 'none',
                  }
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      tabIndex={0}
                      onMouseEnter={() => setAtiva(uf)}
                      onMouseLeave={() => setAtiva(null)}
                      onFocus={() => setAtiva(uf)}
                      onBlur={() => setAtiva(null)}
                      style={{
                        default: estilo,
                        hover: { ...estilo, opacity: 0.8 },
                        pressed: estilo,
                      }}
                    >
                      <title>{`${uf}: ${v === null ? 'sem dados' : formatar(v)}`}</title>
                    </Geography>
                  )
                })
            }
          </Geographies>
        </ComposableMap>
      ) : (
        <p className="mt-3 rounded bg-yellow-50 p-3 text-sm">
          O arquivo do mapa (src/assets/br-states.json) ainda não foi adicionado. Use a tabela
          abaixo.
        </p>
      )}

      <p className="min-h-5 text-sm" aria-live="polite">
        {detalhe
          ? `${detalhe.uf}: ${fmtInteiro(detalhe.total_casos)} notificações, ${fmtInteiro(
              detalhe.obitos,
            )} óbitos${filtroEvolucao ? '' : `, letalidade de ${fmtPercentual(detalhe.letalidade)}`}`
          : ''}
      </p>

      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Legenda do mapa">
        {escala.legenda.map((item) => (
          <li key={item.cor} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm" style={{ background: item.cor }} />
            {formatar(item.min)}
            {item.max !== item.min && ` a ${formatar(item.max)}`}
          </li>
        ))}
      </ul>

      <TabelaDados
        colunas={['UF', 'Notificações', 'Óbitos', 'Letalidade']}
        linhas={linhas.map((l) => [
          l.uf,
          fmtInteiro(l.total_casos),
          fmtInteiro(l.obitos),
          filtroEvolucao ? '—' : fmtPercentual(l.letalidade),
        ])}
      />
    </div>
  )
}

export default function BrazilMap({ filtros }: { filtros: Filtros }) {
  const estado = useDados<PanoramaUf[]>(`/api/panorama-uf${montarQuery(filtros)}`)
  return (
    <Painel titulo="Panorama por UF de notificação" estado={estado}>
      {(linhas) => <Conteudo linhas={linhas} filtroEvolucao={filtros.evolucao !== ''} />}
    </Painel>
  )
}
