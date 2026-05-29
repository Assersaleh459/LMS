import { useNavigate } from 'react-router-dom'
import { useLang } from '../../app/providers/LangProvider'
import { useUnreadCount } from '../../hooks/useUnreadCount'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useContext } from 'react'

interface AppBarProps {
  title:     string
  subtitle?: string
  onBack?:   () => void
  action?:   React.ReactNode
  onLogout?: () => void  // kept for backwards compat — logout is now always shown when session exists
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AppBar({ title, subtitle, onBack, action, onLogout: _onLogout }: AppBarProps) {
  const { lang, fa, toggleLang } = useLang()
  const navigate = useNavigate()
  const auth = useContext(AuthContext)
  const unread = useUnreadCount()

  const showBell = !!auth?.session

  return (
    <header className="bg-navy text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
      {onBack && (
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors icon-back"
          aria-label="back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div className="flex-1 min-w-0">
        <h1 className={`font-bold text-base leading-tight truncate ${fa}`}>{title}</h1>
        {subtitle && (
          <p className={`text-white/60 text-xs mt-0.5 truncate ${fa}`}>{subtitle}</p>
        )}
      </div>

      {action && <div className="flex-shrink-0">{action}</div>}

      {/* Notification bell */}
      {showBell && (
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
          aria-label="notifications"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>
      )}

      {/* Language toggle */}
      <button
        onClick={toggleLang}
        className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-xs font-bold tracking-wide flex-shrink-0"
        aria-label="toggle language"
      >
        {lang === 'ar' ? 'EN' : 'ع'}
      </button>

      {/* Logout — always shown when logged in */}
      {auth?.session && (
        <button
          onClick={auth.signOut}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
          aria-label="logout"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      )}
    </header>
  )
}

AppBar.displayName = 'AppBar'
