import type { StudentCard } from '../../types/domain'
import { KG_GRADES } from '../../lib/moe'
import { useLang } from '../../app/providers/LangProvider'

// KG descriptive values stored as numeric sentinels
export const KG_VALUE: Record<string, number> = {
  excellent: 90,
  good:      70,
  needs:     40,
}

// Map a stored numeric value back to a KG grade key
export function valueToKGKey(val: string): string | null {
  const n = parseFloat(val)
  if (n >= 85) return 'excellent'
  if (n >= 65) return 'good'
  if (!isNaN(n) && n > 0) return 'needs'
  return null
}

interface Props {
  student:  StudentCard
  value:    string           // stored numeric string or ''
  onChange: (value: string) => void
}

export function KGGradeRow({ student, value, onChange }: Props) {
  const { fa } = useLang()
  const selected = valueToKGKey(value)

  return (
    <div className="px-4 py-3 border-b border-gray-100">
      <p className={`font-medium ${fa} text-gray-900 text-sm mb-2`}>{student.full_name_ar}</p>
      <div className="flex gap-2">
        {KG_GRADES.map(g => (
          <button
            key={g.value}
            type="button"
            onClick={() => onChange(String(KG_VALUE[g.value]))}
            className={`flex-1 flex flex-col items-center py-2.5 rounded-xl border-2 transition-colors ${
              selected === g.value
                ? 'border-teal bg-teal/10'
                : 'border-gray-100 bg-gray-50'
            }`}
          >
            <span className="text-2xl">{g.emoji}</span>
            <span className={`text-xs font-bold mt-1 ${fa} ${selected === g.value ? 'text-teal' : 'text-gray-500'}`}>
              {g.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

KGGradeRow.displayName = 'KGGradeRow'
