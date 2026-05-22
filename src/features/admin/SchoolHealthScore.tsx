import { ProgressBar } from '../../components/ui/ProgressBar'
import { toArabicNumerals } from '../../lib/arabic'

interface SchoolHealthScoreProps {
  attendanceRate: number
}

function healthLabel(rate: number): { label: string; color: string } {
  if (rate >= 90) return { label: 'ممتاز',    color: '#1e8449' }
  if (rate >= 75) return { label: 'جيد',      color: '#f39c12' }
  return              { label: 'يحتاج متابعة', color: '#c0392b' }
}

export function SchoolHealthScore({ attendanceRate }: SchoolHealthScoreProps) {
  const { label, color } = healthLabel(attendanceRate)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mx-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold font-arabic" style={{ color }}>{label}</span>
        <div>
          <span className="text-2xl font-bold text-gray-900 font-arabic">
            {toArabicNumerals(attendanceRate)}%
          </span>
          <span className="text-xs text-gray-500 font-arabic mr-1">نسبة الحضور</span>
        </div>
        <h3 className="font-bold font-arabic text-gray-900 text-sm">صحة المدرسة</h3>
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
