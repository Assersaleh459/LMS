import { useLang } from '../../app/providers/LangProvider'

export interface RubricCriterion { name_ar: string }

interface Props {
  criteria:  RubricCriterion[]
  onChange:  (criteria: RubricCriterion[]) => void
}

const SCORE_LABELS: Record<number, { ar: string; en: string }> = {
  4: { ar: 'ممتاز',     en: 'Excellent' },
  3: { ar: 'جيد',       en: 'Good' },
  2: { ar: 'مقبول',     en: 'Acceptable' },
  1: { ar: 'يحتاج عمل', en: 'Needs work' },
}

export { SCORE_LABELS }

export function RubricBuilder({ criteria, onChange }: Props) {
  const { t, fa, dir } = useLang()

  function addCriterion() {
    if (criteria.length >= 5) return
    onChange([...criteria, { name_ar: '' }])
  }

  function updateCriterion(idx: number, value: string) {
    onChange(criteria.map((c, i) => i === idx ? { name_ar: value } : c))
  }

  function removeCriterion(idx: number) {
    onChange(criteria.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addCriterion}
          disabled={criteria.length >= 5}
          className={`text-xs text-teal font-bold ${fa} disabled:opacity-40`}
        >
          + {t('rubric_add_criterion')}
        </button>
        <p className={`text-sm font-bold text-gray-800 ${fa}`}>{t('rubric_title')}</p>
      </div>

      {criteria.length > 0 && (
        <div className="space-y-2">
          {criteria.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <button type="button" onClick={() => removeCriterion(i)} className="text-red-300 text-lg leading-none flex-shrink-0">×</button>
              <input
                value={c.name_ar}
                onChange={e => updateCriterion(i, e.target.value)}
                dir={dir}
                placeholder={t('rubric_criterion_ph')}
                className={`flex-1 px-3 py-2 rounded-xl border border-gray-200 ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30`}
              />
            </div>
          ))}
        </div>
      )}

      {criteria.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-3 space-y-1">
          <p className={`text-xs text-gray-500 font-bold ${fa} text-right mb-2`}>{t('rubric_scale_hint')}</p>
          {[4, 3, 2, 1].map(score => (
            <div key={score} className="flex items-center justify-end gap-2">
              <span className={`text-xs text-gray-500 ${fa}`}>{SCORE_LABELS[score].ar}</span>
              <span className={`w-6 h-6 rounded-full bg-white border-2 ${
                score === 4 ? 'border-green-500 text-green-700'
                : score === 3 ? 'border-teal text-teal'
                : score === 2 ? 'border-yellow-500 text-yellow-700'
                : 'border-red-400 text-red-600'
              } text-xs font-bold flex items-center justify-center`}>
                {score}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

RubricBuilder.displayName = 'RubricBuilder'
