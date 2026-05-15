import QRCode from 'qrcode'

export interface DadosPassaporte {
  animalId: string
  identificacao: string
  sisbovId?: string | null
  raca?: string | null
  sexo: string
  dataNascimento?: Date | null
  pesoAtual?: number | null
  origemFazenda?: string | null
  propriedadeNome: string
  saude: Array<{ tipo: string; descricao: string; produto?: string | null; dataRegistro: Date }>
  movimentos: Array<{ tipo: string; origem?: string | null; destino?: string | null; data: Date; gta?: string | null }>
}

export async function gerarQrCodeDataUrl(animalId: string, baseUrl = ''): Promise<string> {
  const url = `${baseUrl}/passaporte/${animalId}`
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })
}

export async function gerarQrCodeBuffer(animalId: string, baseUrl = ''): Promise<Buffer> {
  const url = `${baseUrl}/passaporte/${animalId}`
  return QRCode.toBuffer(url, {
    width: 400,
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })
}

export function calcularIdadeTexto(dataNascimento?: Date | null): string {
  if (!dataNascimento) return 'Não informada'
  const meses = Math.floor(
    (Date.now() - new Date(dataNascimento).getTime()) / (30.44 * 86_400_000)
  )
  if (meses < 12) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
  const anos = Math.floor(meses / 12)
  const rest = meses % 12
  return rest > 0 ? `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${rest} ${rest === 1 ? 'mês' : 'meses'}` : `${anos} ${anos === 1 ? 'ano' : 'anos'}`
}

export function resumoSaude(saude: DadosPassaporte['saude']): {
  totalVacinas: number
  totalMedicacoes: number
  ultimaOcorrencia: Date | null
} {
  return {
    totalVacinas: saude.filter(s => s.tipo === 'VACINA').length,
    totalMedicacoes: saude.filter(s => s.tipo === 'MEDICACAO').length,
    ultimaOcorrencia: saude.length > 0
      ? new Date(Math.max(...saude.map(s => new Date(s.dataRegistro).getTime())))
      : null,
  }
}
