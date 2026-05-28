import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang } from '../../app/providers/LangProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { toArabicNumerals } from '../../lib/arabic'
import { getMoELetterGrade } from '../../lib/moe'

interface SubjectSummary {
  subject_id: string
  subject_name: string
  grades: { type: string; score: number; max: number }[]
  total: number
  maxTotal: number
}

const TYPE_LABEL: Record<string, string> = {
  written: 'grade_written',
  oral: 'grade_oral',
  practical: 'grade_practical',
  activity: 'grade_activity',
}

function pct(score: number, max: number) {
  return max > 0 ? Math.round((score / max) * 100) : 0
}

function gradeColor(p: number) {
  if (p >= 85) return 'text-green-600'
  if (p >= 65) return 'text-teal'
  if (p >= 50) return 'text-yellow-500'
  return 'text-red-500'
}

export function StudentGradesPage() {
  const auth = useContext(AuthContext)
  const { t, fa } = useLang()
  const navigate = useNavigate()

  const [subjects, setSubjects] = useState<SubjectSummary[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!auth?.profile?.id || !auth?.schoolId) return

    supabase.from('academic_terms').select('id').eq('school_id', auth.schoolId).eq('is_active', true).single()
      .then(({ data: term }) => {
        if (!term) { setLoading(false); return }

        supabase.from('grade_entries')
          .select('subject_id, grade_type, total_grade, max_grade, subjects(name_ar)')
          .eq('student_id', auth.profile!.id)
          .eq('term_id', term.id)
          .then(({ data }) => {
            if (!data) { setLoading(false); return }

            const map: Record<string, SubjectSummary> = {}
            for (const r of data as any[]) {
              const sid = r.subject_id
              const name = r.subjects?.name_ar ?? sid
              if (!map[sid]) map[sid] = { subject_id: sid, subject_name: name, grades: [], total: 0, maxTotal: 0 }
              map[sid].grades.push({ type: r.grade_type, score: r.total_grade, max: r.max_grade })
              map[sid].total    += r.total_grade
              map[sid].maxTotal += r.max_grade
            }
            setSubjects(Object.values(map))
            setLoading(false)
          })
      })
  }, [auth?.profile?.id, auth?.schoolId])

  return (
    <PageWrapper>
      <AppBar
        title={t('my_grades')}
        subtitle={t('my_grades_sub')}
        onBack={() => navigate(-1)}
      />

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
        <div className="py-4 space-y-3 px-4 pb-24">
          {subjects.map(sub => {
            const p = pct(sub.total, sub.maxTotal)
            const letter = getMoELetterGrade(p, 100)
            return (
              <div key={sub.subject_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Subject header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`text-lg font-bold ${gradeColor(p)} ${fa}`}>{toArabicNumerals(p)}%</div>
                    <div className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      p >= 65 ? 'bg-green-50 text-green-700' : p >= 50 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600'
                    }`}>{letter.label}</div>
                  </div>
                  <p className={`font-bold text-gray-800 text-sm ${fa}`}>{sub.subject_name}</p>
                </div>

                {/* Grade breakdown */}
                <div className="divide-y divide-gray-50">
                  {sub.grades.map(g => (
                    <div key={g.type} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${gradeColor(pct(g.score, g.max))} ${fa}`}>
                          {toArabicNumerals(g.score)}/{toArabicNumerals(g.max)}
                        </span>
                        {/* progress bar */}
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct(g.score, g.max) >= 65 ? 'bg-teal' : pct(g.score, g.max) >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                            style={{ width: `${pct(g.score, g.max)}%` }}
                          />
                        </div>
                      </div>
                      <p className={`text-sm text-gray-600 ${fa}`}>{t(TYPE_LABEL[g.type] ?? g.type)}</p>
                    </div>
                  ))}
                </div>

                {/* Total row */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
                  <span className={`text-sm font-bold ${gradeColor(p)} ${fa}`}>
                    {toArabicNumerals(sub.total)}/{toArabicNumerals(sub.maxTotal)}
                  </span>
                  <p className={`text-xs font-bold text-gray-500 ${fa}`}>{t('col_total')}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PageWrapper>
  )
}

StudentGradesPage.displayName = 'StudentGradesPage'
