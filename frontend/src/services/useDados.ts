import { useEffect, useState } from 'react'
import { buscar } from './api'

export interface Estado<T> {
  dados: T | null
  erro: string | null
  carregando: boolean
}

// Busca o caminho sempre que ele muda. A requisicao anterior e cancelada, para
// que uma resposta atrasada nao substitua a do filtro mais recente.
export function useDados<T>(caminho: string): Estado<T> {
  const [estado, setEstado] = useState<Estado<T>>({ dados: null, erro: null, carregando: true })

  useEffect(() => {
    const controle = new AbortController()
    setEstado((anterior) => ({ ...anterior, erro: null, carregando: true }))
    buscar<T>(caminho, controle.signal)
      .then((dados) => setEstado({ dados, erro: null, carregando: false }))
      .catch((falha: Error) => {
        if (controle.signal.aborted) return
        // TypeError e o erro do fetch quando a API nao responde
        const erro = falha instanceof TypeError ? 'Não foi possível acessar a API' : falha.message
        setEstado({ dados: null, erro, carregando: false })
      })
    return () => controle.abort()
  }, [caminho])

  return estado
}
