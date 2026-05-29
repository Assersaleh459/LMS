import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang } from '../../app/providers/LangProvider'
import { supabase } from '../../lib/supabase'
import { SCORE_LABELS } from './RubricBuilder'

interface Criterion { id: string; name_ar: string; order_num: number }

interface Props {
  assignmentId:  string
  submissionId:  string
  onScored?:     (total: number, max: number) => void
}

export function RubricScorer({ assignmentId, submissionId, onScored }: Props) {
  const auth = useContext(AuthContext)
  const { t, fa } = useLang()
  const [criteria, setCriteria]   = useState<Criterion[]>([])
  const [scores,   setScores]     = useState<Record<string, number>>({})
  const [saving,   setSaving]     = useState(false)
  const [saved,    setSaved]      = useState(false)
  const [rubricId, setRubricId]   = useState<string | null>(null)

  useEffect(() => {
    if (!assignmentId) return
    ;(supabase as any)
      .from('rubrics')
      .select('id, rubric_criteria(id, name_ar, order_num)')
      .eq('assignment_id', assignmentId)
      .single()
      .then(({ data }: { data: any }) => {
        if (!data) return
        setRubricId(data.id)
        const sorted = (data.rubric_criteria as Criterion[]).sort((a, b) => a.order_num - b.order_num)
        setCriteria(sorted)

        // Load existing scores
        ;(supabase as any)
          .from('rubric_scores')
          .select('criterion_id, score')
          .eq('submission_id', submissionId)
          .then(({ data: existing }: { data: { criterion_id: string; score: number }[] | null }) => {
            const map: Record<string, number> = {}
            ;(existing ?? []).forEach(r => { map[r.criterion_id] = r.score })
            setScores(map)
          })
      })
  }, [assignmentId, submissionId])

  if (!rubricId || criteria.length === 0) return null

  async function handleSave() {
    if (!auth?.profile?.id) return
    setSaving(true)
    const rows = criteria.map(c => ({
      submission_id: submissionId,
      criterion_id:  c.id,
      score:         scores[c.id] ?? 1,
      graded_by:     auth!.profile!.id,
    }))
    await (supabase as any)
      .from('rubric_scores')
      .upsert(rows, { onConflict: 'submission_id,criterion_id' })

    const total = criteria.reduce((s, c) => s + (scores[c.id] ?? 1), 0)
    onScored?.(total, criteria.length * 4)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="border border-gray-100 rounded-2xl p-4 space-y-3 bg-gray-50">
      <p className={`font-bold text-gray-700 text-sm ${fa} text-right`}>{t('rubric_title')}</p>

      {criteria.map(c => (
        <div key={c.id} className="space-y-1.5">
          <p className={`text-sm text-gray-700 ${fa} text-right`}>{c.name_ar}</p>
          <div className="flex gap-2 justify-end">
            {[4, 3, 2, 1].map(score => (
              <button
                key={score}
                type="button"
                onClick={() => setScores(prev => ({ ...prev, [c.id]: score }))}
                className={`flex-1 py-2 rounded-xl text-xs font-bold ${fa} transition-colors ${
                  scores[c.id] === score
                    ? score === 4 ? 'bg-green-500 text-white'
                      : score === 3 ? 'bg-teal text-white'
                      : score === 2 ? 'bg-yellow-400 text-white'
                      : 'bg-red-400 text-white'
                    : 'bg-white border border-gray-200 text-gray-500'
                }`}
              >
                {score} {SCORE_LABELS[score].ar}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`px-5 py-2 rounded-xl bg-teal text-white font-bold ${fa} text-sm disabled:opacity-50`}
        >
          {saved ? '✓ ' + t('settings_saved') : saving ? t('saving') : t('save_grade')}
        </button>
        <span className={`text-sm font-bold text-gray-600 ${fa}`}>
          {criteria.reduce((s, c) => s + (scores[c.id] ?? 0), 0)} / {criteria.length * 4}
        </span>
      </div>
    </div>
  )
}

RubricScorer.displayName = 'RubricScorer'
