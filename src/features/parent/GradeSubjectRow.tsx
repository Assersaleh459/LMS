import { ProgressBar } from '../../components/ui/ProgressBar'
import { getMoELetterGrade } from '../../lib/moe'
import { toArabicNumerals } from '../../lib/arabic'

interface GradeSubjectRowProps {
  subjectNameAr: string
  score:         number
  maxScore:      number
}

export function GradeSubjectRow({ subjectNameAr, score, maxScore }: GradeSubjectRowProps) {
  const grade = getMoELetterGrade(score, maxScore)
  const pct   = (score / maxScore) * 100

  return (
    <div className="px-4 py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-xs font-bold font-arabic px-2 py-0.5 rounded-full"
          style={{ color: grade.color, backgroundColor: grade.color + '20' }}
        >
          {grade.label}
        </span>
        <div className="flex items-center gap-1">
          <span className="font-bold text-gray-900 text-sm font-arabic">
            {toArabicNumerals(score)}
          </span>
          <span className="text-gray-400 text-xs font-arabic">
            / {toArabicNumerals(maxScore)}
          </span>
        </div>
        <span className="font-medium font-arabic text-gray-900 text-sm">{subjectNameAr}</span>
      </div>
      <ProgressBar
        value={pct}
        color={pct >= 65 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-500'}
        height="h-1.5"
      />
    </div>
  )
}

GradeSubjectRow.displayName = 'GradeSubjectRow'
