import type { Signal, Snapshot, TopDriver, ThresholdEvent } from './database.types'
import type { SSIState, TRCIState, TrendDirection, IndexType, SourceType } from './database.types'
import {
  SSI_CATEGORIES,
  TRCI_CATEGORIES,
  SOURCE_WEIGHTS,
  RECENCY_HALF_LIFE_DAYS,
  EVIDENCE_BOOST,
  CORROBORATION_MULTIPLIER,
  CONFIDENCE_CAP,
  SSI_THRESHOLDS,
  TRCI_THRESHOLDS,
  TREND_THRESHOLDS,
  STATE_LABELS,
} from './constants'

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export type SignalScoreResult = {
  effectiveScore: number
  sourceWeight: number
  recencyFactor: number
  evidenceBoost: number
}

export type CategoryScoreResult = {
  category: string
  indexType: IndexType
  score: number
  signalCount: number
}

export type ExplanationResult = {
  topDrivers: TopDriver[]
  thresholdEvents: ThresholdEvent[]
  summaryText: string
  expandedText: string
}

export type FullSnapshotResult = {
  ssiValue: number
  ssiState: SSIState
  trciValue: number
  trciState: TRCIState
  ssiTrend: TrendDirection
  trciTrend: TrendDirection
  confidence: number
  categoryScores: CategoryScoreResult[]
  explanation: ExplanationResult
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysBetween(a: Date, b: Date): number {
  const ms = Math.abs(a.getTime() - b.getTime())
  return ms / (1000 * 60 * 60 * 24)
}

// ---------------------------------------------------------------------------
// 1. calculateSignalScore
// ---------------------------------------------------------------------------

export function calculateSignalScore(
  signal: Signal,
  now: Date,
): SignalScoreResult {
  const sourceWeight = SOURCE_WEIGHTS[signal.source_type as SourceType]
  const evidenceBoost = signal.evidence_flag ? EVIDENCE_BOOST : 1.0
  const daysSince = daysBetween(now, new Date(signal.created_at))
  const recencyFactor = Math.pow(0.5, daysSince / RECENCY_HALF_LIFE_DAYS)
  const effectiveScore = Math.min(
    5.0,
    signal.base_score * sourceWeight * evidenceBoost * recencyFactor,
  )

  return { effectiveScore, sourceWeight, recencyFactor, evidenceBoost }
}

// ---------------------------------------------------------------------------
// 2. aggregateCategoryScores
// ---------------------------------------------------------------------------

export function aggregateCategoryScores(
  signals: Signal[],
  now: Date,
): CategoryScoreResult[] {
  const groups = new Map<
    string,
    { signals: Signal[]; indexType: IndexType }
  >()

  for (const signal of signals) {
    if (!signal.is_active) continue
    const key = `${signal.category}::${signal.index_type}`
    const existing = groups.get(key)
    if (existing) {
      existing.signals.push(signal)
    } else {
      groups.set(key, {
        signals: [signal],
        indexType: signal.index_type as IndexType,
      })
    }
  }

  const results: CategoryScoreResult[] = []

  for (const [key, group] of groups) {
    const category = key.split('::')[0]

    // Compute effective scores
    const effectiveScores = group.signals.map(
      (s) => calculateSignalScore(s, now).effectiveScore,
    )

    // Weighted average (equal weights = simple average)
    const avg =
      effectiveScores.reduce((sum, s) => sum + s, 0) / effectiveScores.length

    // Corroboration: 2+ distinct source_types
    const distinctSources = new Set(group.signals.map((s) => s.source_type))
    const corroboration =
      distinctSources.size >= 2 ? CORROBORATION_MULTIPLIER : 1.0

    const score = Math.min(5.0, avg * corroboration)

    results.push({
      category,
      indexType: group.indexType,
      score,
      signalCount: group.signals.length,
    })
  }

  return results
}

// ---------------------------------------------------------------------------
// 3. computeSSI
// ---------------------------------------------------------------------------

export function computeSSI(categoryScores: CategoryScoreResult[]): number {
  const ssiKeys = new Set<string>(SSI_CATEGORIES.map((c) => c.key))
  let total = 0

  for (const cs of categoryScores) {
    if (cs.indexType !== 'SSI') continue
    if (!ssiKeys.has(cs.category)) continue
    const cat = SSI_CATEGORIES.find((c) => c.key === cs.category)
    if (cat) {
      total += cs.score * cat.weight
    }
  }

  return total
}

// ---------------------------------------------------------------------------
// 4. computeTRCI
// ---------------------------------------------------------------------------

export function computeTRCI(categoryScores: CategoryScoreResult[]): number {
  const trciKeys = new Set<string>(TRCI_CATEGORIES.map((c) => c.key))
  let total = 0

  for (const cs of categoryScores) {
    if (cs.indexType !== 'TRCI') continue
    if (!trciKeys.has(cs.category)) continue
    const cat = TRCI_CATEGORIES.find((c) => c.key === cs.category)
    if (cat) {
      total += cs.score * cat.weight
    }
  }

  return total
}

// ---------------------------------------------------------------------------
// 5. determineSSIState
// ---------------------------------------------------------------------------

export function determineSSIState(value: number): SSIState {
  for (const threshold of SSI_THRESHOLDS) {
    if (value >= threshold.min) {
      return threshold.state
    }
  }
  // Fallback to last threshold (lowest)
  return SSI_THRESHOLDS[SSI_THRESHOLDS.length - 1].state
}

// ---------------------------------------------------------------------------
// 6. determineTRCIState
// ---------------------------------------------------------------------------

export function determineTRCIState(value: number): TRCIState {
  for (const threshold of TRCI_THRESHOLDS) {
    if (value >= threshold.min) {
      return threshold.state
    }
  }
  return TRCI_THRESHOLDS[TRCI_THRESHOLDS.length - 1].state
}

// ---------------------------------------------------------------------------
// 7. computeTrend
// ---------------------------------------------------------------------------

export function computeTrend(
  current: number,
  previous: number | null,
): TrendDirection {
  if (previous === null) return 'stable'

  const delta = current - previous

  for (const threshold of TREND_THRESHOLDS) {
    if (threshold.direction === 'stable') continue
    if (threshold.direction === 'improving') {
      if (delta <= threshold.minDelta) return 'improving'
    } else {
      if (delta >= threshold.minDelta) return threshold.direction
    }
  }
  return 'stable'
}

// ---------------------------------------------------------------------------
// 8. computeConfidence
// ---------------------------------------------------------------------------

export function computeConfidence(signals: Signal[]): number {
  if (signals.length === 0) return 0

  const activeSignals = signals.filter((s) => s.is_active)
  if (activeSignals.length === 0) return 0

  const uniqueSourceTypes = new Set(activeSignals.map((s) => s.source_type))
  const sourceDiversity = uniqueSourceTypes.size / 9

  const evidenceCount = activeSignals.filter((s) => s.evidence_flag).length
  const evidenceStrength = evidenceCount / activeSignals.length

  const signalVolume = Math.min(activeSignals.length / 10, 1.0)

  const confidence =
    sourceDiversity * 0.4 + evidenceStrength * 0.3 + signalVolume * 0.3

  return Math.min(confidence, CONFIDENCE_CAP)
}

// ---------------------------------------------------------------------------
// 9. generateExplanation
// ---------------------------------------------------------------------------

export function generateExplanation(
  ssiValue: number,
  trciValue: number,
  ssiState: SSIState,
  trciState: TRCIState,
  categoryScores: CategoryScoreResult[],
  previousSnapshot: Snapshot | null,
): ExplanationResult {
  // --- Top Drivers ---
  const drivers: TopDriver[] = []

  for (const cs of categoryScores) {
    let weight = 0
    let label = cs.category

    if (cs.indexType === 'SSI') {
      const cat = SSI_CATEGORIES.find((c) => c.key === cs.category)
      if (cat) {
        weight = cat.weight
        label = cat.label
      }
    } else {
      const cat = TRCI_CATEGORIES.find((c) => c.key === cs.category)
      if (cat) {
        weight = cat.weight
        label = cat.label
      }
    }

    const contribution = cs.score * weight
    const denominator = cs.indexType === 'SSI' ? ssiValue : trciValue
    const contribution_pct =
      denominator > 0 ? (contribution / denominator) * 100 : 0

    drivers.push({
      category: cs.category,
      index_type: cs.indexType,
      contribution_pct,
      score: cs.score,
      label,
    })
  }

  drivers.sort((a, b) => b.contribution_pct - a.contribution_pct)
  const topDrivers = drivers.slice(0, 5)

  // --- Threshold Events ---
  const thresholdEvents: ThresholdEvent[] = []

  if (previousSnapshot) {
    if (previousSnapshot.ssi_state !== ssiState) {
      const ssiLabel = STATE_LABELS[ssiState] ?? ssiState
      const prevSsiLabel =
        STATE_LABELS[previousSnapshot.ssi_state] ?? previousSnapshot.ssi_state
      thresholdEvents.push({
        index_type: 'SSI',
        previous_state: previousSnapshot.ssi_state,
        new_state: ssiState,
        direction: ssiValue > previousSnapshot.ssi_value ? 'up' : 'down',
        label: `SSI moved from ${prevSsiLabel} to ${ssiLabel}`,
      })
    }

    if (previousSnapshot.trci_state !== trciState) {
      const trciLabel = STATE_LABELS[trciState] ?? trciState
      const prevTrciLabel =
        STATE_LABELS[previousSnapshot.trci_state] ?? previousSnapshot.trci_state
      thresholdEvents.push({
        index_type: 'TRCI',
        previous_state: previousSnapshot.trci_state,
        new_state: trciState,
        direction: trciValue > previousSnapshot.trci_value ? 'up' : 'down',
        label: `TRCI moved from ${prevTrciLabel} to ${trciLabel}`,
      })
    }
  }

  // --- Summary Text ---
  const ssiStateLabel = STATE_LABELS[ssiState] ?? ssiState
  const trciStateLabel = STATE_LABELS[trciState] ?? trciState

  let summaryText = `SSI at ${ssiState} (${ssiStateLabel}) \u2014 ${ssiValue.toFixed(1)}. TRCI at ${trciState} (${trciStateLabel}) \u2014 ${trciValue.toFixed(1)}.`

  if (topDrivers.length > 0) {
    summaryText += ` Primary driver: ${topDrivers[0].label} (${topDrivers[0].contribution_pct.toFixed(0)}%).`
  }

  // --- Expanded Text ---
  const lines: string[] = []
  for (const cs of categoryScores) {
    let label = cs.category
    if (cs.indexType === 'SSI') {
      const cat = SSI_CATEGORIES.find((c) => c.key === cs.category)
      if (cat) label = cat.label
    } else {
      const cat = TRCI_CATEGORIES.find((c) => c.key === cs.category)
      if (cat) label = cat.label
    }
    lines.push(
      `${cs.indexType} > ${label}: ${cs.score.toFixed(2)} (${cs.signalCount} signal${cs.signalCount === 1 ? '' : 's'})`,
    )
  }
  const expandedText = lines.join('\n')

  return { topDrivers, thresholdEvents, summaryText, expandedText }
}

// ---------------------------------------------------------------------------
// 10. computeFullSnapshot
// ---------------------------------------------------------------------------

export function computeFullSnapshot(
  signals: Signal[],
  previousSnapshot: Snapshot | null,
  now: Date,
): FullSnapshotResult {
  const categoryScores = aggregateCategoryScores(signals, now)

  const ssiValue = computeSSI(categoryScores)
  const trciValue = computeTRCI(categoryScores)

  const ssiState = determineSSIState(ssiValue)
  const trciState = determineTRCIState(trciValue)

  const ssiTrend = computeTrend(
    ssiValue,
    previousSnapshot?.ssi_value ?? null,
  )
  const trciTrend = computeTrend(
    trciValue,
    previousSnapshot?.trci_value ?? null,
  )

  const confidence = computeConfidence(signals)

  const explanation = generateExplanation(
    ssiValue,
    trciValue,
    ssiState,
    trciState,
    categoryScores,
    previousSnapshot,
  )

  return {
    ssiValue,
    ssiState,
    trciValue,
    trciState,
    ssiTrend,
    trciTrend,
    confidence,
    categoryScores,
    explanation,
  }
}
