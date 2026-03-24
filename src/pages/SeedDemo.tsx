import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Database, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function SeedDemo() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [log, setLog] = useState<string[]>([])
  const [errorMsg, setErrorMsg] = useState('')

  async function seed() {
    if (!profile?.organization_id) {
      setErrorMsg('No organization found. Please ensure your profile has an organization.')
      setStatus('error')
      return
    }

    setStatus('running')
    setLog([])
    const orgId = profile.organization_id

    try {
      // 1. Create a school
      addLog('Creating school: Northview High...')
      const { data: school, error: schoolErr } = await supabase
        .from('schools')
        .insert({ organization_id: orgId, name: 'Northview High', city: 'Atlanta', state: 'GA' })
        .select('id')
        .single()
      if (schoolErr) throw new Error(`School: ${schoolErr.message}`)
      addLog(`✓ School created: ${school.id}`)

      // 2. Create students
      const studentNames = [
        { first_name: 'Maya', last_name: 'Thompson', grade: '10' },
        { first_name: 'Jordan', last_name: 'Rivera', grade: '11' },
        { first_name: 'Alex', last_name: 'Chen', grade: '9' },
        { first_name: 'Sophia', last_name: 'Williams', grade: '10' },
        { first_name: 'Ethan', last_name: 'Brooks', grade: '12' },
      ]

      addLog('Creating 5 demo students...')
      const { data: students, error: studentsErr } = await supabase
        .from('students')
        .insert(studentNames.map(s => ({
          ...s,
          organization_id: orgId,
          school_id: school.id,
        })))
        .select('id, first_name, last_name')
      if (studentsErr) throw new Error(`Students: ${studentsErr.message}`)
      addLog(`✓ ${students.length} students created`)

      // 3. Create signals for each student
      const categories = [
        { cat: 'emotional_distress', idx: 'SSI' as const },
        { cat: 'behavioral_stability', idx: 'SSI' as const },
        { cat: 'social_isolation', idx: 'SSI' as const },
        { cat: 'attendance_engagement', idx: 'SSI' as const },
        { cat: 'threat_communication', idx: 'TRCI' as const },
        { cat: 'fascination_violence', idx: 'TRCI' as const },
      ]

      const sourceTypes = ['teacher', 'counselor', 'admin', 'parent', 'student'] as const
      const freeTexts = [
        'Student appeared fatigued and less participatory.',
        'Family accepted transportation support resources.',
        'Responding well to support circle.',
        'Missed advisory twice and reported sleep disruption.',
        'Teacher noted isolation at lunch.',
        'Showed improved engagement in group activities.',
        'Parent reported stress at home.',
        'Peer concern about social media posts.',
        'Positive interaction with mentor noted.',
        'Attendance improved after check-in.',
      ]

      const studentScoreProfiles = [
        { baseRange: [1.0, 3.0], signalCount: 8 },  // Maya - elevated
        { baseRange: [0.5, 1.5], signalCount: 5 },  // Jordan - low
        { baseRange: [2.0, 4.0], signalCount: 10 }, // Alex - high
        { baseRange: [0.5, 2.0], signalCount: 6 },  // Sophia - moderate
        { baseRange: [3.0, 5.0], signalCount: 7 },  // Ethan - critical
      ]

      for (let si = 0; si < students.length; si++) {
        const student = students[si]
        const profile = studentScoreProfiles[si]
        addLog(`Creating ${profile.signalCount} signals for ${student.first_name}...`)

        const signalInserts = []
        for (let j = 0; j < profile.signalCount; j++) {
          const cat = categories[j % categories.length]
          const daysAgo = Math.floor(Math.random() * 45) + 1
          const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString()
          const baseScore = +(profile.baseRange[0] + Math.random() * (profile.baseRange[1] - profile.baseRange[0])).toFixed(1)

          signalInserts.push({
            student_id: student.id,
            organization_id: orgId,
            category: cat.cat,
            index_type: cat.idx,
            base_score: Math.min(5, Math.max(0, baseScore)),
            source_type: sourceTypes[j % sourceTypes.length],
            evidence_flag: j % 3 === 0,
            free_text: freeTexts[j % freeTexts.length],
            reported_by: null,
            created_at: createdAt,
          })
        }

        const { error: sigErr } = await supabase.from('signals').insert(signalInserts)
        if (sigErr) throw new Error(`Signals for ${student.first_name}: ${sigErr.message}`)
        addLog(`✓ ${profile.signalCount} signals created for ${student.first_name}`)
      }

      // 4. Create snapshots for each student
      addLog('Creating snapshots with computed scores...')
      for (let si = 0; si < students.length; si++) {
        const student = students[si]
        const scoreProfile = studentScoreProfiles[si]
        const avgScore = (scoreProfile.baseRange[0] + scoreProfile.baseRange[1]) / 2

        // Create 3 snapshots (historical trend)
        const snapDates = [
          new Date(Date.now() - 40 * 86400000),
          new Date(Date.now() - 20 * 86400000),
          new Date(), // current
        ]

        const trendValues = [
          avgScore + 0.5,
          avgScore,
          avgScore - 0.3, // slight improvement for demo
        ]

        for (let sni = 0; sni < snapDates.length; sni++) {
          const ssiVal = +Math.min(5, Math.max(0, trendValues[sni])).toFixed(2)
          const trciVal = +Math.min(5, Math.max(0, trendValues[sni] * 0.7)).toFixed(2)
          const isCurrent = sni === snapDates.length - 1

          const ssiState = ssiVal >= 4 ? 'S4' : ssiVal >= 3 ? 'S3' : ssiVal >= 2 ? 'S2' : ssiVal >= 1 ? 'S1' : 'S0'
          const trciState = trciVal >= 4 ? 'C4' : trciVal >= 3 ? 'C3' : trciVal >= 2 ? 'C2' : trciVal >= 1 ? 'C1' : 'C0'

          const { data: snap, error: snapErr } = await supabase
            .from('snapshots')
            .insert({
              student_id: student.id,
              organization_id: orgId,
              ssi_value: ssiVal,
              ssi_state: ssiState,
              trci_value: trciVal,
              trci_state: trciState,
              ssi_trend: sni === 0 ? 'stable' : trendValues[sni] < trendValues[sni - 1] ? 'improving' : 'rising',
              trci_trend: 'stable',
              confidence: 0.65 + Math.random() * 0.25,
              is_current: isCurrent,
              computed_at: snapDates[sni].toISOString(),
            })
            .select('id')
            .single()
          if (snapErr) throw new Error(`Snapshot for ${student.first_name}: ${snapErr.message}`)

          // Only add explanations and category scores for current snapshot
          if (isCurrent && snap) {
            // Category scores
            const catScores = categories.map(c => ({
              student_id: student.id,
              snapshot_id: snap.id,
              category: c.cat,
              index_type: c.idx,
              score: +(Math.random() * avgScore).toFixed(1),
              signal_count: Math.floor(Math.random() * 4) + 1,
            }))

            await supabase.from('category_scores').insert(catScores)

            // Explanation
            const topDrivers = categories.slice(0, 3).map(c => ({
              category: c.cat,
              index_type: c.idx,
              contribution_pct: +(Math.random() * 40 + 10).toFixed(0),
              score: +(Math.random() * avgScore).toFixed(1),
              label: c.cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            }))

            const thresholdEvents = [
              { index_type: 'SSI', previous_state: 'S2', new_state: ssiState, direction: ssiVal > 2 ? 'up' : 'down', label: `Behavioral Escalation ${ssiVal > 2 ? 'increased' : 'decreased'} by 1 point.` },
              { index_type: 'SSI', previous_state: 'S1', new_state: ssiState, direction: 'down', label: 'Social/Emotional Distress decreased by 1 point.' },
              { index_type: 'SSI', previous_state: 'S2', new_state: ssiState, direction: 'down', label: 'Environmental Factors decreased by 1 point.' },
              { index_type: 'TRCI', previous_state: 'C1', new_state: trciState, direction: 'down', label: 'Digital/Peer Signals decreased by 1 point.' },
            ]

            await supabase.from('explanations').insert({
              snapshot_id: snap.id,
              top_drivers: topDrivers,
              threshold_events: thresholdEvents,
              summary_text: `${student.first_name} shows ${ssiVal >= 3 ? 'elevated' : ssiVal >= 2 ? 'moderate' : 'low'} support needs. ${ssiVal < 2 ? 'Current trajectory is stable with improving indicators.' : 'Continued monitoring and structured support is recommended.'}`,
              expanded_text: `Detailed analysis: SSI ${ssiVal.toFixed(2)} (${ssiState}), TRCI ${trciVal.toFixed(2)} (${trciState}). Primary drivers include emotional distress and behavioral stability factors. Source diversity is moderate with ${scoreProfile.signalCount} active signals from multiple reporter types.`,
            })
          }
        }

        addLog(`✓ Snapshots created for ${student.first_name}`)
      }

      addLog('')
      addLog('🎉 Demo data seeded successfully!')
      addLog(`   • 1 school (Northview High)`)
      addLog(`   • 5 students with varied risk profiles`)
      addLog(`   • ${studentScoreProfiles.reduce((s, p) => s + p.signalCount, 0)} signals`)
      addLog(`   • 15 snapshots (3 per student for trend history)`)
      addLog(`   • Category scores, explanations, and threshold events`)
      setStatus('done')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      addLog(`✗ Error: ${msg}`)
      setErrorMsg(msg)
      setStatus('error')
    }
  }

  function addLog(msg: string) {
    setLog(prev => [...prev, msg])
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <Database className="w-5 h-5 text-brand-600" />
          <h1 className="text-xl font-bold text-gray-900">Seed Demo Data</h1>
        </div>
        <p className="text-sm text-gray-500">
          Populate the database with realistic demo students, signals, snapshots, and analysis data.
        </p>
      </div>

      {status === 'idle' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to seed</h3>
          <p className="text-sm text-gray-500 mb-6">
            This will create 5 students at Northview High with varied risk profiles, signals, snapshots, category scores, and AI analysis data.
          </p>
          <button
            onClick={seed}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            <Database className="w-4 h-4" />
            Seed Demo Data
          </button>
        </div>
      )}

      {status === 'running' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-900">Seeding...</h3>
          </div>
          <LogDisplay log={log} />
        </div>
      )}

      {status === 'done' && (
        <div className="bg-white rounded-xl border border-green-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-green-900">Done!</h3>
          </div>
          <LogDisplay log={log} />
          <button
            onClick={() => navigate('/queue')}
            className="mt-4 inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Go to Attention Queue →
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900">Error</h3>
          </div>
          <p className="text-sm text-red-600 mb-3">{errorMsg}</p>
          <LogDisplay log={log} />
          <button
            onClick={() => { setStatus('idle'); setLog([]); setErrorMsg('') }}
            className="mt-4 text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  )
}

function LogDisplay({ log }: { log: string[] }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 max-h-80 overflow-y-auto">
      {log.map((line, i) => (
        <p key={i} className="text-xs font-mono text-gray-600 leading-relaxed">
          {line}
        </p>
      ))}
    </div>
  )
}
