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
import { triggerEmergencyBroadcast } from '../../lib/notifications'

interface ClassSummary { grade: number; section: string; count: number }

export function AdminDashboard() {
  const auth       = useContext(AuthContext)
  const { t, fa }  = useLang()
  const { school } = useSchool()
  const navigate   = useNavigate()
  const { stats, loading } = useAdminData()
  const [classes,          setClasses]          = useState<ClassSummary[]>([])
  const [broadcastOpen,    setBroadcastOpen]    = useState(false)
  const [broadcastMsg,     setBroadcastMsg]     = useState('')
  const [broadcastSending, setBroadcastSending] = useState(false)
  const [broadcastSent,    setBroadcastSent]    = useState(false)

  useEffect(() => {
    if (!auth?.schoolId) return
    supabase.from('v_student_card').select('grade_year, section')
      .eq('school_id', auth.schoolId)
      .then(({ data }) => {
        if (!data) return
        const map: Record<string, ClassSummary> = {}
        for (const s of data) {
          const key = `${s.grade_year}:${s.section}`
          if (!map[key]) map[key] = { grade: s.grade_year ?? 0, section: s.section ?? '', count: 0 }
          map[key].count++
        }
        setClasses(Object.values(map).sort((a, b) => a.grade - b.grade || a.section.localeCompare(b.section)))
      })
  }, [auth?.schoolId])

  async function handleBroadcast() {
    if (!auth?.schoolId || !broadcastMsg.trim()) return
    setBroadcastSending(true)
    await triggerEmergencyBroadcast(auth.schoolId, broadcastMsg.trim())
    setBroadcastSending(false)
    setBroadcastSent(true)
    setBroadcastMsg('')
    setTimeout(() => { setBroadcastSent(false); setBroadcastOpen(false) }, 2000)
  }

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
                <p className={`text-2xl font-bold mt-2 ${fa} ${color}`}>
                  {typeof value === 'number' ? toArabicNumerals(value) : value}
                </p>
                <p className={`text-xs text-gray-500 ${fa} mt-0.5`}>{label}</p>
              </Card>
            ))}
          </div>

          {/* Quick-action links */}
          <div className="grid grid-cols-2 gap-3 mx-4">
            <button
              onClick={() => navigate('/admin/users')}
              className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 active:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center text-xl">👥</div>
              <div className="text-right">
                <p className={`font-bold text-gray-800 text-sm ${fa}`}>{t('user_mgmt')}</p>
                <p className={`text-xs text-gray-400 ${fa}`}>{t('user_mgmt_sub')}</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/teacher/grades/analytics')}
              className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 active:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center text-xl">📊</div>
              <div className="text-right">
                <p className={`font-bold text-gray-800 text-sm ${fa}`}>{t('analytics')}</p>
                <p className={`text-xs text-gray-400 ${fa}`}>{t('view_analytics')}</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/admin/absence-report')}
              className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 active:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-xl">📋</div>
              <div className="text-right">
                <p className={`font-bold text-gray-800 text-sm ${fa}`}>{t('absence_report')}</p>
                <p className={`text-xs text-gray-400 ${fa}`}>{t('moe_threshold_sub')}</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/teacher/conduct')}
              className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 active:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-xl">📓</div>
              <div className="text-right">
                <p className={`font-bold text-gray-800 text-sm ${fa}`}>{t('conduct_log')}</p>
                <p className={`text-xs text-gray-400 ${fa}`}>{t('conduct_log_sub')}</p>
              </div>
            </button>
          </div>

          {/* Emergency broadcast */}
          <div className="mx-4">
            <button
              onClick={() => { setBroadcastOpen(true); setBroadcastSent(false) }}
              className={`w-full flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-4 active:bg-red-100 transition-colors`}
            >
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-xl flex-shrink-0">📢</div>
              <div className="text-right flex-1">
                <p className={`font-bold text-red-700 text-sm ${fa}`}>{t('emergency_broadcast')}</p>
                <p className={`text-xs text-red-400 ${fa}`}>{t('emergency_sub')}</p>
              </div>
            </button>
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
      {/* Emergency broadcast modal */}
      {broadcastOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className={`font-bold text-red-700 text-base ${fa}`}>{t('emergency_broadcast')}</p>
              <button
                onClick={() => setBroadcastOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {broadcastSent ? (
              <div className="py-8 text-center">
                <p className="text-4xl mb-2">✅</p>
                <p className={`font-bold text-green-700 ${fa}`}>{t('emergency_sent')}</p>
              </div>
            ) : (
              <>
                <textarea
                  value={broadcastMsg}
                  onChange={e => setBroadcastMsg(e.target.value)}
                  rows={5}
                  dir="rtl"
                  placeholder={t('emergency_ph')}
                  className={`w-full px-4 py-3 rounded-xl border border-gray-200 ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none`}
                />
                <div className="flex gap-3 pb-2">
                  <button
                    onClick={() => setBroadcastOpen(false)}
                    className={`flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 ${fa} text-sm font-bold`}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleBroadcast}
                    disabled={broadcastSending || !broadcastMsg.trim()}
                    className={`flex-1 py-3.5 rounded-xl bg-red-600 text-white font-bold ${fa} text-sm disabled:opacity-50`}
                  >
                    {broadcastSending ? t('sending') : t('emergency_confirm')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

AdminDashboard.displayName = 'AdminDashboard'
