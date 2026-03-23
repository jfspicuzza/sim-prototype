import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useStudentSnapshot(studentId: string | undefined) {
  return useQuery({
    queryKey: ['sim-snapshot', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('snapshots')
        .select('*, explanations(*), category_scores(*)')
        .eq('student_id', studentId!)
        .eq('is_current', true)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!studentId,
  })
}
