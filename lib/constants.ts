export const ACTIVITY_STATUS: Record<string, { label: string; dot: string; pill: string }> = {
  PENDING:     { label: 'Pendente',     dot: 'bg-yellow-400', pill: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  IN_PROGRESS: { label: 'Em andamento', dot: 'bg-blue-400',   pill: 'bg-blue-50 text-blue-700 border-blue-200' },
  DONE:        { label: 'Concluído',    dot: 'bg-green-500',  pill: 'bg-green-50 text-green-700 border-green-200' },
  LATE:        { label: 'Atrasado',     dot: 'bg-red-500',    pill: 'bg-red-50 text-red-700 border-red-200' },
  CANCELLED:   { label: 'Cancelado',    dot: 'bg-gray-400',   pill: 'bg-gray-50 text-gray-600 border-gray-200' },
}
