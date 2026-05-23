import { ProgressBar } from '../../components/ui/ProgressBar'
import { toArabicNumerals } from '../../lib/arabic'
import { useLang } from '../../app/providers/LangProvider'

interface SchoolHealthScoreProps {
  attendanceRate: number
}

function healthKey(rate: number): { key: string; color: string } {
  if (rate >= 90) return { key: 'health_excellent',    color: '#1e8449' }
  if (rate >= 75) return { key: 'health_good',         color: '#f39c12' }
  return              { key: 'health_needs_follow',     color: '#c0392b' }
}

export function SchoolHealthScore({ attendanceRate }: SchoolHealthScoreProps) {
  const { t, fa } = useLang()
  const { key, color } = healthKey(attendanceRate)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mx-4">
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-bold ${fa}`} style={{ color }}>{t(key)}</span>
        <div>
          <span className={`text-2xl font-bold text-gray-900 ${fa}`}>
            {toArabicNumerals(attendanceRate)}%
          </span>
          <span className={`text-xs text-gray-500 ${fa} mr-1`}>{t('attend_rate')}</span>
        </div>
        <h3 className={`font-bold ${fa} text-gray-900 text-sm`}>{t('school_health')}</h3>
      </div>
      <ProgressBar
        value={attendanceRate}
        color={attendanceRate >= 90 ? 'bg-green-500' : attendanceRate >= 75 ? 'bg-yellow-400' : 'bg-red-500'}
        height="h-3"
      />
    </div>
  )
}

SchoolHealthScore.displayName = 'SchoolHealthScore'
