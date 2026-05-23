import type { AttendanceRecord } from '../../types/domain'
import { toArabicNumerals } from '../../lib/arabic'
import { useLang } from '../../app/providers/LangProvider'

interface AttendanceCalendarProps {
  records: AttendanceRecord[]
}

const ARABIC_MONTHS = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
]

const ARABIC_DAYS_SHORT = ['أح','إث','ث','أر','خ','ج','س']

export function AttendanceCalendar({ records }: AttendanceCalendarProps) {
  const { t, fa } = useLang()
  const now      = new Date()
  const year     = now.getFullYear()
  const month    = now.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const recordMap: Record<string, string> = {}
  records.forEach(r => { recordMap[r.attendance_date] = r.status })

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function cellColor(day: number | null): string {
    if (!day) return ''
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const status  = recordMap[dateStr]
    if (status === 'present') return 'bg-green-500 text-white'
    if (status === 'absent')  return 'bg-red-500 text-white'
    if (status === 'late')    return 'bg-yellow-400 text-white'
    const d = new Date(dateStr)
    if (d < now && d.getDay() !== 5 && d.getDay() !== 6) return 'bg-gray-100 text-gray-400'
    return 'text-gray-700'
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mx-4 mb-4">
      <h3 className={`font-bold ${fa} text-gray-900 mb-3 text-sm`}>
        {ARABIC_MONTHS[month]} {toArabicNumerals(year)}
      </h3>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {ARABIC_DAYS_SHORT.map(d => (
          <span key={d} className={`text-xs text-gray-400 ${fa}`}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {cells.map((day, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-arabic mx-auto ${cellColor(day)}`}
          >
            {day ? toArabicNumerals(day) : ''}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-3 justify-center">
        {[
          { color: 'bg-green-500',  label: t('present') },
          { color: 'bg-red-500',    label: t('absent') },
          { color: 'bg-yellow-400', label: t('late') },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span className={`text-xs text-gray-500 ${fa}`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

AttendanceCalendar.displayName = 'AttendanceCalendar'
