// Calls Supabase Edge Functions (replaces n8n webhooks per project decision)

const ABSENCE_URL    = import.meta.env.VITE_N8N_ATTENDANCE_WEBHOOK  as string
const ASSIGNMENT_URL = import.meta.env.VITE_N8N_ASSIGNMENT_WEBHOOK  as string
const GRADE_URL      = import.meta.env.VITE_N8N_GRADE_WEBHOOK       as string

async function post(url: string, body: object): Promise<void> {
  if (!url || url.includes('YOUR_PROJECT')) return  // placeholder — skip silently
  try {
    await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
  } catch (err) {
    // Non-critical — log and continue
    console.warn('[notifications] webhook failed:', err)
  }
}

export async function triggerAbsenceWhatsApp(absentStudentIds: string[]): Promise<void> {
  await post(ABSENCE_URL, {
    absent_student_ids: absentStudentIds,
    date:         new Date().toISOString().split('T')[0],
    triggered_at: new Date().toISOString(),
  })
}

export async function triggerAssignmentNotification(assignmentId: string): Promise<void> {
  await post(ASSIGNMENT_URL, { assignment_id: assignmentId })
}

export async function triggerGradeNotification(studentId: string, subjectId: string): Promise<void> {
  await post(GRADE_URL, { student_id: studentId, subject_id: subjectId })
}
