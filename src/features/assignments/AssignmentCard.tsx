import type { Assignment } from '../../types/domain'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
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

interface AssignmentCardProps {
  assignment: Assignment
}

export function AssignmentCard({ assignment }: AssignmentCardProps) {
  const { t } = useLang()
  const dueDate  = new Date(assignment.due_date)
  const isPast   = dueDate < new Date()

  return (
    <Card className="mx-4 my-2">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{TYPE_ICONS[assignment.assignment_type] ?? '📋'}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold font-arabic text-gray-900 text-sm">{assignment.title_ar}</p>
          {assignment.description_ar && (
            <p className="text-xs text-gray-500 font-arabic mt-0.5 line-clamp-2">{assignment.description_ar}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge
              label={`${t('due_label')}: ${formatDateShortAr(dueDate)}`}
              variant={isPast ? 'red' : 'blue'}
            />
            <Badge label={`${assignment.max_grade} ${t('points')}`} variant="gray" />
          </div>
        </div>
      </div>
    </Card>
  )
}

AssignmentCard.displayName = 'AssignmentCard'
