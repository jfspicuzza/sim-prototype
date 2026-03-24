import { useState } from 'react'
import { RotateCcw, ShieldAlert, SlidersHorizontal } from 'lucide-react'

// ---------------------------------------------------------------------------
// Default values from constants.ts
// ---------------------------------------------------------------------------

const DEFAULT_WEIGHTS = [
  { key: 'behavioral_escalation', label: 'Behavioral Escalation', weight: 0.25 },
  { key: 'threat_indicators', label: 'Threat Indicators', weight: 0.30 },
  { key: 'social_emotional', label: 'Social/Emotional Distress', weight: 0.20 },
  { key: 'environmental', label: 'Environmental Factors', weight: 0.15 },
  { key: 'digital_peer', label: 'Digital/Peer Signals', weight: 0.10 },
]

const DEFAULT_THRESHOLDS = [
  { key: 'low', label: 'Low', min: 0.0, max: 1.5 },
  { key: 'elevated', label: 'Elevated', min: 1.6, max: 2.5 },
  { key: 'high', label: 'High', min: 2.6, max: 3.5 },
  { key: 'critical', label: 'Critical', min: 3.6, max: 4.5 },
  { key: 'imminent', label: 'Imminent', min: 4.6, max: 5.0 },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminSettings() {
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS.map(w => ({ ...w })))
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS.map(t => ({ ...t })))

  function adjustWeight(idx: number, delta: number) {
    setWeights(prev => prev.map((w, i) =>
      i === idx ? { ...w, weight: Math.max(0, Math.min(1, +(w.weight + delta).toFixed(2))) } : w
    ))
  }

  function adjustThreshold(idx: number, field: 'min' | 'max', delta: number) {
    setThresholds(prev => prev.map((t, i) =>
      i === idx ? { ...t, [field]: Math.max(0, Math.min(5, +(t[field] + delta).toFixed(1))) } : t
    ))
  }

  function resetDefaults() {
    setWeights(DEFAULT_WEIGHTS.map(w => ({ ...w })))
    setThresholds(DEFAULT_THRESHOLDS.map(t => ({ ...t })))
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto pb-28 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">
          Admin Settings
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-2">
          Adjust transparent scoring weights and thresholds.
        </h1>
        <p className="text-sm text-gray-500">
          These controls are for authorized staff reviewing how the draft model prioritizes support follow-up.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-500 mb-6">
        <ShieldAlert className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p>Recommendations are advisory decision support only and require authorized staff review, documentation, and confirmation before action.</p>
      </div>

      {/* Scoring Weights */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-gray-900">Scoring weights</h2>
          <SlidersHorizontal className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Weighted inputs remain visible and reviewable for every assessment
        </p>
        <div className="space-y-4">
          {weights.map((w, i) => (
            <div key={w.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{w.label}</p>
                <p className="text-xs text-gray-500 tabular-nums">{w.weight.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => adjustWeight(i, -0.05)}
                  className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors text-lg font-medium"
                >
                  −
                </button>
                <button
                  onClick={() => adjustWeight(i, 0.05)}
                  className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors text-lg font-medium"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Thresholds */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Risk thresholds</h2>
        <p className="text-xs text-gray-500 mb-5">
          Admins can tune scoring cutoffs for local policy alignment while keeping the logic explainable
        </p>
        <div className="space-y-4">
          {thresholds.map((t, i) => (
            <div key={t.key} className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-sm font-semibold text-gray-900 mb-2">{t.label}</p>
              <div className="flex items-center gap-4">
                {/* Min */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 uppercase w-8">Min</span>
                  <span className="text-sm font-bold text-gray-900 tabular-nums w-8">{t.min.toFixed(1)}</span>
                  <button
                    onClick={() => adjustThreshold(i, 'min', -0.1)}
                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white active:bg-gray-100 transition-colors text-sm font-medium"
                  >
                    −
                  </button>
                  <button
                    onClick={() => adjustThreshold(i, 'min', 0.1)}
                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white active:bg-gray-100 transition-colors text-sm font-medium"
                  >
                    +
                  </button>
                </div>
                {/* Max */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 uppercase w-8">Max</span>
                  <span className="text-sm font-bold text-gray-900 tabular-nums w-8">{t.max.toFixed(1)}</span>
                  <button
                    onClick={() => adjustThreshold(i, 'max', -0.1)}
                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white active:bg-gray-100 transition-colors text-sm font-medium"
                  >
                    −
                  </button>
                  <button
                    onClick={() => adjustThreshold(i, 'max', 0.1)}
                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white active:bg-gray-100 transition-colors text-sm font-medium"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reset button */}
      <button
        onClick={resetDefaults}
        className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-xl transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        Reset to default weights and thresholds
      </button>
    </div>
  )
}
