import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function signIn(email: string, password: string): Promise<boolean> {
    setLoading(true)
    setError(null)

    const { error: err } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)
    if (err) {
      setError('البريد الإلكتروني أو كلمة المرور غلط — حاول تاني')
      return false
    }
    return true
  }

  async function signInWithGoogle(): Promise<void> {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  { redirectTo: window.location.origin },
    })
    setLoading(false)
  }

  return { loading, error, signIn, signInWithGoogle }
}
