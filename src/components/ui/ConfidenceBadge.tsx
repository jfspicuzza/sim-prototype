import { cn } from '@/lib/utils'

const CONFIDENCE_STYLES: { min: number; label: string; classes: string }[] = [
  { min: 0.70, label: 'High',   classes: 'text-green-600 bg-green-50' },
  { min: 0.40, label: 'Medium', classes: 'text-amber-600 bg-amber-50' },
  { min: 0.00, label: 'Low',    classes: 'text-gray-500 bg-gray-100' },
]

function getConfidenceStyle(confidence: number) {
  for (const level of CONFIDENCE_STYLES) {
    if (confidence >= level.min) return level
  }
  return CONFIDENCE_STYLES[CONFIDENCE_STYLES.length - 1]
}

type ConfidenceBadgeProps = {
  confidence: number
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const { label, classes } = getConfidenceStyle(confidence)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        classes,
      )}
    >
      {label} ({(confidence * 100).toFixed(0)}%)
    </span>
  )
}
