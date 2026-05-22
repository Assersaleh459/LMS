import { useEffect, useState, useContext } from 'react'
import { supabase, enterGrade } from '../../lib/supabase'
import { AuthContext } from '../../app/providers/AuthProvider'
import type { GradeType } from '../../types/enums'
import type { StudentCard } from '../../types/domain'

// gradeKey: `${studentId}:${gradeType}`
type GradeMap = Record<string, string>

export function useGrades(
  students:  StudentCard[],
  subjectId: string,
  termId:    string
) {
  const auth = useContext(AuthContext)
  const [grades,  setGrades]  = useState<GradeMap>({})
  const [saving,  setSaving]  = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!students.length || !subjectId) return

    const studentIds = students.map(s => s.id)
    supabase
      .from('grade_entries')
      .select('student_id, grade_type, total_grade')
      .eq('subject_id', subjectId)
      .eq('term_id',    termId)
      .in('student_id', studentIds)
      .then(({ data }) => {
        if (data) {
          const map: GradeMap = {}
          data.forEach(r => { map[`${r.student_id}:${r.grade_type}`] = String(r.total_grade) })
          setGrades(map)
        }
        setLoading(false)
      })
  }, [students, subjectId, termId])

  function setGrade(studentId: string, gradeType: GradeType, value: string) {
    setGrades(prev => ({ ...prev, [`${studentId}:${gradeType}`]: value }))
  }

  async function saveAll(gradeTypes: GradeType[]) {
    if (!auth?.profile?.id) return
    setSaving(true)

    const inserts = []
    for (const student of students) {
      for (const gradeType of gradeTypes) {
        const key = `${student.id}:${gradeType}`
        const val = parseFloat(grades[key] ?? '')
        const enterable = ['written', 'oral', 'practical', 'activity'] as const
        if (!isNaN(val) && enterable.includes(gradeType as typeof enterable[number])) {
          inserts.push(enterGrade({
            studentId: student.id,
            subjectId,
            termId,
            gradeType: gradeType as typeof enterable[number],
            grade:     val,
            enteredBy: auth.profile.id,
          }))
        }
      }
    }

    await Promise.all(inserts)
    setSaving(false)
  }

  return { grades, setGrade, saveAll, saving, loading }
}
