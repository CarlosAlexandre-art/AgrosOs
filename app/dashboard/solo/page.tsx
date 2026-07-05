import { redirect } from 'next/navigation'

// Módulo em pausa — análise de solo sai do menu por enquanto
export default function SoloPage() {
  redirect('/dashboard')
}
