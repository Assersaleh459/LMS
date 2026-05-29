import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: { 'x-school-id': getSchoolIdFromStorage() },
    },
  }
)

function getSchoolIdFromStorage(): string {
  return localStorage.getItem('school_id') ?? ''
}

// ── TYPED QUERY HELPERS ──────────────────────────────────────

export async function getClassStudents(
  gradeYear: number,
  section: string,
  schoolId: string
) {
  return supabase
    .from('v_student_card')
    .select('*')
    .eq('school_id', schoolId)
    .eq('grade_year', gradeYear)
    .eq('section', section)
    .order('full_name_ar')
}

export async function markAttendance(params: {
  studentId:    string
  teacherId:    string
  subjectId:    string
  status:       'present' | 'absent' | 'late' | 'excused'
  date:         string   // YYYY-MM-DD
  periodNumber: number
}) {
  return supabase
    .from('attendance_records')
    .upsert(
      {
        student_id:      params.studentId,
        teacher_id:      params.teacherId,
        subject_id:      params.subjectId,
        status:          params.status,
        attendance_date: params.date,
        period_number:   params.periodNumber,
      },
      { onConflict: 'student_id,attendance_date,period_number' }
    )
    .select()
    .single()
}

export async function enterGrade(params: {
  studentId:  string
  subjectId:  string
  termId:     string
  gradeType:  'written' | 'oral' | 'practical' | 'activity'
  grade:      number
  enteredBy:  string
  comment?:   string
}) {
  // Try update first; if no existing row, insert.
  // This avoids relying on expression-based unique index for ON CONFLICT.
  const { data: updated } = await supabase
    .from('grade_entries')
    .update({
      total_grade:        params.grade,
      teacher_comment_ar: params.comment ?? null,
      entered_by:         params.enteredBy,
    })
    .eq('student_id', params.studentId)
    .eq('subject_id', params.subjectId)
    .eq('term_id',    params.termId)
    .eq('grade_type', params.gradeType)
    .select()

  if (updated?.length) return { data: updated[0], error: null }

  return supabase
    .from('grade_entries')
    .insert({
      student_id:         params.studentId,
      subject_id:         params.subjectId,
      term_id:            params.termId,
      grade_type:         params.gradeType,
      total_grade:        params.grade,
      teacher_comment_ar: params.comment,
      entered_by:         params.enteredBy,
    })
    .select()
    .single()
}
