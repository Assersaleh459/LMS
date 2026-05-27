import { useContext, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { AuthContext } from '../../app/providers/AuthProvider'
import { AppBar }    from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { OfflineBanner } from '../../components/ui/OfflineBanner'
import { AttendanceSummaryBar } from './AttendanceSummaryBar'
import { StudentRow }    from './StudentRow'
import { WhatsAppAlertButton } from './WhatsAppAlertButton'
import { useAttendance } from './useAttendance'
import { triggerAbsenceWhatsApp } from '../../lib/notifications'
import { formatDateAr } from '../../lib/arabic'
import { useLang } from '../../app/providers/LangProvider'
import type { StudentCard } from '../../types/domain'

const TODAY = new Date().toISOString().split('T')[0]
const MAX_PERIODS = 8
const AR_ORDINALS = ['الأولى','الثانية','الثالثة','الرابعة','الخامسة','السادسة','السابعة','الثامنة']

export function AttendancePage() {
  const { t, fa, lang } = useLang()
  const auth    = useContext(AuthContext)
  const [students,   setStudents]   = useState<StudentCard[]>([])
  const [subjectId,  setSubjectId]  = useState('')
  const [gradeYear,  setGradeYear]  = useState(6)
  const [section,    setSection]    = useState('أ')
  const [period,     setPeriod]     = useState(1)
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [waLoading,  setWaLoading]  = useState(false)

  const {
    records, saving, loading: loadingRecords,
    mark, presentCount, absentCount, pendingCount, progressPct
  } = useAttendance(students, subjectId, TODAY, period)

  // Load teacher's assigned class
  useEffect(() => {
    if (!auth?.profile?.id) return

    supabase
      .from('teacher_subjects')
      .select('subject_id, grade_year, section')
      .eq('teacher_id', auth.profile.id)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setSubjectId(data.subject_id)
          setGradeYear(data.grade_year)
          setSection(data.section)
        }
      })
  }, [auth?.profile?.id])

  // Load students once we have grade + section
  useEffect(() => {
    if (!subjectId || !auth?.schoolId) return

    supabase
      .from('v_student_card')
      .select('*')
      .eq('school_id', auth.schoolId)
      .eq('grade_year', gradeYear)
      .eq('section', section)
      .order('full_name_ar')
      .then(({ data }) => {
        if (data) setStudents(data as StudentCard[])
        setLoadingStudents(false)
      })
  }, [subjectId, gradeYear, section, auth?.schoolId])

  async function handleWhatsApp() {
    setWaLoading(true)
    const absentIds = students
      .filter(s => records[s.id] === 'absent')
      .map(s => s.id)
    await triggerAbsenceWhatsApp(absentIds)
    setWaLoading(false)
  }

  const isLoading = loadingStudents || loadingRecords

  const periodLabel = (p: number) =>
    lang === 'ar' ? `الحصة ${AR_ORDINALS[p - 1] ?? p}` : `Period ${p}`

  return (
    <PageWrapper>
      <AppBar
        title={t('attendance')}
        subtitle={`${t('grade_label')} ${gradeYear} ${section} · ${formatDateAr(new Date())}`}
        action={
          <span className={`bg-white/20 text-white text-xs ${fa} px-2 py-1 rounded-lg`}>
            {periodLabel(period)}
          </span>
        }
        onLogout={auth?.signOut}
      />

      {/* Period selector strip */}
      <div className="bg-white border-b border-gray-100 px-3 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {Array.from({ length: MAX_PERIODS }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${fa} transition-colors ${
              period === p ? 'bg-teal text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {periodLabel(p)}
          </button>
        ))}
      </div>

      <OfflineBanner />

      {!isLoading && (
        <AttendanceSummaryBar
          present={presentCount}
          absent={absentCount}
          pending={pendingCount}
          total={students.length}
          progressPct={progressPct}
        />
      )}

      <div className="bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="py-20 text-center">
            <p className={`text-gray-400 ${fa}`}>لا يوجد طلاب في هذا الفصل</p>
          </div>
        ) : (
          students.map(student => (
            <StudentRow
              key={student.id}
              student={student}
              status={records[student.id] ?? null}
              saving={saving[student.id] ?? false}
              onMark={mark}
            />
          ))
        )}
      </div>

      <WhatsAppAlertButton
        absentCount={absentCount}
        loading={waLoading}
        onPress={handleWhatsApp}
      />
    </PageWrapper>
  )
}

AttendancePage.displayName = 'AttendancePage'
