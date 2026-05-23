import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { useLang } from '../../app/providers/LangProvider'
import { toArabicNumerals } from '../../lib/arabic'

interface Submission {
  id:              string
  student_id:      string
  status:          string
  text_answer:     string | null
  grade:           number | null
  teacher_comment: string | null
  submitted_at:    string | null
  users: { first_name_ar: string; last_name_ar: string } | null
}

interface AssignmentMeta { title_ar: string; max_grade: number }

const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-gray-100 text-gray-500',
  submitted: 'bg-blue-100 text-blue-700',
  graded:    'bg-green-100 text-green-700',
  late:      'bg-red-100 text-red-600',
}

export function SubmissionsPage() {
  const { t, fa } = useLang()
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const navigate = useNavigate()

  const [meta,        setMeta]        = useState<AssignmentMeta | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading,     setLoading]     = useState(true)
  const [grading,     setGrading]     = useState<Submission | null>(null)
  const [gradeVal,    setGradeVal]    = useState('')
  const [comment,     setComment]     = useState('')
  const [saving,      setSaving]      = useState(false)

  useEffect(() => {
    if (!assignmentId) return
    Promise.all([
      supabase.from('assignments').select('title_ar, max_grade').eq('id', assignmentId).single(),
      supabase.from('assignment_submissions')
        .select('id, student_id, status, text_answer, grade, teacher_comment, submitted_at, users(first_name_ar, last_name_ar)')
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false }),
    ]).then(([aRes, sRes]) => {
      if (aRes.data) setMeta(aRes.data as AssignmentMeta)
      if (sRes.data) setSubmissions(sRes.data as unknown as Submission[])
      setLoading(false)
    })
  }, [assignmentId])

  function openGrade(sub: Submission) {
    setGrading(sub)
    setGradeVal(sub.grade !== null ? String(sub.grade) : '')
    setComment(sub.teacher_comment ?? '')
  }

  async function handleGrade() {
    if (!grading) return
    const g = parseFloat(gradeVal)
    if (isNaN(g)) return
    setSaving(true)
    await supabase.from('assignment_submissions').update({
      grade:           g,
      teacher_comment: comment.trim() || null,
      status:          'graded',
      graded_at:       new Date().toISOString(),
    }).eq('id', grading.id)

    setSubmissions(prev => prev.map(s =>
      s.id === grading.id ? { ...s, grade: g, teacher_comment: comment.trim() || null, status: 'graded' } : s
    ))
    setSaving(false)
    setGrading(null)
  }

  const gradedCount   = submissions.filter(s => s.status === 'graded').length
  const pendingCount  = submissions.filter(s => s.status === 'pending').length
  const submittedCount = submissions.filter(s => s.status === 'submitted' || s.status === 'late').length

  return (
    <PageWrapper>
      <AppBar title={meta?.title_ar ?? t('submissions')} onBack={() => navigate(-1)} />

      {/* Summary bar */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3 px-4 py-3 bg-white border-b border-gray-100">
          {[
            { label: t('sub_submitted'), count: submittedCount, color: 'text-blue-600' },
            { label: t('sub_graded'),    count: gradedCount,    color: 'text-green-600' },
            { label: t('sub_pending'),   count: pendingCount,   color: 'text-gray-500' },
          ].map(item => (
            <div key={item.label} className="text-center">
              <p className={`text-xl font-bold ${item.color}`}>{toArabicNumerals(item.count)}</p>
              <p className={`text-xs text-gray-500 ${fa}`}>{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      ) : submissions.length === 0 ? (
        <p className={`text-center text-gray-400 ${fa} py-20 text-sm`}>{t('no_submissions')}</p>
      ) : (
        <div className="bg-white divide-y divide-gray-50 overflow-y-auto pb-24">
          {submissions.map(sub => (
            <button
              key={sub.id}
              onClick={() => openGrade(sub)}
              className="w-full flex items-center justify-between px-4 py-4 active:bg-gray-50 transition-colors text-right"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-navy/10 flex items-center justify-center font-bold text-navy text-sm font-arabic flex-shrink-0">
                  {sub.users?.first_name_ar.charAt(0) ?? '?'}
                </div>
                <div>
                  <p className={`text-sm font-bold text-gray-800 ${fa}`}>
                    {sub.users ? `${sub.users.first_name_ar} ${sub.users.last_name_ar}` : sub.student_id}
                  </p>
                  {sub.text_answer && (
                    <p className={`text-xs text-gray-400 ${fa} truncate max-w-[180px]`}>{sub.text_answer}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {sub.grade !== null && (
                  <span className="text-sm font-bold text-gray-700">{toArabicNumerals(sub.grade)}/{meta?.max_grade}</span>
                )}
                <span className={`text-xs ${fa} font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[sub.status]}`}>
                  {t(`sub_${sub.status}` as never)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Grade sheet */}
      {grading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className={`font-bold text-gray-800 text-base ${fa}`}>
                {grading.users ? `${grading.users.first_name_ar} ${grading.users.last_name_ar}` : ''}
              </p>
              <button onClick={() => setGrading(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xl leading-none">×</button>
            </div>

            {grading.text_answer && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className={`text-xs font-bold text-gray-500 ${fa} mb-1`}>{t('student_answer')}</p>
                <p className={`text-sm text-gray-800 ${fa} leading-relaxed`}>{grading.text_answer}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-sm font-bold text-gray-700 ${fa} mb-1`}>
                  {t('grade')} / {meta?.max_grade}
                </label>
                <input
                  type="number" min={0} max={meta?.max_grade ?? 100}
                  value={gradeVal}
                  onChange={e => setGradeVal(e.target.value)}
                  dir="ltr"
                  className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30`}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-bold text-gray-700 ${fa} mb-1`}>{t('teacher_comment')}</label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                dir="rtl"
                className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none`}
                placeholder={t('optional_comment')}
              />
            </div>

            <div className="flex gap-3 pb-2">
              <button onClick={() => setGrading(null)}
                className={`flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 ${fa} text-sm font-bold`}>
                {t('cancel')}
              </button>
              <button onClick={handleGrade} disabled={saving || !gradeVal}
                className={`flex-1 py-3.5 rounded-xl bg-teal text-white font-bold ${fa} text-sm disabled:opacity-50`}>
                {saving ? t('saving') : t('save_grade')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

SubmissionsPage.displayName = 'SubmissionsPage'
