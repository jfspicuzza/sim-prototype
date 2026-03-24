import {
  ShieldCheck, AlertTriangle, CheckCircle2, Target,
} from 'lucide-react'

type Recommendation = {
  urgency: string
  confidence: number
  nextStep: string
  actions: string[]
  rationale: string[]
}

type AIRecommendationPanelProps = {
  ssiValue: number
  trciValue: number
  ssiState: string
  trciState: string
  ssiTrend: string
  trciTrend: string
  confidence: number
  signalCount: number
  interventionCount?: number
}

function generateRecommendation(props: AIRecommendationPanelProps): Recommendation {
  const { ssiValue, trciValue, ssiState, trciState, ssiTrend, confidence, signalCount: _signalCount, interventionCount = 0 } = props
  const highScore = Math.max(ssiValue, trciValue)
  const highState = trciValue >= ssiValue ? trciState : ssiState

  // Determine urgency
  let urgency = 'Routine'
  if (highState === 'S4' || highState === 'C4') urgency = 'Immediate'
  else if (highState === 'S3' || highState === 'C3') urgency = 'Urgent'
  else if (highState === 'S2' || highState === 'C2') urgency = 'Elevated'

  // Determine next step based on state
  let nextStep = 'Continue monitoring'
  const actions: string[] = []
  const rationale: string[] = []

  if (urgency === 'Immediate') {
    nextStep = 'Initiate immediate safety assessment'
    actions.push('Convene threat assessment team within 24 hours.')
    actions.push('Notify building administration and document all observations.')
    actions.push('Review and update safety plan with specific protective measures.')
    rationale.push(`Current score of ${highScore.toFixed(2)} exceeds critical threshold.`)
  } else if (urgency === 'Urgent') {
    nextStep = 'Schedule structured assessment'
    actions.push('Schedule a structured assessment with counselor or support lead.')
    actions.push('Document protective factors and intervention response at next check-in.')
    actions.push('Review existing support services for adequacy.')
    rationale.push(`Score of ${highScore.toFixed(2)} indicates elevated concern warranting structured follow-up.`)
  } else if (urgency === 'Elevated') {
    nextStep = 'Increase monitoring cadence'
    actions.push('Maintain case review cadence with counselor or support lead.')
    actions.push('Document protective factors and intervention response at next check-in.')
    rationale.push('Current data suggests continued structured support and monitored follow-up.')
  } else {
    nextStep = 'Maintain current support plan'
    actions.push('Continue regular check-ins at current cadence.')
    actions.push('Monitor for any changes in pattern or new signals.')
    rationale.push('Score trajectory is within normal range.')
  }

  // Add trend context
  if (ssiTrend === 'improving') {
    rationale.push('Score trajectory is improving compared with the prior assessment.')
  } else if (ssiTrend === 'rising' || ssiTrend === 'rising_rapidly') {
    rationale.push('Score trajectory is trending upward — escalation of review cadence may be warranted.')
  }

  // Add intervention context
  if (interventionCount > 0) {
    rationale.push(`Existing intervention count: ${interventionCount}. Review outcomes before finalizing next steps.`)
  }

  return { urgency, confidence, nextStep, actions, rationale }
}

const URGENCY_COLORS: Record<string, string> = {
  Routine: 'bg-green-50 text-green-700 border-green-200',
  Elevated: 'bg-amber-50 text-amber-700 border-amber-200',
  Urgent: 'bg-orange-50 text-orange-700 border-orange-200',
  Immediate: 'bg-red-50 text-red-700 border-red-200',
}

export function AIRecommendationPanel(props: AIRecommendationPanelProps) {
  const rec = generateRecommendation(props)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-gray-900">AI recommendation panel</h3>
        <Target className="w-5 h-5 text-brand-600" />
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Explainable draft next step with visible urgency, confidence, and rationale.
      </p>

      {/* Recommended Next Step */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{rec.nextStep}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Urgency {rec.urgency} · Confidence {(rec.confidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Human confirmation warning */}
      <div className={`flex items-center gap-2 rounded-lg px-3 py-2 mb-4 border ${URGENCY_COLORS[rec.urgency] || URGENCY_COLORS.Routine}`}>
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span className="text-xs font-medium">
          Human confirmation is required before any intervention decision is finalized.
        </span>
      </div>

      {/* Recommended Actions */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Recommended Actions
        </p>
        <div className="space-y-2">
          {rec.actions.map((action, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">{action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rationale */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Rationale
        </p>
        <ul className="space-y-1.5">
          {rec.rationale.map((r, i) => (
            <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
              <span className="text-gray-400 mt-0.5">·</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
