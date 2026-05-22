interface AppBarProps {
  title:     string
  subtitle?: string
  onBack?:   () => void
  action?:   React.ReactNode
}

export function AppBar({ title, subtitle, onBack, action }: AppBarProps) {
  return (
    <header className="bg-navy text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
      {onBack && (
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors icon-back"
          aria-label="رجوع"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div className="flex-1 min-w-0">
        <h1 className="font-bold font-arabic text-base leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-white/60 text-xs font-arabic mt-0.5 truncate">{subtitle}</p>
        )}
      </div>

      {action && <div className="flex-shrink-0">{action}</div>}
    </header>
  )
}

AppBar.displayName = 'AppBar'
