import type { TrendDirection } from '@/lib/database.types'

import { ChevronsUp, Minus, TrendingDown, TrendingUp } from 'lucide-react'

import { TREND_COLORS, TREND_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'

const TREND_ICONS: Record<TrendDirection, React.ComponentType<{ className?: string }>> = {
  rising_rapidly: ChevronsUp,
  rising: TrendingUp,
  stable: Minus,
  improving: TrendingDown,
}

type TrendIndicatorProps = {
  trend: TrendDirection
  showLabel?: boolean
}

export function TrendIndicator({ trend, showLabel = true }: TrendIndicatorProps) {
  const Icon = TREND_ICONS[trend]

  return (
    <span className={cn('inline-flex items-center gap-1 text-sm', TREND_COLORS[trend])}>
      <Icon className="w-4 h-4" />
      {showLabel && TREND_LABELS[trend]}
    </span>
  )
}
