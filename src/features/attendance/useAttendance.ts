import { useEffect, useState, useContext } from 'react'
import { supabase, markAttendance } from '../../lib/supabase'
import { AuthContext } from '../../app/providers/AuthProvider'
import type { AttendanceRecord, StudentCard } from '../../types/domain'
import type { AttendanceStatus } from '../../types/enums'

type AttendanceMap = Record<string, AttendanceStatus>

const QUEUE_KEY = 'lms_attendance_queue'

interface QueuedAttendance {
  studentId:    string
  teacherId:    string
  subjectId:    string
  status:       'present' | 'absent' | 'late' | 'excused'
  date:         string
  periodNumber: number
}

export function useAttendance(
  students:     StudentCard[],
  subjectId:    string,
  classDate:    string,
  periodNumber: number
) {
  const auth = useContext(AuthContext)
  const [records,  setRecords]  = useState<AttendanceMap>({})
  const [saving,   setSaving]   = useState<Record<string, boolean>>({})
  const [loading,  setLoading]  = useState(true)

  // Load today's existing records on mount
  useEffect(() => {
    if (!students.length) return

    const studentIds = students.map(s => s.id)
    supabase
      .from('attendance_records')
      .select('student_id, status')
      .eq('attendance_date', classDate)
      .eq('period_number',   periodNumber)
      .in('student_id',      studentIds)
      .then(({ data }) => {
        if (data) {
          const map: AttendanceMap = {}
          data.forEach(r => {
            map[r.student_id] = r.status as AttendanceStatus
          })
          setRecords(map)
        }
        setLoading(false)
      })
  }, [students, classDate, periodNumber])

  // Subscribe to realtime changes for this date+period
  useEffect(() => {
    if (!students.length) return

    const channel = supabase
      .channel(`attendance:${classDate}:${periodNumber}`)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'attendance_records',
          filter: `attendance_date=eq.${classDate}`,
        },
        payload => {
          const r = payload.new as AttendanceRecord
          if (r.period_number === periodNumber) {
            setRecords(prev => ({ ...prev, [r.student_id]: r.status }))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [classDate, periodNumber, students.length])

  async function mark(studentId: string, status: 'present' | 'absent') {
    if (!auth?.profile?.id) return

    // Optimistic update
    setRecords(prev => ({ ...prev, [studentId]: status }))
    setSaving(prev => ({ ...prev, [studentId]: true }))

    if (!navigator.onLine) {
      // Queue for later sync
      const queue: QueuedAttendance[] = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')
      queue.push({ studentId, teacherId: auth.profile.id, subjectId, status, date: classDate, periodNumber })
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
      setSaving(prev => ({ ...prev, [studentId]: false }))
      return
    }

    await markAttendance({
      studentId,
      teacherId:    auth.profile.id,
      subjectId,
      status,
      date:         classDate,
      periodNumber,
    })
    setSaving(prev => ({ ...prev, [studentId]: false }))
  }

  // Stats derived from records
  const presentCount = Object.values(records).filter(s => s === 'present').length
  const absentCount  = Object.values(records).filter(s => s === 'absent').length
  const pendingCount = students.length - Object.keys(records).length
  const progressPct  = students.length ? (presentCount / students.length) * 100 : 0

  // Flush offline queue on reconnect
  useEffect(() => {
    async function flush() {
      const raw = localStorage.getItem(QUEUE_KEY)
      if (!raw) return
      const queue: QueuedAttendance[] = JSON.parse(raw)
      for (const item of queue) {
        await markAttendance(item)
      }
      localStorage.removeItem(QUEUE_KEY)
    }

    window.addEventListener('online', flush)
    return () => window.removeEventListener('online', flush)
  }, [])

  return { records, saving, loading, mark, presentCount, absentCount, pendingCount, progressPct }
}
