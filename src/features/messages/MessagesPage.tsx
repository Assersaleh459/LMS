import { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang } from '../../app/providers/LangProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  body: string
  is_read: boolean
  created_at: string
}

interface Conversation {
  other_id: string
  other_name: string
  last_body: string
  last_at: string
  unread: number
}

export function MessagesPage() {
  const auth = useContext(AuthContext)
  const { t, fa } = useLang()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const withId = params.get('with') // open a specific conversation

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages,      setMessages]      = useState<Message[]>([])
  const [otherName,     setOtherName]     = useState('')
  const [body,          setBody]          = useState('')
  const [loading,       setLoading]       = useState(true)
  const [sending,       setSending]       = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const me = auth?.profile?.id ?? ''
  const schoolId = auth?.schoolId ?? ''

  useEffect(() => {
    if (!me) return
    if (withId) {
      loadThread(withId)
    } else {
      loadConversations()
    }
  }, [me, withId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadConversations() {
    const { data } = await (supabase as any).from('messages')
      .select('*')
      .or(`sender_id.eq.${me},recipient_id.eq.${me}`)
      .order('created_at', { ascending: false })

    if (!data) { setLoading(false); return }

    const convMap: Record<string, Conversation> = {}
    for (const m of data as Message[]) {
      const otherId = m.sender_id === me ? m.recipient_id : m.sender_id
      if (!convMap[otherId]) {
        convMap[otherId] = { other_id: otherId, other_name: otherId, last_body: m.body, last_at: m.created_at, unread: 0 }
      }
      if (m.recipient_id === me && !m.is_read) convMap[otherId].unread++
    }

    // Enrich with names
    const ids = Object.keys(convMap)
    if (ids.length > 0) {
      const { data: users } = await (supabase as any).from('users').select('id, full_name_ar').in('id', ids)
      if (users) {
        for (const u of users as { id: string; full_name_ar: string }[]) {
          if (convMap[u.id]) convMap[u.id].other_name = u.full_name_ar
        }
      }
    }

    setConversations(Object.values(convMap).sort((a, b) => b.last_at.localeCompare(a.last_at)))
    setLoading(false)
  }

  async function loadThread(otherId: string) {
    const { data: msgs } = await (supabase as any).from('messages')
      .select('*')
      .or(`and(sender_id.eq.${me},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${me})`)
      .order('created_at')
    setMessages(msgs ?? [])

    const { data: user } = await (supabase as any).from('users').select('full_name_ar').eq('id', otherId).single()
    if (user) setOtherName(user.full_name_ar)

    // Mark incoming as read
    await (supabase as any).from('messages')
      .update({ is_read: true })
      .eq('recipient_id', me)
      .eq('sender_id', otherId)
      .eq('is_read', false)

    setLoading(false)
  }

  async function send() {
    if (!body.trim() || !withId || !me || !schoolId) return
    setSending(true)
    const { data } = await (supabase as any).from('messages').insert({
      school_id:    schoolId,
      sender_id:    me,
      recipient_id: withId,
      body:         body.trim(),
    }).select().single()
    if (data) setMessages(prev => [...prev, data])
    setBody('')
    setSending(false)
  }

  function timeLabel(iso: string) {
    const d = new Date(iso)
    return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
  }

  // Thread view
  if (withId) {
    return (
      <PageWrapper>
        <AppBar title={otherName || t('messages')} onBack={() => navigate('/messages')} />
        <div className="flex flex-col h-[calc(100vh-56px)]">
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-20">
            {messages.map(m => {
              const isMine = m.sender_id === me
              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMine ? 'bg-teal text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'}`}>
                    <p className={`text-sm ${fa}`}>{m.body}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-gray-400'}`}>{timeLabel(m.created_at)}</p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 px-4 py-3 flex gap-3">
            <input
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder={t('message_ph')}
              dir="rtl"
              className={`flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 text-sm ${fa} focus:outline-none focus:ring-2 focus:ring-teal/30`}
            />
            <button
              onClick={send}
              disabled={sending || !body.trim()}
              className="w-11 h-11 rounded-2xl bg-teal text-white flex items-center justify-center disabled:opacity-50"
            >
              <svg className="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </PageWrapper>
    )
  }

  // Conversations list
  return (
    <PageWrapper>
      <AppBar title={t('messages')} onBack={() => navigate(-1)} />
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-5xl mb-4">💬</span>
          <p className={`text-sm ${fa}`}>{t('no_messages')}</p>
        </div>
      ) : (
        <div className="pb-24">
          {conversations.map(c => (
            <button
              key={c.other_id}
              onClick={() => navigate(`/messages?with=${c.other_id}`)}
              className="w-full flex items-center gap-4 px-4 py-4 border-b border-gray-50 bg-white active:bg-gray-50 transition-colors text-right"
            >
              <div className="w-11 h-11 rounded-full bg-navy/10 flex items-center justify-center text-navy font-bold flex-shrink-0">
                {c.other_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-gray-800 text-sm ${fa}`}>{c.other_name}</p>
                <p className={`text-xs text-gray-400 truncate ${fa} mt-0.5`}>{c.last_body}</p>
              </div>
              {c.unread > 0 && (
                <div className="w-5 h-5 rounded-full bg-teal text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {c.unread}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}

MessagesPage.displayName = 'MessagesPage'
