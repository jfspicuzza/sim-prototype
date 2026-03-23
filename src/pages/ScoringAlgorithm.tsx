import {
  Zap, Layers, BarChart3, Target, TrendingUp, Shield,
  FileCheck, Users2, Clock, ArrowRight, Sparkles, Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  SSI_CATEGORIES,
  TRCI_CATEGORIES,
  SOURCE_WEIGHTS,
  SOURCE_TYPE_LABELS,
  RECENCY_HALF_LIFE_DAYS,
  EVIDENCE_BOOST,
  CORROBORATION_MULTIPLIER,
  CONFIDENCE_CAP,
  STATE_LABELS,
  STATE_COLORS,
  TREND_LABELS,
  TREND_COLORS,
} from '@/lib/constants'
import type { SourceType, TrendDirection } from '@/lib/database.types'

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-gray-900 mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Pipeline Step
// ---------------------------------------------------------------------------

const PIPELINE_STEPS = [
  { icon: Zap, label: 'Signal Input', desc: 'Raw observation with base score (0–5)' },
  { icon: Target, label: 'Effective Score', desc: 'Weighted by source, evidence, recency' },
  { icon: Layers, label: 'Category Score', desc: 'Averaged per category with corroboration' },
  { icon: BarChart3, label: 'Index Value', desc: 'Weighted sum across all categories' },
  { icon: Shield, label: 'State (S0–S4)', desc: 'Threshold-based classification' },
  { icon: TrendingUp, label: 'Trend', desc: 'Delta from previous snapshot' },
]

function PipelineFlow() {
  return (
    <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-2">
      {PIPELINE_STEPS.map((step, i) => (
        <div key={step.label} className="flex items-center gap-2">
          <div className="bg-white border border-gray-200 rounded-xl p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow flex-shrink-0 w-full md:w-40">
            <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center mb-2.5">
              <step.icon className="w-5 h-5 text-brand-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{step.label}</p>
            <p className="text-xs text-gray-500 mt-1 leading-snug">{step.desc}</p>
          </div>
          {i < PIPELINE_STEPS.length - 1 && (
            <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0 hidden md:block" />
          )}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Category Weight Bars
// ---------------------------------------------------------------------------

function CategoryWeights({
  title,
  categories,
  accentColor,
  bgColor,
  borderColor,
}: {
  title: string
  categories: readonly { key: string; label: string; weight: number }[]
  accentColor: string
  bgColor: string
  borderColor: string
}) {
  const maxWeight = Math.max(...categories.map(c => c.weight))

  return (
    <div className={cn('rounded-xl border overflow-hidden', borderColor)}>
      <div className={cn('px-5 py-3', bgColor)}>
        <h3 className={cn('text-sm font-bold', accentColor)}>{title}</h3>
      </div>
      <div className="bg-white p-5 space-y-3">
        {categories.map(cat => (
          <div key={cat.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-700">{cat.label}</span>
              <span className="text-xs font-mono font-semibold text-gray-500">
                {(cat.weight * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-700', accentColor.replace('text-', 'bg-'))}
                style={{ width: `${(cat.weight / maxWeight) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Source Credibility Chart
// ---------------------------------------------------------------------------

function SourceCredibilityChart() {
  const entries = Object.entries(SOURCE_WEIGHTS) as [SourceType, number][]
  entries.sort((a, b) => b[1] - a[1])

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2.5">
      {entries.map(([key, weight]) => (
        <div key={key} className="flex items-center gap-3">
          <span className="text-sm text-gray-700 w-40 flex-shrink-0 truncate">
            {SOURCE_TYPE_LABELS[key]}
          </span>
          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                weight >= 0.9 ? 'bg-brand-700' :
                weight >= 0.8 ? 'bg-brand-600' :
                weight >= 0.7 ? 'bg-brand-500' :
                weight >= 0.5 ? 'bg-brand-400' : 'bg-brand-300'
              )}
              style={{ width: `${weight * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono font-semibold text-gray-500 w-10 text-right">
            {weight.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Multiplier Cards
// ---------------------------------------------------------------------------

function MultiplierCards() {
  const cards = [
    {
      icon: FileCheck,
      title: 'Evidence Boost',
      value: `${EVIDENCE_BOOST}x`,
      desc: 'Applied when a signal is flagged with supporting evidence or documentation.',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      iconColor: 'text-emerald-600',
    },
    {
      icon: Users2,
      title: 'Corroboration',
      value: `${CORROBORATION_MULTIPLIER}x`,
      desc: 'Applied when 2+ different source types report within the same category.',
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      iconColor: 'text-blue-600',
    },
    {
      icon: Clock,
      title: 'Recency Half-Life',
      value: `${RECENCY_HALF_LIFE_DAYS} days`,
      desc: 'Exponential decay — signals lose half their weight every 30 days.',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      iconColor: 'text-amber-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map(card => (
        <div key={card.title} className={cn('rounded-xl border p-5', card.color)}>
          <div className="flex items-center gap-2.5 mb-3">
            <card.icon className={cn('w-5 h-5', card.iconColor)} />
            <span className="text-sm font-bold">{card.title}</span>
          </div>
          <p className="text-2xl font-bold mb-2">{card.value}</p>
          <p className="text-xs leading-relaxed opacity-80">{card.desc}</p>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// State Thresholds Visualization
// ---------------------------------------------------------------------------

function StateThresholds() {
  const states = [
    { key: 'S0', ssiLabel: STATE_LABELS.S0, trciLabel: STATE_LABELS.C0, range: '0.0 – 0.9' },
    { key: 'S1', ssiLabel: STATE_LABELS.S1, trciLabel: STATE_LABELS.C1, range: '1.0 – 1.9' },
    { key: 'S2', ssiLabel: STATE_LABELS.S2, trciLabel: STATE_LABELS.C2, range: '2.0 – 2.9' },
    { key: 'S3', ssiLabel: STATE_LABELS.S3, trciLabel: STATE_LABELS.C3, range: '3.0 – 3.9' },
    { key: 'S4', ssiLabel: STATE_LABELS.S4, trciLabel: STATE_LABELS.C4, range: '4.0 – 5.0' },
  ]

  const bgColors: Record<string, string> = {
    S0: 'bg-green-500',
    S1: 'bg-blue-500',
    S2: 'bg-amber-500',
    S3: 'bg-orange-500',
    S4: 'bg-red-500',
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      {/* Color band */}
      <div className="flex rounded-lg overflow-hidden h-4 mb-4">
        {states.map(s => (
          <div key={s.key} className={cn('flex-1', bgColors[s.key])} />
        ))}
      </div>

      {/* Labels */}
      <div className="grid grid-cols-5 gap-2">
        {states.map(s => (
          <div key={s.key} className="text-center">
            <div className={cn('inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold mb-1.5', STATE_COLORS[s.key])}>
              {s.key}
            </div>
            <p className="text-xs font-medium text-gray-700">{s.ssiLabel}</p>
            <p className="text-xs text-gray-500">{s.trciLabel}</p>
            <p className="text-xs font-mono text-gray-400 mt-1">{s.range}</p>
          </div>
        ))}
      </div>

      {/* Scale labels */}
      <div className="flex justify-between mt-3 px-1">
        <span className="text-xs text-gray-400">0.0</span>
        <span className="text-xs text-gray-400">5.0</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Confidence Formula
// ---------------------------------------------------------------------------

function ConfidenceFormula() {
  const parts = [
    { label: 'Source Diversity', pct: 40, color: 'bg-brand-600', desc: 'Unique source types / 9 possible' },
    { label: 'Evidence Strength', pct: 30, color: 'bg-emerald-500', desc: 'Ratio of evidence-flagged signals' },
    { label: 'Signal Volume', pct: 30, color: 'bg-amber-500', desc: 'Active signals / 10 (capped at 1.0)' },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1">
          {/* Stacked bar */}
          <div className="flex rounded-lg overflow-hidden h-5">
            {parts.map(p => (
              <div key={p.label} className={cn('h-full', p.color)} style={{ width: `${p.pct}%` }} />
            ))}
          </div>
        </div>
        <div className="flex-shrink-0 bg-gray-100 rounded-lg px-3 py-1.5">
          <span className="text-xs text-gray-500">Cap: </span>
          <span className="text-sm font-bold text-gray-900">{CONFIDENCE_CAP}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {parts.map(p => (
          <div key={p.label} className="flex items-start gap-2.5">
            <div className={cn('w-3 h-3 rounded-sm mt-0.5 flex-shrink-0', p.color)} />
            <div>
              <p className="text-sm font-semibold text-gray-900">{p.label} <span className="font-mono text-gray-500">({p.pct}%)</span></p>
              <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Trend Detection
// ---------------------------------------------------------------------------

function TrendDetection() {
  const trends: { direction: TrendDirection; threshold: string; desc: string }[] = [
    { direction: 'rising_rapidly', threshold: '≥ +1.5', desc: 'Significant escalation from previous snapshot' },
    { direction: 'rising', threshold: '≥ +0.5', desc: 'Noticeable upward movement' },
    { direction: 'stable', threshold: '±0.5', desc: 'Within normal fluctuation range' },
    { direction: 'improving', threshold: '≤ −0.5', desc: 'Meaningful decrease from previous' },
  ]

  const bgMap: Record<TrendDirection, string> = {
    rising_rapidly: 'bg-red-50 border-red-200',
    rising: 'bg-amber-50 border-amber-200',
    stable: 'bg-gray-50 border-gray-200',
    improving: 'bg-green-50 border-green-200',
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {trends.map(t => (
        <div key={t.direction} className={cn('rounded-xl border p-4', bgMap[t.direction])}>
          <div className="flex items-center justify-between mb-2">
            <span className={cn('text-sm font-bold', TREND_COLORS[t.direction])}>
              {TREND_LABELS[t.direction]}
            </span>
            <span className={cn('text-lg font-mono font-bold', TREND_COLORS[t.direction])}>
              {t.threshold}
            </span>
          </div>
          <p className="text-xs text-gray-600">{t.desc}</p>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Formula Card
// ---------------------------------------------------------------------------

function FormulaCard() {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white">
      <div className="flex items-center gap-2 mb-4">
        <Info className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">Core Formula</span>
      </div>
      <div className="font-mono text-sm space-y-2">
        <p>
          <span className="text-brand-300">effective_score</span>
          <span className="text-gray-500"> = </span>
          <span className="text-white">base_score</span>
          <span className="text-gray-500"> × </span>
          <span className="text-emerald-400">source_weight</span>
          <span className="text-gray-500"> × </span>
          <span className="text-amber-400">evidence_boost</span>
          <span className="text-gray-500"> × </span>
          <span className="text-purple-400">recency_decay</span>
        </p>
        <p className="text-gray-500 text-xs mt-1">
          where recency_decay = 0.5 ^ (days_since / {RECENCY_HALF_LIFE_DAYS})
        </p>
        <div className="border-t border-gray-700 my-3" />
        <p>
          <span className="text-brand-300">category_score</span>
          <span className="text-gray-500"> = </span>
          <span className="text-white">avg(effective_scores)</span>
          <span className="text-gray-500"> × </span>
          <span className="text-blue-400">corroboration</span>
        </p>
        <div className="border-t border-gray-700 my-3" />
        <p>
          <span className="text-brand-300">index_value</span>
          <span className="text-gray-500"> = </span>
          <span className="text-white">Σ (category_score × category_weight)</span>
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ScoringAlgorithm() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <Sparkles className="w-5 h-5 text-brand-600" />
          <h1 className="text-xl font-bold text-gray-900">Scoring Algorithm</h1>
        </div>
        <p className="text-sm text-gray-500">
          How SIM 2.0 transforms raw behavioral signals into actionable safety indices.
        </p>
      </div>

      {/* Pipeline */}
      <Section title="Computation Pipeline" subtitle="Each signal flows through six stages to produce a final state and trend.">
        <PipelineFlow />
      </Section>

      {/* Formula */}
      <Section title="Scoring Formulas">
        <FormulaCard />
      </Section>

      {/* Dual Index Cards */}
      <Section title="Index Categories & Weights" subtitle="Each index is a weighted sum of its category scores. Weights reflect relative importance.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CategoryWeights
            title="SSI — Student Safety Index"
            categories={SSI_CATEGORIES}
            accentColor="text-brand-700"
            bgColor="bg-brand-50"
            borderColor="border-brand-200"
          />
          <CategoryWeights
            title="TRCI — Threat Risk & Concern Index"
            categories={TRCI_CATEGORIES}
            accentColor="text-red-700"
            bgColor="bg-red-50"
            borderColor="border-red-200"
          />
        </div>
      </Section>

      {/* Source Credibility */}
      <Section title="Source Credibility Weights" subtitle="Higher-authority sources produce stronger signal scores.">
        <SourceCredibilityChart />
      </Section>

      {/* Multipliers */}
      <Section title="Scoring Multipliers" subtitle="Additional factors that amplify or decay signal strength.">
        <MultiplierCards />
      </Section>

      {/* State Thresholds */}
      <Section title="State Thresholds" subtitle="Index values map to discrete states on a 0–5 scale.">
        <StateThresholds />
      </Section>

      {/* Confidence */}
      <Section title="Confidence Score" subtitle="How much to trust the current indices, based on data quality and volume.">
        <ConfidenceFormula />
      </Section>

      {/* Trend Detection */}
      <Section title="Trend Detection" subtitle="Compares current index value to previous snapshot to determine direction.">
        <TrendDetection />
      </Section>
    </div>
  )
}
