import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Plus, Upload, X, Check, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { School } from '@/lib/database.types'

type Tab = 'list' | 'add' | 'bulk'

export default function SchoolList() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('list')
  const [schoolName, setSchoolName] = useState('')
  const [schoolCity, setSchoolCity] = useState('')
  const [schoolState, setSchoolState] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [bulkResult, setBulkResult] = useState<{ added: number; skipped: string[] } | null>(null)

  const orgId = profile?.organization_id

  // Fetch schools
  const { data: schools = [], isLoading } = useQuery({
    queryKey: ['schools', orgId],
    queryFn: async () => {
      if (!orgId) return []
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('organization_id', orgId)
        .order('name')
      if (error) throw error
      return data as unknown as School[]
    },
    enabled: !!orgId,
  })

  // Add single school
  const addSchool = useMutation({
    mutationFn: async (school: { name: string; city: string; state: string }) => {
      if (!orgId) throw new Error('No organization')
      const { error } = await supabase.from('schools').insert({
        organization_id: orgId,
        name: school.name.trim(),
        city: school.city.trim() || null,
        state: school.state.trim() || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      setSchoolName('')
      setSchoolCity('')
      setSchoolState('')
      setTab('list')
    },
  })

  // Bulk add schools
  const bulkAdd = useMutation({
    mutationFn: async (names: string[]) => {
      if (!orgId) throw new Error('No organization')
      const existingNames = new Set(schools.map(s => s.name.toLowerCase()))
      const skipped: string[] = []
      const toInsert: { organization_id: string; name: string }[] = []

      for (const raw of names) {
        const name = raw.trim()
        if (!name) continue
        if (existingNames.has(name.toLowerCase())) {
          skipped.push(name)
          continue
        }
        existingNames.add(name.toLowerCase())
        toInsert.push({ organization_id: orgId, name })
      }

      if (toInsert.length > 0) {
        const { error } = await supabase.from('schools').insert(toInsert)
        if (error) throw error
      }

      return { added: toInsert.length, skipped }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      setBulkText('')
      setBulkResult(result)
    },
  })

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!schoolName.trim()) return
    addSchool.mutate({ name: schoolName, city: schoolCity, state: schoolState })
  }

  function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault()
    const names = bulkText.split('\n').map(l => l.trim()).filter(Boolean)
    if (names.length === 0) return
    setBulkResult(null)
    bulkAdd.mutate(names)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Schools</h1>
          <p className="text-sm text-gray-500 mt-1">
            {schools.length} school{schools.length !== 1 ? 's' : ''} in your organization
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setTab('add'); setBulkResult(null) }}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              tab === 'add'
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            )}
          >
            <Plus className="w-4 h-4" />
            Add School
          </button>
          <button
            onClick={() => { setTab('bulk'); setBulkResult(null) }}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              tab === 'bulk'
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            )}
          >
            <Upload className="w-4 h-4" />
            Bulk Upload
          </button>
        </div>
      </div>

      {/* Add Single School */}
      {tab === 'add' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Add a School</h2>
            <button onClick={() => setTab('list')} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
              <input
                type="text"
                value={schoolName}
                onChange={e => setSchoolName(e.target.value)}
                required
                placeholder="e.g. Lincoln Elementary"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={schoolCity}
                  onChange={e => setSchoolCity(e.target.value)}
                  placeholder="e.g. Atlanta"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={schoolState}
                  onChange={e => setSchoolState(e.target.value)}
                  placeholder="e.g. GA"
                  maxLength={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent uppercase"
                />
              </div>
            </div>
            {addSchool.isError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                {(addSchool.error as Error).message}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setTab('list')} className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
                Cancel
              </button>
              <button
                type="submit"
                disabled={addSchool.isPending}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
              >
                {addSchool.isPending ? 'Adding...' : 'Add School'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Upload */}
      {tab === 'bulk' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Bulk Upload Schools</h2>
            <button onClick={() => setTab('list')} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Paste one school name per line. Duplicates will be skipped automatically.
          </p>
          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              rows={10}
              placeholder={"Lincoln Elementary\nWashington Middle School\nJefferson High School\nRoosevelt Academy"}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y"
            />
            {bulkResult && (
              <div className={cn(
                'text-sm rounded-lg px-3 py-2 border',
                bulkResult.added > 0
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              )}>
                <div className="flex items-center gap-1.5 mb-1">
                  {bulkResult.added > 0
                    ? <Check className="w-4 h-4" />
                    : <AlertCircle className="w-4 h-4" />
                  }
                  <span className="font-medium">
                    {bulkResult.added} school{bulkResult.added !== 1 ? 's' : ''} added
                  </span>
                </div>
                {bulkResult.skipped.length > 0 && (
                  <p className="text-xs mt-1">
                    Skipped (already exist): {bulkResult.skipped.join(', ')}
                  </p>
                )}
              </div>
            )}
            {bulkAdd.isError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                {(bulkAdd.error as Error).message}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setTab('list')} className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">
                Cancel
              </button>
              <button
                type="submit"
                disabled={bulkAdd.isPending || !bulkText.trim()}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
              >
                {bulkAdd.isPending ? 'Uploading...' : 'Upload Schools'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* School List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading schools...</div>
        ) : schools.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900">No schools yet</p>
            <p className="text-sm text-gray-500 mt-1">Add schools individually or use bulk upload to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left font-medium text-gray-600 px-4 py-3">School Name</th>
                <th className="text-left font-medium text-gray-600 px-4 py-3">City</th>
                <th className="text-left font-medium text-gray-600 px-4 py-3">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schools.map(school => (
                <tr key={school.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      {school.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{school.city || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{school.state || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
