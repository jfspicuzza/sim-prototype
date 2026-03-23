import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export function useAttentionQueue() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['attention-queue', profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('snapshots')
        .select('*, students!inner(id, first_name, last_name, grade, school_id, is_active, schools(name)), explanations(*)')
        .eq('is_current', true)
        .eq('students.is_active', true)
        .order('computed_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!profile?.organization_id,
  })
}

// Urgency sorting: TRCI state value * 10 + trend multiplier + SSI state value * 2
export function urgencyScore(snapshot: { trci_state: string; trci_trend: string; ssi_state: string }): number {
  const trciVal: Record<string, number> = { C0: 0, C1: 1, C2: 2, C3: 3, C4: 4 }
  const ssiVal: Record<string, number> = { S0: 0, S1: 1, S2: 2, S3: 3, S4: 4 }
  const trendMult: Record<string, number> = { rising_rapidly: 3, rising: 1.5, stable: 0, improving: -0.5 }
  return (trciVal[snapshot.trci_state] ?? 0) * 10 + (trendMult[snapshot.trci_trend] ?? 0) + (ssiVal[snapshot.ssi_state] ?? 0) * 2
}
