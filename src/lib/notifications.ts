import { supabase } from './supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

async function callEdgeFunction(name: string, body: object): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const jwt = session?.access_token ?? ''
    await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    console.warn(`[notifications] ${name} failed:`, err)
  }
}

export async function triggerAbsenceWhatsApp(absentStudentIds: string[]): Promise<void> {
  if (!absentStudentIds.length) return
  await callEdgeFunction('notify-absence', {
    absent_student_ids: absentStudentIds,
    date: new Date().toISOString().split('T')[0],
  })
}

export async function triggerAssignmentNotification(assignmentId: string): Promise<void> {
  await callEdgeFunction('notify-assignment', { assignment_id: assignmentId })
}

export async function triggerGradeNotification(studentId: string, subjectId: string): Promise<void> {
  await callEdgeFunction('notify-grade', { student_id: studentId, subject_id: subjectId })
}

export async function triggerEmergencyBroadcast(schoolId: string, messageAr: string): Promise<number> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const jwt = session?.access_token ?? ''
    const res = await fetch(`${SUPABASE_URL}/functions/v1/emergency-broadcast`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
      body: JSON.stringify({ school_id: schoolId, message_ar: messageAr }),
    })
    const json = await res.json()
    return json.sent ?? 0
  } catch {
    return 0
  }
}
