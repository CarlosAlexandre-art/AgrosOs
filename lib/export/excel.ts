import * as XLSX from 'xlsx'

function autoWidth(ws: XLSX.WorkSheet, data: Record<string, unknown>[]) {
  if (!data.length) return
  const cols = Object.keys(data[0])
  ws['!cols'] = cols.map(col => ({
    wch: Math.max(col.length + 2, ...data.map(row => String(row[col] ?? '').length + 2)),
  }))
}

export function exportFinanceiroExcel(data: {
  propertyName: string
  costs: { category: string; description?: string | null; amount: number; date: string }[]
  totalGeral: number
}) {
  const catLabels: Record<string, string> = {
    INSUMO: 'Insumo', MAO_DE_OBRA: 'Mão de obra', MAQUINARIO: 'Maquinário', AGROLINK: 'AgroCore', OUTROS: 'Outros',
  }

  const rows = data.costs.map(c => ({
    'Data': new Date(c.date).toLocaleDateString('pt-BR'),
    'Categoria': catLabels[c.category] || c.category,
    'Descrição': c.description || '',
    'Valor (R$)': Number(c.amount).toFixed(2),
  }))

  rows.push({ 'Data': '', 'Categoria': '', 'Descrição': 'TOTAL GERAL', 'Valor (R$)': data.totalGeral.toFixed(2) })

  const ws = XLSX.utils.json_to_sheet(rows)
  autoWidth(ws, rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Financeiro')
  XLSX.writeFile(wb, `SmartAgroOS-Financeiro-${data.propertyName.replace(/\s/g, '_')}.xlsx`)
}

export function exportOperacoesExcel(data: {
  propertyName: string
  activities: { type: string; status: string; startDate: string; endDate?: string | null; description?: string | null; executor: string }[]
}) {
  const statusLabel: Record<string, string> = {
    PENDING: 'Pendente', IN_PROGRESS: 'Em andamento', DONE: 'Concluído', LATE: 'Atrasado', CANCELLED: 'Cancelado',
  }

  const rows = data.activities.map(a => ({
    'Tipo': a.type,
    'Status': statusLabel[a.status] || a.status,
    'Executor': a.executor === 'INTERNAL' ? 'Interno' : 'AgroCore',
    'Data Início': new Date(a.startDate).toLocaleDateString('pt-BR'),
    'Data Fim': a.endDate ? new Date(a.endDate).toLocaleDateString('pt-BR') : '',
    'Descrição': a.description || '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  autoWidth(ws, rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Operações')
  XLSX.writeFile(wb, `SmartAgroOS-Operacoes-${data.propertyName.replace(/\s/g, '_')}.xlsx`)
}

export function exportMetasExcel(data: {
  propertyName: string
  goals: { title: string; type: string; targetValue: number; currentValue: number; isCompleted: boolean; deadline?: string | null }[]
}) {
  const rows = data.goals.map(g => {
    const pct = g.targetValue > 0 ? ((g.currentValue / g.targetValue) * 100).toFixed(1) : '0'
    return {
      'Meta': g.title,
      'Tipo': g.type,
      'Valor Alvo': g.targetValue,
      'Valor Atual': g.currentValue,
      'Progresso (%)': pct,
      'Status': g.isCompleted ? 'Concluída' : 'Em andamento',
      'Prazo': g.deadline ? new Date(g.deadline).toLocaleDateString('pt-BR') : '',
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  autoWidth(ws, rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Metas')
  XLSX.writeFile(wb, `SmartAgroOS-Metas-${data.propertyName.replace(/\s/g, '_')}.xlsx`)
}

export function exportPropriedadeExcel(data: {
  property: { name: string; location?: string | null; sizeHectares: number }
  fields: { name: string; sizeHectares: number; crop?: { name: string } | null }[]
  team: { name: string; role: string; phone?: string | null }[]
}) {
  const wb = XLSX.utils.book_new()

  // Aba talhões
  const fieldRows = data.fields.map(f => ({
    'Talhão': f.name,
    'Área (ha)': Number(f.sizeHectares),
    'Cultura': f.crop?.name || '',
  }))
  const wsFields = XLSX.utils.json_to_sheet(fieldRows)
  autoWidth(wsFields, fieldRows)
  XLSX.utils.book_append_sheet(wb, wsFields, 'Talhões')

  // Aba equipe
  const teamRows = data.team.map(m => ({
    'Nome': m.name,
    'Função': m.role,
    'Telefone': m.phone || '',
  }))
  const wsTeam = XLSX.utils.json_to_sheet(teamRows)
  autoWidth(wsTeam, teamRows)
  XLSX.utils.book_append_sheet(wb, wsTeam, 'Equipe')

  XLSX.writeFile(wb, `SmartAgroOS-Propriedade-${data.property.name.replace(/\s/g, '_')}.xlsx`)
}
