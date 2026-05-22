import { useContext, useEffect, useState } from 'react'
import { AuthContext }  from '../../app/providers/AuthProvider'
import { supabase }     from '../../lib/supabase'
import { PageWrapper }  from '../../components/layout/PageWrapper'
import { AppBar }       from '../../components/layout/AppBar'
import { Avatar }       from '../../components/ui/Avatar'
import { HomeworkCard } from './HomeworkCard'
import type { StudentCard, Assignment } from '../../types/domain'
import { KG_GRADES } from '../../lib/moe'

export function KGDashboard() {
  const auth = useContext(AuthContext)
  const [student,     setStudent]     = useState<StudentCard | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    if (!auth?.profile?.id) return

    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      supabase.from('v_student_card').select('*').eq('id', auth.profile.id).single(),
      supabase.from('assignments').select('*').gte('due_date', today).order('due_date').limit(5),
    ]).then(([studentRes, assignRes]) => {
      if (studentRes.data) setStudent(studentRes.data as StudentCard)
      if (assignRes.data)  setAssignments(assignRes.data as Assignment[])
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

  return (
    <PageWrapper>
      <AppBar title="مدرستي" subtitle={student?.school_name_ar ?? ''} />

      <div className="bg-navy text-white px-4 py-6 flex items-center gap-4">
        <Avatar name={student?.full_name_ar ?? ''} url={student?.avatar_url} size="lg" />
        <div>
          <h1 className="font-bold text-xl font-arabic">{student?.full_name_ar}</h1>
          <p className="text-white/70 text-sm font-arabic mt-0.5">روضة</p>
        </div>
      </div>

      {/* KG descriptive grade scale */}
      <div className="px-4 py-4">
        <h2 className="font-bold font-arabic text-gray-700 mb-3 text-sm">التقييمات</h2>
        <div className="grid grid-cols-3 gap-3">
          {KG_GRADES.map(g => (
            <div key={g.value} className="bg-white rounded-2xl border border-gray-100 p-3 text-center">
              <span className="text-3xl">{g.emoji}</span>
              <p className="text-xs font-arabic text-gray-700 mt-1">{g.label}</p>
            </div>
          ))}
        </div>
      </div>

      {assignments.length > 0 && (
        <div>
          <h2 className="font-bold font-arabic text-gray-700 px-4 mb-2 text-sm">النشاطات</h2>
          {assignments.map(a => <HomeworkCard key={a.id} assignment={a} />)}
        </div>
      )}
    </PageWrapper>
  )
}

KGDashboard.displayName = 'KGDashboard'
