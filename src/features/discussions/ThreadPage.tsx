import { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'

interface Reply {
  id: string; body_ar: string; created_at: string
  users: { first_name_ar: string; last_name_ar: string; avatar_url: string | null } | null
}
interface Thread {
  id: string; title_ar: string; body_ar: string; created_at: string; is_locked: boolean
  users: { first_name_ar: string; last_name_ar: string } | null
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m || 1} د`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} س`
  return `${Math.floor(h / 24)} ي`
}

export function ThreadPage() {
  const { threadId } = useParams<{ subjectId: string; threadId: string }>()
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const [thread, setThread] = useState<Thread | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [newReply, setNewReply] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!threadId) return
    Promise.all([
      supabase.from('discussion_threads')
        .select('id, title_ar, body_ar, created_at, is_locked, users(first_name_ar, last_name_ar)')
        .eq('id', threadId).single(),
      supabase.from('discussion_replies')
        .select('id, body_ar, created_at, users(first_name_ar, last_name_ar, avatar_url)')
        .eq('thread_id', threadId).order('created_at'),
    ]).then(([tRes, rRes]) => {
      if (tRes.data) setThread(tRes.data as unknown as Thread)
      if (rRes.data) setReplies(rRes.data as unknown as Reply[])
    })

    // Realtime subscription
    const channel = supabase
      .channel(`thread:${threadId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'discussion_replies', filter: `thread_id=eq.${threadId}` },
        payload => {
          const r = payload.new as Reply
          setReplies(prev => [...prev, r])
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [threadId])

  async function sendReply() {
    if (!newReply.trim() || !auth?.profile?.id || !threadId) return
    setSending(true)
    await supabase.from('discussion_replies').insert({
      thread_id: threadId,
      author_id: auth.profile.id,
      body_ar:   newReply.trim(),
    })
    setNewReply('')
    setSending(false)
  }

  return (
    <PageWrapper>
      <AppBar title={thread?.title_ar ?? 'النقاش'} onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto">
        {/* Original post */}
        {thread && (
          <div className="bg-navy/5 px-4 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-arabic">{timeAgo(thread.created_at)}</span>
              {thread.users && (
                <span className="text-xs font-bold text-navy font-arabic">
                  {thread.users.first_name_ar} {thread.users.last_name_ar}
                </span>
              )}
            </div>
            <p className="font-arabic text-gray-800 text-sm leading-relaxed">{thread.body_ar}</p>
          </div>
        )}

        {/* Replies */}
        <div className="divide-y divide-gray-100">
          {replies.map(reply => {
            return (
              <div key={reply.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  {reply.users && (
                    <span className="text-xs font-bold text-gray-700 font-arabic">
                      {reply.users.first_name_ar} {reply.users.last_name_ar}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 font-arabic">{timeAgo(reply.created_at)}</span>
                </div>
                <p className="font-arabic text-gray-800 text-sm leading-relaxed">{reply.body_ar}</p>
              </div>
            )
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      {!thread?.is_locked && (
        <div className="border-t border-gray-200 bg-white px-4 py-3 pb-safe">
          <div className="flex gap-2 items-end">
            <textarea
              value={newReply}
              onChange={e => setNewReply(e.target.value)}
              rows={2}
              dir="rtl"
              placeholder="اكتب ردك..."
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-right font-arabic text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-none"
            />
            <button
              onClick={sendReply}
              disabled={sending || !newReply.trim()}
              className="w-10 h-10 rounded-xl bg-teal text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50"
            >
              <svg className="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

ThreadPage.displayName = 'ThreadPage'
