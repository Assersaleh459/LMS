import { useEffect, useState, useContext } from 'react'
import { supabase } from '../../lib/supabase'
import { AuthContext } from '../../app/providers/AuthProvider'
import { triggerAssignmentNotification } from '../../lib/notifications'
import type { Assignment } from '../../types/domain'
import type { AssignmentType, GradeType } from '../../types/enums'

export function useAssignments(subjectId?: string) {
  const auth = useContext(AuthContext)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    if (!subjectId) { setLoading(false); return }

    supabase
      .from('assignments')
      .select('*')
      .eq('subject_id', subjectId)
      .order('due_date', { ascending: true })
      .then(({ data }) => {
        if (data) setAssignments(data as Assignment[])
        setLoading(false)
      })
  }, [subjectId])

  async function createAssignment(params: {
    subjectId:      string
    titleAr:        string
    descriptionAr?: string
    type:           AssignmentType
    gradeCategory?: GradeType
    maxGrade:       number
    dueDate:        string
    gradeYear:      number
    section:        string
    whatsappNotify: boolean
  }): Promise<string | null> {
    if (!auth?.profile?.id) return null

    const { data, error } = await supabase
      .from('assignments')
      .insert({
        subject_id:       params.subjectId,
        teacher_id:       auth.profile.id,
        title_ar:         params.titleAr,
        description_ar:   params.descriptionAr,
        assignment_type:  params.type,
        grade_category:   params.gradeCategory,
        max_grade:        params.maxGrade,
        due_date:         params.dueDate,
        grade_year:       params.gradeYear,
        section:          params.section,
        whatsapp_notify:  params.whatsappNotify,
        is_published:     true,
        published_at:     new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error || !data) return null

    if (params.whatsappNotify) {
      await triggerAssignmentNotification(data.id)
    }

    setAssignments(prev => [...prev, { ...data } as Assignment])
    return data.id
  }

  return { assignments, loading, createAssignment }
}
