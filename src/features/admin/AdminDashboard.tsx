import { useContext } from 'react'
import { AuthContext }  from '../../app/providers/AuthProvider'
import { useSchool }    from '../../app/providers/SchoolProvider'
import { PageWrapper }  from '../../components/layout/PageWrapper'
import { AppBar }       from '../../components/layout/AppBar'
import { Card }         from '../../components/ui/Card'
import { SchoolHealthScore } from './SchoolHealthScore'
import { useAdminData } from './useAdminData'
import { toArabicNumerals, formatDateAr } from '../../lib/arabic'

export function AdminDashboard() {
  const auth       = useContext(AuthContext)
  const { school } = useSchool()
  const { stats, loading } = useAdminData()

  return (
    <PageWrapper>
      <AppBar
        title={school?.name_ar ?? 'لوحة المدير'}
        subtitle={formatDateAr(new Date())}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="py-4 space-y-4">
          {stats && (
            <SchoolHealthScore attendanceRate={stats.attendanceRate} />
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mx-4">
            {[
              { label: 'الطلاب',  value: stats?.totalStudents ?? 0,  icon: '🎓', color: 'text-navy' },
              { label: 'المعلمون', value: stats?.totalTeachers ?? 0, icon: '👩‍🏫', color: 'text-teal' },
              { label: 'غياب اليوم', value: stats?.absentToday ?? 0, icon: '⚠️', color: 'text-red-600' },
              { label: 'نسبة الحضور', value: `${stats?.attendanceRate ?? 0}%`, icon: '📊', color: 'text-green-700' },
            ].map(({ label, value, icon, color }) => (
              <Card key={label} className="text-center py-5">
                <span className="text-3xl">{icon}</span>
                <p className={`text-2xl font-bold mt-2 font-arabic ${color}`}>
                  {typeof value === 'number' ? toArabicNumerals(value) : value}
                </p>
                <p className="text-xs text-gray-500 font-arabic mt-0.5">{label}</p>
              </Card>
            ))}
          </div>

          <div className="mx-4">
            <p className="text-xs text-gray-400 font-arabic text-center">
              مرحباً {auth?.profile?.first_name_ar} — لوحة الإدارة الكاملة قريباً
            </p>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

AdminDashboard.displayName = 'AdminDashboard'
