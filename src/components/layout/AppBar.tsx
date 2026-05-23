import { useLang } from '../../app/providers/LangProvider'

interface AppBarProps {
  title:      string
  subtitle?:  string
  onBack?:    () => void
  action?:    React.ReactNode
  onLogout?:  () => void
}

export function AppBar({ title, subtitle, onBack, action, onLogout }: AppBarProps) {
  const { lang, toggleLang } = useLang()
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
        <h1 className={`font-bold text-base leading-tight truncate ${lang === 'ar' ? 'font-arabic' : ''}`}>{title}</h1>
        {subtitle && (
          <p className={`text-white/60 text-xs mt-0.5 truncate ${lang === 'ar' ? 'font-arabic' : ''}`}>{subtitle}</p>
        )}
      </div>

      {action && <div className="flex-shrink-0">{action}</div>}

      {/* Language toggle */}
      <button
        onClick={toggleLang}
        className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-xs font-bold tracking-wide flex-shrink-0"
        aria-label="toggle language"
      >
        {lang === 'ar' ? 'EN' : 'ع'}
      </button>

      {onLogout && (
        <button
          onClick={onLogout}
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
