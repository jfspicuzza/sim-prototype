import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Signal } from '@/lib/database.types'
import { SOURCE_TYPE_LABELS } from '@/lib/constants'
import { formatDateTime } from '@/lib/utils'
import { TrendGraph } from './TrendGraph'

type CaseReviewWorkspaceProps = {
  signals: Signal[]
  snapshotHistory: { date: string; value: number }[]
  interventions: { title: string; description: string; source: string; date: string }[]
  auditEntries: { action: string; user: string; detail: string; date: string }[]
}

const TABS = [
  { key: 'incidents', label: 'Incident History' },
  { key: 'notes', label: 'Notes' },
  { key: 'trend', label: 'Trend Graph' },
  { key: 'outcomes', label: 'Intervention Outcomes' },
  { key: 'audit', label: 'Audit Log' },
] as const

type TabKey = (typeof TABS)[number]['key']

export function CaseReviewWorkspace({
  signals,
  snapshotHistory,
  interventions,
  auditEntries,
}: CaseReviewWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('incidents')

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-gray-900">Case review workspace</h3>
        <Settings2 className="w-5 h-5 text-brand-600" />
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Tabs for incident history, notes, trend graph, intervention outcomes, and audit log
      </p>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[160px]">
        {activeTab === 'incidents' && (
          <IncidentHistoryTab signals={signals} />
        )}
        {activeTab === 'notes' && (
          <NotesTab signals={signals} />
        )}
        {activeTab === 'trend' && (
          <TrendGraphTab data={snapshotHistory} />
        )}
        {activeTab === 'outcomes' && (
          <OutcomesTab interventions={interventions} />
        )}
        {activeTab === 'audit' && (
          <AuditLogTab entries={auditEntries} />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-tab views
// ---------------------------------------------------------------------------

function IncidentHistoryTab({ signals }: { signals: Signal[] }) {
  if (signals.length === 0) {
    return <EmptyState text="No incidents recorded yet." />
  }
  return (
    <div className="space-y-3">
      {signals.map(s => (
        <div key={s.id} className="bg-gray-50 rounded-lg px-4 py-3">
          <p className="text-sm font-semibold text-gray-900 mb-0.5">
            {s.free_text || s.category}
          </p>
          <p className="text-xs text-gray-500">
            Assessor {SOURCE_TYPE_LABELS[s.source_type] ?? s.source_type}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Evidence {s.evidence_flag ? `${s.source_type}://evidence/001` : 'none'}
          </p>
          <p className="text-xs text-gray-400">
            {formatDateTime(s.created_at)}
          </p>
        </div>
      ))}
    </div>
  )
}

function NotesTab({ signals }: { signals: Signal[] }) {
  const notes = signals.filter(s => s.free_text)
  if (notes.length === 0) {
    return <EmptyState text="No notes recorded yet." />
  }
  return (
    <div className="space-y-3">
      {notes.map(s => (
        <div key={s.id} className="bg-gray-50 rounded-lg px-4 py-3">
          <p className="text-sm text-gray-900 mb-1">{s.free_text}</p>
          <p className="text-xs text-gray-500">
            {SOURCE_TYPE_LABELS[s.source_type] ?? s.source_type} · {formatDateTime(s.created_at)}
          </p>
        </div>
      ))}
    </div>
  )
}

function TrendGraphTab({ data }: { data: { date: string; value: number }[] }) {
  return <TrendGraph data={data} height={180} />
}

function OutcomesTab({ interventions }: { interventions: { title: string; description: string; source: string; date: string }[] }) {
  if (interventions.length === 0) {
    return <EmptyState text="No intervention outcomes recorded yet." />
  }
  return (
    <div className="space-y-3">
      {interventions.map((iv, i) => (
        <div key={i} className="bg-gray-50 rounded-lg px-4 py-3">
          <p className="text-sm font-semibold text-gray-900 mb-0.5">{iv.title}</p>
          <p className="text-sm text-gray-700">{iv.description}</p>
          <p className="text-xs text-gray-500 mt-1">{iv.source} · {iv.date}</p>
        </div>
      ))}
    </div>
  )
}

function AuditLogTab({ entries }: { entries: { action: string; user: string; detail: string; date: string }[] }) {
  if (entries.length === 0) {
    return <EmptyState text="No audit entries yet." />
  }
  return (
    <div className="space-y-2">
      {entries.map((e, i) => (
        <div key={i} className="flex items-start gap-3 px-3 py-2 bg-gray-50 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-900">{e.action}</p>
            <p className="text-xs text-gray-500">{e.user} · {e.detail}</p>
            <p className="text-xs text-gray-400">{e.date}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-gray-400 text-center py-6">{text}</p>
}
