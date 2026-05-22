import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function sendOTP(phone: string): Promise<boolean> {
    setLoading(true)
    setError(null)

    // Normalize Egyptian phone: 01XXXXXXXXX → +201XXXXXXXXX
    const normalized = phone.startsWith('+2')
      ? phone
      : '+2' + phone.replace(/^0/, '')

    const { error: err } = await supabase.auth.signInWithOtp({ phone: normalized })

    setLoading(false)
    if (err) { setError('فشل إرسال الكود — تحقق من الرقم وحاول تاني'); return false }
    return true
  }

  async function verifyOTP(phone: string, token: string): Promise<boolean> {
    setLoading(true)
    setError(null)

    const normalized = phone.startsWith('+2')
      ? phone
      : '+2' + phone.replace(/^0/, '')

    const { error: err } = await supabase.auth.verifyOtp({
      phone: normalized,
      token,
      type: 'sms',
    })

    setLoading(false)
    if (err) { setError('الكود غلط أو انتهت صلاحيته — حاول تاني'); return false }
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

  return { loading, error, sendOTP, verifyOTP, signInWithGoogle }
}
