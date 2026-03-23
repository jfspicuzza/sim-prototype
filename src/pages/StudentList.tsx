import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Pencil } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { supabase } from '@/lib/supabase'
import { useAuth, useCanSubmitSignals } from '@/hooks/useAuth'
import { GRADE_OPTIONS } from '@/lib/constants'
import { StateBadge } from '@/components/ui/StateBadge'
import type { Student } from '@/lib/database.types'

type StudentWithSnapshot = Student & {
  snapshots: {
    ssi_state: string
    trci_state: string
  }[] | null
}

type StudentFormData = {
  first_name: string
  last_name: string
  grade: string
  school_id: string
}

const EMPTY_FORM: StudentFormData = {
  first_name: '',
  last_name: '',
  grade: '',
  school_id: '',
}

export default function StudentList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  const canWrite = useCanSubmitSignals()

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [form, setForm] = useState<StudentFormData>(EMPTY_FORM)
  const [formError, setFormError] = useState('')

  // Fetch students with current snapshot joined
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['sim-students', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*, snapshots(ssi_state, trci_state)')
        .eq('is_active', true)
        .eq('snapshots.is_current', true)
        .order('last_name', { ascending: true })
      if (error) throw error
      return (data ?? []) as unknown as StudentWithSnapshot[]
    },
    enabled: !!profile?.organization_id,
  })

  // Fetch schools for the dropdown
  const { data: schools = [] } = useQuery({
    queryKey: ['sim-schools', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .eq('organization_id', profile!.organization_id!)
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return data ?? []
    },
    enabled: !!profile?.organization_id,
  })

  // Create / Update mutation
  const saveMutation = useMutation({
    mutationFn: async (formData: StudentFormData) => {
      if (editingStudent) {
        const { error } = await supabase
          .from('students')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            grade: formData.grade || null,
            school_id: formData.school_id || null,
          })
          .eq('id', editingStudent.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('students')
          .insert({
            first_name: formData.first_name,
            last_name: formData.last_name,
            grade: formData.grade || null,
            school_id: formData.school_id || null,
            organization_id: profile!.organization_id!,
          })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sim-students'] })
      closeModal()
    },
    onError: (err) => {
      setFormError(err instanceof Error ? err.message : 'Failed to save student')
    },
  })

  function openAddModal() {
    setEditingStudent(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setModalOpen(true)
  }

  function openEditModal(student: Student, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingStudent(student)
    setForm({
      first_name: student.first_name,
      last_name: student.last_name,
      grade: student.grade ?? '',
      school_id: student.school_id ?? '',
    })
    setFormError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingStudent(null)
    setForm(EMPTY_FORM)
    setFormError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setFormError('First and last name are required.')
      return
    }
    saveMutation.mutate(form)
  }

  // Client-side search filter
  const filtered = students.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.first_name.toLowerCase().includes(q) ||
      s.last_name.toLowerCase().includes(q) ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      `${s.last_name}, ${s.first_name}`.toLowerCase().includes(q)
    )
  })

  // Find school name by id
  function schoolName(schoolId: string | null): string {
    if (!schoolId) return '\u2014'
    const school = schools.find((s) => s.id === schoolId)
    return school?.name ?? '\u2014'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} student{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canWrite && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search students by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          {search ? 'No students match your search.' : 'No students found. Add a student to get started.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Name</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Grade</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">School</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">SSI State</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">TRCI State</th>
                {canWrite && (
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((student) => {
                const snap = student.snapshots && student.snapshots.length > 0 ? student.snapshots[0] : null
                return (
                  <tr
                    key={student.id}
                    onClick={() => navigate(`/student/${student.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {student.last_name}, {student.first_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {student.grade ?? '\u2014'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {schoolName(student.school_id)}
                    </td>
                    <td className="px-4 py-3">
                      {snap ? <StateBadge state={snap.ssi_state} /> : <span className="text-sm text-gray-400">&mdash;</span>}
                    </td>
                    <td className="px-4 py-3">
                      {snap ? <StateBadge state={snap.trci_state} /> : <span className="text-sm text-gray-400">&mdash;</span>}
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => openEditModal(student, e)}
                          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 transition-colors"
                          title="Edit student"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl p-6 w-full max-w-md z-50">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              {editingStudent ? 'Edit Student' : 'Add Student'}
            </Dialog.Title>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                <input
                  type="text"
                  required
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                <input
                  type="text"
                  required
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Grade</label>
                <select
                  value={form.grade}
                  onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
                >
                  <option value="">Select grade...</option>
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">School</label>
                <select
                  value={form.school_id}
                  onChange={(e) => setForm((f) => ({ ...f, school_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
                >
                  <option value="">Select school...</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveMutation.isPending ? 'Saving...' : editingStudent ? 'Save Changes' : 'Add Student'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
