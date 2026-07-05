import { redirect } from 'next/navigation'

// Módulo descontinuado — as funções de satélite vivem em Análise Territorial / Geo Inteligência
export default function ImagensSatelitePage() {
  redirect('/dashboard/analise-territorial')
}
