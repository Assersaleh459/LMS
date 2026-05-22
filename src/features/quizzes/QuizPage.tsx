import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'

interface Quiz {
  id: string; title_ar: string; instructions_ar: string | null
  duration_min: number | null; pass_score: number
}
interface Question {
  id: string; question_ar: string; question_type: string
  options: string[] | null; correct_answer: string | null; points: number; order_num: number
}

export function QuizPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const submittedRef = useRef(false)

  useEffect(() => {
    if (!lessonId) return
    supabase
      .from('quizzes')
      .select('id, title_ar, instructions_ar, duration_min, pass_score')
      .eq('lesson_id', lessonId)
      .single()
      .then(({ data: quizData }) => {
        if (!quizData) { setLoading(false); return }
        setQuiz(quizData)
        if (quizData.duration_min) setTimeLeft(quizData.duration_min * 60)
        supabase
          .from('quiz_questions')
          .select('id, question_ar, question_type, options, correct_answer, points, order_num')
          .eq('quiz_id', quizData.id)
          .order('order_num')
          .then(({ data }) => {
            if (data) setQuestions(data.map(q => ({ ...q, options: q.options as string[] | null })))
            setLoading(false)
          })
      })
  }, [lessonId])

  // countdown timer — ticks once per second
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return
    const id = setTimeout(() => setTimeLeft(t => (t ?? 1) - 1), 1000)
    return () => clearTimeout(id)
  }, [timeLeft])

  const handleSubmit = useCallback(async () => {
    if (!quiz || !auth?.profile?.id || submittedRef.current) return
    submittedRef.current = true
    setSubmitting(true)

    const maxScore = questions.reduce((s, q) => s + q.points, 0)
    let score = 0
    const answerRows = questions.map(q => {
      const ans = answers[q.id] ?? ''
      const isCorrect = q.correct_answer !== null && ans === q.correct_answer
      if (isCorrect) score += q.points
      return { question_id: q.id, answer_text: ans, is_correct: isCorrect }
    })

    const { data: attempt } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quiz.id,
        student_id: auth.profile.id,
        score,
        max_score: maxScore,
        is_complete: true,
        submitted_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (attempt) {
      await supabase
        .from('quiz_attempt_answers')
        .insert(answerRows.map(r => ({ ...r, attempt_id: attempt.id })))
      navigate(`/quiz/${lessonId}/result/${attempt.id}`, { replace: true })
    }
    setSubmitting(false)
  }, [quiz, auth?.profile?.id, questions, answers, lessonId, navigate])

  // auto-submit when timer expires
  useEffect(() => {
    if (timeLeft === 0) handleSubmit()
  }, [timeLeft, handleSubmit])

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const answered = Object.keys(answers).length

  if (loading) return (
    <PageWrapper>
      <AppBar title="الاختبار" onBack={() => navigate(-1)} />
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
      </div>
    </PageWrapper>
  )

  if (!quiz) return (
    <PageWrapper>
      <AppBar title="الاختبار" onBack={() => navigate(-1)} />
      <p className="text-center text-gray-400 font-arabic py-20">لا يوجد اختبار لهذا الدرس</p>
    </PageWrapper>
  )

  return (
    <PageWrapper>
      <AppBar
        title={quiz.title_ar}
        onBack={() => navigate(-1)}
        action={timeLeft !== null ? (
          <span className={`font-arabic text-sm font-bold ${timeLeft < 60 ? 'text-red-300' : 'text-white/80'}`}>
            {formatTime(timeLeft)}
          </span>
        ) : undefined}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-32">
        {quiz.instructions_ar && (
          <div className="bg-teal/5 rounded-2xl p-4">
            <p className="font-arabic text-gray-700 text-sm text-right leading-relaxed">{quiz.instructions_ar}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-arabic">{answered}/{questions.length} سؤال</span>
          <span className="text-xs text-gray-500 font-arabic">درجة النجاح: {quiz.pass_score}%</span>
        </div>

        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="font-arabic font-bold text-gray-900 text-sm text-right mb-3">
              {idx + 1}. {q.question_ar}
              <span className="mr-2 text-xs text-gray-400 font-normal">({q.points} درجة)</span>
            </p>

            {q.question_type === 'true_false' ? (
              <div className="flex gap-3 justify-end">
                {['صح', 'خطأ'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                    className={`flex-1 py-3 rounded-xl font-arabic font-bold text-sm transition-colors ${
                      answers[q.id] === opt ? 'bg-teal text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {(q.options ?? []).map((opt, oIdx) => (
                  <button
                    key={oIdx}
                    onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                    className={`w-full px-4 py-3 rounded-xl text-right font-arabic text-sm transition-colors ${
                      answers[q.id] === opt
                        ? 'bg-teal text-white font-bold'
                        : 'bg-gray-50 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 pb-safe">
        <button
          onClick={() => handleSubmit()}
          disabled={submitting || answered < questions.length}
          className="w-full py-4 rounded-xl bg-teal text-white font-bold font-arabic text-base disabled:opacity-50"
        >
          {submitting ? 'جاري التسليم...' : `تسليم الاختبار (${answered}/${questions.length})`}
        </button>
      </div>
    </PageWrapper>
  )
}

QuizPage.displayName = 'QuizPage'
