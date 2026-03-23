import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile, SIMRole } from '@/lib/database.types'
import type { Session } from '@supabase/supabase-js'
import { SIM_WRITE_ACCESS } from '@/lib/constants'

export interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    setProfile(data)
    setLoading(false)
  }

  return { session, profile, loading }
}

export function useRole(): SIMRole | null {
  const { profile } = useAuth()
  return profile?.role ?? null
}

export function useCanSubmitSignals(): boolean {
  const role = useRole()
  return SIM_WRITE_ACCESS.includes(role as SIMRole)
}
