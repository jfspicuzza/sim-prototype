import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Search } from 'lucide-react'
import { useAttentionQueue, urgencyScore } from '@/hooks/useAttentionQueue'
import { StateBadge } from '@/components/ui/StateBadge'
import { TrendIndicator } from '@/components/ui/TrendIndicator'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { STATE_BORDER_COLORS } from '@/lib/constants'
import { cn, timeAgo } from '@/lib/utils'
import type { TrendDirection, TopDriver } from '@/lib/database.types'

type QueueStudent = {
  id: string
  first_name: string
  last_name: string
  grade: string | null
  school_id: string | null
  is_active: boolean
  schools: { name: string } | null
}

type QueueExplanation = {
  top_drivers: unknown
}

type QueueItem = {
  id: string
  student_id: string
  ssi_value: number
  ssi_state: string
  trci_value: number
  trci_state: string
  ssi_trend: TrendDirection
  trci_trend: TrendDirection
  confidence: number
  computed_at: string
  students: QueueStudent
  explanations: QueueExplanation[]
}

export default function AttentionQueue() {
  const navigate = useNavigate()
  const { data: rawData = [], isLoading } = useAttentionQueue()
  const [search, setSearch] = useState('')

  const items = rawData as unknown as QueueItem[]

  // Sort by urgency, then filter by search
  const sorted = useMemo(() => {
    let filtered = items

    if (search) {
      const q = search.toLowerCase()
      filtered = items.filter((item) => {
        const student = item.students
        return (
          student.first_name.toLowerCase().includes(q) ||
          student.last_name.toLowerCase().includes(q) ||
          `${student.first_name} ${student.last_name}`.toLowerCase().includes(q) ||
          `${student.last_name}, ${student.first_name}`.toLowerCase().includes(q)
        )
      })
    }

    return [...filtered].sort((a, b) => urgencyScore(b) - urgencyScore(a))
  }, [items, search])

  function getTopDriverLabel(item: QueueItem): string {
    const explanation = item.explanations?.[0]
    if (!explanation) return '\u2014'
    const drivers = explanation.top_drivers as TopDriver[] | null
    if (!drivers || drivers.length === 0) return '\u2014'
    return drivers[0].label
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          <h1 className="text-2xl font-bold text-gray-900">Attention Queue</h1>
        </div>
        <p className="text-sm text-gray-500">
          Students requiring review, sorted by urgency.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by student name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>

      {/* Queue */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16">
          <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {search ? 'No matching students' : 'No students in the queue yet'}
          </h3>
          <p className="text-sm text-gray-500">
            {search ? 'Try a different search term.' : 'Add students and submit signals to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((item) => {
            const student = item.students
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/student/${item.student_id}`)}
                className={cn(
                  'w-full text-left bg-white rounded-lg border shadow-sm p-4 hover:shadow-md transition-shadow border-l-4',
                  STATE_BORDER_COLORS[item.trci_state]
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Student info + badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {student.last_name}, {student.first_name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {student.grade ? `Grade ${student.grade}` : ''}
                        {student.schools ? ` \u2022 ${student.schools.name}` : ''}
                      </span>
                    </div>

                    {/* Index badges row */}
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500 font-medium">SSI:</span>
                        <span className="text-sm font-semibold tabular-nums text-gray-900">{item.ssi_value.toFixed(1)}</span>
                        <StateBadge state={item.ssi_state} />
                        <TrendIndicator trend={item.ssi_trend} showLabel={false} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500 font-medium">TRCI:</span>
                        <span className="text-sm font-semibold tabular-nums text-gray-900">{item.trci_value.toFixed(1)}</span>
                        <StateBadge state={item.trci_state} />
                        <TrendIndicator trend={item.trci_trend} showLabel={false} />
                      </div>
                      <ConfidenceBadge confidence={item.confidence} />
                    </div>
                  </div>

                  {/* Right: Top driver + timestamp */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500 mb-1">{getTopDriverLabel(item)}</p>
                    <p className="text-xs text-gray-400">{timeAgo(item.computed_at)}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
