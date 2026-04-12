'use client'

import ExportButtons from '@/components/ExportButtons'
import { exportMetasPDF } from '@/lib/export/pdf'
import { exportMetasExcel } from '@/lib/export/excel'

interface Props {
  propertyName: string
  goals: { title: string; type: string; targetValue: number; currentValue: number; isCompleted: boolean; deadline?: string | null }[]
}

export default function MetasExport(props: Props) {
  return (
    <ExportButtons
      onExportPDF={() => exportMetasPDF(props)}
      onExportExcel={() => exportMetasExcel(props)}
    />
  )
}
