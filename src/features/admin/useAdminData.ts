import { useEffect, useState, useContext } from 'react'
import { supabase } from '../../lib/supabase'
import { AuthContext } from '../../app/providers/AuthProvider'

type AdminStats = {
  totalStudents:    number
  totalTeachers:    number
  absentToday:      number
  attendanceRate:   number   // percentage
}

export function useAdminData() {
  const auth = useContext(AuthContext)
  const [stats,   setStats]   = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth?.schoolId) return

    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true })
        .eq('school_id', auth.schoolId)
        .in('role', ['kg_primary_student', 'prep_secondary_student']),
      supabase.from('users').select('id', { count: 'exact', head: true })
        .eq('school_id', auth.schoolId)
        .in('role', ['subject_teacher', 'homeroom_teacher']),
      supabase.from('attendance_records').select('id', { count: 'exact', head: true })
        .eq('attendance_date', today)
        .eq('status', 'absent'),
      supabase.from('attendance_records').select('id', { count: 'exact', head: true })
        .eq('attendance_date', today),
    ]).then(([studentsRes, teachersRes, absentRes, totalAttendRes]) => {
      const total     = studentsRes.count ?? 0
      const absent    = absentRes.count ?? 0
      const attended  = totalAttendRes.count ?? 0
      const rate      = attended > 0 ? ((attended - absent) / attended) * 100 : 0

      setStats({
        totalStudents:  total,
        totalTeachers:  teachersRes.count ?? 0,
        absentToday:    absent,
        attendanceRate: Math.round(rate),
      })
      setLoading(false)
    })
  }, [auth?.schoolId])

  return { stats, loading }
}
