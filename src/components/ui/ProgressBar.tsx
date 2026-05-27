import { useLang } from '../../app/providers/LangProvider'

interface ProgressBarProps {
  value:      number   // 0–100
  color?:     string   // tailwind bg-* class
  height?:    string   // tailwind h-* class
  showLabel?: boolean
}

export function ProgressBar({ value, color = 'bg-teal', height = 'h-2', showLabel = false }: ProgressBarProps) {
  const { fa } = useLang()
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 bg-gray-200 rounded-full overflow-hidden ${height} progress-bar`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs text-gray-500 ${fa} w-8 text-left`}>{Math.round(clamped)}%</span>
      )}
    </div>
  )
}

ProgressBar.displayName = 'ProgressBar'
