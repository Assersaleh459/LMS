import { ProgressBar } from '../../components/ui/ProgressBar'
import { toArabicNumerals } from '../../lib/arabic'
import { useLang } from '../../app/providers/LangProvider'

interface AttendanceSummaryBarProps {
  present:     number
  absent:      number
  pending:     number
  total:       number
  progressPct: number
}

export function AttendanceSummaryBar({ present, absent, pending, progressPct }: AttendanceSummaryBarProps) {
  const { t, fa } = useLang()
  return (
    <div className="bg-white border-b border-gray-100 px-4 py-3 space-y-2">
      <div className={`flex items-center justify-between text-sm ${fa}`}>
        <span className="text-green-700 font-semibold">
          {t('present')}: {toArabicNumerals(present)}
        </span>
        <span className="text-red-600 font-semibold">
          {t('absent')}: {toArabicNumerals(absent)}
        </span>
        <span className="text-gray-500">
          {t('pending')}: {toArabicNumerals(pending)}
        </span>
      </div>
      <ProgressBar
        value={progressPct}
        color={progressPct >= 80 ? 'bg-green-500' : progressPct >= 50 ? 'bg-yellow-400' : 'bg-red-400'}
        height="h-2"
      />
    </div>
  )
}

AttendanceSummaryBar.displayName = 'AttendanceSummaryBar'
