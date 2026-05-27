import type { Metadata, Viewport } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import PWAInstaller from '@/components/PWAInstaller'
import SplashScreen from '@/components/SplashScreen'

const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' })

export const metadata: Metadata = {
  title: 'SmartAgroOS — Sistema Operacional da Fazenda',
  description: 'Planeje, execute e controle toda a operação da sua fazenda em um único lugar.',
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icon-192',
    shortcut: '/icons/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SmartAgroOS',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#16a34a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`h-full ${montserrat.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192" />
        <script dangerouslySetInnerHTML={{
          __html: `window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__bip=e;});`
        }} />
      </head>
      <body className="font-sans min-h-full bg-[#f0fdf4] text-[#0f172a]">
        <SplashScreen />
        {children}
        <PWAInstaller />
        <script dangerouslySetInnerHTML={{
          __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});});}`
        }} />
      </body>
    </html>
  )
}
