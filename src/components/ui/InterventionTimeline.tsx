import { ClipboardList } from 'lucide-react'

type Intervention = {
  title: string
  description: string
  source: string
  status: 'active' | 'completed' | 'pending'
  effectiveness?: number
}

type InterventionTimelineProps = {
  interventions: Intervention[]
}

const STATUS_STYLES: Record<string, string> = {
  active: 'text-brand-700 bg-brand-50',
  completed: 'text-green-700 bg-green-50',
  pending: 'text-amber-700 bg-amber-50',
}

export function InterventionTimeline({ interventions }: InterventionTimelineProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-gray-900">Intervention timeline</h3>
        <ClipboardList className="w-5 h-5 text-brand-600" />
      </div>
      <p className="text-xs text-gray-500 mb-4">Support actions, ownership, and outcomes</p>

      {interventions.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No interventions recorded yet.</p>
      ) : (
        <div className="space-y-3">
          {interventions.map((intervention, i) => (
            <div key={i} className="bg-gray-50 rounded-lg px-4 py-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-semibold text-gray-900">{intervention.title}</p>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[intervention.status]}`}>
                  {intervention.status}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-1">{intervention.description}</p>
              <p className="text-xs text-gray-500">
                {intervention.source}
                {intervention.effectiveness != null && (
                  <> · effectiveness {intervention.effectiveness.toFixed(1)}</>
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
