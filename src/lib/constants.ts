// SIM 2.0 Constants
// All scoring weights, thresholds, labels, and configuration values.

import type {
  SIMRole,
  SourceType,
  SSIState,
  TRCIState,
  TrendDirection,
  IndexType,
} from './database.types'

// ============================================================
// SSI Categories (Student Safety Index) — 6 categories
// ============================================================

export const SSI_CATEGORIES = [
  { key: 'attendance_engagement',  label: 'Attendance & Engagement',   weight: 0.15 },
  { key: 'academic_functioning',   label: 'Academic Functioning',      weight: 0.10 },
  { key: 'emotional_distress',     label: 'Emotional Distress',        weight: 0.25 },
  { key: 'social_isolation',       label: 'Social Isolation',          weight: 0.15 },
  { key: 'behavioral_stability',   label: 'Behavioral Stability',      weight: 0.20 },
  { key: 'responsiveness_support', label: 'Responsiveness to Support', weight: 0.15 },
] as const

// ============================================================
// TRCI Categories (Threat Risk & Concern Index) — 6 categories
// ============================================================

export const TRCI_CATEGORIES = [
  { key: 'threat_communication', label: 'Threat Communications',      weight: 0.25 },
  { key: 'fascination_violence', label: 'Fascination with Violence',  weight: 0.20 },
  { key: 'weapon_access',       label: 'Weapon Access/Interest',     weight: 0.20 },
  { key: 'grievance_fixation',  label: 'Grievance/Fixation',         weight: 0.15 },
  { key: 'planning_behavior',   label: 'Planning Behaviors',         weight: 0.10 },
  { key: 'peer_concern',        label: 'Peer/Staff Concern Reports', weight: 0.10 },
] as const

// ============================================================
// Combined categories with index_type
// ============================================================

export const ALL_CATEGORIES: { key: string; label: string; weight: number; index_type: IndexType }[] = [
  ...SSI_CATEGORIES.map((c) => ({ ...c, index_type: 'SSI' as const })),
  ...TRCI_CATEGORIES.map((c) => ({ ...c, index_type: 'TRCI' as const })),
]

// ============================================================
// Source weights (used in scoring engine)
// ============================================================

export const SOURCE_WEIGHTS: Record<SourceType, number> = {
  evidence:        1.00,
  law_enforcement: 0.95,
  admin:           0.85,
  counselor:       0.85,
  teacher:         0.80,
  parent:          0.70,
  student:         0.60,
  anonymous:       0.40,
  system:          0.75,
}

// ============================================================
// Source type labels (for dropdowns and display)
// ============================================================

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  teacher:         'Teacher',
  admin:           'Administrator',
  counselor:       'Counselor',
  student:         'Student',
  parent:          'Parent/Guardian',
  anonymous:       'Anonymous',
  system:          'System',
  evidence:        'Evidence/Documentation',
  law_enforcement: 'Law Enforcement',
}

export const SOURCE_TYPE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: 'teacher',         label: 'Teacher' },
  { value: 'admin',           label: 'Administrator' },
  { value: 'counselor',       label: 'Counselor' },
  { value: 'student',         label: 'Student' },
  { value: 'parent',          label: 'Parent/Guardian' },
  { value: 'anonymous',       label: 'Anonymous' },
  { value: 'system',          label: 'System' },
  { value: 'evidence',        label: 'Evidence/Documentation' },
  { value: 'law_enforcement', label: 'Law Enforcement' },
]

// ============================================================
// State thresholds (ordered high-to-low for lookup)
// ============================================================

export const SSI_THRESHOLDS: { state: SSIState; min: number }[] = [
  { state: 'S4', min: 4.0 },
  { state: 'S3', min: 3.0 },
  { state: 'S2', min: 2.0 },
  { state: 'S1', min: 1.0 },
  { state: 'S0', min: 0.0 },
]

export const TRCI_THRESHOLDS: { state: TRCIState; min: number }[] = [
  { state: 'C4', min: 4.0 },
  { state: 'C3', min: 3.0 },
  { state: 'C2', min: 2.0 },
  { state: 'C1', min: 1.0 },
  { state: 'C0', min: 0.0 },
]

// ============================================================
// Trend detection thresholds (delta over trailing window)
// ============================================================

export const TREND_THRESHOLDS: { direction: TrendDirection; minDelta: number }[] = [
  { direction: 'rising_rapidly', minDelta: 1.5 },
  { direction: 'rising',         minDelta: 0.5 },
  { direction: 'improving',      minDelta: -0.5 },
  { direction: 'stable',         minDelta: -Infinity },
]

// ============================================================
// Scoring engine constants
// ============================================================

/** Signals older than this many days are half-weighted via exponential decay */
export const RECENCY_HALF_LIFE_DAYS = 30

/** Multiplier applied when a signal has evidence_flag = true */
export const EVIDENCE_BOOST = 1.15

/** Multiplier applied when 2+ sources corroborate the same category */
export const CORROBORATION_MULTIPLIER = 1.10

/** Maximum confidence value (prevents overfit on sparse data) */
export const CONFIDENCE_CAP = 0.95

// ============================================================
// State labels
// ============================================================

export const STATE_LABELS: Record<string, string> = {
  S0: 'Baseline',
  S1: 'Emerging',
  S2: 'Moderate',
  S3: 'Elevated',
  S4: 'Critical',
  C0: 'No Concern',
  C1: 'Low Concern',
  C2: 'Moderate',
  C3: 'High Concern',
  C4: 'Imminent',
}

// ============================================================
// State badge colors (Tailwind class strings)
// ============================================================

export const STATE_COLORS: Record<string, string> = {
  S0: 'bg-green-100 text-green-700',
  S1: 'bg-blue-100 text-blue-700',
  S2: 'bg-amber-100 text-amber-700',
  S3: 'bg-orange-100 text-orange-700',
  S4: 'bg-red-100 text-red-700',
  C0: 'bg-green-100 text-green-700',
  C1: 'bg-blue-100 text-blue-700',
  C2: 'bg-amber-100 text-amber-700',
  C3: 'bg-orange-100 text-orange-700',
  C4: 'bg-red-100 text-red-700',
}

// ============================================================
// State border colors (for queue row left-border accent)
// ============================================================

export const STATE_BORDER_COLORS: Record<string, string> = {
  S0: 'border-l-green-400',
  S1: 'border-l-blue-400',
  S2: 'border-l-amber-400',
  S3: 'border-l-orange-400',
  S4: 'border-l-red-500',
  C0: 'border-l-green-400',
  C1: 'border-l-blue-400',
  C2: 'border-l-amber-400',
  C3: 'border-l-orange-400',
  C4: 'border-l-red-500',
}

// ============================================================
// Trend labels, colors, and icons
// ============================================================

export const TREND_LABELS: Record<TrendDirection, string> = {
  improving:      'Improving',
  stable:         'Stable',
  rising:         'Rising',
  rising_rapidly: 'Rising Rapidly',
}

export const TREND_COLORS: Record<TrendDirection, string> = {
  improving:      'text-green-600',
  stable:         'text-gray-500',
  rising:         'text-amber-600',
  rising_rapidly: 'text-red-600',
}

/** Unicode arrow characters for trend display */
export const TREND_ICONS: Record<TrendDirection, string> = {
  improving:      '\u2198',  // arrow down-right
  stable:         '\u2192',  // arrow right
  rising:         '\u2197',  // arrow up-right
  rising_rapidly: '\u2191',  // arrow up
}

// ============================================================
// Confidence level labels
// ============================================================

export const CONFIDENCE_LEVELS: { min: number; label: string; color: string }[] = [
  { min: 0.80, label: 'High',     color: 'text-green-600' },
  { min: 0.50, label: 'Moderate', color: 'text-amber-600' },
  { min: 0.25, label: 'Low',      color: 'text-orange-600' },
  { min: 0.00, label: 'Very Low', color: 'text-red-600' },
]

export function getConfidenceLabel(confidence: number): { label: string; color: string } {
  for (const level of CONFIDENCE_LEVELS) {
    if (confidence >= level.min) return level
  }
  return CONFIDENCE_LEVELS[CONFIDENCE_LEVELS.length - 1]
}

// ============================================================
// Role definitions
// ============================================================

export const SIM_ALL_ACCESS: SIMRole[] = [
  'platform_admin',
  'sim_admin',
  'sim_counselor',
  'sim_threat_team',
  'sim_principal',
]

export const SIM_WRITE_ACCESS: SIMRole[] = [
  'platform_admin',
  'sim_admin',
  'sim_counselor',
  'sim_threat_team',
]

export const ROLE_LABELS: Record<SIMRole, string> = {
  platform_admin:  'Platform Admin',
  sim_admin:       'SIM Admin',
  sim_counselor:   'Counselor',
  sim_threat_team: 'Threat Assessment Team',
  sim_principal:   'Principal',
}

// ============================================================
// Grade options (for student forms)
// ============================================================

export const GRADE_OPTIONS: { value: string; label: string }[] = [
  { value: 'PK', label: 'Pre-K' },
  { value: 'K',  label: 'Kindergarten' },
  { value: '1',  label: '1st Grade' },
  { value: '2',  label: '2nd Grade' },
  { value: '3',  label: '3rd Grade' },
  { value: '4',  label: '4th Grade' },
  { value: '5',  label: '5th Grade' },
  { value: '6',  label: '6th Grade' },
  { value: '7',  label: '7th Grade' },
  { value: '8',  label: '8th Grade' },
  { value: '9',  label: '9th Grade' },
  { value: '10', label: '10th Grade' },
  { value: '11', label: '11th Grade' },
  { value: '12', label: '12th Grade' },
]

// ============================================================
// Default route
// ============================================================

export function getDefaultRoute(): string {
  return '/queue'
}
