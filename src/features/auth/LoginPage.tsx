import { useContext, useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { useLang } from '../../app/providers/LangProvider'
import { AuthContext } from '../../app/providers/AuthProvider'

const ROLE_ROUTES: Record<string, string> = {
  subject_teacher:        '/teacher/attendance',
  homeroom_teacher:       '/teacher/attendance',
  kg_primary_student:     '/student/primary',
  prep_secondary_student: '/student/secondary',
  parent:                 '/parent',
  school_admin:           '/admin',
  chain_admin:            '/admin',
  it_admin:               '/admin',
  moe_supervisor:         '/admin',
}

export function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const { loading: authLoading, error, signIn } = useAuth()
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const { t, ta, fa } = useLang()

  if (auth && !auth.loading && auth.session && auth.role) {
    return <Navigate to={ROLE_ROUTES[auth.role] ?? '/'} replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ok = await signIn(email.trim(), password)
    if (ok) navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 py-12">

      {/* Logo */}
      <div className="w-24 h-24 rounded-2xl bg-teal flex items-center justify-center mb-8 shadow-lg">
        <span className={`text-white text-4xl font-bold ${fa}`}>م</span>
      </div>

      <h1 className={`text-white text-2xl font-bold ${fa} mb-1 text-center`}>
        {t('login_title')}
      </h1>
      <p className={`text-white/60 text-sm ${fa} mb-10 text-center`}>
        {t('login_sub')}
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">

        {/* Email */}
        <div>
          <label className={`block text-white/80 text-sm ${fa} mb-2 ${ta}`}>
            {t('email')}
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t('email_ph')}
            dir="ltr"
            autoComplete="email"
            className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-left focus:outline-none focus:border-teal-light focus:ring-2 focus:ring-teal-light/30"
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className={`block text-white/80 text-sm ${fa} mb-2 ${ta}`}>
            {t('password')}
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('password_ph')}
              dir="ltr"
              autoComplete="current-password"
              className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-left focus:outline-none focus:border-teal-light focus:ring-2 focus:ring-teal-light/30 pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
              tabIndex={-1}
            >
              {showPass ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className={`text-red-400 text-sm ${fa} ${ta}`}>{t('login_err')}</p>
        )}

        <button
          type="submit"
          disabled={authLoading || !email || !password}
          className={`w-full py-4 rounded-xl bg-teal text-white font-bold ${fa} text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-light transition-colors`}
        >
          {authLoading ? t('login_loading') : t('login_btn')}
        </button>
      </form>

    </div>
  )
}

LoginPage.displayName = 'LoginPage'
