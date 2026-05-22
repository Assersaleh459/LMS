import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'

interface Unit {
  id: string
  title_ar: string
  description_ar: string | null
  order_num: number
  is_published: boolean
  lesson_count?: number
}

interface Subject {
  id: string
  name_ar: string
}

export function CoursePage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const [subject, setSubject] = useState<Subject | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const isTeacher = auth?.role === 'subject_teacher' || auth?.role === 'homeroom_teacher'

  useEffect(() => {
    if (!subjectId) return
    Promise.all([
      supabase.from('subjects').select('id, name_ar').eq('id', subjectId).single(),
      supabase.from('units').select('*').eq('subject_id', subjectId).order('order_num'),
    ]).then(([subjRes, unitsRes]) => {
      if (subjRes.data) setSubject(subjRes.data)
      if (unitsRes.data) setUnits(unitsRes.data)
      setLoading(false)
    })
  }, [subjectId])

  return (
    <PageWrapper>
      <AppBar title={subject?.name_ar ?? 'المادة'} onBack={() => navigate(-1)} />

      {isTeacher && (
        <div className="px-4 py-3 border-b border-gray-100 bg-white">
          <button
            onClick={() => navigate(`/teacher/course/${subjectId}/unit/new`)}
            className="w-full py-3 rounded-xl bg-teal text-white font-bold font-arabic text-sm"
          >
            + إضافة وحدة جديدة
          </button>
        </div>
      )}

      <div className="flex-1 px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
          </div>
        ) : units.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 font-arabic text-sm">لا توجد وحدات بعد</p>
            {isTeacher && <p className="text-gray-400 font-arabic text-xs mt-1">ابدأ بإضافة أول وحدة</p>}
          </div>
        ) : (
          units.map((unit, idx) => (
            <button
              key={unit.id}
              onClick={() => navigate(`/course/${subjectId}/unit/${unit.id}`)}
              className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-right flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center flex-shrink-0">
                <span className="text-teal font-bold font-arabic text-sm">{idx + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold font-arabic text-gray-900 text-sm truncate">{unit.title_ar}</p>
                {unit.description_ar && (
                  <p className="text-gray-500 font-arabic text-xs mt-0.5 truncate">{unit.description_ar}</p>
                )}
              </div>
              {!unit.is_published && (
                <span className="text-xs font-arabic text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full flex-shrink-0">مسودة</span>
              )}
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))
        )}
      </div>
    </PageWrapper>
  )
}

CoursePage.displayName = 'CoursePage'
