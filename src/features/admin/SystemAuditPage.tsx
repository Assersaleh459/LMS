import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang } from '../../app/providers/LangProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'

interface AuditEntry {
  id:          string
  actor_name:  string | null
  actor_role:  string | null
  action:      string
  entity_type: string
  entity_desc: string | null
  details:     Record<string, unknown> | null
  created_at:  string
}

const ACTION_COLOR: Record<string, string> = {
  CREATE:  'bg-green-100 text-green-700',
  UPDATE:  'bg-blue-100 text-blue-700',
  DELETE:  'bg-red-100 text-red-700',
  LOGIN:   'bg-teal/10 text-teal',
  LOGOUT:  'bg-gray-100 text-gray-500',
  PUBLISH: 'bg-purple-100 text-purple-700',
}

const ENTITY_ICON: Record<string, string> = {
  user:         '👤',
  grade:        '📊',
  attendance:   '✅',
  assignment:   '📋',
  setting:      '⚙️',
  conduct:      '📓',
  quiz:         '❓',
  announcement: '📢',
  login:        '🔑',
}

const PAGE_SIZE = 50

export function SystemAuditPage() {
  const auth = useContext(AuthContext)
  const { t, fa } = useLang()
  const navigate = useNavigate()

  const [entries,     setEntries]     = useState<AuditEntry[]>([])
  const [loading,     setLoading]     = useState(true)
  const [total,       setTotal]       = useState(0)
  const [page,        setPage]        = useState(0)
  const [filterAction, setFilterAction] = useState('')
  const [filterEntity, setFilterEntity] = useState('')
  const [search,      setSearch]      = useState('')

  useEffect(() => {
    if (!auth?.schoolId) return
    setLoading(true)

    let q = (supabase as any)
      .from('system_audit_log')
      .select('*', { count: 'exact' })
      .eq('school_id', auth.schoolId)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (filterAction) q = q.eq('action', filterAction)
    if (filterEntity) q = q.eq('entity_type', filterEntity)
    if (search.trim()) q = q.or(`actor_name.ilike.%${search}%,entity_desc.ilike.%${search}%`)

    q.then(({ data, count }: { data: AuditEntry[]; count: number }) => {
      setEntries(data ?? [])
      setTotal(count ?? 0)
      setLoading(false)
    })
  }, [auth?.schoolId, page, filterAction, filterEntity, search])

  function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleString('ar-EG', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <PageWrapper>
      <AppBar title={t('audit_system')} subtitle={t('audit_system_sub')} onBack={() => navigate('/admin')} />

      {/* Filters */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 space-y-2">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          dir="rtl"
          placeholder={t('audit_search_ph')}
          className={`w-full px-3 py-2 rounded-xl border border-gray-200 ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30`}
        />
        <div className="flex gap-2 overflow-x-auto">
          {['', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PUBLISH'].map(a => (
            <button
              key={a}
              onClick={() => { setFilterAction(a); setPage(0) }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${fa} transition-colors ${
                filterAction === a ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {a || t('tab_all')}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {['', 'user', 'grade', 'attendance', 'assignment', 'conduct', 'setting', 'login'].map(e => (
            <button
              key={e}
              onClick={() => { setFilterEntity(e); setPage(0) }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                filterEntity === e ? 'bg-teal text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {e ? `${ENTITY_ICON[e] ?? ''} ${e}` : t('tab_all')}
            </button>
          ))}
        </div>
        <p className={`text-xs text-gray-400 ${fa}`}>{total} {t('audit_total_entries')}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-4xl mb-3">📋</span>
          <p className={`${fa} text-sm`}>{t('no_data')}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50 pb-24">
          {entries.map(entry => (
            <div key={entry.id} className="px-4 py-3 bg-white">
              <div className="flex items-start justify-between gap-3">
                {/* Left: action + entity */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ACTION_COLOR[entry.action] ?? 'bg-gray-100 text-gray-600'}`}>
                    {entry.action}
                  </span>
                  <span className="text-sm">
                    {ENTITY_ICON[entry.entity_type] ?? '📄'}
                  </span>
                  {entry.entity_desc && (
                    <span className={`text-sm text-gray-700 font-bold ${fa}`}>{entry.entity_desc}</span>
                  )}
                </div>
                {/* Right: date */}
                <span className="text-xs text-gray-400 flex-shrink-0 dir-ltr">{formatDate(entry.created_at)}</span>
              </div>

              <div className="flex items-center gap-3 mt-1.5">
                {entry.actor_name && (
                  <span className={`text-xs text-gray-500 ${fa}`}>
                    👤 {entry.actor_name}
                    {entry.actor_role && <span className="text-gray-400"> · {entry.actor_role}</span>}
                  </span>
                )}
                {entry.entity_type && (
                  <span className="text-xs text-gray-400">{entry.entity_type}</span>
                )}
              </div>

              {/* Details expandable */}
              {entry.details && Object.keys(entry.details).length > 0 && (
                <details className="mt-1.5">
                  <summary className={`text-xs text-teal cursor-pointer ${fa}`}>{t('audit_details')}</summary>
                  <pre className="mt-1 text-xs text-gray-500 bg-gray-50 rounded-lg p-2 overflow-auto max-h-32 whitespace-pre-wrap">
                    {JSON.stringify(entry.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))}
            disabled={page >= totalPages - 1}
            className={`px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold ${fa} disabled:opacity-40`}
          >
            {t('back')}
          </button>
          <span className={`text-sm text-gray-500 ${fa}`}>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.max(p - 1, 0))}
            disabled={page === 0}
            className={`px-4 py-2 rounded-xl bg-teal text-white text-sm font-bold ${fa} disabled:opacity-40`}
          >
            {t('new')}
          </button>
        </div>
      )}
    </PageWrapper>
  )
}

SystemAuditPage.displayName = 'SystemAuditPage'
