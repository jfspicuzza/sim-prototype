import { useMemo } from 'react'

type DataPoint = {
  date: string
  value: number
}

type TrendGraphProps = {
  data: DataPoint[]
  height?: number
}

export function TrendGraph({ data, height = 160 }: TrendGraphProps) {
  const { points, labels, yLabels, pathD, areaD, width } = useMemo(() => {
    if (data.length === 0) return { points: [], labels: [], yLabels: [], pathD: '', areaD: '', width: 300 }

    const w = 300
    const h = height
    const padX = 10
    const padY = 20
    const plotW = w - padX * 2
    const plotH = h - padY * 2

    const minVal = 0
    const maxVal = 5

    const pts = data.map((d, i) => ({
      x: padX + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW),
      y: padY + plotH - ((d.value - minVal) / (maxVal - minVal)) * plotH,
      ...d,
    }))

    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const area = path + ` L ${pts[pts.length - 1].x} ${padY + plotH} L ${pts[0].x} ${padY + plotH} Z`

    // Date labels (first, middle, last)
    const lbls: { x: number; text: string }[] = []
    if (pts.length >= 1) lbls.push({ x: pts[0].x, text: fmtDate(pts[0].date) })
    if (pts.length >= 3) lbls.push({ x: pts[Math.floor(pts.length / 2)].x, text: fmtDate(pts[Math.floor(pts.length / 2)].date) })
    if (pts.length >= 2) lbls.push({ x: pts[pts.length - 1].x, text: fmtDate(pts[pts.length - 1].date) })

    // Y-axis labels
    const yLbls = [0, 1, 2, 3, 4, 5].map(v => ({
      y: padY + plotH - ((v - minVal) / (maxVal - minVal)) * plotH,
      text: v.toString(),
    }))

    return { points: pts, labels: lbls, yLabels: yLbls, pathD: path, areaD: area, width: w }
  }, [data, height])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-gray-400">
        No trend data available yet.
      </div>
    )
  }

  // Determine if last point is higher than second-to-last (for coloring)
  const lastPt = data[data.length - 1]
  const isElevated = lastPt && lastPt.value >= 2.0

  return (
    <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {yLabels.map(yl => (
        <line
          key={yl.text}
          x1={10}
          y1={yl.y}
          x2={width - 10}
          y2={yl.y}
          stroke="#f3f4f6"
          strokeWidth={1}
        />
      ))}

      {/* Area fill */}
      <path d={areaD} fill="url(#trendGradient)" opacity={0.3} />

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={isElevated ? '#ef4444' : '#3b82f6'}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 5 : 3.5}
          fill={i === points.length - 1 && isElevated ? '#ef4444' : '#3b82f6'}
          stroke="white"
          strokeWidth={2}
        />
      ))}

      {/* Date labels */}
      {labels.map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={height + 14}
          textAnchor="middle"
          className="fill-gray-400"
          fontSize={9}
          fontFamily="system-ui"
        >
          {l.text}
        </text>
      ))}

      {/* Gradient def */}
      <defs>
        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isElevated ? '#ef4444' : '#3b82f6'} stopOpacity={0.4} />
          <stop offset="100%" stopColor={isElevated ? '#ef4444' : '#3b82f6'} stopOpacity={0.02} />
        </linearGradient>
      </defs>
    </svg>
  )
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
