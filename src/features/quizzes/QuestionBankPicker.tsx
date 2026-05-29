import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang } from '../../app/providers/LangProvider'
import { supabase } from '../../lib/supabase'

interface BankQuestion {
  id:            string
  question_ar:   string
  question_type: string
  options:       string[] | null
  correct_answer: string | null
  points:        number
}

interface Props {
  subjectId: string
  onPick: (q: BankQuestion) => void
  onClose: () => void
}

export function QuestionBankPicker({ subjectId, onPick, onClose }: Props) {
  const auth = useContext(AuthContext)
  const { t, fa, ta } = useLang()
  const [questions, setQuestions] = useState<BankQuestion[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')

  useEffect(() => {
    if (!subjectId || !auth?.schoolId) return
    ;(supabase as any)
      .from('question_bank')
      .select('id, question_ar, question_type, options, correct_answer, points')
      .eq('subject_id', subjectId)
      .eq('school_id', auth.schoolId)
      .order('created_at', { ascending: false })
      .then(({ data }: { data: BankQuestion[] | null }) => {
        setQuestions(data ?? [])
        setLoading(false)
      })
  }, [subjectId, auth?.schoolId])

  const filtered = search.trim()
    ? questions.filter(q => q.question_ar.includes(search.trim()))
    : questions

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <button onClick={onClose} className="text-gray-400 text-xl leading-none">×</button>
          <p className={`font-bold text-gray-800 ${fa}`}>{t('bank_pick_title')}</p>
        </div>

        <div className="px-4 py-2 border-b border-gray-100">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            dir="rtl"
            placeholder={t('bank_search_ph')}
            className={`w-full px-3 py-2 rounded-xl border border-gray-200 ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30`}
          />
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 rounded-full border-2 border-teal border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className={`text-center text-gray-400 ${fa} py-10 text-sm`}>{t('bank_empty')}</p>
          ) : (
            filtered.map(q => (
              <button
                key={q.id}
                onClick={() => { onPick(q); onClose() }}
                className={`w-full px-4 py-3 text-right active:bg-gray-50 transition-colors`}
              >
                <p className={`text-sm text-gray-800 ${fa} ${ta} leading-relaxed`}>{q.question_ar}</p>
                <span className={`text-xs text-gray-400 ${fa}`}>
                  {q.question_type === 'true_false' ? t('tf_label') : t('mcq_label')} · {q.points} {t('points')}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

QuestionBankPicker.displayName = 'QuestionBankPicker'
