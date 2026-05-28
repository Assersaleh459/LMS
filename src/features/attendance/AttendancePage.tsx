import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { AuthContext } from '../../app/providers/AuthProvider'
import { AppBar }    from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { OfflineBanner } from '../../components/ui/OfflineBanner'
import { AttendanceSummaryBar } from './AttendanceSummaryBar'
import { StudentRow }    from './StudentRow'
import { WhatsAppAlertButton } from './WhatsAppAlertButton'
import { useAttendance } from './useAttendance'
import { useTeacherSubjects } from '../../hooks/useTeacherSubjects'
import { triggerAbsenceWhatsApp } from '../../lib/notifications'
import { formatDateAr } from '../../lib/arabic'
import { useLang } from '../../app/providers/LangProvider'
import type { StudentCard } from '../../types/domain'

const TODAY = new Date().toISOString().split('T')[0]
const MAX_PERIODS = 8
const AR_ORDINALS = ['الأولى','الثانية','الثالثة','الرابعة','الخامسة','السادسة','السابعة','الثامنة']

export function AttendancePage() {
  const { t, fa, lang } = useLang()
  const auth = useContext(AuthContext)
  const navigate = useNavigate()

  const { subjects, active, setActive, loading: loadingSubjects } = useTeacherSubjects()

  const [students,        setStudents]        = useState<StudentCard[]>([])
  const [period,          setPeriod]          = useState(1)
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [waLoading,       setWaLoading]       = useState(false)

  const {
    records, saving, loading: loadingRecords,
    mark, presentCount, absentCount, pendingCount, progressPct
  } = useAttendance(students, active?.subjectId ?? '', TODAY, period)

  // Reload students whenever the active class changes
  useEffect(() => {
    if (!active || !auth?.schoolId) return
    setLoadingStudents(true)
    supabase
      .from('v_student_card')
      .select('*')
      .eq('school_id', auth.schoolId)
      .eq('grade_year', active.gradeYear)
      .eq('section', active.section)
      .order('full_name_ar')
      .then(({ data }) => {
        setStudents((data ?? []) as StudentCard[])
        setLoadingStudents(false)
      })
  }, [active, auth?.schoolId])

  async function handleWhatsApp() {
    setWaLoading(true)
    const absentIds = students
      .filter(s => records[s.id] === 'absent')
      .map(s => s.id)
    await triggerAbsenceWhatsApp(absentIds)
    setWaLoading(false)
  }

  const isLoading = loadingSubjects || loadingStudents || loadingRecords

  const periodLabel = (p: number) =>
    lang === 'ar' ? `الحصة ${AR_ORDINALS[p - 1] ?? p}` : `Period ${p}`

  const classLabel = (sub: typeof active) =>
    sub ? `${sub.subjectName} · ${t('grade_label')} ${sub.gradeYear} ${sub.section}` : t('loading')

  return (
    <PageWrapper>
      <AppBar
        title={t('attendance')}
        subtitle={`${classLabel(active)} · ${formatDateAr(new Date())}`}
        action={
          <div className="flex items-center gap-2">
            <span className={`bg-white/20 text-white text-xs ${fa} px-2 py-1 rounded-lg`}>
              {periodLabel(period)}
            </span>
            <button
              onClick={() => navigate('/teacher/profile')}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        }
        onLogout={auth?.signOut}
      />

      {/* Class picker — shown only when teacher has multiple classes */}
      {subjects.length > 1 && (
        <div className="bg-white border-b border-gray-200 px-3 py-2 flex gap-2 overflow-x-auto">
          {subjects.map(sub => {
            const isActive = sub.subjectId === active?.subjectId &&
                             sub.gradeYear === active?.gradeYear &&
                             sub.section   === active?.section
            return (
              <button
                key={`${sub.subjectId}-${sub.gradeYear}-${sub.section}`}
                onClick={() => setActive(sub)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${fa} transition-colors ${
                  isActive ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {sub.subjectName} · {sub.gradeYear}{sub.section}
              </button>
            )
          })}
        </div>
      )}

      {/* Period selector strip */}
      <div className="bg-white border-b border-gray-100 px-3 py-2 flex gap-2 overflow-x-auto">
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
            <p className={`text-gray-400 ${fa}`}>{t('no_students')}</p>
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
