import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext }  from '../../app/providers/AuthProvider'
import { useLang }      from '../../app/providers/LangProvider'
import { useSchool }    from '../../app/providers/SchoolProvider'
import { supabase }     from '../../lib/supabase'
import { PageWrapper }  from '../../components/layout/PageWrapper'
import { AppBar }       from '../../components/layout/AppBar'
import { Card }         from '../../components/ui/Card'
import { SchoolHealthScore } from './SchoolHealthScore'
import { useAdminData } from './useAdminData'
import { toArabicNumerals, formatDateAr } from '../../lib/arabic'

interface ClassSummary { grade: number; section: string; count: number }

export function AdminDashboard() {
  const auth       = useContext(AuthContext)
  const { t, fa }  = useLang()
  const { school } = useSchool()
  const navigate   = useNavigate()
  const { stats, loading } = useAdminData()
  const [classes, setClasses] = useState<ClassSummary[]>([])

  useEffect(() => {
    if (!auth?.schoolId) return
    supabase.from('v_student_card').select('grade_year, section')
      .eq('school_id', auth.schoolId)
      .then(({ data }) => {
        if (!data) return
        const map: Record<string, ClassSummary> = {}
        for (const s of data) {
          const key = `${s.grade_year}:${s.section}`
          if (!map[key]) map[key] = { grade: s.grade_year, section: s.section, count: 0 }
          map[key].count++
        }
        setClasses(Object.values(map).sort((a, b) => a.grade - b.grade || a.section.localeCompare(b.section)))
      })
  }, [auth?.schoolId])

  return (
    <PageWrapper>
      <AppBar
        title={school?.name_ar ?? t('admin_title')}
        subtitle={formatDateAr(new Date())}
        onLogout={auth?.signOut}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="py-4 space-y-5 overflow-y-auto pb-24">
          {stats && <SchoolHealthScore attendanceRate={stats.attendanceRate} />}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mx-4">
            {[
              { label: t('total_students'), value: stats?.totalStudents ?? 0,  icon: '🎓', color: 'text-navy' },
              { label: t('total_teachers'), value: stats?.totalTeachers ?? 0,  icon: '👩‍🏫', color: 'text-teal' },
              { label: t('absent'),         value: stats?.absentToday ?? 0,    icon: '⚠️', color: 'text-red-600' },
              { label: t('present_today'),  value: `${stats?.attendanceRate ?? 0}%`, icon: '📊', color: 'text-green-700' },
            ].map(({ label, value, icon, color }) => (
              <Card key={label} className="text-center py-5">
                <span className="text-3xl">{icon}</span>
                <p className={`text-2xl font-bold mt-2 font-arabic ${color}`}>
                  {typeof value === 'number' ? toArabicNumerals(value) : value}
                </p>
                <p className={`text-xs text-gray-500 ${fa} mt-0.5`}>{label}</p>
              </Card>
            ))}
          </div>

          {/* Class list */}
          {classes.length > 0 && (
            <div className="mx-4">
              <p className={`text-sm font-bold text-gray-700 ${fa} mb-3`}>{t('classes')} ({classes.length})</p>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {classes.map((cls, i) => (
                  <button
                    key={`${cls.grade}:${cls.section}`}
                    onClick={() => navigate(`/admin/class/${cls.grade}/${cls.section}`)}
                    className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 active:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-navy/10 flex items-center justify-center">
                        <span className="text-navy font-bold text-sm">{i + 1}</span>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-gray-800 text-sm ${fa}`}>
                          {t('grade_label')} {cls.grade} — {cls.section}
                        </p>
                        <p className={`text-xs text-gray-400 ${fa}`}>
                          {toArabicNumerals(cls.count)} {t('students')}
                        </p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  )
}

AdminDashboard.displayName = 'AdminDashboard'
