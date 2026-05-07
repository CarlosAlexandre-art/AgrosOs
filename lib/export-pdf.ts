import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// ─── Tipos de exportação ───────────────────────────────────────────────────────

export interface ExportPDFData {
  title: string
  subtitle?: string
  content: Array<{
    type: 'text' | 'table' | 'chart' | 'image'
    data: any
    title?: string
  }>
  metadata?: {
    author?: string
    subject?: string
    keywords?: string
    creator?: string
  }
}

// ─── Exportador PDF Principal ─────────────────────────────────────────────────

export class PDFExporter {
  public doc: jsPDF
  private currentY: number = 20
  private pageHeight: number = 280
  private margin: number = 15

  constructor() {
    this.doc = new jsPDF()
    this.setupDocument()
  }

  private setupDocument() {
    this.doc.setFontSize(12)
    this.doc.setTextColor(51, 51, 51) // #333333
  }

  // Adicionar título
  addTitle(title: string, fontSize: number = 18) {
    if (this.currentY > this.pageHeight - 40) {
      this.doc.addPage()
      this.currentY = 20
    }

    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(34, 139, 34) // #228B22
    this.doc.text(title, this.margin, this.currentY)
    this.currentY += fontSize / 2 + 10
  }

  // Adicionar subtítulo
  addSubtitle(subtitle: string) {
    if (this.currentY > this.pageHeight - 30) {
      this.doc.addPage()
      this.currentY = 20
    }

    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(100, 100, 100) // #646464
    this.doc.text(subtitle, this.margin, this.currentY)
    this.currentY += 8
  }

  // Adicionar texto
  addText(text: string, fontSize: number = 11) {
    if (this.currentY > this.pageHeight - 30) {
      this.doc.addPage()
      this.currentY = 20
    }

    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(51, 51, 51)
    
    const lines = this.doc.splitTextToSize(text, 180)
    lines.forEach((line: string) => {
      this.doc.text(line, this.margin, this.currentY)
      this.currentY += fontSize / 2 + 2
    })
    this.currentY += 5
  }

  // Adicionar tabela
  addTable(headers: string[], rows: string[][]) {
    if (this.currentY > this.pageHeight - 60) {
      this.doc.addPage()
      this.currentY = 20
    }

    const cellWidth = 180 / headers.length
    const cellHeight = 8

    // Cabeçalho
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFillColor(34, 139, 34) // #228B22
    
    headers.forEach((header, index) => {
      this.doc.rect(this.margin + index * cellWidth, this.currentY, cellWidth, cellHeight, 'F')
      this.doc.text(header, this.margin + index * cellWidth + 2, this.currentY + 5)
    })
    
    this.currentY += cellHeight

    // Linhas
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(51, 51, 51)
    
    rows.forEach((row, rowIndex) => {
      if (rowIndex % 2 === 0) {
        this.doc.setFillColor(245, 245, 245) // #F5F5F5
      } else {
        this.doc.setFillColor(255, 255, 255) // #FFFFFF
      }
      
      row.forEach((cell, cellIndex) => {
        this.doc.rect(this.margin + cellIndex * cellWidth, this.currentY, cellWidth, cellHeight, 'F')
        this.doc.text(cell, this.margin + cellIndex * cellWidth + 2, this.currentY + 5)
      })
      
      this.currentY += cellHeight
    })
    
    this.currentY += 10
  }

  // Adicionar gráfico (placeholder)
  addChart(chartData: any, title?: string) {
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage()
      this.currentY = 20
    }

    if (title) {
      this.addSubtitle(title)
    }

    // Placeholder para gráfico
    this.doc.setFillColor(240, 240, 240)
    this.doc.rect(this.margin, this.currentY, 180, 60, 'F')
    
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(150, 150, 150)
    this.doc.text('[Gráfico - Em implementação]', this.margin + 90, this.currentY + 30)
    
    this.currentY += 70
  }

  // Adicionar rodapé
  addFooter(pageNumber: number, totalPages: number) {
    const footerY = this.pageHeight - 10
    
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(8)
    this.doc.setTextColor(150, 150, 150)
    
    this.doc.text(`Página ${pageNumber} de ${totalPages}`, this.margin, footerY)
    this.doc.text('Gerado por SmartAgroOS - OryonAG', 180 - this.margin, footerY, { align: 'right' })
  }

  // Gerar blob do PDF
  generateBlob(): Blob {
    return new Blob([this.doc.output('blob')], { type: 'application/pdf' })
  }

  // Salvar PDF
  save(filename: string) {
    this.doc.save(filename)
  }
}

// ─── Exportações Específicas ─────────────────────────────────────────────────

export class SmartAgroOSExporter {
  // Exportar relatório de atividades
  static async exportarAtividades(data: {
    property: any
    activities: any[]
    periodo: { inicio: Date; fim: Date }
    usuario: string
  }) {
    const exporter = new PDFExporter()
    
    exporter.addTitle('Relatório de Atividades')
    exporter.addSubtitle(`${data.property.name} - ${data.periodo.inicio.toLocaleDateString('pt-BR')} a ${data.periodo.fim.toLocaleDateString('pt-BR')}`)
    
    // Resumo
    exporter.addText('Resumo do Período')
    const totalAtividades = data.activities.length
    const concluidas = data.activities.filter(a => a.status === 'DONE').length
    const emAndamento = data.activities.filter(a => a.status === 'IN_PROGRESS').length
    const pendentes = data.activities.filter(a => a.status === 'PENDING').length
    
    exporter.addTable(
      ['Métrica', 'Quantidade'],
      [
        ['Total de Atividades', totalAtividades.toString()],
        ['Concluídas', concluidas.toString()],
        ['Em Andamento', emAndamento.toString()],
        ['Pendentes', pendentes.toString()]
      ]
    )
    
    // Detalhes das atividades
    exporter.addTitle('Detalhes das Atividades', 14)
    
    const atividadesTable = [
      ['Data', 'Tipo', 'Status', 'Responsável', 'Custo']
    ]
    
    data.activities.forEach(activity => {
      atividadesTable.push([
        new Date(activity.startDate).toLocaleDateString('pt-BR'),
        activity.type,
        activity.status,
        activity.assignedTo?.name || 'Não atribuído',
        activity.cost ? `R$ ${Number(activity.cost).toFixed(2)}` : 'N/A'
      ])
    })
    
    exporter.addTable(atividadesTable[0], atividadesTable.slice(1))
    
    // Adicionar rodapé
    const totalPages = exporter.doc.getCurrentPageInfo().pageNumber
    exporter.addFooter(1, totalPages)
    
    return exporter.generateBlob()
  }

  // Exportar relatório financeiro
  static async exportarFinanceiro(data: {
    property: any
    revenues: any[]
    costs: any[]
    periodo: { inicio: Date; fim: Date }
    usuario: string
  }) {
    const exporter = new PDFExporter()
    
    exporter.addTitle('Relatório Financeiro')
    exporter.addSubtitle(`${data.property.name} - ${data.periodo.inicio.toLocaleDateString('pt-BR')} a ${data.periodo.fim.toLocaleDateString('pt-BR')}`)
    
    // Resumo financeiro
    const totalReceitas = data.revenues.reduce((sum, r) => sum + Number(r.amount), 0)
    const totalCustos = data.costs.reduce((sum, c) => sum + Number(c.amount), 0)
    const margem = totalReceitas - totalCustos
    const margemPercentual = totalReceitas > 0 ? (margem / totalReceitas) * 100 : 0
    
    exporter.addText('Resumo Financeiro')
    exporter.addTable(
      ['Métrica', 'Valor'],
      [
        ['Total de Receitas', `R$ ${totalReceitas.toFixed(2)}`],
        ['Total de Custos', `R$ ${totalCustos.toFixed(2)}`],
        ['Margem Líquida', `R$ ${margem.toFixed(2)}`],
        ['Margem Percentual', `${margemPercentual.toFixed(1)}%`]
      ]
    )
    
    // Detalhes de receitas
    exporter.addTitle('Receitas', 14)
    const receitasTable = [['Data', 'Descrição', 'Categoria', 'Valor']]
    
    data.revenues.forEach(revenue => {
      receitasTable.push([
        new Date(revenue.date).toLocaleDateString('pt-BR'),
        revenue.description || 'Sem descrição',
        revenue.category,
        `R$ ${Number(revenue.amount).toFixed(2)}`
      ])
    })
    
    exporter.addTable(receitasTable[0], receitasTable.slice(1))
    
    // Detalhes de custos
    exporter.addTitle('Custos', 14)
    const custosTable = [['Data', 'Descrição', 'Categoria', 'Valor']]
    
    data.costs.forEach(cost => {
      custosTable.push([
        new Date(cost.date).toLocaleDateString('pt-BR'),
        cost.description || 'Sem descrição',
        cost.category,
        `R$ ${Number(cost.amount).toFixed(2)}`
      ])
    })
    
    exporter.addTable(custosTable[0], custosTable.slice(1))
    
    const totalPages = exporter.doc.getCurrentPageInfo().pageNumber
    exporter.addFooter(1, totalPages)
    
    return exporter.generateBlob()
  }

  // Exportar relatório de metas
  static async exportarMetas(data: {
    property: any
    goals: any[]
    usuario: string
  }) {
    const exporter = new PDFExporter()
    
    exporter.addTitle('Relatório de Metas')
    exporter.addSubtitle(`${data.property.name}`)
    
    // Visão geral das metas
    const totalMetas = data.goals.length
    const concluidas = data.goals.filter(g => g.isCompleted).length
    const emAndamento = data.goals.filter(g => !g.isCompleted && g.deadline && new Date(g.deadline) > new Date()).length
    const vencidas = data.goals.filter(g => !g.isCompleted && g.deadline && new Date(g.deadline) <= new Date()).length
    
    exporter.addText('Visão Geral das Metas')
    exporter.addTable(
      ['Status', 'Quantidade'],
      [
        ['Total de Metas', totalMetas.toString()],
        ['Concluídas', concluidas.toString()],
        ['Em Andamento', emAndamento.toString()],
        ['Vencidas', vencidas.toString()]
      ]
    )
    
    // Detalhes das metas
    exporter.addTitle('Detalhes das Metas', 14)
    const metasTable = [['Meta', 'Tipo', 'Alvo', 'Atual', 'Progresso', 'Prazo', 'Status']]
    
    data.goals.forEach(goal => {
      const progress = goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0
      const status = goal.isCompleted ? 'Concluída' : 
                   new Date(goal.deadline || '') <= new Date() ? 'Vencida' : 'Em Andamento'
      
      metasTable.push([
        goal.title,
        goal.type,
        goal.targetValue.toString(),
        goal.currentValue.toString(),
        `${progress.toFixed(1)}%`,
        goal.deadline ? new Date(goal.deadline).toLocaleDateString('pt-BR') : 'Sem prazo',
        status
      ])
    })
    
    exporter.addTable(metasTable[0], metasTable.slice(1))
    
    const totalPages = exporter.doc.getCurrentPageInfo().pageNumber
    exporter.addFooter(1, totalPages)
    
    return exporter.generateBlob()
  }
}

// ─── Função utilitária para download ─────────────────────────────────────────────

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ─── Exportação de elemento HTML para PDF ─────────────────────────────────────────

export async function exportElementToPDF(element: HTMLElement, filename: string) {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    })
    
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF()
    
    const imgWidth = 210
    const pageHeight = 295
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    
    let position = 0
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    
    pdf.save(filename)
  } catch (error) {
    console.error('Erro ao exportar elemento para PDF:', error)
    throw error
  }
}
