import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { useLang } from '../../app/providers/LangProvider'

interface Attempt {
  score: number | null; max_score: number | null; is_complete: boolean
  quizzes: { title_ar: string; pass_score: number } | null
}
interface AnswerRow {
  id: string; answer_text: string | null; is_correct: boolean | null
  quiz_questions: { question_ar: string; options: string[] | null; correct_answer: string | null } | null
}

export function QuizResultPage() {
  const { t, ta, fa } = useLang()
  const { attemptId } = useParams<{ attemptId: string }>()
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [answers, setAnswers] = useState<AnswerRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!attemptId) return
    Promise.all([
      supabase
        .from('quiz_attempts')
        .select('score, max_score, is_complete, quizzes(title_ar, pass_score)')
        .eq('id', attemptId)
        .single(),
      supabase
        .from('quiz_attempt_answers')
        .select('id, answer_text, is_correct, quiz_questions(question_ar, options, correct_answer)')
        .eq('attempt_id', attemptId),
    ]).then(([attRes, ansRes]) => {
      if (attRes.data) setAttempt(attRes.data as unknown as Attempt)
      if (ansRes.data) setAnswers(ansRes.data as unknown as AnswerRow[])
      setLoading(false)
    })
  }, [attemptId])

  if (loading) return (
    <PageWrapper>
      <AppBar title={t('quiz_result')} onBack={() => navigate(-1)} />
      <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" /></div>
    </PageWrapper>
  )

  if (!attempt) return (
    <PageWrapper>
      <AppBar title={t('quiz_result')} onBack={() => navigate(-1)} />
      <p className={`text-center text-gray-400 ${fa} py-20`}>{t('no_result')}</p>
    </PageWrapper>
  )

  const score = attempt.score ?? 0
  const maxScore = attempt.max_score ?? 1
  const pct = Math.round((score / maxScore) * 100)
  const passScore = attempt.quizzes?.pass_score ?? 50
  const passed = pct >= passScore

  return (
    <PageWrapper>
      <AppBar title={attempt.quizzes?.title_ar ?? t('quiz_result')} onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto">
        {/* Score card */}
        <div className={`px-4 py-8 text-center ${passed ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
            <span className="text-4xl">{passed ? '🎉' : '💪'}</span>
          </div>
          <p className={`text-5xl font-bold ${fa} mb-1 ${passed ? 'text-green-600' : 'text-red-600'}`}>{pct}%</p>
          <p className={`text-gray-600 ${fa} text-sm`}>{score} {t('out_of')} {maxScore} {t('points')}</p>
          <p className={`${fa} font-bold text-lg mt-3 ${passed ? 'text-green-700' : 'text-red-700'}`}>
            {passed ? t('passed') : t('failed')}
          </p>
          <p className={`text-gray-400 ${fa} text-xs mt-1`}>{t('pass_score_lbl')} {passScore}%</p>
        </div>

        {/* Answer review */}
        {answers.length > 0 && (
          <div className="px-4 py-4 space-y-3">
            <p className={`${fa} font-bold text-gray-800 ${ta} mb-4`}>{t('answer_review')}</p>
            {answers.map((a, idx) => (
              <div
                key={a.id}
                className={`rounded-2xl border p-4 ${a.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
              >
                <p className={`${fa} font-bold text-gray-900 text-sm ${ta} mb-2`}>
                  {idx + 1}. {a.quiz_questions?.question_ar}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${fa} font-bold ${a.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                    {a.is_correct ? t('correct_lbl') : t('wrong_lbl')}
                  </span>
                  <div className={ta}>
                    <p className={`text-xs ${fa} text-gray-600`}>{t('your_answer')} <span className="font-bold">{a.answer_text || '—'}</span></p>
                    {!a.is_correct && a.quiz_questions?.correct_answer && (
                      <p className={`text-xs ${fa} text-green-700 mt-0.5`}>{t('correct_answer')} <span className="font-bold">{a.quiz_questions.correct_answer}</span></p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-4 pb-8">
          <button
            onClick={() => navigate(-1)}
            className={`w-full py-4 rounded-xl bg-navy text-white font-bold ${fa} text-base`}
          >
            {t('back')}
          </button>
        </div>
      </div>
    </PageWrapper>
  )
}

QuizResultPage.displayName = 'QuizResultPage'
