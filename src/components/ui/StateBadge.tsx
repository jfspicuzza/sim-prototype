import { STATE_COLORS, STATE_LABELS } from '@/lib/constants'
import { cn } from '@/lib/utils'

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
} as const

type StateBadgeProps = {
  state: string
  size?: 'sm' | 'md'
}

export function StateBadge({ state, size = 'sm' }: StateBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        STATE_COLORS[state],
        SIZE_CLASSES[size],
      )}
    >
      {state} &mdash; {STATE_LABELS[state]}
    </span>
  )
}
