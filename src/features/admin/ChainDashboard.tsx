import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang } from '../../app/providers/LangProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Card } from '../../components/ui/Card'
import { toArabicNumerals } from '../../lib/arabic'

interface SchoolStat {
  id: string
  name_ar: string
  student_count: number
  teacher_count: number
  attendance_rate: number
}

export function ChainDashboard() {
  const auth = useContext(AuthContext)
  const { t, fa } = useLang()
  const [schools,  setSchools]  = useState<SchoolStat[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    supabase.from('schools').select('id, name_ar')
      .then(async ({ data: schoolList }) => {
        if (!schoolList) { setLoading(false); return }

        const stats: SchoolStat[] = await Promise.all(schoolList.map(async (s) => {
          const [stuRes, teachRes, attRes] = await Promise.all([
            supabase.from('users').select('id', { count: 'exact', head: true })
              .eq('school_id', s.id).in('role', ['kg_primary_student', 'prep_secondary_student']),
            supabase.from('users').select('id', { count: 'exact', head: true })
              .eq('school_id', s.id).in('role', ['subject_teacher', 'homeroom_teacher']),
            (supabase as any).from('attendance_records').select('status')
              .eq('school_id', s.id)
              .gte('attendance_date', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]),
          ])

          const total = attRes.data?.length ?? 0
          const present = attRes.data?.filter((r: any) => r.status === 'present').length ?? 0
          const rate = total > 0 ? Math.round((present / total) * 100) : 0

          return {
            id: s.id,
            name_ar: s.name_ar,
            student_count: stuRes.count ?? 0,
            teacher_count: teachRes.count ?? 0,
            attendance_rate: rate,
          }
        }))

        setSchools(stats)
        setLoading(false)
      })
  }, [])

  const totals = schools.reduce((acc, s) => ({
    students: acc.students + s.student_count,
    teachers: acc.teachers + s.teacher_count,
    avg: acc.avg + s.attendance_rate,
  }), { students: 0, teachers: 0, avg: 0 })
  const avgAttend = schools.length > 0 ? Math.round(totals.avg / schools.length) : 0

  return (
    <PageWrapper>
      <AppBar
        title={t('chain_dashboard')}
        onLogout={auth?.signOut}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="py-4 space-y-5 pb-24">
          {/* Totals */}
          <div className="grid grid-cols-3 gap-3 mx-4">
            {[
              { label: t('school_count'),    value: schools.length,   icon: '🏫' },
              { label: t('chain_students'),  value: totals.students,  icon: '🎓' },
              { label: t('chain_teachers'),  value: totals.teachers,  icon: '👩‍🏫' },
            ].map(({ label, value, icon }) => (
              <Card key={label} className="text-center py-4">
                <span className="text-2xl">{icon}</span>
                <p className={`text-xl font-bold mt-1 text-navy ${fa}`}>{toArabicNumerals(value)}</p>
                <p className={`text-[10px] text-gray-400 mt-0.5 ${fa}`}>{label}</p>
              </Card>
            ))}
          </div>

          <div className="mx-4">
            <Card className="flex items-center justify-between px-4 py-4">
              <span className={`text-2xl font-bold ${avgAttend >= 80 ? 'text-green-600' : avgAttend >= 60 ? 'text-yellow-500' : 'text-red-500'} ${fa}`}>
                {toArabicNumerals(avgAttend)}%
              </span>
              <p className={`text-sm font-bold text-gray-700 ${fa}`}>{t('chain_attendance')}</p>
            </Card>
          </div>

          {/* Schools list */}
          <div className="mx-4">
            <p className={`text-sm font-bold text-gray-700 ${fa} mb-3`}>{t('all_schools')}</p>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {schools.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-4 py-4 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${s.attendance_rate >= 80 ? 'text-green-600' : s.attendance_rate >= 60 ? 'text-yellow-500' : 'text-red-500'} ${fa}`}>
                      {toArabicNumerals(s.attendance_rate)}%
                    </span>
                    <span className={`text-xs text-gray-400 ${fa}`}>
                      {toArabicNumerals(s.student_count)} طالب
                    </span>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-gray-800 text-sm ${fa}`}>{s.name_ar}</p>
                    <p className={`text-xs text-gray-400 ${fa}`}>{toArabicNumerals(i + 1)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

ChainDashboard.displayName = 'ChainDashboard'
