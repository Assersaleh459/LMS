import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'

export function LoginPage() {
  const [phone, setPhone] = useState('')
  const { loading, error, sendOTP, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    const ok = await sendOTP(phone)
    if (ok) navigate('/login/otp', { state: { phone } })
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 py-12">
      {/* Logo placeholder */}
      <div className="w-24 h-24 rounded-2xl bg-teal flex items-center justify-center mb-8">
        <span className="text-white text-4xl font-bold font-arabic">م</span>
      </div>

      <h1 className="text-white text-2xl font-bold font-arabic mb-2 text-center">
        أهلاً بك في مدرستي
      </h1>
      <p className="text-white/60 text-sm font-arabic mb-10 text-center">
        مدرسة الفارابي للغات
      </p>

      <form onSubmit={handleSendOTP} className="w-full max-w-sm space-y-4">
        <div>
          <label className="block text-white/80 text-sm font-arabic mb-2 text-right">
            رقم الهاتف
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            dir="ltr"
            className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-center text-xl tracking-widest focus:outline-none focus:border-teal-light focus:ring-2 focus:ring-teal-light/30"
            maxLength={11}
            required
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm font-arabic text-right">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || phone.length < 10}
          className="w-full py-4 rounded-xl bg-teal text-white font-bold font-arabic text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-light transition-colors"
        >
          {loading ? 'جاري الإرسال...' : 'إرسال كود التحقق'}
        </button>
      </form>

      <div className="mt-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/20" />
          <span className="text-white/40 text-xs font-arabic">أو</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-white text-gray-800 font-medium font-arabic flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {/* Google icon SVG */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>أو تسجيل الدخول بـ Google</span>
        </button>
      </div>
    </div>
  )
}

LoginPage.displayName = 'LoginPage'
