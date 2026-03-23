const GAUGE_COLORS: Record<string, string> = {
  S0: 'bg-green-500',
  S1: 'bg-blue-500',
  S2: 'bg-amber-500',
  S3: 'bg-orange-500',
  S4: 'bg-red-500',
  C0: 'bg-green-500',
  C1: 'bg-blue-500',
  C2: 'bg-amber-500',
  C3: 'bg-orange-500',
  C4: 'bg-red-500',
}

type ScoreGaugeProps = {
  value: number
  state: string
  label?: string
}

export function ScoreGauge({ value, state, label }: ScoreGaugeProps) {
  const fillPct = (value / 5) * 100

  return (
    <div className="space-y-1">
      {label && (
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
      )}
      <div className="text-lg font-semibold tabular-nums text-gray-900">
        {value.toFixed(1)} <span className="text-sm font-normal text-gray-400">/ 5.0</span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${GAUGE_COLORS[state] ?? 'bg-gray-400'}`}
          style={{ width: `${Math.min(fillPct, 100)}%` }}
        />
      </div>
    </div>
  )
}
