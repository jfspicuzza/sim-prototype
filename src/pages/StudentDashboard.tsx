import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, PlusCircle, Clock, ChevronDown, ChevronUp,
  CheckCircle2, ShieldAlert, TrendingUp,
  ArrowDownRight, ArrowUpRight, Sparkles, AlertTriangle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useStudentSnapshot } from '@/hooks/useStudentSnapshot'
import { StateBadge } from '@/components/ui/StateBadge'
import { TrendIndicator } from '@/components/ui/TrendIndicator'
import { ScoreGauge } from '@/components/ui/ScoreGauge'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { DriverList } from '@/components/ui/DriverList'
import { TrendGraph } from '@/components/ui/TrendGraph'
import { AIRecommendationPanel } from '@/components/ui/AIRecommendationPanel'
import { InterventionTimeline } from '@/components/ui/InterventionTimeline'
import { CaseReviewWorkspace } from '@/components/ui/CaseReviewWorkspace'
import { timeAgo, formatDateTime } from '@/lib/utils'
import { SOURCE_TYPE_LABELS, ALL_CATEGORIES } from '@/lib/constants'
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

  const { data: rawSnapshot, isLoading: snapshotLoading } = useStudentSnapshot(studentId)
  const snapshot = rawSnapshot as unknown as SnapshotWithRelations | null

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

  // Fetch all snapshots for trend graph
  const { data: allSnapshots = [] } = useQuery({
    queryKey: ['sim-snapshot-history', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('snapshots')
        .select('computed_at, ssi_value, trci_value')
        .eq('student_id', studentId!)
        .order('computed_at', { ascending: true })
        .limit(20)
      if (error) throw error
      return (data ?? []).map((s: { computed_at: string; ssi_value: number; trci_value: number }) => ({
        date: s.computed_at,
        value: Math.max(s.ssi_value, s.trci_value),
      }))
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
  const overallScore = snapshot ? Math.max(snapshot.ssi_value, snapshot.trci_value) : 0
  const highestState = snapshot
    ? (snapshot.trci_value >= snapshot.ssi_value ? snapshot.trci_state : snapshot.ssi_state)
    : 'S0'

  // Mock interventions for the prototype (will be replaced with real data)
  const mockInterventions = signals.length > 0
    ? [
        {
          title: 'Support circle',
          description: 'Student engaged with weekly check-ins.',
          source: 'Counseling · active',
          status: 'active' as const,
          effectiveness: 4.2,
        },
      ]
    : []

  // Mock audit entries
  const mockAuditEntries = signals.slice(0, 3).map(s => ({
    action: s.free_text || s.category,
    user: SOURCE_TYPE_LABELS[s.source_type] ?? s.source_type,
    detail: `Score ${s.base_score.toFixed(1)}`,
    date: formatDateTime(s.created_at),
  }))

  // Mock intervention outcomes for case review
  const mockInterventionOutcomes = mockInterventions.map(iv => ({
    title: iv.title,
    description: iv.description,
    source: iv.source,
    date: formatDateTime(new Date().toISOString()),
  }))

  return (
    <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button
            onClick={() => navigate('/queue')}
            className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Back to queue"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                {student.first_name} {student.last_name}
              </h1>
              {snapshot && <StateBadge state={highestState} size="md" />}
            </div>
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              {student.schools?.name ?? 'No school'}
              {student.grade ? ` · Grade ${student.grade}` : ''}
            </p>
          </div>
        </div>
        <Link
          to={`/signal/${student.id}`}
          className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-medium px-3 md:px-4 py-2 rounded-lg text-sm transition-colors flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Submit Signal</span>
        </Link>
      </div>

      {!snapshot ? (
        <div className="bg-white rounded-xl shadow-sm border p-8 md:p-12 text-center">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Data Yet</h3>
          <p className="text-sm text-gray-500">
            Submit a signal for this student to generate their first snapshot.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: Student Profile Card */}
          <div className="md:hidden space-y-3">
            {/* Overall Score */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
                Current Overall Score
              </p>
              <p className="text-4xl font-bold text-gray-900 tabular-nums">
                {overallScore.toFixed(2)}
              </p>
            </div>

            {/* Trend Direction */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Trend Direction
              </p>
              <div className="flex items-center gap-2">
                <TrendIndicator trend={snapshot.ssi_trend} />
              </div>
            </div>

            {/* Trend Velocity */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Trend Velocity
              </p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">
                {(snapshot.ssi_value - snapshot.trci_value).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-500">
            <ShieldAlert className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p>Recommendations are advisory decision support only and require authorized staff review, documentation, and confirmation before action.</p>
          </div>

          {/* Desktop: Dual Index Cards */}
          <div className="hidden md:grid grid-cols-2 gap-4">
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
              Updated: {timeAgo(snapshot.computed_at)}
            </span>
          </div>

          {/* What Changed */}
          {thresholdEvents.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <h3 className="text-base font-semibold text-gray-900">What changed?</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">Summary between the last two structured assessments</p>
              <div className="space-y-2">
                {thresholdEvents.map((event, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-3 py-2.5"
                  >
                    {event.direction === 'up' ? (
                      <ArrowUpRight className="w-4 h-4 text-red-500 flex-shrink-0" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                    <span className="text-sm text-gray-700">{event.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Score Breakdown */}
          {snapshot.category_scores && snapshot.category_scores.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-brand-600" />
                <h3 className="text-base font-semibold text-gray-900">Category score breakdown</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">Latest 0–5 category inputs used in weighted scoring</p>
              <div className="space-y-3">
                {snapshot.category_scores.map(cs => {
                  const catDef = ALL_CATEGORIES.find(c => c.key === cs.category && c.index_type === cs.index_type)
                  const label = catDef?.label ?? cs.category
                  return (
                    <div key={`${cs.category}-${cs.index_type}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                        <span className="text-sm font-bold text-gray-900 tabular-nums">{cs.score.toFixed(1)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full transition-all duration-500"
                          style={{ width: `${(cs.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* AI Recommendation Panel */}
          <AIRecommendationPanel
            ssiValue={snapshot.ssi_value}
            trciValue={snapshot.trci_value}
            ssiState={snapshot.ssi_state}
            trciState={snapshot.trci_state}
            ssiTrend={snapshot.ssi_trend}
            trciTrend={snapshot.trci_trend}
            confidence={snapshot.confidence}
            signalCount={signals.length}
            interventionCount={mockInterventions.length}
          />

          {/* Signal History — Mobile: Timeline Cards */}
          <div className="md:hidden bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-brand-600" />
              <h3 className="text-base font-semibold text-gray-900">Signals / observations timeline</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">Observed notes, signals, and updates over time</p>
            {signals.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No signals recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {signals.map(signal => (
                  <div key={signal.id} className="bg-gray-50 rounded-lg px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase">
                        {signal.index_type === 'SSI' ? 'Observation' : 'Note'}
                      </span>
                      <span className="text-xs font-bold text-gray-900 tabular-nums">
                        {signal.base_score.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium mb-1">
                      {signal.free_text || signal.category}
                    </p>
                    <p className="text-xs text-gray-500">
                      {SOURCE_TYPE_LABELS[signal.source_type] ?? signal.source_type}
                      {' · '}
                      {formatDateTime(signal.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Intervention Timeline */}
          <InterventionTimeline interventions={mockInterventions} />

          {/* Trend Graph */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-gray-900">Trend graph</h3>
              <TrendingUp className="w-5 h-5 text-brand-600" />
            </div>
            <p className="text-xs text-gray-500 mb-3">Overall score trajectory across recent assessments</p>
            <TrendGraph data={allSnapshots} />
          </div>

          {/* Case Review Workspace */}
          <CaseReviewWorkspace
            signals={signals}
            snapshotHistory={allSnapshots}
            interventions={mockInterventionOutcomes}
            auditEntries={mockAuditEntries}
          />

          {/* Analysis Panel */}
          <div className="bg-white rounded-xl shadow-sm border p-5 md:p-6 space-y-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Analysis</h3>
            {explanation && (
              <p className="text-sm text-gray-700 leading-relaxed">{explanation.summary_text}</p>
            )}
            {topDrivers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Top Drivers</h4>
                <DriverList drivers={topDrivers} />
              </div>
            )}
            {explanation?.expanded_text && (
              <div>
                <button
                  onClick={() => setExpandedText(!expandedText)}
                  className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                >
                  {expandedText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {expandedText ? 'Hide detailed breakdown' : 'Show detailed breakdown'}
                </button>
                {expandedText && (
                  <pre className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap font-mono">
                    {explanation.expanded_text}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Signal History — Desktop: Table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Signal History</h3>
            </div>
            {signals.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">No signals recorded yet.</div>
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
                  {signals.map(signal => (
                    <tr key={signal.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{timeAgo(signal.created_at)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{signal.category}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 tabular-nums">{signal.base_score.toFixed(1)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{SOURCE_TYPE_LABELS[signal.source_type] ?? signal.source_type}</td>
                      <td className="px-4 py-3 text-center">
                        {signal.evidence_flag ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <span className="text-gray-300">&mdash;</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{signal.free_text ?? '\u2014'}</td>
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
