import type { Metadata, Viewport } from 'next'
import './globals.css'
import PWAInstaller from '@/components/PWAInstaller'

export const metadata: Metadata = {
  title: 'AgroOS — Sistema Operacional da Fazenda',
  description: 'Planeje, execute e controle toda a operação da sua fazenda em um único lugar.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AgroOS',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#16a34a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full bg-[#f8fafc] text-[#0f172a]">
        {children}
        <PWAInstaller />
      </body>
    </html>
  )
}
