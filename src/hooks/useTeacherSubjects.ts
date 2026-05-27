import { useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from '../app/providers/AuthProvider'

export type TeacherSubjectOption = {
  subjectId:   string
  subjectName: string
  gradeYear:   number
  section:     string
}

export function useTeacherSubjects() {
  const auth = useContext(AuthContext)
  const [subjects, setSubjects] = useState<TeacherSubjectOption[]>([])
  const [active,   setActive]   = useState<TeacherSubjectOption | null>(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!auth?.profile?.id) return
    supabase
      .from('teacher_subjects')
      .select('subject_id, grade_year, section, subjects(name_ar)')
      .eq('teacher_id', auth.profile.id)
      .then(({ data }) => {
        const opts = (data ?? []).map(r => ({
          subjectId:   r.subject_id,
          subjectName: (r.subjects as { name_ar: string } | null)?.name_ar ?? '',
          gradeYear:   r.grade_year as number,
          section:     r.section as string,
        }))
        setSubjects(opts)
        if (opts.length) setActive(opts[0])
        setLoading(false)
      })
  }, [auth?.profile?.id])

  return { subjects, active, setActive, loading }
}
