import { useEffect, useState, useContext } from 'react'
import { supabase, enterGrade } from '../../lib/supabase'
import { offlineQueue } from '../../lib/offlineQueue'
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

    const enterable = ['written', 'oral', 'practical', 'activity'] as const
    type Enterable = typeof enterable[number]

    const rows: { student: StudentCard; gradeType: Enterable; val: number }[] = []
    for (const student of students) {
      for (const gradeType of gradeTypes) {
        const key = `${student.id}:${gradeType}`
        const val = parseFloat(grades[key] ?? '')
        if (!isNaN(val) && enterable.includes(gradeType as Enterable)) {
          rows.push({ student, gradeType: gradeType as Enterable, val })
        }
      }
    }

    if (!navigator.onLine) {
      rows.forEach(({ student, gradeType, val }) => {
        offlineQueue.enqueue({
          type: 'grade',
          payload: {
            student_id:  student.id,
            subject_id:  subjectId,
            term_id:     termId,
            grade_type:  gradeType,
            total_grade: val,
            entered_by:  auth.profile!.id,
          },
        })
      })
      setSaving(false)
      return
    }

    await Promise.all(
      rows.map(({ student, gradeType, val }) =>
        enterGrade({
          studentId: student.id,
          subjectId,
          termId,
          gradeType,
          grade:     val,
          enteredBy: auth.profile!.id,
        })
      )
    )
    setSaving(false)
  }

  return { grades, setGrade, saveAll, saving, loading }
}
