import type { Assignment } from '../../types/domain'
import { formatDateShortAr } from '../../lib/arabic'
import { useLang } from '../../app/providers/LangProvider'

const TYPE_ICONS: Record<string, string> = {
  written:        '📝',
  oral:           '🗣️',
  practical:      '🔬',
  project:        '📁',
  quiz:           '✅',
  notebook_photo: '📸',
}

interface HomeworkCardProps {
  assignment: Assignment
}

export function HomeworkCard({ assignment }: HomeworkCardProps) {
  const { t, fa } = useLang()
  const due    = new Date(assignment.due_date)
  const isPast = due < new Date()

  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 mx-4 mb-2">
      <span className="text-2xl">{TYPE_ICONS[assignment.assignment_type] ?? '📋'}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${fa} text-gray-900 text-sm truncate`}>{assignment.title_ar}</p>
        <p className={`text-xs ${fa} mt-0.5 ${isPast ? 'text-red-500' : 'text-teal'}`}>
          {isPast ? `${t('past_due')} · ` : `${t('due_label')}: `}
          {formatDateShortAr(due)}
        </p>
      </div>
    </div>
  )
}

HomeworkCard.displayName = 'HomeworkCard'
