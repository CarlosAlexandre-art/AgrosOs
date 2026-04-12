'use client'

import ExportButtons from '@/components/ExportButtons'
import { exportFinanceiroPDF } from '@/lib/export/pdf'
import { exportFinanceiroExcel } from '@/lib/export/excel'

interface Props {
  propertyName: string
  costs: { category: string; description?: string | null; amount: number; date: string }[]
  totalGeral: number
  costPerHa: number
  sizeHa: number
}

export default function FinanceiroExport(props: Props) {
  return (
    <ExportButtons
      onExportPDF={() => exportFinanceiroPDF(props)}
      onExportExcel={() => exportFinanceiroExcel(props)}
    />
  )
}
