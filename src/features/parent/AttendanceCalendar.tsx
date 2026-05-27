import { useState } from 'react'
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
  const now        = new Date()
  const [offset, setOffset] = useState(0)    // 0 = current month, -1 = prev, -2 = two months ago

  const displayDate  = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const year         = displayDate.getFullYear()
  const month        = displayDate.getMonth()
  const firstDay     = new Date(year, month, 1).getDay()
  const daysInMonth  = new Date(year, month + 1, 0).getDate()
  const canGoNext    = offset < 0

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

  const totalPresent = cells.filter(d => {
    if (!d) return false
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    return recordMap[dateStr] === 'present'
  }).length

  const totalAbsent = cells.filter(d => {
    if (!d) return false
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    return recordMap[dateStr] === 'absent'
  }).length

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mx-4 mb-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setOffset(o => Math.max(o - 1, -2))}
          disabled={offset <= -2}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 disabled:opacity-30"
        >
          <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <h3 className={`font-bold ${fa} text-gray-900 text-sm`}>
          {ARABIC_MONTHS[month]} {toArabicNumerals(year)}
        </h3>

        <button
          onClick={() => setOffset(o => Math.min(o + 1, 0))}
          disabled={!canGoNext}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 disabled:opacity-30"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {ARABIC_DAYS_SHORT.map(d => (
          <span key={d} className={`text-xs text-gray-400 ${fa}`}>{d}</span>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {cells.map((day, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs mx-auto ${cellColor(day)}`}
          >
            {day ? toArabicNumerals(day) : ''}
          </div>
        ))}
      </div>

      {/* Month summary bar */}
      {(totalPresent + totalAbsent) > 0 && (
        <div className="mt-3 flex items-center gap-1 h-2 rounded-full overflow-hidden bg-gray-100">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${(totalPresent / (totalPresent + totalAbsent)) * 100}%` }}
          />
          <div
            className="h-full bg-red-500 transition-all"
            style={{ width: `${(totalAbsent / (totalPresent + totalAbsent)) * 100}%` }}
          />
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 justify-center">
        {[
          { color: 'bg-green-500',  label: `${t('present')} (${toArabicNumerals(totalPresent)})` },
          { color: 'bg-red-500',    label: `${t('absent')} (${toArabicNumerals(totalAbsent)})` },
          { color: 'bg-yellow-400', label: t('late') },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-2.5 h-2.5 rounded-full ${color} flex-shrink-0`} />
            <span className={`text-xs text-gray-500 ${fa}`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

AttendanceCalendar.displayName = 'AttendanceCalendar'
