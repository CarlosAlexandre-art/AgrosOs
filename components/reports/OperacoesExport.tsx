'use client'

import ExportButtons from '@/components/ExportButtons'
import { exportOperacoesPDF } from '@/lib/export/pdf'
import { exportOperacoesExcel } from '@/lib/export/excel'

interface Props {
  propertyName: string
  activities: { type: string; status: string; startDate: string; endDate?: string | null; description?: string | null; executor: string }[]
}

export default function OperacoesExport(props: Props) {
  return (
    <ExportButtons
      onExportPDF={() => exportOperacoesPDF(props)}
      onExportExcel={() => exportOperacoesExcel(props)}
    />
  )
}
