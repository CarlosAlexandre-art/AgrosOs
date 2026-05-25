/**
 * Quantum-Inspired QUBO Solver — Simulated Annealing
 * Solves the same class of optimization problems as D-Wave hardware.
 * For N phases × M members, finds minimum-energy assignment in O(N×M×iter).
 */

export interface Phase {
  index: number
  tipo: string
  inicio_dia: number
  duracao_dias: number
  prioridade: 'alta' | 'media' | 'baixa'
}

export interface Member {
  id: string
  name: string
  role: string
  currentLoad: number        // active tasks right now
  completionRate: number     // 0-1, historical
  specializations: string[]  // types done most
}

export interface Assignment {
  phaseIndex: number
  memberId: string
  memberName: string
  energyContribution: number
}

export interface QUBOResult {
  assignments: Assignment[]
  totalEnergy: number
  iterations: number
  temperature: number
  convergence: number  // 0-100, how confident
}

function phasesOverlap(a: Phase, b: Phase): boolean {
  const aEnd = a.inicio_dia + a.duracao_dias
  const bEnd = b.inicio_dia + b.duracao_dias
  return a.inicio_dia < bEnd && b.inicio_dia < aEnd
}

function specializationScore(tipo: string, member: Member): number {
  return member.specializations.some(s =>
    s.toLowerCase().includes(tipo.toLowerCase()) ||
    tipo.toLowerCase().includes(s.toLowerCase())
  ) ? 1.0 : 0.0
}

function calcEnergy(
  assignment: number[],  // assignment[phaseIdx] = memberIdx
  phases: Phase[],
  members: Member[]
): number {
  let energy = 0

  for (let p = 0; p < phases.length; p++) {
    const m = members[assignment[p]]

    // Cost: penalize overloaded members
    energy += m.currentLoad * 0.4

    // Cost: penalize low completion rate
    energy += (1 - m.completionRate) * 2.0

    // Reward: specialization match (negative energy = better)
    energy -= specializationScore(phases[p].tipo, m) * 1.5

    // Reward: high priority phases assigned to best performers
    if (phases[p].prioridade === 'alta') {
      energy -= m.completionRate * 1.0
    }

    // Penalty: same member assigned to overlapping phases (conflict)
    for (let q = p + 1; q < phases.length; q++) {
      if (assignment[p] === assignment[q] && phasesOverlap(phases[p], phases[q])) {
        energy += 5.0
      }
    }
  }

  return energy
}

export function solveQUBO(phases: Phase[], members: Member[]): QUBOResult {
  if (members.length === 0) {
    return {
      assignments: phases.map(p => ({ phaseIndex: p.index, memberId: '', memberName: 'Não atribuído', energyContribution: 0 })),
      totalEnergy: 0,
      iterations: 0,
      temperature: 0,
      convergence: 0,
    }
  }

  // Initial random assignment
  let current = phases.map(() => Math.floor(Math.random() * members.length))
  let currentE = calcEnergy(current, phases, members)
  let best = [...current]
  let bestE = currentE

  // SA parameters (tuned for N ≤ 50 phases, M ≤ 20 members)
  let T = 10.0
  const T_MIN = 0.01
  const COOLING = 0.92
  const ITER_PER_T = Math.max(50, phases.length * members.length)
  let totalIter = 0

  while (T > T_MIN) {
    for (let i = 0; i < ITER_PER_T; i++) {
      // Propose move: reassign one random phase to a random member
      const p = Math.floor(Math.random() * phases.length)
      const newM = Math.floor(Math.random() * members.length)
      const prev = current[p]
      current[p] = newM

      const newE = calcEnergy(current, phases, members)
      const dE = newE - currentE

      if (dE < 0 || Math.random() < Math.exp(-dE / T)) {
        currentE = newE
        if (currentE < bestE) {
          best = [...current]
          bestE = currentE
        }
      } else {
        current[p] = prev
      }
      totalIter++
    }
    T *= COOLING
  }

  const assignments: Assignment[] = phases.map((phase, i) => {
    const m = members[best[i]]
    return {
      phaseIndex: phase.index,
      memberId: m.id,
      memberName: m.name,
      energyContribution: Math.round(calcEnergy([0], [phase], [m]) * 100) / 100,
    }
  })

  // Convergence: 100 = no conflicts, lower = has overlaps
  const conflicts = phases.filter((p, i) =>
    phases.some((q, j) => i !== j && best[i] === best[j] && phasesOverlap(p, q))
  ).length
  const convergence = Math.max(0, Math.round(100 - (conflicts / phases.length) * 100))

  return {
    assignments,
    totalEnergy: Math.round(bestE * 100) / 100,
    iterations: totalIter,
    temperature: Math.round(T * 1000) / 1000,
    convergence,
  }
}
