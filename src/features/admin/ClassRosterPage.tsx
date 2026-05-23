import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { useLang } from '../../app/providers/LangProvider'
import { getMoELetterGrade } from '../../lib/moe'
import { toArabicNumerals } from '../../lib/arabic'
import type { StudentCard } from '../../types/domain'

interface StudentRow extends StudentCard {
  todayStatus?: string
  avgPct?: number
}

const STATUS_STYLE: Record<string, string> = {
  present: 'bg-green-100 text-green-700',
  absent:  'bg-red-100 text-red-600',
  late:    'bg-yellow-100 text-yellow-700',
}

export function ClassRosterPage() {
  const { grade, section } = useParams<{ grade: string; section: string }>()
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const { t, fa } = useLang()

  const [students, setStudents] = useState<StudentRow[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!auth?.schoolId || !grade || !section) return

    const today = new Date().toISOString().split('T')[0]

    supabase.from('v_student_card').select('*')
      .eq('school_id', auth.schoolId)
      .eq('grade_year', parseInt(grade))
      .eq('section', section)
      .order('full_name_ar')
      .then(async ({ data: sData }) => {
        if (!sData?.length) { setLoading(false); return }
        const ids = sData.map(s => s.id)

        const [attRes, gradesRes] = await Promise.all([
          supabase.from('attendance_records').select('student_id, status')
            .in('student_id', ids).eq('attendance_date', today),
          supabase.from('grade_entries').select('student_id, total_grade')
            .in('student_id', ids),
        ])

        const attMap: Record<string, string> = {}
        for (const a of attRes.data ?? []) attMap[a.student_id] = a.status

        const gradeSum: Record<string, { sum: number; count: number }> = {}
        for (const g of gradesRes.data ?? []) {
          if (!gradeSum[g.student_id]) gradeSum[g.student_id] = { sum: 0, count: 0 }
          gradeSum[g.student_id].sum += g.total_grade
          gradeSum[g.student_id].count++
        }

        setStudents((sData as StudentCard[]).map(s => ({
          ...s,
          todayStatus: attMap[s.id],
          avgPct: gradeSum[s.id]?.count
            ? Math.round(gradeSum[s.id].sum / gradeSum[s.id].count)
            : undefined,
        })))
        setLoading(false)
      })
  }, [auth?.schoolId, grade, section])

  const presentToday = students.filter(s => s.todayStatus === 'present').length
  const absentToday  = students.filter(s => s.todayStatus === 'absent').length

  return (
    <PageWrapper>
      <AppBar
        title={`${t('grade_label')} ${grade} — ${section}`}
        subtitle={`${students.length} ${t('students')}`}
        onBack={() => navigate(-1)}
      />

      {/* Today summary */}
      {!loading && (
        <div className="flex gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <div className="flex-1 text-center">
            <p className="text-lg font-bold text-green-700">{toArabicNumerals(presentToday)}</p>
            <p className={`text-xs text-gray-500 ${fa}`}>{t('present')}</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="flex-1 text-center">
            <p className="text-lg font-bold text-red-600">{toArabicNumerals(absentToday)}</p>
            <p className={`text-xs text-gray-500 ${fa}`}>{t('absent')}</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="flex-1 text-center">
            <p className="text-lg font-bold text-gray-400">{toArabicNumerals(students.length - presentToday - absentToday)}</p>
            <p className={`text-xs text-gray-500 ${fa}`}>{t('pending')}</p>
          </div>
        </div>
      )}

      <div className="bg-white flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
          </div>
        ) : (
          students.map((s, i) => {
            const gradeLabel = s.avgPct !== undefined ? getMoELetterGrade(s.avgPct, 100) : null
            return (
              <button
                key={s.id}
                onClick={() => navigate(`/teacher/student/${s.id}/progress`)}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 active:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-navy/10 flex items-center justify-center text-xs font-bold text-navy">
                    {i + 1}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800 font-arabic">{s.full_name_ar}</p>
                    <p className="text-xs text-gray-400">{s.student_code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.todayStatus && (
                    <span className={`text-xs font-arabic font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[s.todayStatus] ?? 'bg-gray-100 text-gray-500'}`}>
                      {t(s.todayStatus) ?? s.todayStatus}
                    </span>
                  )}
                  {gradeLabel && (
                    <span className="text-xs font-bold font-arabic px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: gradeLabel.color + '20', color: gradeLabel.color }}>
                      {gradeLabel.label}
                    </span>
                  )}
                  <svg className="w-4 h-4 text-gray-300 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            )
          })
        )}
      </div>
    </PageWrapper>
  )
}

ClassRosterPage.displayName = 'ClassRosterPage'
