import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { useLang } from '../../app/providers/LangProvider'
import { getMoELetterGrade } from '../../lib/moe'
import { toArabicNumerals } from '../../lib/arabic'
import type { StudentCard } from '../../types/domain'

interface QuizAttempt { score: number; max_score: number; submitted_at: string; quizzes: { title_ar: string } | null }
interface AttendanceRec { status: string; attendance_date: string }

const STATUS_COLOR: Record<string, string> = {
  present: '#27ae60',
  absent:  '#c0392b',
  late:    '#f39c12',
}

export function StudentProgressPage() {
  const { t, fa } = useLang()
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()

  const [student,     setStudent]     = useState<StudentCard | null>(null)
  const [attempts,    setAttempts]    = useState<QuizAttempt[]>([])
  const [attendance,  setAttendance]  = useState<AttendanceRec[]>([])
  const [lessonsDone, setLessonsDone] = useState(0)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    if (!studentId) return
    Promise.all([
      supabase.from('v_student_card').select('*').eq('id', studentId).single(),
      supabase.from('quiz_attempts')
        .select('score, max_score, submitted_at, quizzes(title_ar)')
        .eq('student_id', studentId).order('submitted_at'),
      supabase.from('attendance_records')
        .select('status, attendance_date')
        .eq('student_id', studentId).order('attendance_date', { ascending: false }).limit(60),
      supabase.from('lesson_progress')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentId),
    ]).then(([sRes, aRes, attRes, lcRes]) => {
      if (sRes.data) setStudent(sRes.data as StudentCard)
      if (aRes.data) setAttempts(aRes.data as unknown as QuizAttempt[])
      if (attRes.data) setAttendance(attRes.data as AttendanceRec[])
      setLessonsDone(lcRes.count ?? 0)
      setLoading(false)
    })
  }, [studentId])

  const avgQuizPct = attempts.length
    ? Math.round(attempts.reduce((s, a) => s + (a.max_score > 0 ? (a.score / a.max_score) * 100 : 0), 0) / attempts.length)
    : null

  const presentCount = attendance.filter(a => a.status === 'present').length
  const absentCount  = attendance.filter(a => a.status === 'absent').length
  const lateCount    = attendance.filter(a => a.status === 'late').length
  const attendRate   = attendance.length > 0
    ? Math.round((presentCount / attendance.length) * 100)
    : null

  if (loading) return (
    <PageWrapper>
      <AppBar title={t('student_progress')} onBack={() => navigate(-1)} />
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
      </div>
    </PageWrapper>
  )

  return (
    <PageWrapper>
      <AppBar
        title={t('student_progress')}
        onBack={() => navigate(-1)}
        action={
          <button
            onClick={() => navigate(`/teacher/report-card/${studentId}`)}
            className={`text-xs font-bold text-white/90 bg-white/15 hover:bg-white/25 px-2 py-1 rounded-lg ${fa}`}
          >
            🖨 {t('report_card')}
          </button>
        }
      />
      <div className="overflow-y-auto">
        {/* Student header */}
        {student && (
          <div className="bg-navy text-white px-4 py-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold font-arabic">
              {student.full_name_ar.charAt(0)}
            </div>
            <div>
              <h1 className={`font-bold text-lg ${fa}`}>{student.full_name_ar}</h1>
              <p className={`text-white/70 text-sm ${fa}`}>
                {t('grade_label')} {student.grade_year} {student.section}
              </p>
            </div>
          </div>
        )}

        <div className="p-4 space-y-5 pb-24">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
              <p className="text-xl font-bold text-teal">{toArabicNumerals(lessonsDone)}</p>
              <p className={`text-xs text-gray-500 ${fa} mt-1 leading-tight`}>{t('lessons_taken')}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
              <p className="text-xl font-bold text-navy">{toArabicNumerals(attempts.length)}</p>
              <p className={`text-xs text-gray-500 ${fa} mt-1 leading-tight`}>{t('quizzes_taken')}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
              <p className="text-xl font-bold" style={{ color: attendRate !== null && attendRate >= 80 ? '#27ae60' : '#e67e22' }}>
                {attendRate !== null ? `${toArabicNumerals(attendRate)}%` : '—'}
              </p>
              <p className={`text-xs text-gray-500 ${fa} mt-1 leading-tight`}>{t('attend_rate')}</p>
            </div>
          </div>

          {/* Quiz history */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className={`text-sm font-bold text-gray-700 ${fa} mb-3`}>
              {t('quiz_history')}
              {avgQuizPct !== null && (
                <span className="mr-2 text-xs font-normal text-gray-500">
                  {t('avg_quiz_score')}: {toArabicNumerals(avgQuizPct)}%
                </span>
              )}
            </p>
            {attempts.length === 0 ? (
              <p className={`text-center text-gray-400 ${fa} py-4 text-sm`}>{t('no_quizzes')}</p>
            ) : (
              <div className="space-y-2">
                {attempts.slice(-10).reverse().map((a, i) => {
                  const pct   = a.max_score > 0 ? Math.round((a.score / a.max_score) * 100) : 0
                  const grade = getMoELetterGrade(pct, 100)
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 font-arabic truncate max-w-[55%]">
                        {a.quizzes?.title_ar ?? t('quiz')}
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Mini bar */}
                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: grade.color }}
                          />
                        </div>
                        <span
                          className="text-xs font-bold font-arabic px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: grade.color + '20', color: grade.color }}
                        >
                          {toArabicNumerals(pct)}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Attendance summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className={`text-sm font-bold text-gray-700 ${fa} mb-3`}>{t('attend_summary')}</p>
            {attendance.length === 0 ? (
              <p className={`text-center text-gray-400 ${fa} py-4 text-sm`}>{t('no_attendance')}</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: t('present_days'), count: presentCount, color: STATUS_COLOR.present },
                    { label: t('absent_days'),  count: absentCount,  color: STATUS_COLOR.absent },
                    { label: t('late_days'),    count: lateCount,    color: STATUS_COLOR.late },
                  ].map(c => (
                    <div key={c.label} className="text-center">
                      <p className="text-xl font-bold" style={{ color: c.color }}>{toArabicNumerals(c.count)}</p>
                      <p className={`text-xs text-gray-500 ${fa}`}>{c.label}</p>
                    </div>
                  ))}
                </div>
                {/* Dot grid — last 60 records */}
                <div className="flex flex-wrap gap-1.5">
                  {attendance.slice(0, 60).map((rec, i) => (
                    <div
                      key={i}
                      title={`${rec.attendance_date} — ${rec.status}`}
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: STATUS_COLOR[rec.status] ?? '#e5e7eb' }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}

StudentProgressPage.displayName = 'StudentProgressPage'
