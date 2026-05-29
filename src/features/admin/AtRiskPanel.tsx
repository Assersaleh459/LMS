import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang } from '../../app/providers/LangProvider'
import { supabase } from '../../lib/supabase'
import { toArabicNumerals } from '../../lib/arabic'

interface AtRiskStudent {
  student_id:        string
  full_name_ar:      string
  grade_year:        number
  section:           string
  absence_rate:      number
  avg_grade_pct:     number
  overdue_assignments: number
  flag_attendance:   boolean
  flag_grades:       boolean
  flag_assignments:  boolean
  risk_score:        number
}

export function AtRiskPanel() {
  const auth = useContext(AuthContext)
  const { t, fa } = useLang()
  const [students, setStudents] = useState<AtRiskStudent[]>([])
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!auth?.schoolId) return
    ;(supabase as any)
      .from('v_at_risk_students')
      .select('*')
      .eq('school_id', auth.schoolId)
      .order('risk_score', { ascending: false })
      .then(({ data }: { data: AtRiskStudent[] | null }) => {
        setStudents(data ?? [])
        setLoading(false)
      })
  }, [auth?.schoolId])

  if (loading || students.length === 0) return null

  return (
    <div className="mx-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-red-50 border border-red-200 rounded-2xl px-4 py-3.5 active:bg-red-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
            {toArabicNumerals(students.length)}
          </span>
          <span className={`text-sm font-bold text-red-700 ${fa}`}>{t('at_risk_title')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs text-red-400 ${fa}`}>{t('at_risk_sub')}</span>
          <svg
            className={`w-4 h-4 text-red-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm mt-2 overflow-hidden">
          {students.map((s, i) => (
            <div
              key={s.student_id}
              className={`px-4 py-3 ${i < students.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-1.5 flex-wrap">
                  {s.flag_attendance && (
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold ${fa}`}>
                      {t('at_risk_flag_attend')} {toArabicNumerals(Math.round(s.absence_rate))}%
                    </span>
                  )}
                  {s.flag_grades && (
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold ${fa}`}>
                      {t('at_risk_flag_grades')} {toArabicNumerals(Math.round(s.avg_grade_pct))}%
                    </span>
                  )}
                  {s.flag_assignments && (
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-bold ${fa}`}>
                      {t('at_risk_flag_hw')} {toArabicNumerals(s.overdue_assignments)}
                    </span>
                  )}
                </div>
                <div className="text-right mr-2">
                  <p className={`font-bold text-gray-800 text-sm ${fa}`}>{s.full_name_ar}</p>
                  <p className={`text-xs text-gray-400 ${fa}`}>
                    {t('grade_label')} {toArabicNumerals(s.grade_year)} — {s.section}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

AtRiskPanel.displayName = 'AtRiskPanel'
