import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../app/providers/LangProvider'

type Mode = 'request' | 'sent' | 'update' | 'done'

export function ResetPasswordPage() {
  const { t, fa } = useLang()
  const navigate = useNavigate()

  const [mode,     setMode]     = useState<Mode>('request')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  // Supabase sends the user back with a session fragment — detect it
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('type=recovery')) {
      setMode('update')
    }
  }, [])

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setMode('sent')
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('كلمتا المرور غير متطابقتين'); return }
    if (password.length < 8)  { setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setMode('done')
    setTimeout(() => navigate('/login'), 2000)
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 py-12">
      <div className="w-20 h-20 rounded-2xl bg-teal flex items-center justify-center mb-8 shadow-lg">
        <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      </div>

      <div className="w-full max-w-sm">
        {mode === 'request' && (
          <form onSubmit={handleRequest} className="space-y-4">
            <h1 className={`text-white text-xl font-bold ${fa} text-center mb-6`}>استعادة كلمة المرور</h1>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              dir="ltr"
              required
              className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"
            />
            {error && <p className={`text-red-400 text-sm ${fa}`}>{error}</p>}
            <button
              type="submit"
              disabled={loading || !email}
              className={`w-full py-4 rounded-xl bg-teal text-white font-bold ${fa} disabled:opacity-50`}
            >
              {loading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className={`w-full py-3 text-white/60 text-sm ${fa}`}
            >
              {t('back')}
            </button>
          </form>
        )}

        {mode === 'sent' && (
          <div className="text-center space-y-4">
            <p className="text-5xl">📧</p>
            <p className={`text-white font-bold text-lg ${fa}`}>تم إرسال الرابط</p>
            <p className={`text-white/60 text-sm ${fa}`}>تحقق من بريدك الإلكتروني واضغط على الرابط لإعادة تعيين كلمة المرور</p>
            <button onClick={() => navigate('/login')} className={`text-teal text-sm ${fa} underline`}>
              العودة لتسجيل الدخول
            </button>
          </div>
        )}

        {mode === 'update' && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <h1 className={`text-white text-xl font-bold ${fa} text-center mb-6`}>تعيين كلمة مرور جديدة</h1>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="كلمة المرور الجديدة"
              dir="ltr"
              required
              minLength={8}
              className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"
            />
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="تأكيد كلمة المرور"
              dir="ltr"
              required
              className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"
            />
            {error && <p className={`text-red-400 text-sm ${fa}`}>{error}</p>}
            <button
              type="submit"
              disabled={loading || !password || !confirm}
              className={`w-full py-4 rounded-xl bg-teal text-white font-bold ${fa} disabled:opacity-50`}
            >
              {loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
            </button>
          </form>
        )}

        {mode === 'done' && (
          <div className="text-center space-y-4">
            <p className="text-5xl">✅</p>
            <p className={`text-white font-bold text-lg ${fa}`}>تم تغيير كلمة المرور بنجاح</p>
            <p className={`text-white/60 text-sm ${fa}`}>جاري تحويلك لصفحة تسجيل الدخول...</p>
          </div>
        )}
      </div>
    </div>
  )
}

ResetPasswordPage.displayName = 'ResetPasswordPage'
