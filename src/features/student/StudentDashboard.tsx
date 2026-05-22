import { useContext, useEffect, useState } from 'react'
import { AuthContext }  from '../../app/providers/AuthProvider'
import { supabase }     from '../../lib/supabase'
import { PageWrapper }  from '../../components/layout/PageWrapper'
import { AppBar }       from '../../components/layout/AppBar'
import { Avatar }       from '../../components/ui/Avatar'
import { ProgressBar }  from '../../components/ui/ProgressBar'
import { HomeworkCard } from './HomeworkCard'
import type { StudentCard, Assignment, GradeEntry } from '../../types/domain'
import { getMoELetterGrade } from '../../lib/moe'
import { toArabicNumerals } from '../../lib/arabic'

export function StudentDashboard() {
  const auth = useContext(AuthContext)
  const [student,     setStudent]     = useState<StudentCard | null>(null)
  const [grades,      setGrades]      = useState<GradeEntry[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    if (!auth?.profile?.id) return

    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      supabase.from('v_student_card').select('*').eq('id', auth.profile.id).single(),
      supabase.from('grade_entries').select('*').eq('student_id', auth.profile.id).limit(20),
      supabase.from('assignments').select('*').gte('due_date', today).order('due_date').limit(5),
    ]).then(([studentRes, gradesRes, assignRes]) => {
      if (studentRes.data)  setStudent(studentRes.data as StudentCard)
      if (gradesRes.data)   setGrades(gradesRes.data as GradeEntry[])
      if (assignRes.data)   setAssignments(assignRes.data as Assignment[])
      setLoading(false)
    })
  }, [auth?.profile?.id])

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-10 h-10 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      </PageWrapper>
    )
  }

  // Compute average from grades
  const avgScore = grades.length
    ? grades.reduce((sum, g) => sum + g.total_grade, 0) / grades.length
    : 0
  const avgGrade = avgScore > 0 ? getMoELetterGrade(avgScore, 100) : null

  return (
    <PageWrapper>
      <AppBar title="مدرستي" subtitle={student?.school_name_ar ?? ''} onLogout={auth?.signOut} />

      {/* Student card */}
      <div className="bg-navy text-white px-4 py-6 flex items-center gap-4">
        <Avatar name={student?.full_name_ar ?? ''} url={student?.avatar_url} size="lg" />
        <div>
          <h1 className="font-bold text-xl font-arabic">{student?.full_name_ar}</h1>
          <p className="text-white/70 text-sm font-arabic mt-0.5">
            الصف {student?.grade_year} {student?.section}
          </p>
          {avgGrade && (
            <span
              className="inline-block mt-1 text-xs font-arabic font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: avgGrade.color + '30', color: avgGrade.color }}
            >
              {avgGrade.label} · {toArabicNumerals(Math.round(avgScore))}%
            </span>
          )}
        </div>
      </div>

      {/* Attendance streak */}
      {student && student.attendance_streak_days > 0 && (
        <div className="bg-green-50 border-b border-green-100 px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="font-bold font-arabic text-green-800 text-sm">
              {toArabicNumerals(student.attendance_streak_days)} يوم متواصل بلا غياب!
            </p>
            <ProgressBar value={Math.min(student.attendance_streak_days * 3.3, 100)} color="bg-green-500" height="h-1.5" />
          </div>
        </div>
      )}

      {/* Upcoming homework */}
      {assignments.length > 0 && (
        <div className="pt-4">
          <h2 className="font-bold font-arabic text-gray-700 px-4 mb-2 text-sm">الواجبات القادمة</h2>
          {assignments.map(a => <HomeworkCard key={a.id} assignment={a} />)}
        </div>
      )}

      {/* Recent grades */}
      {grades.length > 0 && (
        <div className="pt-4 pb-6">
          <h2 className="font-bold font-arabic text-gray-700 px-4 mb-2 text-sm">آخر الدرجات</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mx-4 overflow-hidden">
            {grades.slice(0, 5).map(g => {
              const grade = getMoELetterGrade(g.total_grade, 100)
              return (
                <div key={g.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0">
                  <span className="text-xs font-bold font-arabic px-2 py-0.5 rounded-full" style={{ backgroundColor: grade.color + '20', color: grade.color }}>
                    {grade.label}
                  </span>
                  <span className="font-bold text-gray-900 text-sm">{toArabicNumerals(g.total_grade)}</span>
                  <span className="text-gray-500 text-xs font-arabic">{g.subject_id}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

StudentDashboard.displayName = 'StudentDashboard'
