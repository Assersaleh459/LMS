import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { AuthContext } from '../../app/providers/AuthProvider'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { useLang } from '../../app/providers/LangProvider'
import { toArabicNumerals } from '../../lib/arabic'
import type { StudentCard } from '../../types/domain'

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

interface AssignmentMeta {
  title_ar:  string
  max_grade: number
  grade_year: number
  section:    string
}

const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-gray-100 text-gray-500',
  submitted: 'bg-blue-100 text-blue-700',
  graded:    'bg-green-100 text-green-700',
  late:      'bg-red-100 text-red-600',
}

export function SubmissionsPage() {
  const { t, fa } = useLang()
  const auth = useContext(AuthContext)
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const navigate = useNavigate()

  const [meta,        setMeta]        = useState<AssignmentMeta | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [allStudents, setAllStudents] = useState<StudentCard[]>([])
  const [loading,     setLoading]     = useState(true)
  const [activeView,  setActiveView]  = useState<'digital' | 'roster'>('digital')
  const [grading,     setGrading]     = useState<Submission | null>(null)
  const [gradeVal,    setGradeVal]    = useState('')
  const [comment,     setComment]     = useState('')
  const [saving,      setSaving]      = useState(false)
  const [toggling,    setToggling]    = useState<string | null>(null)

  useEffect(() => {
    if (!assignmentId) return
    Promise.all([
      supabase.from('assignments')
        .select('title_ar, max_grade, grade_year, section')
        .eq('id', assignmentId).single(),
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

  // Load full class roster once meta is available
  useEffect(() => {
    if (!meta || !auth?.schoolId) return
    supabase.from('v_student_card').select('*')
      .eq('school_id', auth.schoolId)
      .eq('grade_year', meta.grade_year)
      .eq('section', meta.section)
      .order('full_name_ar')
      .then(({ data }) => setAllStudents((data ?? []) as StudentCard[]))
  }, [meta, auth?.schoolId])

  // submissionMap: studentId → Submission
  const submissionMap = Object.fromEntries(submissions.map(s => [s.student_id, s]))

  async function toggleSubmission(student: StudentCard) {
    if (!assignmentId) return
    setToggling(student.id)
    const existing = submissionMap[student.id]

    if (!existing) {
      // Create new submitted record
      const { data } = await supabase.from('assignment_submissions').insert({
        assignment_id: assignmentId,
        student_id:    student.id,
        status:        'submitted',
        submitted_at:  new Date().toISOString(),
      }).select('id, student_id, status, text_answer, grade, teacher_comment, submitted_at, users(first_name_ar, last_name_ar)').single()
      if (data) setSubmissions(prev => [...prev, data as unknown as Submission])
    } else if (existing.status === 'submitted') {
      // Mark as not submitted (pending)
      await supabase.from('assignment_submissions')
        .update({ status: 'pending', submitted_at: null })
        .eq('id', existing.id)
      setSubmissions(prev => prev.map(s =>
        s.id === existing.id ? { ...s, status: 'pending', submitted_at: null } : s
      ))
    } else if (existing.status === 'pending') {
      // Mark as submitted
      await supabase.from('assignment_submissions')
        .update({ status: 'submitted', submitted_at: new Date().toISOString() })
        .eq('id', existing.id)
      setSubmissions(prev => prev.map(s =>
        s.id === existing.id ? { ...s, status: 'submitted', submitted_at: new Date().toISOString() } : s
      ))
    }
    setToggling(null)
  }

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

  const gradedCount    = submissions.filter(s => s.status === 'graded').length
  const pendingCount   = submissions.filter(s => s.status === 'pending').length
  const submittedCount = submissions.filter(s => s.status === 'submitted' || s.status === 'late').length
  const missingCount   = allStudents.length - submissions.filter(s => s.status !== 'pending').length

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

      {/* View tabs */}
      <div className="flex bg-white border-b border-gray-100">
        {(['digital', 'roster'] as const).map(view => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`flex-1 py-3 text-sm font-bold ${fa} transition-colors ${
              activeView === view
                ? 'text-teal border-b-2 border-teal'
                : 'text-gray-400'
            }`}
          >
            {view === 'digital'
              ? `${t('digital_subs')} (${submittedCount + gradedCount})`
              : `${t('all_students')} ${allStudents.length > 0 ? `· ${toArabicNumerals(missingCount > 0 ? missingCount : 0)} ${t('sub_pending')}` : ''}`
            }
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      ) : activeView === 'digital' ? (
        /* ── Digital submissions list ── */
        submissions.length === 0 ? (
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
        )
      ) : (
        /* ── Full class roster with submission toggle ── */
        <div className="bg-white divide-y divide-gray-50 overflow-y-auto pb-24">
          {allStudents.map(student => {
            const sub = submissionMap[student.id]
            const isSubmitted = sub && sub.status !== 'pending'
            const isGraded    = sub?.status === 'graded'
            const isToggling  = toggling === student.id
            return (
              <div key={student.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-navy/10 flex items-center justify-center font-bold text-navy text-sm font-arabic flex-shrink-0">
                    {student.full_name_ar.charAt(0)}
                  </div>
                  <p className={`text-sm font-bold text-gray-800 ${fa}`}>{student.full_name_ar}</p>
                </div>
                <button
                  onClick={() => !isGraded && toggleSubmission(student)}
                  disabled={isToggling || isGraded}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${fa} transition-colors disabled:opacity-60 ${
                    isGraded    ? 'bg-green-100 text-green-700' :
                    isSubmitted ? 'bg-blue-100 text-blue-700'   :
                                  'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {isToggling ? (
                    <div className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                  ) : isGraded ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4" />
                    </svg>
                  ) : isSubmitted ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  {isGraded ? t('sub_graded') : isSubmitted ? t('sub_submitted') : t('sub_pending')}
                </button>
              </div>
            )
          })}
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
