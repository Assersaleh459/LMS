import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang } from '../../app/providers/LangProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'

interface Term {
  id:            string
  name_ar:       string
  term_number:   number
  academic_year: string
  start_date:    string
  end_date:      string
  is_active:     boolean
}

export function AcademicYearPage() {
  const auth = useContext(AuthContext)
  const { t, fa } = useLang()
  const navigate = useNavigate()

  const [terms,      setTerms]      = useState<Term[]>([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [newOpen,    setNewOpen]    = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)

  const [formYear,       setFormYear]       = useState(() => {
    const y = new Date().getFullYear()
    return `${y}-${y + 1}`
  })
  const [formTerm,  setFormTerm]  = useState<1 | 2>(1)
  const [formStart, setFormStart] = useState('')
  const [formEnd,   setFormEnd]   = useState('')

  const activeTerm = terms.find(t => t.is_active) ?? null

  useEffect(() => {
    if (!auth?.schoolId) return
    supabase.from('academic_terms')
      .select('*')
      .eq('school_id', auth.schoolId)
      .order('academic_year', { ascending: false })
      .order('term_number', { ascending: false })
      .then(({ data }) => {
        setTerms((data ?? []) as Term[])
        setLoading(false)
      })
  }, [auth?.schoolId])

  async function endCurrentTerm() {
    if (!activeTerm) return
    setSaving(true)
    await supabase.from('academic_terms')
      .update({ is_active: false })
      .eq('id', activeTerm.id)
    setTerms(prev => prev.map(t => t.id === activeTerm.id ? { ...t, is_active: false } : t))
    setSaving(false)
    setConfirmEnd(false)
  }

  async function createTerm() {
    if (!auth?.schoolId || !formStart || !formEnd) return
    setSaving(true)

    // Deactivate any existing active term first
    if (activeTerm) {
      await supabase.from('academic_terms')
        .update({ is_active: false })
        .eq('id', activeTerm.id)
    }

    const { data } = await supabase.from('academic_terms').insert({
      school_id:     auth.schoolId,
      name_ar:       `الفصل الدراسي ${formTerm === 1 ? 'الأول' : 'الثاني'} ${formYear}`,
      term_number:   formTerm,
      academic_year: formYear,
      start_date:    formStart,
      end_date:      formEnd,
      is_active:     true,
    }).select().single()

    if (data) {
      setTerms(prev => [
        data as Term,
        ...prev.map(t => ({ ...t, is_active: false })),
      ])
    }
    setSaving(false)
    setNewOpen(false)
  }

  function termBadge(term: Term) {
    if (term.is_active) return { bg: 'bg-teal/10', text: 'text-teal', label: t('term_active') }
    return { bg: 'bg-gray-100', text: 'text-gray-500', label: t('term_ended') }
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('ar-EG', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  return (
    <PageWrapper>
      <AppBar title={t('academic_year')} subtitle={t('academic_year_sub')} onBack={() => navigate(-1)} />

      {/* Active term banner */}
      {!loading && activeTerm && (
        <div className="mx-4 mt-4 bg-teal/10 border border-teal/30 rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`text-sm font-bold text-teal ${fa}`}>{t('current_term')}</p>
              <p className={`text-base font-bold text-gray-800 ${fa} mt-0.5`}>{activeTerm.name_ar}</p>
              <p className={`text-xs text-gray-500 ${fa} mt-1`}>
                {fmtDate(activeTerm.start_date)} — {fmtDate(activeTerm.end_date)}
              </p>
            </div>
            <button
              onClick={() => setConfirmEnd(true)}
              className={`flex-shrink-0 text-xs font-bold px-3 py-2 rounded-xl bg-red-50 text-red-600 ${fa}`}
            >
              {t('end_term')}
            </button>
          </div>
        </div>
      )}

      {/* Start new term button */}
      {!loading && (
        <div className="px-4 mt-3">
          <button
            onClick={() => setNewOpen(true)}
            className={`w-full py-3 rounded-xl bg-navy text-white font-bold ${fa} text-sm`}
          >
            + {t('new_term')}
          </button>
        </div>
      )}

      {/* Term history */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="mt-4 mx-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-24">
          <p className={`text-xs font-bold text-gray-500 ${fa} px-4 pt-3 pb-1`}>{t('term_history')}</p>
          {terms.length === 0 ? (
            <p className={`text-center text-gray-400 ${fa} py-8 text-sm`}>{t('no_data')}</p>
          ) : terms.map((term, i) => {
            const badge = termBadge(term)
            return (
              <div key={term.id} className={`px-4 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <p className={`text-sm font-bold text-gray-800 ${fa}`}>{term.name_ar}</p>
                    <p className={`text-xs text-gray-400 ${fa} mt-0.5`}>
                      {fmtDate(term.start_date)} — {fmtDate(term.end_date)}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${badge.bg} ${badge.text} ${fa} flex-shrink-0`}>
                    {badge.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Confirm end modal */}
      {confirmEnd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-5 space-y-4">
            <p className={`font-bold text-gray-800 text-base ${fa}`}>{t('end_term_confirm_title')}</p>
            <p className={`text-sm text-gray-500 ${fa}`}>{t('end_term_confirm_body')}</p>
            <div className="flex gap-3 pb-2">
              <button
                onClick={() => setConfirmEnd(false)}
                className={`flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 ${fa} text-sm font-bold`}
              >
                {t('cancel')}
              </button>
              <button
                onClick={endCurrentTerm}
                disabled={saving}
                className={`flex-1 py-3.5 rounded-xl bg-red-600 text-white font-bold ${fa} text-sm disabled:opacity-50`}
              >
                {saving ? t('saving') : t('end_term')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New term form modal */}
      {newOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className={`font-bold text-gray-800 text-base ${fa}`}>{t('new_term')}</p>
              <button
                onClick={() => setNewOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={`block text-xs text-gray-500 ${fa} mb-1`}>{t('academic_year_label')}</label>
                <input
                  type="text"
                  value={formYear}
                  onChange={e => setFormYear(e.target.value)}
                  dir="ltr"
                  placeholder="2025-2026"
                  className={`w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30`}
                />
              </div>

              <div>
                <label className={`block text-xs text-gray-500 ${fa} mb-1`}>{t('term_number_label')}</label>
                <div className="flex gap-2">
                  {([1, 2] as const).map(n => (
                    <button
                      key={n}
                      onClick={() => setFormTerm(n)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${fa} transition-colors border ${
                        formTerm === n ? 'bg-navy text-white border-transparent' : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      {n === 1 ? t('term_first') : t('term_second')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-xs text-gray-500 ${fa} mb-1`}>{t('start_date')}</label>
                <input
                  type="date"
                  value={formStart}
                  onChange={e => setFormStart(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
                />
              </div>

              <div>
                <label className={`block text-xs text-gray-500 ${fa} mb-1`}>{t('end_date')}</label>
                <input
                  type="date"
                  value={formEnd}
                  onChange={e => setFormEnd(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
                />
              </div>

              {activeTerm && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                  <p className={`text-xs text-yellow-700 ${fa}`}>{t('rollover_warning')}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pb-2">
              <button
                onClick={() => setNewOpen(false)}
                className={`flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 ${fa} text-sm font-bold`}
              >
                {t('cancel')}
              </button>
              <button
                onClick={createTerm}
                disabled={saving || !formStart || !formEnd || !formYear}
                className={`flex-1 py-3.5 rounded-xl bg-navy text-white font-bold ${fa} text-sm disabled:opacity-50`}
              >
                {saving ? t('saving') : t('start_term')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

AcademicYearPage.displayName = 'AcademicYearPage'
