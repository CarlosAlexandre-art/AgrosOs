import { Metadata } from 'next'
import AgroNavClient from './AgroNavClient'

export const metadata: Metadata = {
  title: 'AgroNav — Planejamento de Campo',
}

export default async function AgroNavPage({
  searchParams,
}: {
  searchParams: Promise<{ fieldId?: string; serviceId?: string }>
}) {
  const { fieldId, serviceId } = await searchParams
  return (
    <AgroNavClient
      initialFieldId={fieldId}
      initialServiceId={serviceId}
    />
  )
}
