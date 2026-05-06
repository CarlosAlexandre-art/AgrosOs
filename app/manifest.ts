import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'SmartAgroOS — Sistema Operacional da Fazenda',
    short_name: 'SmartAgroOS',
    description: 'Planeje, execute e controle toda a operação da sua fazenda em um único lugar.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#16a34a',
    orientation: 'portrait',
    categories: ['productivity', 'business'],
    lang: 'pt-BR',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Nova atividade',
        url: '/dashboard/operacoes/nova',
        description: 'Registrar nova atividade',
      },
      {
        name: 'Lançar custo',
        url: '/dashboard/financeiro/novo',
        description: 'Registrar novo custo',
      },
    ],
  }
}
