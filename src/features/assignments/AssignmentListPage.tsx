import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext }  from '../../app/providers/AuthProvider'
import { supabase }     from '../../lib/supabase'
import { AppBar }       from '../../components/layout/AppBar'
import { PageWrapper }  from '../../components/layout/PageWrapper'
import { AssignmentCard } from './AssignmentCard'
import { useAssignments } from './useAssignments'

export function AssignmentListPage() {
  const auth     = useContext(AuthContext)
  const navigate = useNavigate()
  const [subjectId, setSubjectId] = useState('')

  useEffect(() => {
    if (!auth?.profile?.id) return
    supabase
      .from('teacher_subjects')
      .select('subject_id')
      .eq('teacher_id', auth.profile.id)
      .limit(1)
      .single()
      .then(({ data }) => { if (data) setSubjectId(data.subject_id) })
  }, [auth?.profile?.id])

  const { assignments, loading } = useAssignments(subjectId)

  return (
    <PageWrapper>
      <AppBar
        title="الواجبات"
        action={
          <button
            onClick={() => navigate('/teacher/assignments/new')}
            className="bg-teal text-white text-xs font-arabic font-bold px-3 py-2 rounded-lg"
          >
            + واجب جديد
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="text-5xl">📋</span>
          <p className="text-gray-400 font-arabic text-sm">لا توجد واجبات بعد</p>
          <button
            onClick={() => navigate('/teacher/assignments/new')}
            className="bg-teal text-white font-arabic font-bold px-6 py-3 rounded-xl"
          >
            أضف أول واجب
          </button>
        </div>
      ) : (
        <div className="py-2">
          {assignments.map(a => <AssignmentCard key={a.id} assignment={a} />)}
        </div>
      )}
    </PageWrapper>
  )
}

AssignmentListPage.displayName = 'AssignmentListPage'
