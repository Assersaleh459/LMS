import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang } from '../../app/providers/LangProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'

interface Notif {
  id: string
  title_ar: string
  body_ar: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

export function NotificationsPage() {
  const auth = useContext(AuthContext)
  const { t, fa } = useLang()
  const navigate = useNavigate()

  const [notifs,   setNotifs]   = useState<Notif[]>([])
  const [loading,  setLoading]  = useState(true)
  const [pushOk,   setPushOk]   = useState<boolean | null>(null)

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPushOk(Notification.permission === 'granted')
    }
  }, [])

  useEffect(() => {
    if (!auth?.profile?.id) return
    ;(supabase as any).from('notifications')
      .select('*')
      .eq('user_id', auth.profile.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }: { data: Notif[] | null }) => {
        setNotifs(data ?? [])
        setLoading(false)
      })
  }, [auth?.profile?.id])

  async function requestPush() {
    if (typeof Notification === 'undefined') return
    const perm = await Notification.requestPermission()
    setPushOk(perm === 'granted')
  }

  async function markAllRead() {
    if (!auth?.profile?.id) return
    await (supabase as any).from('notifications')
      .update({ is_read: true })
      .eq('user_id', auth.profile.id)
      .eq('is_read', false)
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function markRead(id: string, link: string | null) {
    await (supabase as any).from('notifications').update({ is_read: true }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    if (link) navigate(link)
  }

  function timeAgo(iso: string) {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    if (mins < 1)  return 'الآن'
    if (mins < 60) return `منذ ${mins} دقيقة`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)  return `منذ ${hrs} ساعة`
    return `منذ ${Math.floor(hrs / 24)} يوم`
  }

  const unread = notifs.filter(n => !n.is_read).length

  return (
    <PageWrapper>
      <AppBar
        title={t('notifications')}
        onBack={() => navigate(-1)}
        action={unread > 0 ? (
          <button
            onClick={markAllRead}
            className={`text-xs text-white/80 ${fa} underline`}
          >
            {t('mark_all_read')}
          </button>
        ) : undefined}
      />

      {/* Push permission banner */}
      {pushOk === false && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <div className="flex-1">
            <p className={`text-sm font-bold text-amber-700 ${fa}`}>{t('notif_enable')}</p>
          </div>
          <button
            onClick={requestPush}
            className={`text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-xl ${fa}`}
          >
            {t('notif_enable')}
          </button>
        </div>
      )}
      {pushOk === true && (
        <div className="mx-4 mt-4 bg-green-50 border border-green-100 rounded-2xl p-3 flex items-center gap-2">
          <span className="text-lg">✅</span>
          <p className={`text-sm text-green-700 ${fa}`}>{t('notif_enabled')}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      ) : notifs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-5xl mb-4">🔕</span>
          <p className={`text-sm ${fa}`}>{t('notif_empty')}</p>
        </div>
      ) : (
        <div className="py-3 pb-24 space-y-1">
          {notifs.map(n => (
            <button
              key={n.id}
              onClick={() => markRead(n.id, n.link)}
              className={`w-full flex items-start gap-3 px-4 py-3.5 text-right transition-colors border-b border-gray-50 ${
                n.is_read ? 'bg-white' : 'bg-teal/5'
              } active:bg-gray-50`}
            >
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.is_read ? 'bg-transparent' : 'bg-teal'}`} />
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-gray-800 text-sm ${fa}`}>{n.title_ar}</p>
                {n.body_ar && <p className={`text-xs text-gray-500 mt-0.5 ${fa} line-clamp-2`}>{n.body_ar}</p>}
                <p className={`text-xs text-gray-300 mt-1 ${fa}`}>{timeAgo(n.created_at)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}

NotificationsPage.displayName = 'NotificationsPage'
