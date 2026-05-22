import { useContext, useEffect, useState } from 'react'
import { AuthContext }  from '../../app/providers/AuthProvider'
import { supabase }     from '../../lib/supabase'
import { PageWrapper }  from '../../components/layout/PageWrapper'
import { AppBar }       from '../../components/layout/AppBar'
import { Avatar }       from '../../components/ui/Avatar'
import { HomeworkCard } from './HomeworkCard'
import type { StudentCard, Assignment, GradeEntry } from '../../types/domain'
import { calcThanawyWeightedGrade, getMoELetterGrade } from '../../lib/moe'
import { toArabicNumerals } from '../../lib/arabic'

export function SecondaryDashboard() {
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

  // Thanawy: separate monthly vs final grades
  const monthlyGrades = grades.filter(g => g.grade_type === 'monthly')
  const finalGrades   = grades.filter(g => g.grade_type === 'final')
  const monthlyAvg    = monthlyGrades.length ? monthlyGrades.reduce((s, g) => s + g.total_grade, 0) / monthlyGrades.length : 0
  const finalAvg      = finalGrades.length   ? finalGrades.reduce((s, g) => s + g.total_grade, 0) / finalGrades.length : 0
  const weighted      = monthlyAvg + finalAvg > 0 ? calcThanawyWeightedGrade(monthlyAvg, finalAvg, 100, 100) : 0
  const overallGrade  = weighted > 0 ? getMoELetterGrade(weighted, 100) : null

  return (
    <PageWrapper>
      <AppBar title="مدرستي — ثانوي" subtitle={student?.school_name_ar ?? ''} onLogout={auth?.signOut} />

      <div className="bg-navy text-white px-4 py-6 flex items-center gap-4">
        <Avatar name={student?.full_name_ar ?? ''} url={student?.avatar_url} size="lg" />
        <div>
          <h1 className="font-bold text-xl font-arabic">{student?.full_name_ar}</h1>
          <p className="text-white/70 text-sm font-arabic mt-0.5">الصف {student?.grade_year} {student?.section}</p>
          {overallGrade && (
            <span className="inline-block mt-1 text-xs font-arabic font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
              المعدل المرجح: {toArabicNumerals(weighted)}% · {overallGrade.label}
            </span>
          )}
        </div>
      </div>

      {/* Weighted breakdown */}
      {weighted > 0 && (
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex gap-6 text-center">
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-arabic">شهري (٤٠%)</p>
            <p className="font-bold text-lg text-gray-900">{toArabicNumerals(Math.round(monthlyAvg))}</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-arabic">نهائي (٦٠%)</p>
            <p className="font-bold text-lg text-gray-900">{toArabicNumerals(Math.round(finalAvg))}</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-arabic">المجموع</p>
            <p className="font-bold text-lg text-navy">{toArabicNumerals(weighted)}</p>
          </div>
        </div>
      )}

      {assignments.length > 0 && (
        <div className="pt-4">
          <h2 className="font-bold font-arabic text-gray-700 px-4 mb-2 text-sm">الواجبات</h2>
          {assignments.map(a => <HomeworkCard key={a.id} assignment={a} />)}
        </div>
      )}
    </PageWrapper>
  )
}

SecondaryDashboard.displayName = 'SecondaryDashboard'
