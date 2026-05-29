import { createContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import type { UserRole } from '../../types/enums'
import type { UserProfile } from '../../types/domain'

type AuthState = {
  session:    Session | null
  profile:    UserProfile | null
  role:       UserRole | null
  schoolId:   string | null
  loading:    boolean
  signOut:    () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session,  setSession]  = useState<Session | null>(null)
  const [profile,  setProfile]  = useState<UserProfile | null>(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION on mount — no need for a separate getSession call.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
      if (sess) loadProfile(sess.user.id)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    setLoading(true)
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      setProfile(data as UserProfile)
      localStorage.setItem('school_id', data.school_id)

      // Log login event
      ;(supabase as any).from('system_audit_log').insert({
        school_id:   data.school_id,
        actor_id:    data.id,
        actor_name:  `${data.first_name_ar} ${data.last_name_ar}`,
        actor_role:  data.role,
        action:      'LOGIN',
        entity_type: 'login',
        entity_desc: data.email,
      }).then(() => {})
    }
    setLoading(false)
  }

  async function signOut() {
    // Log logout event before clearing session
    const profileSnap = profile
    if (profileSnap) {
      await (supabase as any).from('system_audit_log').insert({
        school_id:   profileSnap.school_id,
        actor_id:    profileSnap.id,
        actor_name:  `${profileSnap.first_name_ar} ${profileSnap.last_name_ar}`,
        actor_role:  profileSnap.role,
        action:      'LOGOUT',
        entity_type: 'login',
        entity_desc: (profileSnap as any).email ?? null,
      })
    }
    await supabase.auth.signOut()
    localStorage.removeItem('school_id')
  }

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      role:     profile?.role ?? null,
      schoolId: profile?.school_id ?? null,
      loading,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
