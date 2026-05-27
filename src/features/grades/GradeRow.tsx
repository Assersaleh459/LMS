import type { StudentCard } from '../../types/domain'
import type { GradeType } from '../../types/enums'
import { GradeInput } from '../../components/forms/GradeInput'
import { getMoELetterGrade } from '../../lib/moe'
import { PRIMARY_GRADE_MAX } from '../../lib/moe'
import { useLang } from '../../app/providers/LangProvider'

interface GradeRowProps {
  student:   StudentCard
  gradeType: GradeType
  value:     string
  onChange:  (value: string) => void
}

export function GradeRow({ student, gradeType, value, onChange }: GradeRowProps) {
  const { fa } = useLang()
  const max    = PRIMARY_GRADE_MAX[gradeType] ?? 10
  const numVal = parseFloat(value)
  const grade  = !isNaN(numVal) ? getMoELetterGrade(numVal, max) : null

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${fa} text-gray-900 text-sm truncate`}>
          {student.full_name_ar}
        </p>
      </div>

      <GradeInput value={value} max={max} onChange={onChange} />

      {grade && (
        <span
          className={`text-xs ${fa} font-bold px-2 py-0.5 rounded-full`}
          style={{ color: grade.color, backgroundColor: grade.color + '20' }}
        >
          {grade.label}
        </span>
      )}
    </div>
  )
}

GradeRow.displayName = 'GradeRow'
