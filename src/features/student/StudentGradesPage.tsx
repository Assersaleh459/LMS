import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang } from '../../app/providers/LangProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { toArabicNumerals } from '../../lib/arabic'
import { getMoELetterGrade, calcThanawyWeightedGrade } from '../../lib/moe'

interface SubjectSummary {
  subject_id: string
  subject_name: string
  grades: { type: string; score: number; max: number }[]
  total: number
  maxTotal: number
}

// Maps grade_type → subject column holding the max marks for that type
const TYPE_MAX_COL: Record<string, string> = {
  written:    'written_marks',
  oral:       'oral_marks',
  practical:  'practical_marks',
  activity:   'activity_marks',
}

const TYPE_LABEL: Record<string, string> = {
  written:   'grade_written',
  oral:      'grade_oral',
  practical: 'grade_practical',
  activity:  'grade_activity',
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
  const isSecondary = auth?.role === 'prep_secondary_student'

  const [subjects, setSubjects] = useState<SubjectSummary[]>([])
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

        // Join grade_entries → subjects to get the mark allocations per grade type
        supabase.from('grade_entries')
          .select(`
            subject_id,
            grade_type,
            total_grade,
            subjects (
              name_ar,
              total_marks,
              written_marks,
              oral_marks,
              practical_marks,
              activity_marks
            )
          `)
          .eq('student_id', auth.profile!.id)
          .eq('term_id', term.id)
          .then(({ data }) => {
            if (!data) { setLoading(false); return }

            const map: Record<string, SubjectSummary> = {}
            for (const r of data as any[]) {
              const sid  = r.subject_id
              const sub  = r.subjects
              const name = sub?.name_ar ?? sid

              if (!map[sid]) {
                map[sid] = {
                  subject_id:   sid,
                  subject_name: name,
                  grades:       [],
                  total:        0,
                  maxTotal:     sub?.total_marks ?? 100,
                }
              }

              // Get the max for this specific grade type from the subject columns
              const maxColKey = TYPE_MAX_COL[r.grade_type]
              const maxForType = sub?.[maxColKey] ?? 0

              map[sid].grades.push({
                type:  r.grade_type,
                score: r.total_grade,
                max:   maxForType,
              })
              map[sid].total += r.total_grade
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
            if (isSecondary) {
              // Thanawi: find monthly and final grades
              const monthly = sub.grades.find(g => g.type === 'monthly')
              const final   = sub.grades.find(g => g.type === 'final')
              const weighted = (monthly || final)
                ? calcThanawyWeightedGrade(
                    monthly?.score ?? 0, final?.score ?? 0,
                    monthly?.max ?? 100, final?.max ?? 100
                  )
                : 0
              const letter = weighted > 0 ? getMoELetterGrade(weighted, 100) : null
              return (
                <div key={sub.subject_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      {weighted > 0 && <span className={`text-lg font-bold ${gradeColor(weighted)} ${fa}`}>{toArabicNumerals(weighted)}%</span>}
                      {letter && <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${weighted >= 65 ? 'bg-green-50 text-green-700' : weighted >= 50 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600'}`}>{letter.label}</span>}
                    </div>
                    <p className={`font-bold text-gray-800 text-sm ${fa}`}>{sub.subject_name}</p>
                  </div>
                  <div className="flex divide-x divide-gray-50">
                    <div className="flex-1 px-4 py-3 text-center">
                      <p className={`text-xs text-gray-400 ${fa}`}>{t('monthly_40')}</p>
                      <p className={`font-bold text-gray-800 ${fa}`}>{monthly ? toArabicNumerals(monthly.score) : '—'}</p>
                    </div>
                    <div className="flex-1 px-4 py-3 text-center">
                      <p className={`text-xs text-gray-400 ${fa}`}>{t('final_60')}</p>
                      <p className={`font-bold text-gray-800 ${fa}`}>{final ? toArabicNumerals(final.score) : '—'}</p>
                    </div>
                    <div className="flex-1 px-4 py-3 text-center bg-gray-50">
                      <p className={`text-xs text-gray-400 ${fa}`}>{t('total_lbl')}</p>
                      <p className={`font-bold text-navy ${fa}`}>{weighted > 0 ? toArabicNumerals(weighted) : '—'}</p>
                    </div>
                  </div>
                </div>
              )
            }

            // Primary: existing numeric display
            const p      = pct(sub.total, sub.maxTotal)
            const letter = getMoELetterGrade(p, 100)
            return (
              <div key={sub.subject_id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`text-lg font-bold ${gradeColor(p)} ${fa}`}>{toArabicNumerals(p)}%</div>
                    <div className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      p >= 65 ? 'bg-green-50 text-green-700' : p >= 50 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600'
                    }`}>{letter.label}</div>
                  </div>
                  <p className={`font-bold text-gray-800 text-sm ${fa}`}>{sub.subject_name}</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {sub.grades.map(g => {
                    const gp = pct(g.score, g.max)
                    return (
                      <div key={g.type} className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${gradeColor(gp)} ${fa}`}>
                            {toArabicNumerals(g.score)}/{toArabicNumerals(g.max)}
                          </span>
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${gp >= 65 ? 'bg-teal' : gp >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${gp}%` }} />
                          </div>
                        </div>
                        <p className={`text-sm text-gray-600 ${fa}`}>{t(TYPE_LABEL[g.type] ?? g.type)}</p>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
                  <span className={`text-sm font-bold ${gradeColor(p)} ${fa}`}>{toArabicNumerals(sub.total)}/{toArabicNumerals(sub.maxTotal)}</span>
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
