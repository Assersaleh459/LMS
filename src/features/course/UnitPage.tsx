import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'

interface Lesson {
  id: string; title_ar: string; content_type: string
  duration_min: number | null; order_num: number; is_published: boolean
}

const ICONS: Record<string, string> = {
  video: '🎬', pdf: '📄', text: '📝', link: '🔗', quiz: '✅'
}
const TYPE_LABELS: Record<string, string> = {
  video: 'فيديو', pdf: 'ملف PDF', text: 'نص', link: 'رابط', quiz: 'اختبار'
}

export function UnitPage() {
  const { subjectId, unitId } = useParams<{ subjectId: string; unitId: string }>()
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const [unitTitle, setUnitTitle] = useState('')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const isTeacher = auth?.role === 'subject_teacher' || auth?.role === 'homeroom_teacher'

  useEffect(() => {
    if (!unitId || !auth?.profile?.id) return
    Promise.all([
      supabase.from('units').select('title_ar').eq('id', unitId).single(),
      supabase.from('lessons').select('*').eq('unit_id', unitId).order('order_num'),
      supabase.from('lesson_progress').select('lesson_id').eq('student_id', auth.profile.id),
    ]).then(([unitRes, lessonsRes, progressRes]) => {
      if (unitRes.data) setUnitTitle(unitRes.data.title_ar)
      if (lessonsRes.data) setLessons(lessonsRes.data)
      if (progressRes.data) setCompleted(new Set(progressRes.data.map(p => p.lesson_id)))
      setLoading(false)
    })
  }, [unitId, auth?.profile?.id])

  const progress = lessons.length ? Math.round((completed.size / lessons.length) * 100) : 0

  return (
    <PageWrapper>
      <AppBar title={unitTitle || 'الوحدة'} onBack={() => navigate(-1)} />

      {lessons.length > 0 && (
        <div className="px-4 py-3 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-arabic">{completed.size}/{lessons.length} درس مكتمل</span>
            <span className="text-xs font-bold text-teal">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {isTeacher && (
        <div className="px-4 py-3 border-b border-gray-100 bg-lms-bg">
          <button
            onClick={() => navigate(`/teacher/course/${subjectId}/unit/${unitId}/lesson/new`)}
            className="w-full py-3 rounded-xl bg-teal text-white font-bold font-arabic text-sm"
          >
            + إضافة درس جديد
          </button>
        </div>
      )}

      <div className="flex-1 px-4 py-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
          </div>
        ) : lessons.length === 0 ? (
          <p className="text-center text-gray-400 font-arabic text-sm py-20">لا توجد دروس بعد</p>
        ) : (
          lessons.map((lesson) => {
            const done = completed.has(lesson.id)
            return (
              <button
                key={lesson.id}
                onClick={() => navigate(`/course/${subjectId}/unit/${unitId}/lesson/${lesson.id}`)}
                className={`w-full rounded-2xl border p-4 text-right flex items-center gap-3 transition-colors ${
                  done ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 shadow-sm'
                }`}
              >
                <span className="text-2xl flex-shrink-0">{ICONS[lesson.content_type] ?? '📄'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold font-arabic text-gray-900 text-sm truncate">{lesson.title_ar}</p>
                  <p className="text-gray-500 font-arabic text-xs mt-0.5">
                    {TYPE_LABELS[lesson.content_type]}
                    {lesson.duration_min ? ` · ${lesson.duration_min} دقيقة` : ''}
                  </p>
                </div>
                {done ? (
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            )
          })
        )}
      </div>
    </PageWrapper>
  )
}

UnitPage.displayName = 'UnitPage'
