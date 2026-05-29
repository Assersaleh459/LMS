import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang } from '../../app/providers/LangProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { KG_GRADES } from '../../lib/moe'

interface SubjectResult {
  subject_id:   string
  subject_name: string
  pct:          number
}

function toKGGrade(pct: number) {
  if (pct >= 85) return KG_GRADES[0]
  if (pct >= 65) return KG_GRADES[1]
  return KG_GRADES[2]
}

export function KGGradesPage() {
  const auth = useContext(AuthContext)
  const { t, fa } = useLang()
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState<SubjectResult[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!auth?.profile?.id || !auth?.schoolId) return

    supabase.from('academic_terms')
      .select('id')
      .eq('school_id', auth.schoolId)
      .eq('is_active', true)
      .single()
      .then(({ data: term }) => {
        if (!term) { setLoading(false); return }

        supabase.from('grade_entries')
          .select(`subject_id, total_grade, subjects ( name_ar, total_marks )`)
          .eq('student_id', auth.profile!.id)
          .eq('term_id', term.id)
          .then(({ data }) => {
            if (!data) { setLoading(false); return }

            const map: Record<string, { name: string; score: number; max: number }> = {}
            for (const r of data as any[]) {
              const sid = r.subject_id
              if (!map[sid]) {
                map[sid] = { name: r.subjects?.name_ar ?? sid, score: 0, max: r.subjects?.total_marks ?? 100 }
              }
              map[sid].score += r.total_grade
            }

            setSubjects(
              Object.entries(map).map(([sid, v]) => ({
                subject_id:   sid,
                subject_name: v.name,
                pct:          v.max > 0 ? Math.round((v.score / v.max) * 100) : 0,
              }))
            )
            setLoading(false)
          })
      })
  }, [auth?.profile?.id, auth?.schoolId])

  return (
    <PageWrapper>
      <AppBar title={t('my_grades')} subtitle={t('kg_grades_sub')} onBack={() => navigate(-1)} />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-5xl mb-4">📊</span>
          <p className={`${fa} text-sm`}>{t('no_grades_yet')}</p>
        </div>
      ) : (
        <div className="py-4 px-4 space-y-3 pb-24">
          {subjects.map(sub => {
            const grade = toKGGrade(sub.pct)
            return (
              <div
                key={sub.subject_id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between px-5 py-4"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{grade.emoji}</span>
                  <span className={`text-lg font-bold text-gray-800 ${fa}`}>{grade.label}</span>
                </div>
                <p className={`font-bold text-gray-700 text-sm ${fa}`}>{sub.subject_name}</p>
              </div>
            )
          })}
        </div>
      )}
    </PageWrapper>
  )
}

KGGradesPage.displayName = 'KGGradesPage'
