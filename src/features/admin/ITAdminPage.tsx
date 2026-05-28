import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang } from '../../app/providers/LangProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { Card } from '../../components/ui/Card'
import { toArabicNumerals } from '../../lib/arabic'

interface RecentUser {
  id: string
  full_name_ar: string
  role: string
  created_at: string
}

const ROLE_ICON: Record<string, string> = {
  school_admin: '🏫',
  subject_teacher: '👨‍🏫',
  homeroom_teacher: '📋',
  kg_primary_student: '🎒',
  prep_secondary_student: '🎓',
  parent: '👪',
  it_admin: '💻',
  chain_admin: '🔗',
  moe_supervisor: '🏛️',
}

export function ITAdminPage() {
  const auth = useContext(AuthContext)
  const { t, fa } = useLang()
  const navigate = useNavigate()

  const [counts,    setCounts]    = useState({ total: 0, active: 0, schools: 0 })
  const [recent,    setRecent]    = useState<RecentUser[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('schools').select('id', { count: 'exact', head: true }),
      (supabase as any).from('users').select('id, full_name_ar, role, created_at')
        .order('created_at', { ascending: false }).limit(20),
    ]).then(([userRes, schoolRes, recentRes]) => {
      setCounts({
        total:   userRes.count ?? 0,
        active:  userRes.count ?? 0,
        schools: schoolRes.count ?? 0,
      })
      setRecent(recentRes.data ?? [])
      setLoading(false)
    })
  }, [])

  function timeAgo(iso: string) {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
    if (days === 0) return 'اليوم'
    if (days === 1) return 'أمس'
    return `منذ ${days} يوم`
  }

  return (
    <PageWrapper>
      <AppBar title={t('it_dashboard')} onLogout={auth?.signOut} />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="py-4 space-y-5 pb-24">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mx-4">
            {[
              { label: t('school_count'), value: counts.schools, icon: '🏫' },
              { label: t('active_users'), value: counts.active,  icon: '👥' },
              { label: t('total_students'), value: counts.total, icon: '📊' },
            ].map(({ label, value, icon }) => (
              <Card key={label} className="text-center py-4">
                <span className="text-2xl">{icon}</span>
                <p className={`text-xl font-bold mt-1 text-navy ${fa}`}>{toArabicNumerals(value)}</p>
                <p className={`text-[10px] text-gray-400 mt-0.5 ${fa}`}>{label}</p>
              </Card>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3 mx-4">
            <button
              onClick={() => navigate('/admin/users')}
              className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 active:bg-gray-50"
            >
              <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center text-xl">👥</div>
              <p className={`font-bold text-gray-800 text-sm ${fa}`}>{t('user_mgmt')}</p>
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 active:bg-gray-50"
            >
              <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center text-xl">⚙️</div>
              <p className={`font-bold text-gray-800 text-sm ${fa}`}>{t('school_settings')}</p>
            </button>
          </div>

          {/* Recent user activity */}
          <div className="mx-4">
            <p className={`text-sm font-bold text-gray-700 ${fa} mb-3`}>{t('recent_activity')}</p>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {recent.map(u => (
                <div key={u.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{ROLE_ICON[u.role] ?? '👤'}</span>
                    <span className={`text-xs text-gray-400 ${fa}`}>{timeAgo(u.created_at)}</span>
                  </div>
                  <p className={`font-bold text-gray-800 text-sm ${fa}`}>{u.full_name_ar}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

ITAdminPage.displayName = 'ITAdminPage'
