import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang } from '../../app/providers/LangProvider'
import { supabase } from '../../lib/supabase'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { AppBar } from '../../components/layout/AppBar'
import { Card } from '../../components/ui/Card'
import { toArabicNumerals, formatDateAr } from '../../lib/arabic'
import { useTeacherSubjects } from '../../hooks/useTeacherSubjects'

interface DashStats {
  classCount:        number
  ungradedCount:     number
  pendingAssign:     number
  absentToday:       number
}

interface RecentAssignment {
  id:          string
  title_ar:    string
  due_date:    string
  ungraded:    number
}

export function TeacherDashboard() {
  const auth = useContext(AuthContext)
  const { t, fa } = useLang()
  const navigate = useNavigate()
  const { subjects, loading: loadingSubjects } = useTeacherSubjects()
  const [stats,       setStats]       = useState<DashStats | null>(null)
  const [assignments, setAssignments] = useState<RecentAssignment[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    if (!auth?.profile?.id || loadingSubjects) return

    const today = new Date().toISOString().split('T')[0]
    const subjectIds = subjects.map(s => s.subjectId)

    Promise.all([
      // Ungraded submissions across teacher's assignments
      subjectIds.length
        ? (supabase as any).from('assignment_submissions')
            .select('id', { count: 'exact', head: true })
            .in('status', ['submitted', 'late'])
            .then(async ({ count: ungraded }: any) => {
              // Absent students today across teacher's classes
              const { count: absent } = await supabase
                .from('attendance_records')
                .select('id', { count: 'exact', head: true })
                .eq('teacher_id', auth!.profile!.id)
                .eq('attendance_date', today)
                .eq('status', 'absent')

              // Upcoming assignments not yet due
              const { data: assigns } = await supabase
                .from('assignments')
                .select('id, title_ar, due_date')
                .eq('teacher_id', auth!.profile!.id)
                .gte('due_date', today)
                .order('due_date')
                .limit(4)

              setStats({
                classCount:    subjects.length,
                ungradedCount: ungraded ?? 0,
                pendingAssign: assigns?.length ?? 0,
                absentToday:   absent ?? 0,
              })
              setAssignments((assigns ?? []).map((a: any) => ({ ...a, ungraded: 0 })))
              setLoading(false)
            })
        : Promise.resolve().then(() => { setLoading(false) })
    ])
  }, [auth?.profile?.id, subjects, loadingSubjects])

  const profile = auth?.profile

  return (
    <PageWrapper>
      <AppBar
        title={profile ? `${profile.first_name_ar} ${profile.last_name_ar}` : t('loading')}
        subtitle={formatDateAr(new Date())}
        onLogout={auth?.signOut}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="py-4 space-y-5 pb-24">

          {/* Stats grid */}
          {stats && (
            <div className="grid grid-cols-2 gap-3 mx-4">
              {[
                { label: t('teacher_classes'),   value: stats.classCount,    icon: '📚', color: 'text-navy' },
                { label: t('absent'),            value: stats.absentToday,   icon: '⚠️', color: 'text-red-600' },
                { label: t('ungraded_subs'),     value: stats.ungradedCount, icon: '📝', color: 'text-orange-600' },
                { label: t('upcoming_hw'),       value: stats.pendingAssign, icon: '📅', color: 'text-teal' },
              ].map(({ label, value, icon, color }) => (
                <Card key={label} className="text-center py-4">
                  <span className="text-2xl">{icon}</span>
                  <p className={`text-2xl font-bold mt-1 ${color} ${fa}`}>{toArabicNumerals(value)}</p>
                  <p className={`text-xs text-gray-400 mt-0.5 ${fa}`}>{label}</p>
                </Card>
              ))}
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3 mx-4">
            {[
              { label: t('attendance'),    sub: t('nav_attendance'),  icon: '✅', path: '/teacher/attendance' },
              { label: t('grade_entry'),   sub: t('nav_grades'),      icon: '📊', path: '/teacher/grades' },
              { label: t('assignments'),   sub: t('new_assignment'),  icon: '📋', path: '/teacher/assignments' },
              { label: t('conduct_log'),   sub: t('conduct_log_sub'), icon: '📓', path: '/teacher/conduct' },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 active:bg-gray-50 transition-colors text-right"
              >
                <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center text-xl flex-shrink-0">{item.icon}</div>
                <div>
                  <p className={`font-bold text-gray-800 text-sm ${fa}`}>{item.label}</p>
                  <p className={`text-xs text-gray-400 ${fa}`}>{item.sub}</p>
                </div>
              </button>
            ))}
          </div>

          {/* My classes */}
          {subjects.length > 0 && (
            <div className="mx-4">
              <p className={`text-sm font-bold text-gray-700 ${fa} mb-3`}>{t('teacher_classes')}</p>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {subjects.map((s) => (
                  <div key={`${s.subjectId}-${s.gradeYear}-${s.section}`}
                    className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                    <span className={`text-xs text-gray-400 ${fa}`}>{t('grade_label')} {toArabicNumerals(s.gradeYear)} — {s.section}</span>
                    <p className={`font-bold text-gray-800 text-sm ${fa}`}>{s.subjectName}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming assignments */}
          {assignments.length > 0 && (
            <div className="mx-4">
              <p className={`text-sm font-bold text-gray-700 ${fa} mb-3`}>{t('upcoming_hw')}</p>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {assignments.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => navigate(`/teacher/assignments/${a.id}/submissions`)}
                    className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 active:bg-gray-50 transition-colors"
                  >
                    <span className={`text-xs text-gray-400 ${fa}`}>{a.due_date}</span>
                    <p className={`font-bold text-gray-800 text-sm ${fa}`}>{a.title_ar}</p>
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

TeacherDashboard.displayName = 'TeacherDashboard'
