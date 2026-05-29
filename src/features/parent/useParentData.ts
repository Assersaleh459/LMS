import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { StudentCard, AttendanceRecord, GradeEntry, Assignment } from '../../types/domain'

const CACHE_KEY = 'lms_parent_data'

type ParentData = {
  student:     StudentCard | null
  attendance:  AttendanceRecord[]
  grades:      GradeEntry[]
  assignments: Assignment[]
  lastFetched: string
}

export type ChildInfo = {
  id:           string
  full_name_ar: string
  grade_year:   number
  section:      string
  avatar_url:   string | null
}

export function useParentData(selectedStudentId?: string | null) {
  const [searchParams] = useSearchParams()
  const token          = searchParams.get('token')

  const [allChildren, setAllChildren] = useState<ChildInfo[]>([])
  const [data,    setData]    = useState<ParentData | null>(() => {
    const cached = localStorage.getItem(CACHE_KEY)
    return cached ? JSON.parse(cached) : null
  })
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); setError('يجب تسجيل الدخول أولاً'); return }

      // Fetch all linked students for this parent
      const { data: links } = await supabase
        .from('parent_student_links')
        .select('student_id, is_primary')
        .eq('parent_id', user.id)

      if (!links?.length) { setLoading(false); setError('لا يوجد طالب مرتبط بهذا الحساب'); return }

      // Load child cards for the switcher
      const allIds = links.map(l => l.student_id)
      const { data: childCards } = await supabase
        .from('v_student_card')
        .select('id, full_name_ar, grade_year, section, avatar_url')
        .in('id', allIds)
      setAllChildren((childCards ?? []) as ChildInfo[])

      // Determine active student: caller-selected → primary → first
      const primaryId = links.find(l => l.is_primary)?.student_id ?? links[0].student_id
      const studentId = selectedStudentId ?? primaryId

      const today      = new Date().toISOString().split('T')[0]
      const monthAgo   = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]

      const [studentRes, attendanceRes, gradesRes, assignmentsRes] = await Promise.all([
        supabase.from('v_student_card').select('*').eq('id', studentId).single(),
        supabase.from('attendance_records').select('*').eq('student_id', studentId)
          .gte('attendance_date', monthAgo).order('attendance_date', { ascending: false }),
        supabase.from('grade_entries').select('*, subjects(total_marks)').eq('student_id', studentId)
          .order('created_at', { ascending: false }),
        supabase.from('assignments').select('*')
          .gte('due_date', today).order('due_date', { ascending: true }).limit(10),
      ])

      const fresh: ParentData = {
        student:     studentRes.data as StudentCard | null,
        attendance:  (attendanceRes.data ?? []) as AttendanceRecord[],
        grades:      (gradesRes.data ?? []) as GradeEntry[],
        assignments: (assignmentsRes.data ?? []) as Assignment[],
        lastFetched: new Date().toISOString(),
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify(fresh))
      setData(fresh)
      setLoading(false)
    }

    if (navigator.onLine) {
      load().catch(() => { setLoading(false) })
    } else {
      setLoading(false)
    }
  }, [token, selectedStudentId])

  const absentToday = data?.attendance.find(r =>
    r.attendance_date === new Date().toISOString().split('T')[0] && r.status === 'absent'
  )

  return { data, loading, error, absentToday, allChildren }
}
