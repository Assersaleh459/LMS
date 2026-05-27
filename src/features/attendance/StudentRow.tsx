import type { StudentCard } from '../../types/domain'
import type { AttendanceStatus } from '../../types/enums'
import { Avatar } from '../../components/ui/Avatar'
import { useLang } from '../../app/providers/LangProvider'

interface StudentRowProps {
  student: StudentCard
  status:  AttendanceStatus | null
  saving:  boolean
  onMark:  (studentId: string, status: 'present' | 'absent') => void
}

const ROW_BG: Record<string, string> = {
  present: 'bg-green-50 border-green-200',
  absent:  'bg-red-50 border-red-200',
  late:    'bg-yellow-50 border-yellow-200',
  excused: 'bg-blue-50 border-blue-200',
}

export function StudentRow({ student, status, saving, onMark }: StudentRowProps) {
  const { t, fa } = useLang()
  const rowBg = status ? ROW_BG[status] ?? 'bg-white border-gray-100' : 'bg-white border-gray-100'

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b transition-colors ${rowBg}`}>
      <Avatar name={student.full_name_ar} url={student.avatar_url} size="sm" />

      <div className="flex-1 min-w-0">
        <p className={`font-medium ${fa} text-gray-900 text-sm truncate`}>
          {student.full_name_ar}
        </p>
        <p className="text-xs text-gray-400 font-mono">{student.student_code}</p>
      </div>

      {saving && (
        <div className="w-5 h-5 rounded-full border-2 border-teal border-t-transparent animate-spin" />
      )}

      {/* Absent button */}
      <button
        type="button"
        onClick={() => onMark(student.id, 'absent')}
        disabled={saving}
        aria-label={t('absent')}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all text-lg disabled:opacity-40 ${
          status === 'absent'
            ? 'bg-red-500 text-white shadow-md scale-110'
            : 'bg-red-100 text-red-500 hover:bg-red-200'
        }`}
      >
        ✗
      </button>

      {/* Present button */}
      <button
        type="button"
        onClick={() => onMark(student.id, 'present')}
        disabled={saving}
        aria-label={t('present')}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all text-lg disabled:opacity-40 ${
          status === 'present'
            ? 'bg-green-500 text-white shadow-md scale-110'
            : 'bg-green-100 text-green-600 hover:bg-green-200'
        }`}
      >
        ✓
      </button>
    </div>
  )
}

StudentRow.displayName = 'StudentRow'
