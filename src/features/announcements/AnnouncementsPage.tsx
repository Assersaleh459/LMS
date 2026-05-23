import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { useLang } from '../../app/providers/LangProvider'

interface Announcement {
  id: string; title_ar: string; body_ar: string
  is_pinned: boolean; created_at: string
  users: { first_name_ar: string; last_name_ar: string } | null
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `منذ ${m || 1} دقيقة`
  const h = Math.floor(m / 60)
  if (h < 24) return `منذ ${h} ساعة`
  return `منذ ${Math.floor(h / 24)} يوم`
}

export function AnnouncementsPage() {
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const { t, fa } = useLang()
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const isTeacher = auth?.role === 'subject_teacher' || auth?.role === 'homeroom_teacher' || auth?.role === 'school_admin'

  useEffect(() => {
    if (!auth?.schoolId) return
    supabase
      .from('announcements')
      .select('id, title_ar, body_ar, is_pinned, created_at, users(first_name_ar, last_name_ar)')
      .eq('school_id', auth.schoolId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (data) setItems(data as unknown as Announcement[])
        setLoading(false)
      })
  }, [auth?.schoolId])

  return (
    <PageWrapper>
      <AppBar title={t('announcements')} />

      {isTeacher && (
        <div className="px-4 py-3 border-b border-gray-100 bg-white">
          <button
            onClick={() => navigate('/announcements/new')}
            className={`w-full py-3 rounded-xl bg-teal text-white font-bold ${fa} text-sm`}
          >
            {t('new_announce')}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className={`text-center text-gray-400 ${fa} text-sm py-20`}>{t('no_announces')}</p>
        ) : (
          items.map(item => (
            <div key={item.id} className={`px-4 py-4 ${item.is_pinned ? 'bg-gold/5' : 'bg-white'}`}>
              {item.is_pinned && (
                <span className={`inline-flex items-center gap-1 text-xs ${fa} text-gold bg-gold/10 px-2 py-0.5 rounded-full mb-2`}>
                  📌 {t('pinned')}
                </span>
              )}
              <p className="font-bold font-arabic text-gray-900 text-sm">{item.title_ar}</p>
              <p className="text-gray-600 font-arabic text-sm mt-1 leading-relaxed">{item.body_ar}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-400 text-xs font-arabic">{timeAgo(item.created_at)}</span>
                {item.users && (
                  <span className="text-gray-400 text-xs font-arabic">
                    {item.users.first_name_ar} {item.users.last_name_ar}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </PageWrapper>
  )
}

AnnouncementsPage.displayName = 'AnnouncementsPage'
