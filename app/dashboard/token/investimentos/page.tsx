import { redirect } from 'next/navigation'

// AgroToken em espera — fluxos pausados até o lançamento
export default function TokenInvestimentosPage() {
  redirect('/dashboard/token')
}
