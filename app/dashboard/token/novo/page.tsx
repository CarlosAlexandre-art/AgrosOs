import { redirect } from 'next/navigation'

// AgroToken em espera — fluxos pausados até o lançamento
export default function TokenNovoPage() {
  redirect('/dashboard/token')
}
