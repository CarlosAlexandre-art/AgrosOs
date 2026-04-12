import jsPDF from 'jspdf'

const GREEN = '#16a34a'
const DARK = '#0f172a'
const GRAY = '#64748b'
const LIGHT = '#f1f5f9'
const WHITE = '#ffffff'

function header(doc: jsPDF, title: string, subtitle: string) {
  // Fundo header
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, 210, 40, 'F')

  // Barra verde lateral
  doc.setFillColor(22, 163, 74)
  doc.rect(0, 0, 6, 40, 'F')

  // Logo text
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('AgroOS', 14, 16)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('Sistema Operacional da Fazenda', 14, 23)

  // Título do relatório
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 34)

  // Data no canto direito
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  const now = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  doc.text(now, 196, 16, { align: 'right' })
  doc.text(subtitle, 196, 23, { align: 'right' })

  return 50 // y position after header
}

function footer(doc: jsPDF, pageNum: number) {
  const pageHeight = doc.internal.pageSize.height
  doc.setFillColor(241, 245, 249)
  doc.rect(0, pageHeight - 12, 210, 12, 'F')
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.setFont('helvetica', 'normal')
  doc.text('AgroOS — Sistema Operacional da Fazenda', 14, pageHeight - 4)
  doc.text(`Página ${pageNum}`, 196, pageHeight - 4, { align: 'right' })
}

function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFillColor(22, 163, 74)
  doc.rect(14, y, 3, 6, 'F')
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(text, 20, y + 5)
  return y + 12
}

function kpiCard(doc: jsPDF, label: string, value: string, x: number, y: number, w = 42) {
  doc.setFillColor(241, 245, 249)
  doc.roundedRect(x, y, w, 20, 3, 3, 'F')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text(label.toUpperCase(), x + 4, y + 7)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(value, x + 4, y + 16)
}

// ─── RELATÓRIO FINANCEIRO ───────────────────────────────────────────────────

export function exportFinanceiroPDF(data: {
  propertyName: string
  costs: { category: string; description?: string | null; amount: number; date: string }[]
  totalGeral: number
  costPerHa: number
  sizeHa: number
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let y = header(doc, 'Relatório Financeiro', data.propertyName)
  footer(doc, 1)

  // KPIs
  kpiCard(doc, 'Custo Total', `R$ ${data.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, y)
  kpiCard(doc, 'Custo por ha', `R$ ${data.costPerHa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 60, y)
  kpiCard(doc, 'Área Total', `${data.sizeHa} ha`, 106, y)
  kpiCard(doc, 'Lançamentos', `${data.costs.length}`, 152, y)
  y += 28

  // Custos por categoria
  y = sectionTitle(doc, 'Custos por Categoria', y)
  const byCat: Record<string, number> = {}
  for (const c of data.costs) {
    byCat[c.category] = (byCat[c.category] || 0) + c.amount
  }

  const catColors: Record<string, [number, number, number]> = {
    INSUMO: [22, 163, 74],
    MAO_DE_OBRA: [59, 130, 246],
    MAQUINARIO: [234, 179, 8],
    AGROLINK: [168, 85, 247],
    OUTROS: [100, 116, 139],
  }
  const catLabels: Record<string, string> = {
    INSUMO: 'Insumo', MAO_DE_OBRA: 'Mão de obra', MAQUINARIO: 'Maquinário', AGROLINK: 'AgroCore', OUTROS: 'Outros',
  }

  let barX = 14
  const barY = y
  const total = data.totalGeral || 1
  Object.entries(byCat).forEach(([cat, val]) => {
    const pct = (val / total) * 100
    const barW = Math.max((val / total) * 140, 2)
    const [r, g, b] = catColors[cat] || [100, 116, 139]
    doc.setFillColor(r, g, b)
    doc.roundedRect(14, y, barW, 8, 2, 2, 'F')
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(`${catLabels[cat] || cat}`, 14 + barW + 3, y + 6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(`R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${pct.toFixed(1)}%)`, 160, y + 6)
    y += 12
  })
  y += 4

  // Tabela de lançamentos
  y = sectionTitle(doc, 'Lançamentos', y)

  // Header tabela
  doc.setFillColor(15, 23, 42)
  doc.rect(14, y, 182, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.text('Data', 17, y + 5.5)
  doc.text('Categoria', 45, y + 5.5)
  doc.text('Descrição', 85, y + 5.5)
  doc.text('Valor', 185, y + 5.5, { align: 'right' })
  y += 8

  data.costs.slice(0, 30).forEach((c, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(14, y, 182, 7, 'F')
    }
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(new Date(c.date).toLocaleDateString('pt-BR'), 17, y + 5)
    doc.text(catLabels[c.category] || c.category, 45, y + 5)
    const desc = (c.description || '—').substring(0, 35)
    doc.text(desc, 85, y + 5)
    doc.setFont('helvetica', 'bold')
    doc.text(`R$ ${Number(c.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 195, y + 5, { align: 'right' })
    y += 7

    if (y > 270) {
      doc.addPage()
      footer(doc, doc.getNumberOfPages())
      y = 15
    }
  })

  // Total
  doc.setFillColor(22, 163, 74)
  doc.rect(14, y, 182, 9, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL GERAL', 17, y + 6.5)
  doc.text(`R$ ${data.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 195, y + 6.5, { align: 'right' })

  doc.save(`AgroOS-Financeiro-${data.propertyName.replace(/\s/g, '_')}.pdf`)
}

// ─── RELATÓRIO OPERAÇÕES ────────────────────────────────────────────────────

export function exportOperacoesPDF(data: {
  propertyName: string
  activities: { type: string; status: string; startDate: string; endDate?: string | null; description?: string | null; executor: string }[]
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let y = header(doc, 'Relatório Operacional', data.propertyName)
  footer(doc, 1)

  const statusLabel: Record<string, string> = {
    PENDING: 'Pendente', IN_PROGRESS: 'Em andamento', DONE: 'Concluído', LATE: 'Atrasado', CANCELLED: 'Cancelado',
  }
  const statusColors: Record<string, [number, number, number]> = {
    PENDING: [234, 179, 8], IN_PROGRESS: [59, 130, 246], DONE: [22, 163, 74], LATE: [239, 68, 68], CANCELLED: [100, 116, 139],
  }

  // KPIs
  const done = data.activities.filter(a => a.status === 'DONE').length
  const late = data.activities.filter(a => a.status === 'LATE').length
  const inProgress = data.activities.filter(a => a.status === 'IN_PROGRESS').length
  kpiCard(doc, 'Total', `${data.activities.length}`, 14, y)
  kpiCard(doc, 'Concluídas', `${done}`, 60, y)
  kpiCard(doc, 'Em andamento', `${inProgress}`, 106, y)
  kpiCard(doc, 'Atrasadas', `${late}`, 152, y)
  y += 28

  y = sectionTitle(doc, 'Lista de Atividades', y)

  // Header tabela
  doc.setFillColor(15, 23, 42)
  doc.rect(14, y, 182, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.text('Tipo', 17, y + 5.5)
  doc.text('Início', 75, y + 5.5)
  doc.text('Descrição', 100, y + 5.5)
  doc.text('Status', 172, y + 5.5, { align: 'right' })
  y += 8

  data.activities.forEach((a, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(14, y, 182, 8, 'F')
    }
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text(a.type.substring(0, 25), 17, y + 5.5)
    doc.setFont('helvetica', 'normal')
    doc.text(new Date(a.startDate).toLocaleDateString('pt-BR'), 75, y + 5.5)
    doc.text((a.description || '—').substring(0, 30), 100, y + 5.5)

    // Badge status
    const [r, g, b] = statusColors[a.status] || [100, 116, 139]
    doc.setFillColor(r, g, b)
    doc.roundedRect(157, y + 1.5, 36, 5, 1.5, 1.5, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.text(statusLabel[a.status] || a.status, 175, y + 5.5, { align: 'center' })
    y += 8

    if (y > 270) {
      doc.addPage()
      footer(doc, doc.getNumberOfPages())
      y = 15
    }
  })

  doc.save(`AgroOS-Operacoes-${data.propertyName.replace(/\s/g, '_')}.pdf`)
}

// ─── RELATÓRIO METAS ────────────────────────────────────────────────────────

export function exportMetasPDF(data: {
  propertyName: string
  goals: { title: string; type: string; targetValue: number; currentValue: number; isCompleted: boolean; deadline?: string | null }[]
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let y = header(doc, 'Relatório de Metas', data.propertyName)
  footer(doc, 1)

  const completed = data.goals.filter(g => g.isCompleted).length
  kpiCard(doc, 'Total de Metas', `${data.goals.length}`, 14, y)
  kpiCard(doc, 'Concluídas', `${completed}`, 60, y)
  kpiCard(doc, 'Em andamento', `${data.goals.length - completed}`, 106, y)
  const pct = data.goals.length > 0 ? Math.round((completed / data.goals.length) * 100) : 0
  kpiCard(doc, 'Progresso geral', `${pct}%`, 152, y)
  y += 28

  y = sectionTitle(doc, 'Detalhamento das Metas', y)

  data.goals.forEach((g) => {
    const progress = g.targetValue > 0 ? Math.min((g.currentValue / g.targetValue) * 100, 100) : 0
    const barW = (progress / 100) * 150

    // Card background
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(14, y, 182, 28, 3, 3, 'F')

    // Status badge
    if (g.isCompleted) {
      doc.setFillColor(22, 163, 74)
    } else {
      doc.setFillColor(59, 130, 246)
    }
    doc.roundedRect(158, y + 4, 32, 5, 1.5, 1.5, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.text(g.isCompleted ? 'CONCLUÍDA' : 'EM ANDAMENTO', 174, y + 7.5, { align: 'center' })

    // Título
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(g.title, 18, y + 10)

    // Prazo
    if (g.deadline) {
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 116, 139)
      doc.text(`Prazo: ${new Date(g.deadline).toLocaleDateString('pt-BR')}`, 18, y + 16)
    }

    // Barra de progresso
    doc.setFillColor(226, 232, 240)
    doc.roundedRect(18, y + 20, 150, 4, 2, 2, 'F')
    doc.setFillColor(22, 163, 74)
    if (barW > 0) doc.roundedRect(18, y + 20, barW, 4, 2, 2, 'F')

    // Valores
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(`${progress.toFixed(0)}%`, 172, y + 23.5)

    y += 32

    if (y > 260) {
      doc.addPage()
      footer(doc, doc.getNumberOfPages())
      y = 15
    }
  })

  doc.save(`AgroOS-Metas-${data.propertyName.replace(/\s/g, '_')}.pdf`)
}

// ─── RELATÓRIO PROPRIEDADE ──────────────────────────────────────────────────

export function exportPropriedadePDF(data: {
  property: { name: string; location?: string | null; sizeHectares: number }
  fields: { name: string; sizeHectares: number; crop?: { name: string } | null }[]
  team: { name: string; role: string }[]
  totalActivities: number
  totalCost: number
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let y = header(doc, 'Relatório da Propriedade', data.property.name)
  footer(doc, 1)

  // KPIs
  kpiCard(doc, 'Área Total', `${data.property.sizeHectares} ha`, 14, y)
  kpiCard(doc, 'Talhões', `${data.fields.length}`, 60, y)
  kpiCard(doc, 'Equipe', `${data.team.length} membros`, 106, y)
  kpiCard(doc, 'Custo Total', `R$ ${data.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 152, y)
  y += 28

  // Info geral
  y = sectionTitle(doc, 'Informações Gerais', y)
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(14, y, 182, 20, 3, 3, 'F')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('Nome da Propriedade', 18, y + 7)
  doc.text('Localização', 100, y + 7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(data.property.name, 18, y + 14)
  doc.text(data.property.location || '—', 100, y + 14)
  y += 26

  // Talhões
  if (data.fields.length > 0) {
    y = sectionTitle(doc, 'Talhões', y)
    doc.setFillColor(15, 23, 42)
    doc.rect(14, y, 182, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.text('Nome', 17, y + 5.5)
    doc.text('Área (ha)', 100, y + 5.5)
    doc.text('Cultura', 145, y + 5.5)
    y += 8

    data.fields.forEach((f, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252)
        doc.rect(14, y, 182, 7, 'F')
      }
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'normal')
      doc.text(f.name, 17, y + 5)
      doc.text(`${Number(f.sizeHectares)} ha`, 100, y + 5)
      doc.text(f.crop?.name || '—', 145, y + 5)
      y += 7
    })
    y += 6
  }

  // Equipe
  if (data.team.length > 0) {
    y = sectionTitle(doc, 'Equipe', y)
    const cols = 3
    data.team.forEach((m, i) => {
      const col = i % cols
      const cardX = 14 + col * 62
      if (col === 0 && i > 0) y += 22

      doc.setFillColor(240, 253, 244)
      doc.roundedRect(cardX, y, 58, 18, 3, 3, 'F')
      doc.setFillColor(22, 163, 74)
      doc.circle(cardX + 9, y + 9, 5, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(m.name[0].toUpperCase(), cardX + 9, y + 11.5, { align: 'center' })

      doc.setTextColor(15, 23, 42)
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.text(m.name.substring(0, 14), cardX + 17, y + 8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 116, 139)
      doc.setFontSize(7)
      doc.text(m.role.substring(0, 18), cardX + 17, y + 14)
    })
  }

  doc.save(`AgroOS-Propriedade-${data.property.name.replace(/\s/g, '_')}.pdf`)
}
