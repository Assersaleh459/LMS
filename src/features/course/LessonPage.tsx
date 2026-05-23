import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { useLang } from '../../app/providers/LangProvider'

interface Lesson {
  id: string; title_ar: string; content_type: string
  content_url: string | null; content_text: string | null; duration_min: number | null
}

function getYouTubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{11})/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
}

export function LessonPage() {
  const { t, fa } = useLang()
  const { lessonId } = useParams<{ subjectId: string; unitId: string; lessonId: string }>()
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [completed, setCompleted] = useState(false)
  const [marking, setMarking] = useState(false)

  useEffect(() => {
    if (!lessonId || !auth?.profile?.id) return
    Promise.all([
      supabase.from('lessons').select('*').eq('id', lessonId).single(),
      supabase.from('lesson_progress').select('id').eq('lesson_id', lessonId).eq('student_id', auth.profile.id).maybeSingle(),
    ]).then(([lessonRes, progressRes]) => {
      if (lessonRes.data) setLesson(lessonRes.data)
      setCompleted(!!progressRes.data)
    })
  }, [lessonId, auth?.profile?.id])

  async function markComplete() {
    if (completed || !auth?.profile?.id || !lessonId) return
    setMarking(true)
    await supabase.from('lesson_progress').insert({ lesson_id: lessonId, student_id: auth.profile.id })
    setCompleted(true)
    setMarking(false)
  }

  if (!lesson) return (
    <PageWrapper>
      <AppBar title={t('lesson')} onBack={() => navigate(-1)} />
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
      </div>
    </PageWrapper>
  )

  const embedUrl = lesson.content_url ? getYouTubeEmbed(lesson.content_url) : null

  return (
    <PageWrapper>
      <AppBar title={lesson.title_ar} onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto">
        {/* Video */}
        {lesson.content_type === 'video' && lesson.content_url && (
          <div className="bg-black">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full aspect-video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={lesson.content_url} controls className="w-full aspect-video" />
            )}
          </div>
        )}

        {/* PDF */}
        {lesson.content_type === 'pdf' && lesson.content_url && (
          <div className="px-4 py-6 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📄</span>
            </div>
            <p className={`${fa} text-gray-700 font-bold mb-4`}>{lesson.title_ar}</p>
            <a
              href={lesson.content_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-block px-6 py-3 bg-teal text-white rounded-xl ${fa} font-bold text-sm`}
            >
              {t('open_file')}
            </a>
          </div>
        )}

        {/* External link */}
        {lesson.content_type === 'link' && lesson.content_url && (
          <div className="px-4 py-6 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔗</span>
            </div>
            <p className={`${fa} text-gray-700 font-bold mb-4`}>{lesson.title_ar}</p>
            <a
              href={lesson.content_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-block px-6 py-3 bg-navy text-white rounded-xl ${fa} font-bold text-sm`}
            >
              {t('open_link')}
            </a>
          </div>
        )}

        {/* Text content */}
        {lesson.content_type === 'text' && lesson.content_text && (
          <div className="px-4 py-6">
            <div className={`prose prose-sm max-w-none ${fa} text-gray-800 leading-relaxed whitespace-pre-wrap`} style={{ textAlign: 'start' }}>
              {lesson.content_text}
            </div>
          </div>
        )}

        {/* Quiz redirect */}
        {lesson.content_type === 'quiz' && (
          <div className="px-4 py-6 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <p className={`${fa} text-gray-700 font-bold mb-2`}>{lesson.title_ar}</p>
            <button
              onClick={() => navigate(`/quiz/${lessonId}`)}
              className={`px-6 py-3 bg-teal text-white rounded-xl ${fa} font-bold text-sm`}
            >
              {t('start_quiz')}
            </button>
          </div>
        )}

        {/* Mark complete */}
        <div className="px-4 py-4 pb-24">
          <button
            onClick={markComplete}
            disabled={completed || marking}
            className={`w-full py-4 rounded-xl font-bold ${fa} text-base transition-colors ${
              completed
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'bg-teal text-white hover:bg-teal-light disabled:opacity-50'
            }`}
          >
            {completed ? t('completed') : marking ? t('completing') : t('complete')}
          </button>
        </div>
      </div>
    </PageWrapper>
  )
}

LessonPage.displayName = 'LessonPage'
