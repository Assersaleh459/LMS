import { useContext, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { ArabicInput } from '../../components/forms/ArabicInput'
import { useLang } from '../../app/providers/LangProvider'

interface QuizQuestion {
  question_ar: string
  question_type: 'mcq' | 'true_false'
  options: string[]
  correct_index: number
  points: number
}

const emptyMCQ = (): QuizQuestion => ({
  question_ar: '', question_type: 'mcq',
  options: ['', '', '', ''], correct_index: 0, points: 1,
})

export function CreateQuizPage() {
  const { t, ta, fa, dir } = useLang()
  const { subjectId, lessonId } = useParams<{ subjectId: string; lessonId?: string }>()
  const auth = useContext(AuthContext)
  const navigate = useNavigate()

  const emptyTF = (): QuizQuestion => ({
    question_ar: '', question_type: 'true_false',
    options: [t('t_true'), t('t_false')], correct_index: 0, points: 1,
  })

  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [duration, setDuration] = useState('')
  const [passScore, setPassScore] = useState('50')
  const [gradeYear, setGradeYear] = useState('')
  const [section, setSection] = useState('')
  const [questions, setQuestions] = useState<QuizQuestion[]>([emptyMCQ()])
  const [saving, setSaving] = useState(false)

  function updateQ(idx: number, patch: Partial<QuizQuestion>) {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, ...patch } : q))
  }

  function updateOption(qIdx: number, oIdx: number, val: string) {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q
      const opts = [...q.options]
      opts[oIdx] = val
      return { ...q, options: opts }
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !subjectId || !auth?.profile?.id) return
    const yr = parseInt(gradeYear)
    if (isNaN(yr)) return

    setSaving(true)
    const { data: quiz } = await supabase
      .from('quizzes')
      .insert({
        subject_id: subjectId,
        lesson_id: lessonId || null,
        created_by: auth.profile.id,
        title_ar: title.trim(),
        instructions_ar: instructions.trim() || null,
        duration_min: duration ? parseInt(duration) : null,
        pass_score: parseInt(passScore) || 50,
        grade_year: yr,
        section: section.trim() || 'أ',
        is_published: true,
      })
      .select('id')
      .single()

    if (quiz) {
      const rows = questions
        .filter(q => q.question_ar.trim())
        .map((q, idx) => ({
          quiz_id: quiz.id,
          question_ar: q.question_ar.trim(),
          question_type: q.question_type,
          options: q.options.filter(o => o.trim()),
          correct_answer: q.options[q.correct_index],
          points: q.points,
          order_num: idx + 1,
        }))
      await supabase.from('quiz_questions').insert(rows)
    }
    setSaving(false)
    navigate(`/course/${subjectId}`, { replace: true })
  }

  return (
    <PageWrapper>
      <AppBar title={t('new_quiz')} onBack={() => navigate(-1)} />
      <form onSubmit={handleSubmit} className="p-4 space-y-5 pb-24">
        <ArabicInput label={t('quiz_title')} placeholder={t('quiz_title_ph')} value={title} onChange={e => setTitle(e.target.value)} />

        <div>
          <label className={`block text-sm font-medium text-gray-700 ${fa} ${ta} mb-1`}>{t('instructions')}</label>
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            rows={2}
            dir={dir}
            className={`w-full px-4 py-3 rounded-xl border border-gray-200 ${ta} ${fa} text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-none text-sm`}
            placeholder={t('instructions_ph')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`block text-sm font-medium text-gray-700 ${fa} ${ta} mb-1`}>{t('duration_min')}</label>
            <input type="number" value={duration} onChange={e => setDuration(e.target.value)} min={1} max={180}
              dir={dir} placeholder="30"
              className={`w-full px-4 py-3 rounded-xl border border-gray-200 ${ta} ${fa} focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal text-sm`} />
          </div>
          <div>
            <label className={`block text-sm font-medium text-gray-700 ${fa} ${ta} mb-1`}>{t('pass_score')}</label>
            <input type="number" value={passScore} onChange={e => setPassScore(e.target.value)} min={0} max={100}
              dir={dir}
              className={`w-full px-4 py-3 rounded-xl border border-gray-200 ${ta} ${fa} focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal text-sm`} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ArabicInput label={t('grade_year')} placeholder="10" value={gradeYear} onChange={e => setGradeYear(e.target.value)} />
          <ArabicInput label={t('section')} placeholder="أ" value={section} onChange={e => setSection(e.target.value)} />
        </div>

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className={`${fa} font-bold text-gray-800 ${ta}`}>{t('questions')} ({questions.length})</p>
          </div>

          {questions.map((q, qIdx) => (
            <div key={qIdx} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setQuestions(prev => prev.filter((_, i) => i !== qIdx))}
                  className={`text-red-400 text-xs ${fa}`}>{t('delete')}</button>
                <div className="flex gap-2">
                  <button type="button"
                    onClick={() => updateQ(qIdx, q.question_type === 'mcq' ? emptyTF() : emptyMCQ())}
                    className={`text-xs ${fa} text-teal bg-teal/10 px-2 py-1 rounded-lg`}>
                    {q.question_type === 'mcq' ? t('tf_label') : t('mcq_label')}
                  </button>
                  <span className={`text-xs ${fa} text-gray-500`}>س {qIdx + 1}</span>
                </div>
              </div>

              <textarea
                value={q.question_ar}
                onChange={e => updateQ(qIdx, { question_ar: e.target.value })}
                rows={2}
                dir={dir}
                placeholder={t('question_text')}
                className={`w-full px-3 py-2 rounded-xl border border-gray-200 ${ta} ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-none`}
              />

              {q.question_type === 'mcq' ? (
                <div className="space-y-2">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQ(qIdx, { correct_index: oIdx })}
                        className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${q.correct_index === oIdx ? 'border-teal bg-teal' : 'border-gray-300'}`}
                      >
                        {q.correct_index === oIdx && <span className="w-2 h-2 rounded-full bg-white" />}
                      </button>
                      <input
                        value={opt}
                        onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                        dir={dir}
                        placeholder={`${t('option_ph')} ${oIdx + 1}`}
                        className={`flex-1 px-3 py-2 rounded-xl border border-gray-200 ${ta} ${fa} text-sm focus:outline-none focus:ring-1 focus:ring-teal/30`}
                      />
                    </div>
                  ))}
                  <p className={`text-xs text-gray-400 ${fa} ${ta}`}>{t('q_correct_hint')}</p>
                </div>
              ) : (
                <div className="flex gap-2 justify-end">
                  {[t('t_true'), t('t_false')].map((opt, oIdx) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => updateQ(qIdx, { correct_index: oIdx })}
                      className={`flex-1 py-2 rounded-xl ${fa} font-bold text-sm ${q.correct_index === oIdx ? 'bg-teal text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <label className={`text-xs ${fa} text-gray-500`}>{t('points')}:</label>
                <input type="number" value={q.points} min={1} max={10}
                  onChange={e => updateQ(qIdx, { points: parseInt(e.target.value) || 1 })}
                  className="w-16 px-2 py-1 rounded-lg border border-gray-200 text-center text-sm focus:outline-none focus:ring-1 focus:ring-teal/30" />
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <button type="button" onClick={() => setQuestions(prev => [...prev, emptyTF()])}
              className={`flex-1 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 ${fa} text-sm`}>
              {t('add_tf')}
            </button>
            <button type="button" onClick={() => setQuestions(prev => [...prev, emptyMCQ()])}
              className={`flex-1 py-3 rounded-xl border-2 border-dashed border-teal/40 text-teal ${fa} text-sm`}>
              {t('add_mcq')}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !title.trim() || questions.every(q => !q.question_ar.trim())}
          className={`w-full py-4 rounded-xl bg-teal text-white font-bold ${fa} text-base disabled:opacity-50`}
        >
          {saving ? t('saving') : t('publish_quiz')}
        </button>
      </form>
    </PageWrapper>
  )
}

CreateQuizPage.displayName = 'CreateQuizPage'
