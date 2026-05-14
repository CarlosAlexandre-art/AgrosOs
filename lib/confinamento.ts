// Cálculos zootécnicos para confinamento bovino (padrões BR — Nelore/cruzado)

export interface DadosLote {
  pesoMedioEntrada: number      // kg
  pesoAtual: number             // kg
  diasConfinamento: number
  consumoRacaoKgTotal: number   // kg MS acumulado
  custoTotalReais: number
  cabecas: number
  pesoMetaAbate?: number        // kg meta (default 480)
}

export interface KpisLote {
  gmd: number                   // kg/dia — Ganho Médio Diário
  conversaoAlimentar: number    // kg MS / kg ganho — ideal 6–8
  eficienciaAlimentar: number   // kg ganho / kg MS
  custoArroba: number           // R$/@ produzida
  arrobasProduzidasLote: number
  diasRestantesAbate: number
  dataPrevisaoAbate: Date | null
  margemEstimadaReais: number   // simplificada (sem cotação externa)
  scorePerformance: number      // 0–100
  alertas: string[]
}

// Benchmarks BR (Nelore confinamento — médias da indústria)
const BENCHMARK = {
  gmd_min: 0.8,
  gmd_ideal: 1.3,
  ca_ideal: 7.0,
  ca_max: 10.0,
  peso_abate_padrao: 480,
  arrobas_por_kg: 1 / 15,      // 1 @ = 15 kg peso vivo
  preco_arroba_referencia: 320, // R$/@ (fallback sem cotação real)
}

export function calcularKpisLote(d: DadosLote): KpisLote {
  const pesoMeta = d.pesoMetaAbate ?? BENCHMARK.peso_abate_padrao
  const ganhoTotal = d.pesoAtual - d.pesoMedioEntrada
  const alertas: string[] = []

  const gmd = d.diasConfinamento > 0 ? ganhoTotal / d.diasConfinamento : 0
  const conversaoAlimentar = ganhoTotal > 0 ? d.consumoRacaoKgTotal / (ganhoTotal * d.cabecas) : 0
  const eficienciaAlimentar = conversaoAlimentar > 0 ? 1 / conversaoAlimentar : 0

  const arrobasProduzidasLote = (ganhoTotal * d.cabecas) * BENCHMARK.arrobas_por_kg
  const custoArroba = arrobasProduzidasLote > 0 ? d.custoTotalReais / arrobasProduzidasLote : 0

  const diasRestantesAbate = gmd > 0 ? Math.ceil((pesoMeta - d.pesoAtual) / gmd) : 999
  const dataPrevisaoAbate = gmd > 0 && diasRestantesAbate < 365
    ? new Date(Date.now() + diasRestantesAbate * 86_400_000)
    : null

  const receitaEstimada = arrobasProduzidasLote * BENCHMARK.preco_arroba_referencia
  const margemEstimadaReais = receitaEstimada - d.custoTotalReais

  // Score 0–100
  let score = 60
  if (gmd >= BENCHMARK.gmd_ideal) score += 20
  else if (gmd >= BENCHMARK.gmd_min) score += 10
  else { score -= 15; alertas.push('GMD abaixo do mínimo esperado para a raça') }

  if (conversaoAlimentar > 0 && conversaoAlimentar <= BENCHMARK.ca_ideal) score += 15
  else if (conversaoAlimentar > BENCHMARK.ca_max) { score -= 15; alertas.push('Conversão alimentar alta — revisar formulação') }

  if (margemEstimadaReais > 0) score += 5
  else alertas.push('Margem estimada negativa — revisar custos')

  if (diasRestantesAbate < 10 && diasRestantesAbate > 0)
    alertas.push(`Lote próximo do peso de abate (${diasRestantesAbate} dias)`)

  return {
    gmd: +gmd.toFixed(3),
    conversaoAlimentar: +conversaoAlimentar.toFixed(2),
    eficienciaAlimentar: +eficienciaAlimentar.toFixed(3),
    custoArroba: +custoArroba.toFixed(2),
    arrobasProduzidasLote: +arrobasProduzidasLote.toFixed(1),
    diasRestantesAbate,
    dataPrevisaoAbate,
    margemEstimadaReais: +margemEstimadaReais.toFixed(2),
    scorePerformance: Math.max(0, Math.min(100, score)),
    alertas,
  }
}

export function calcularTendenciaPeso(registros: { data: Date; pesoMedio: number }[]): {
  tendencia: 'subindo' | 'estavel' | 'caindo'
  gmdUltimos7d: number
} {
  if (registros.length < 2) return { tendencia: 'estavel', gmdUltimos7d: 0 }

  const sorted = [...registros].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
  const recentes = sorted.slice(-7)

  if (recentes.length < 2) return { tendencia: 'estavel', gmdUltimos7d: 0 }

  const primeiro = recentes[0]
  const ultimo = recentes[recentes.length - 1]
  const dias = (new Date(ultimo.data).getTime() - new Date(primeiro.data).getTime()) / 86_400_000
  const gmd7d = dias > 0 ? (ultimo.pesoMedio - primeiro.pesoMedio) / dias : 0

  return {
    tendencia: gmd7d > 0.3 ? 'subindo' : gmd7d < -0.1 ? 'caindo' : 'estavel',
    gmdUltimos7d: +gmd7d.toFixed(3),
  }
}
