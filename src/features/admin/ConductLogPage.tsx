import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang } from '../../app/providers/LangProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'

interface Student { id: string; full_name_ar: string }

interface ConductEntry {
  id:         string
  student_id: string
  teacher_id: string
  entry_date: string
  category:   'positive' | 'negative' | 'neutral'
  note_ar:    string
  student_name?: string
  teacher_name?: string
}

const CATEGORY_STYLE = {
  positive: { bg: 'bg-green-100',  text: 'text-green-700',  icon: '⭐' },
  negative: { bg: 'bg-red-100',    text: 'text-red-700',    icon: '⚠️' },
  neutral:  { bg: 'bg-gray-100',   text: 'text-gray-600',   icon: '📝' },
}

export function ConductLogPage() {
  const auth = useContext(AuthContext)
  const { t, fa } = useLang()
  const navigate = useNavigate()

  const [students,   setStudents]   = useState<Student[]>([])
  const [entries,    setEntries]    = useState<ConductEntry[]>([])
  const [loading,    setLoading]    = useState(true)
  const [formOpen,   setFormOpen]   = useState(false)
  const [saving,     setSaving]     = useState(false)

  const [selStudent, setSelStudent] = useState('')
  const [category,   setCategory]  = useState<'positive' | 'negative' | 'neutral'>('positive')
  const [note,       setNote]      = useState('')

  const teacherId = auth?.session?.user?.id ?? ''

  useEffect(() => {
    if (!auth?.schoolId || !teacherId) return
    async function load() {
      const [studRes, entriesRes] = await Promise.all([
        supabase.from('v_student_card')
          .select('id, full_name_ar')
          .eq('school_id', auth!.schoolId!)
          .order('full_name_ar'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('conduct_entries')
          .select('*')
          .eq('school_id', auth!.schoolId!)
          .order('entry_date', { ascending: false })
          .limit(200),
      ])

      const studs = ((studRes.data ?? []) as { id: string | null; full_name_ar: string | null }[])
        .filter((s): s is Student => !!s.id && !!s.full_name_ar) as Student[]
      setStudents(studs)

      const raw = (entriesRes.data ?? []) as ConductEntry[]
      if (!raw.length) { setEntries([]); setLoading(false); return }

      const teacherIds  = [...new Set(raw.map(r => r.teacher_id))]
      const { data: teachers } = await supabase
        .from('users').select('id, first_name_ar, last_name_ar').in('id', teacherIds)

      const tMap: Record<string, string> = {}
      ;(teachers ?? []).forEach(u => { tMap[u.id] = `${u.first_name_ar} ${u.last_name_ar}` })

      const sMap: Record<string, string> = {}
      studs.forEach(s => { sMap[s.id] = s.full_name_ar })

      setEntries(raw.map(r => ({
        ...r,
        student_name: sMap[r.student_id] ?? r.student_id,
        teacher_name: tMap[r.teacher_id] ?? r.teacher_id,
      })))
      setLoading(false)
    }
    load()
  }, [auth?.schoolId, teacherId])

  async function handleSave() {
    if (!selStudent || !note.trim() || !auth?.schoolId || !teacherId) return
    setSaving(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('conduct_entries').insert({
      student_id: selStudent,
      teacher_id: teacherId,
      school_id:  auth.schoolId,
      category,
      note_ar:    note.trim(),
    })
    const student = students.find(s => s.id === selStudent)
    setEntries(prev => [{
      id:           crypto.randomUUID(),
      student_id:   selStudent,
      teacher_id:   teacherId,
      entry_date:   new Date().toISOString().split('T')[0],
      category,
      note_ar:      note.trim(),
      student_name: student?.full_name_ar,
      teacher_name: 'أنت',
    }, ...prev])
    setNote('')
    setFormOpen(false)
    setSaving(false)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <PageWrapper>
      <AppBar title={t('conduct_log')} subtitle={t('conduct_log_sub')} onBack={() => navigate(-1)} />

      {/* Add entry button */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <button
          onClick={() => setFormOpen(true)}
          className={`w-full py-3 rounded-xl bg-teal text-white font-bold ${fa} text-sm`}
        >
          + {t('conduct_add')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <p className={`text-center text-gray-400 ${fa} py-20 text-sm`}>{t('no_data')}</p>
      ) : (
        <div className="bg-white divide-y divide-gray-50 pb-24">
          {entries.map(entry => {
            const style = CATEGORY_STYLE[entry.category]
            return (
              <div key={entry.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">{style.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-bold text-gray-800 ${fa}`}>{entry.student_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.text} ${fa}`}>
                        {t(`conduct_${entry.category}`)}
                      </span>
                    </div>
                    <p className={`text-sm text-gray-700 ${fa} mt-1`}>{entry.note_ar}</p>
                    <p className={`text-xs text-gray-400 ${fa} mt-0.5`}>
                      {entry.teacher_name} · {formatDate(entry.entry_date)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add entry modal */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className={`font-bold text-gray-800 text-base ${fa}`}>{t('conduct_add')}</p>
              <button
                onClick={() => { setFormOpen(false); setNote('') }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Student picker */}
            <select
              value={selStudent}
              onChange={e => setSelStudent(e.target.value)}
              dir="rtl"
              className={`w-full px-4 py-3 rounded-xl border border-gray-200 ${fa} text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal/30`}
            >
              <option value="">{t('conduct_select_student')}</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.full_name_ar}</option>
              ))}
            </select>

            {/* Category */}
            <div className="flex gap-2">
              {(['positive', 'negative', 'neutral'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold ${fa} transition-colors border ${
                    category === cat
                      ? `${CATEGORY_STYLE[cat].bg} ${CATEGORY_STYLE[cat].text} border-transparent`
                      : 'bg-white text-gray-500 border-gray-200'
                  }`}
                >
                  {CATEGORY_STYLE[cat].icon} {t(`conduct_${cat}`)}
                </button>
              ))}
            </div>

            {/* Note */}
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={4}
              dir="rtl"
              placeholder={t('conduct_note_ph')}
              className={`w-full px-4 py-3 rounded-xl border border-gray-200 ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none`}
            />

            <div className="flex gap-3 pb-2">
              <button
                onClick={() => { setFormOpen(false); setNote('') }}
                className={`flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 ${fa} text-sm font-bold`}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !selStudent || !note.trim()}
                className={`flex-1 py-3.5 rounded-xl bg-teal text-white font-bold ${fa} text-sm disabled:opacity-50`}
              >
                {saving ? t('saving') : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

ConductLogPage.displayName = 'ConductLogPage'
