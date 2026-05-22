import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'

interface Thread {
  id: string; title_ar: string; body_ar: string
  is_pinned: boolean; reply_count: number; created_at: string
  users: { first_name_ar: string; last_name_ar: string } | null
}

export function DiscussionPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const navigate = useNavigate()
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!subjectId) return
    supabase
      .from('discussion_threads')
      .select('id, title_ar, body_ar, is_pinned, reply_count, created_at, users(first_name_ar, last_name_ar)')
      .eq('subject_id', subjectId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setThreads(data as unknown as Thread[])
        setLoading(false)
      })
  }, [subjectId])

  return (
    <PageWrapper>
      <AppBar title="النقاشات" onBack={() => navigate(-1)} />

      <div className="px-4 py-3 border-b border-gray-100 bg-white">
        <button
          onClick={() => navigate(`/discussions/${subjectId}/new`)}
          className="w-full py-3 rounded-xl bg-teal text-white font-bold font-arabic text-sm"
        >
          + موضوع جديد
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
          </div>
        ) : threads.length === 0 ? (
          <p className="text-center text-gray-400 font-arabic text-sm py-20">لا توجد نقاشات — كن أول من يبدأ!</p>
        ) : (
          threads.map(thread => (
            <button
              key={thread.id}
              onClick={() => navigate(`/discussions/${subjectId}/thread/${thread.id}`)}
              className="w-full px-4 py-4 text-right bg-white hover:bg-gray-50 transition-colors"
            >
              {thread.is_pinned && (
                <span className="inline-flex items-center gap-1 text-xs font-arabic text-teal bg-teal/10 px-2 py-0.5 rounded-full mb-1">
                  📌 مثبت
                </span>
              )}
              <p className="font-bold font-arabic text-gray-900 text-sm">{thread.title_ar}</p>
              <p className="text-gray-500 font-arabic text-xs mt-0.5 line-clamp-2">{thread.body_ar}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-400 text-xs font-arabic">
                  💬 {thread.reply_count} رد
                </span>
                {thread.users && (
                  <span className="text-gray-400 text-xs font-arabic">
                    {thread.users.first_name_ar} {thread.users.last_name_ar}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </PageWrapper>
  )
}

DiscussionPage.displayName = 'DiscussionPage'
