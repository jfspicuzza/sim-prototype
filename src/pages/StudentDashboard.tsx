import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, PlusCircle, Clock, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useStudentSnapshot } from '@/hooks/useStudentSnapshot'
import { StateBadge } from '@/components/ui/StateBadge'
import { TrendIndicator } from '@/components/ui/TrendIndicator'
import { ScoreGauge } from '@/components/ui/ScoreGauge'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { DriverList } from '@/components/ui/DriverList'
import { timeAgo } from '@/lib/utils'
import { SOURCE_TYPE_LABELS } from '@/lib/constants'
import type { TopDriver, ThresholdEvent, TrendDirection, Signal } from '@/lib/database.types'

type SnapshotWithRelations = {
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
  explanations: {
    top_drivers: unknown
    threshold_events: unknown
    summary_text: string
    expanded_text: string | null
  }[]
  category_scores: {
    category: string
    index_type: string
    score: number
    signal_count: number
  }[]
}

type StudentData = {
  id: string
  first_name: string
  last_name: string
  grade: string | null
  school_id: string | null
  schools: { name: string } | null
}

export default function StudentDashboard() {
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()
  const [expandedText, setExpandedText] = useState(false)

  // Fetch student info
  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ['sim-student', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, grade, school_id, schools(name)')
        .eq('id', studentId!)
        .single()
      if (error) throw error
      return data as unknown as StudentData
    },
    enabled: !!studentId,
  })

  // Fetch current snapshot with explanations and category_scores
  const { data: rawSnapshot, isLoading: snapshotLoading } = useStudentSnapshot(studentId)
  const snapshot = rawSnapshot as unknown as SnapshotWithRelations | null

  // Fetch signal history
  const { data: signals = [] } = useQuery({
    queryKey: ['sim-signals', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .eq('student_id', studentId!)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return (data ?? []) as Signal[]
    },
    enabled: !!studentId,
  })

  const isLoading = studentLoading || snapshotLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="text-center py-24 text-gray-500">
        Student not found.
      </div>
    )
  }

  const explanation = snapshot?.explanations?.[0] ?? null
  const topDrivers = (explanation?.top_drivers ?? []) as TopDriver[]
  const thresholdEvents = (explanation?.threshold_events ?? []) as ThresholdEvent[]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Student Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/queue')}
            className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Back to queue"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {student.first_name} {student.last_name}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {student.grade ? `Grade ${student.grade}` : 'No grade assigned'}
              {student.schools ? ` \u2022 ${student.schools.name}` : ''}
            </p>
          </div>
        </div>
        <Link
          to={`/signal/${student.id}`}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Submit Signal
        </Link>
      </div>

      {!snapshot ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <div className="text-gray-400 mb-3">
            <Clock className="w-10 h-10 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Data Yet</h3>
          <p className="text-sm text-gray-500">
            Submit a signal for this student to generate their first snapshot.
          </p>
        </div>
      ) : (
        <>
          {/* Dual Index Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* SSI Card */}
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-3">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Student Support Index (SSI)
              </h3>
              <ScoreGauge value={snapshot.ssi_value} state={snapshot.ssi_state} />
              <div className="flex items-center gap-2">
                <StateBadge state={snapshot.ssi_state} size="md" />
                <TrendIndicator trend={snapshot.ssi_trend} />
              </div>
            </div>

            {/* TRCI Card */}
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-3">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Threat-Relevant Concern Index (TRCI)
              </h3>
              <ScoreGauge value={snapshot.trci_value} state={snapshot.trci_state} />
              <div className="flex items-center gap-2">
                <StateBadge state={snapshot.trci_state} size="md" />
                <TrendIndicator trend={snapshot.trci_trend} />
              </div>
            </div>
          </div>

          {/* Confidence Row */}
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <ConfidenceBadge confidence={snapshot.confidence} />
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Last updated: {timeAgo(snapshot.computed_at)}
            </span>
          </div>

          {/* Explainability Panel */}
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Analysis</h3>

            {/* Summary */}
            {explanation && (
              <p className="text-sm text-gray-700 leading-relaxed">
                {explanation.summary_text}
              </p>
            )}

            {/* Threshold Events */}
            {thresholdEvents.length > 0 && (
              <div className="space-y-2">
                {thresholdEvents.map((event, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm ${
                      event.direction === 'up'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}
                  >
                    <span className="font-medium">{event.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Top Drivers */}
            {topDrivers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Top Drivers</h4>
                <DriverList drivers={topDrivers} />
              </div>
            )}

            {/* Detailed Breakdown (Collapsible) */}
            {explanation?.expanded_text && (
              <div>
                <button
                  onClick={() => setExpandedText(!expandedText)}
                  className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                >
                  {expandedText ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Hide detailed breakdown
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show detailed breakdown
                    </>
                  )}
                </button>
                {expandedText && (
                  <pre className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap font-mono">
                    {explanation.expanded_text}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Signal History */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Signal History</h3>
            </div>

            {signals.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                No signals recorded yet.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Category</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Score</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Source</th>
                    <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Evidence</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {signals.map((signal) => (
                    <tr key={signal.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {timeAgo(signal.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {signal.category}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 tabular-nums">
                        {signal.base_score.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {SOURCE_TYPE_LABELS[signal.source_type] ?? signal.source_type}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {signal.evidence_flag ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-gray-300">&mdash;</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                        {signal.free_text ?? '\u2014'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
