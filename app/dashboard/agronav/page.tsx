import { Metadata } from 'next'
import AgroNavClient from './AgroNavClient'

export const metadata: Metadata = {
  title: 'AgroNav — Planejamento de Campo',
}

export default function AgroNavPage({
  searchParams,
}: {
  searchParams: { fieldId?: string; serviceId?: string }
}) {
  return (
    <AgroNavClient
      initialFieldId={searchParams.fieldId}
      initialServiceId={searchParams.serviceId}
    />
  )
}
