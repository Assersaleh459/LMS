import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { useLang } from '../../app/providers/LangProvider'

interface Subject {
  id: string
  name_ar: string
  name_en: string | null
  grade_year: number
  stage: string
}

const STAGE_KEYS: Record<string, string> = {
  kg: 'stage_kg',
  primary: 'stage_primary',
  prep: 'stage_prep',
  secondary: 'stage_sec',
}

export function SubjectsListPage() {
  const { t, ta, fa } = useLang()
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  const isTeacher = auth?.role === 'subject_teacher' || auth?.role === 'homeroom_teacher' || auth?.role === 'school_admin'

  useEffect(() => {
    if (!auth?.profile?.id || !auth?.schoolId) return

    if (isTeacher) {
      supabase
        .from('teacher_subjects')
        .select('subject_id, subjects(id, name_ar, name_en, grade_year, stage)')
        .eq('teacher_id', auth.profile.id)
        .then(({ data }) => {
          if (data) {
            const subs = data
              .map(row => row.subjects as Subject | null)
              .filter((s): s is Subject => s !== null)
            const unique = Array.from(new Map(subs.map(s => [s.id, s])).values())
            setSubjects(unique)
          }
          setLoading(false)
        })
    } else {
      supabase
        .from('subjects')
        .select('id, name_ar, name_en, grade_year, stage')
        .eq('school_id', auth.schoolId)
        .eq('is_active', true)
        .order('grade_year')
        .then(({ data }) => {
          if (data) setSubjects(data)
          setLoading(false)
        })
    }
  }, [auth?.profile?.id, auth?.schoolId])

  return (
    <PageWrapper>
      <AppBar title={t('subjects')} />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
          </div>
        ) : subjects.length === 0 ? (
          <p className={`text-center text-gray-400 ${fa} text-sm py-20`}>{t('no_subjects')}</p>
        ) : (
          subjects.map(sub => (
            <button
              key={sub.id}
              onClick={() => navigate(`/course/${sub.id}`)}
              className={`w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 ${ta} flex items-center gap-4`}
            >
              <div className="w-12 h-12 rounded-2xl bg-navy/10 flex items-center justify-center flex-shrink-0">
                <span className={`text-navy font-bold ${fa} text-xs leading-tight text-center`}>{sub.name_ar.slice(0, 2)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold ${fa} text-gray-900 text-sm truncate`}>{sub.name_ar}</p>
                <p className={`text-gray-400 ${fa} text-xs mt-0.5`}>
                  {t(STAGE_KEYS[sub.stage] ?? sub.stage)} — {t('grade_label')} {sub.grade_year}
                </p>
              </div>
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

SubjectsListPage.displayName = 'SubjectsListPage'
