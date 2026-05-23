import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../../app/providers/AuthProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { useLang } from '../../app/providers/LangProvider'
import { formatDateShortAr } from '../../lib/arabic'
import type { Assignment, AssignmentSubmission } from '../../types/domain'

const TYPE_ICONS: Record<string, string> = {
  written: '📝', oral: '🗣️', practical: '🔬',
  project: '📁', quiz: '✅', notebook_photo: '📸',
}

const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-gray-100 text-gray-500',
  submitted: 'bg-blue-100 text-blue-700',
  graded:    'bg-green-100 text-green-700',
  late:      'bg-red-100 text-red-600',
}

export function StudentAssignmentsPage() {
  const { t, fa, dir } = useLang()
  const auth = useContext(AuthContext)

  const [assignments,  setAssignments]  = useState<Assignment[]>([])
  const [submissions,  setSubmissions]  = useState<Record<string, AssignmentSubmission>>({})
  const [loading,      setLoading]      = useState(true)
  const [selected,     setSelected]     = useState<Assignment | null>(null)
  const [answer,       setAnswer]       = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [studentInfo,  setStudentInfo]  = useState<{ grade_year: number; section: string } | null>(null)

  useEffect(() => {
    if (!auth?.profile?.id) return
    supabase.from('v_student_card').select('grade_year, section').eq('id', auth.profile.id).single()
      .then(({ data }) => {
        if (data && data.grade_year !== null && data.section !== null) {
          setStudentInfo({ grade_year: data.grade_year, section: data.section })
        }
      })
  }, [auth?.profile?.id])

  useEffect(() => {
    if (!studentInfo || !auth?.profile?.id) return
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      supabase.from('assignments').select('*')
        .eq('grade_year', studentInfo.grade_year)
        .eq('section', studentInfo.section)
        .eq('is_published', true)
        .gte('due_date', today)
        .order('due_date'),
      supabase.from('assignment_submissions').select('*').eq('student_id', auth.profile.id),
    ]).then(([aRes, sRes]) => {
      if (aRes.data) setAssignments(aRes.data as Assignment[])
      if (sRes.data) {
        const map: Record<string, AssignmentSubmission> = {}
        ;(sRes.data as AssignmentSubmission[]).forEach(s => { map[s.assignment_id] = s })
        setSubmissions(map)
      }
      setLoading(false)
    })
  }, [studentInfo, auth?.profile?.id])

  function openAssignment(a: Assignment) {
    setSelected(a)
    setAnswer(submissions[a.id]?.text_answer ?? '')
  }

  async function handleSubmit() {
    if (!selected || !auth?.profile?.id || !answer.trim()) return
    setSubmitting(true)
    const existing = submissions[selected.id]
    const now = new Date().toISOString()
    const isPast = new Date(selected.due_date) < new Date()

    if (existing) {
      await supabase.from('assignment_submissions').update({
        text_answer:  answer.trim(),
        status:       isPast ? 'late' : 'submitted',
        submitted_at: now,
      }).eq('id', existing.id)
    } else {
      await supabase.from('assignment_submissions').insert({
        assignment_id: selected.id,
        student_id:    auth.profile.id,
        text_answer:   answer.trim(),
        status:        isPast ? 'late' : 'submitted',
        submitted_at:  now,
      })
    }

    // Refresh submission
    const { data } = await supabase.from('assignment_submissions')
      .select('*').eq('assignment_id', selected.id).eq('student_id', auth.profile.id).single()
    if (data) setSubmissions(prev => ({ ...prev, [selected.id]: data as AssignmentSubmission }))
    setSubmitting(false)
    setSelected(null)
  }

  const statusLabel = (s: AssignmentSubmission | undefined) => {
    if (!s) return t('sub_pending')
    if (s.status === 'graded') return `${t('sub_graded')} ${s.grade ?? ''}`
    if (s.status === 'submitted') return t('sub_submitted')
    if (s.status === 'late') return t('sub_late')
    return t('sub_pending')
  }

  return (
    <PageWrapper>
      <AppBar title={t('my_assignments')} />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="text-5xl">🎉</span>
          <p className={`text-gray-400 ${fa} text-sm`}>{t('no_pending_hw')}</p>
        </div>
      ) : (
        <div className="py-2 pb-24 overflow-y-auto">
          {assignments.map(a => {
            const sub  = submissions[a.id]
            const past = new Date(a.due_date) < new Date()
            const statusClass = STATUS_COLOR[sub?.status ?? 'pending']
            return (
              <button
                key={a.id}
                onClick={() => openAssignment(a)}
                className="w-full flex items-center gap-3 bg-white px-4 py-4 border-b border-gray-100 active:bg-gray-50 transition-colors text-right"
              >
                <span className="text-2xl flex-shrink-0">{TYPE_ICONS[a.assignment_type] ?? '📋'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold ${fa} text-gray-900 text-sm truncate`}>{a.title_ar}</p>
                  <p className={`text-xs ${fa} mt-0.5 ${past ? 'text-red-500' : 'text-gray-400'}`}>
                    {t('due_label')}: {formatDateShortAr(new Date(a.due_date))}
                    {' · '}{a.max_grade} {t('points')}
                  </p>
                </div>
                <span className={`text-xs ${fa} font-bold px-2 py-1 rounded-full flex-shrink-0 ${statusClass}`}>
                  {statusLabel(sub)}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Submission sheet */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className={`font-bold text-gray-800 text-base ${fa} flex-1 truncate pl-4`}>{selected.title_ar}</p>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xl leading-none flex-shrink-0">×</button>
            </div>

            {selected.description_ar && (
              <p className={`text-sm text-gray-600 ${fa} leading-relaxed bg-gray-50 rounded-xl px-3 py-3`}>{selected.description_ar}</p>
            )}

            {/* If graded — show feedback */}
            {submissions[selected.id]?.status === 'graded' ? (
              <div className="space-y-3">
                <div className="bg-green-50 rounded-xl p-4">
                  <p className={`text-xs font-bold text-green-700 ${fa} mb-1`}>{t('teacher_grade')}</p>
                  <p className="text-3xl font-bold text-green-700">{submissions[selected.id]?.grade ?? '—'} / {selected.max_grade}</p>
                  {submissions[selected.id]?.teacher_comment && (
                    <p className={`text-sm text-green-800 ${fa} mt-2`}>{submissions[selected.id]?.teacher_comment}</p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className={`text-xs text-gray-500 ${fa} mb-1`}>{t('your_answer')}</p>
                  <p className={`text-sm text-gray-800 ${fa}`}>{submissions[selected.id]?.text_answer}</p>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className={`block text-sm font-bold text-gray-700 ${fa} mb-2`}>{t('your_answer')}</label>
                  <textarea
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    rows={5}
                    dir={dir}
                    placeholder={t('answer_ph')}
                    className={`w-full px-4 py-3 rounded-xl border border-gray-200 ${fa} text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-none`}
                  />
                </div>
                <div className="flex gap-3 pb-2">
                  <button onClick={() => setSelected(null)}
                    className={`flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 ${fa} text-sm font-bold`}>
                    {t('cancel')}
                  </button>
                  <button onClick={handleSubmit} disabled={submitting || !answer.trim()}
                    className={`flex-1 py-3.5 rounded-xl bg-teal text-white font-bold ${fa} text-sm disabled:opacity-50`}>
                    {submitting ? t('saving') : t('submit_hw')}
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

StudentAssignmentsPage.displayName = 'StudentAssignmentsPage'
