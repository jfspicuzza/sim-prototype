import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { SSI_CATEGORIES, TRCI_CATEGORIES, SOURCE_TYPE_OPTIONS } from '@/lib/constants'
import { computeFullSnapshot } from '@/lib/scoring'
import type { IndexType, SourceType } from '@/lib/database.types'

type SignalFormData = {
  studentId: string
  category: string
  indexType: IndexType
  baseScore: number
  sourceType: SourceType
  evidenceFlag: boolean
  freeText: string
}

export default function SignalIntake() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { studentId: paramStudentId } = useParams<{ studentId: string }>()
  const { profile } = useAuth()

  const [form, setForm] = useState<SignalFormData>({
    studentId: paramStudentId ?? '',
    category: '',
    indexType: 'SSI',
    baseScore: 2.5,
    sourceType: 'teacher',
    evidenceFlag: false,
    freeText: '',
  })
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Fetch students for the dropdown
  const { data: students = [] } = useQuery({
    queryKey: ['sim-students-select', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .eq('is_active', true)
        .order('last_name')
      if (error) throw error
      return data ?? []
    },
    enabled: !!profile?.organization_id,
  })

  // Auto-detect index type from category
  function handleCategoryChange(category: string) {
    let indexType: IndexType = 'SSI'
    const isSSI = SSI_CATEGORIES.some((c) => c.key === category)
    const isTRCI = TRCI_CATEGORIES.some((c) => c.key === category)
    if (isTRCI) indexType = 'TRCI'
    else if (isSSI) indexType = 'SSI'
    setForm((f) => ({ ...f, category, indexType }))
  }

  const submitSignal = useMutation({
    mutationFn: async (formData: SignalFormData) => {
      // 1. Insert signal
      const { error: signalError } = await supabase
        .from('signals')
        .insert({
          student_id: formData.studentId,
          organization_id: profile!.organization_id!,
          category: formData.category,
          index_type: formData.indexType,
          base_score: formData.baseScore,
          source_type: formData.sourceType,
          evidence_flag: formData.evidenceFlag,
          free_text: formData.freeText || null,
          reported_by: profile!.id,
        })
        .select()
        .single()
      if (signalError) throw signalError

      // 2. Fetch ALL active signals for this student
      const { data: allSignals, error: signalsError } = await supabase
        .from('signals')
        .select('*')
        .eq('student_id', formData.studentId)
        .eq('is_active', true)
      if (signalsError) throw signalsError

      // 3. Fetch previous current snapshot
      const { data: prevSnapshot } = await supabase
        .from('snapshots')
        .select('*')
        .eq('student_id', formData.studentId)
        .eq('is_current', true)
        .maybeSingle()

      // 4. Run scoring engine
      const result = computeFullSnapshot(allSignals!, prevSnapshot, new Date())

      // 5. Mark previous snapshot as not current
      if (prevSnapshot) {
        await supabase.from('snapshots').update({ is_current: false }).eq('id', prevSnapshot.id)
      }

      // 6. Insert new snapshot
      const { data: newSnapshot, error: snapError } = await supabase
        .from('snapshots')
        .insert({
          student_id: formData.studentId,
          organization_id: profile!.organization_id!,
          ssi_value: result.ssiValue,
          ssi_state: result.ssiState,
          trci_value: result.trciValue,
          trci_state: result.trciState,
          ssi_trend: result.ssiTrend,
          trci_trend: result.trciTrend,
          confidence: result.confidence,
          is_current: true,
        })
        .select()
        .single()
      if (snapError) throw snapError

      // 7. Insert category scores
      if (result.categoryScores.length > 0) {
        await supabase.from('category_scores').insert(
          result.categoryScores.map((cs) => ({
            student_id: formData.studentId,
            snapshot_id: newSnapshot!.id,
            category: cs.category,
            index_type: cs.indexType as 'SSI' | 'TRCI',
            score: cs.score,
            signal_count: cs.signalCount,
          }))
        )
      }

      // 8. Insert explanation
      await supabase.from('explanations').insert({
        snapshot_id: newSnapshot!.id,
        top_drivers: result.explanation.topDrivers,
        threshold_events: result.explanation.thresholdEvents,
        summary_text: result.explanation.summaryText,
        expanded_text: result.explanation.expandedText,
      })

      return { studentId: formData.studentId }
    },
    onSuccess: (data) => {
      setSubmitSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['sim-students'] })
      queryClient.invalidateQueries({ queryKey: ['sim-snapshot', data.studentId] })
      queryClient.invalidateQueries({ queryKey: ['attention-queue'] })
      navigate(`/student/${data.studentId}`)
    },
    onError: (err) => {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit signal')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError('')
    setSubmitSuccess(false)

    if (!form.studentId) {
      setSubmitError('Please select a student.')
      return
    }
    if (!form.category) {
      setSubmitError('Please select a category.')
      return
    }

    submitSignal.mutate(form)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Submit Signal</h1>
        <p className="text-sm text-gray-500 mt-1">
          Record an observation or concern. The system will recalculate the student&apos;s indices automatically.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
        {/* Student Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Student</label>
          <select
            value={form.studentId}
            onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
          >
            <option value="">Select a student...</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.last_name}, {s.first_name}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
          <select
            value={form.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
          >
            <option value="">Select a category...</option>
            <optgroup label="SSI \u2014 Student Support Index">
              {SSI_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </optgroup>
            <optgroup label="TRCI \u2014 Threat Risk & Concern Index">
              {TRCI_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </optgroup>
          </select>
          {form.category && (
            <p className="text-xs text-gray-500 mt-1">
              Index: <span className="font-medium">{form.indexType}</span>
            </p>
          )}
        </div>

        {/* Base Score */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Base Score
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={form.baseScore}
              onChange={(e) => setForm((f) => ({ ...f, baseScore: parseFloat(e.target.value) }))}
              className="flex-1 accent-brand-600"
            />
            <span className="text-lg font-semibold text-gray-900 tabular-nums w-12 text-center">
              {form.baseScore.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0 \u2014 No concern</span>
            <span>5 \u2014 Severe</span>
          </div>
        </div>

        {/* Source Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Source Type</label>
          <select
            value={form.sourceType}
            onChange={(e) => setForm((f) => ({ ...f, sourceType: e.target.value as SourceType }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
          >
            {SOURCE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Evidence Flag */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="evidence-flag"
            checked={form.evidenceFlag}
            onChange={(e) => setForm((f) => ({ ...f, evidenceFlag: e.target.checked }))}
            className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <label htmlFor="evidence-flag" className="text-sm text-gray-700">
            Supported by documented evidence
          </label>
        </div>

        {/* Free Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Additional Context <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={form.freeText}
            onChange={(e) => setForm((f) => ({ ...f, freeText: e.target.value }))}
            rows={3}
            placeholder="Describe the observation or concern..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Error */}
        {submitError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Success */}
        {submitSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2">
            Signal submitted successfully. Redirecting...
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitSignal.isPending}
          className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitSignal.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Signal
            </>
          )}
        </button>
      </form>
    </div>
  )
}
