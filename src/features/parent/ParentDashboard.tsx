import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar }          from '../../components/ui/Avatar'
import { Card }            from '../../components/ui/Card'
import { OfflineBanner }   from '../../components/ui/OfflineBanner'
import { AssignmentCard }  from '../assignments/AssignmentCard'
import { AttendanceCalendar } from './AttendanceCalendar'
import { GradeSubjectRow } from './GradeSubjectRow'
import { useParentData }   from './useParentData'
import { formatLastUpdated } from '../../lib/arabic'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../app/providers/LangProvider'

export function ParentDashboard() {
  const { t, fa } = useLang()
  const navigate = useNavigate()
  const [activeChildId, setActiveChildId] = useState<string | null>(null)
  const { data, loading, error, absentToday, allChildren } = useParentData(activeChildId)
  const [subjectNames, setSubjectNames] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!data?.grades?.length) return
    const ids = [...new Set(data.grades.map(g => g.subject_id))]
    supabase.from('subjects').select('id, name_ar').in('id', ids).then(({ data: subs }) => {
      if (!subs) return
      const map: Record<string, string> = {}
      subs.forEach(s => { map[s.id] = s.name_ar })
      setSubjectNames(map)
    })
  }, [data?.grades])

  if (loading) {
    return (
      <div className="min-h-screen bg-lms-bg flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-teal border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error || !data?.student) {
    return (
      <div className="min-h-screen bg-lms-bg flex flex-col items-center justify-center gap-4 p-6">
        <span className="text-5xl">😕</span>
        <p className={`text-gray-600 ${fa} text-center`}>{error ?? t('generic_error')}</p>
      </div>
    )
  }

  const { student, attendance, grades, assignments } = data

  // Aggregate grades by subject (use most recent per subject)
  const subjectGrades: Record<string, { score: number; max: number; name: string }> = {}
  grades.forEach(g => {
    if (!subjectGrades[g.subject_id]) {
      subjectGrades[g.subject_id] = { score: g.total_grade, max: 100, name: subjectNames[g.subject_id] ?? g.subject_id }
    }
  })

  return (
    <div className={`min-h-screen bg-lms-bg ${fa}`}>
      <OfflineBanner />

      {/* Children switcher — only shown when parent has multiple children */}
      {allChildren.length > 1 && (
        <div className="bg-white border-b border-gray-100 px-3 py-2 flex gap-2 overflow-x-auto">
          {allChildren.map(child => {
            const isActive = (activeChildId ?? '') === child.id ||
              (!activeChildId && child.id === student?.id)
            return (
              <button
                key={child.id}
                onClick={() => setActiveChildId(child.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${fa} transition-colors ${
                  isActive ? 'bg-[#1e8449] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Avatar name={child.full_name_ar} url={child.avatar_url} size="sm" />
                <span>{child.full_name_ar}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Header — green for parent portal */}
      <div className="bg-[#1e8449] text-white px-4 pt-8 pb-6">
        <div className="flex items-center gap-4">
          <Avatar name={student.full_name_ar} url={student.avatar_url} size="lg" />
          <div className="flex-1">
            <h1 className="font-bold text-xl">{student.full_name_ar}</h1>
            <p className="text-white/80 text-sm mt-0.5">
              الصف {student.grade_year} {student.section} · {student.school_name_ar}
            </p>
            <span className="inline-flex items-center gap-1 bg-[#25D366] text-white text-xs px-2 py-0.5 rounded-full mt-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t('wa_linked')}
            </span>
          </div>
          {/* Report card button */}
          <button
            onClick={() => navigate(`/parent/report-card/${student.id}`)}
            className={`flex-shrink-0 bg-white/20 hover:bg-white/30 text-white text-xs ${fa} font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('report_card')}
          </button>
        </div>
        {data.lastFetched && (
          <p className="text-white/50 text-xs mt-3 text-left">
            {formatLastUpdated(new Date(data.lastFetched))}
          </p>
        )}
      </div>

      <div className="py-4 space-y-4">
        {/* Absent alert */}
        {absentToday && (
          <div className="mx-4 border-2 border-red-300 rounded-2xl bg-red-50 p-4 flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className={`font-bold text-red-700 ${fa}`}>{t('absent_today')}</p>
              <p className={`text-red-600 text-sm ${fa} mt-0.5`}>
                {student.full_name_ar}
              </p>
            </div>
            <a
              href={`https://wa.me/${student.parent_whatsapp?.replace('+', '')}`}
              className={`bg-red-600 text-white text-xs ${fa} font-bold px-3 py-2 rounded-lg`}
            >
              {t('contact_teacher')}
            </a>
          </div>
        )}

        {/* Grades */}
        {Object.keys(subjectGrades).length > 0 && (
          <div>
            <h2 className={`font-bold ${fa} text-gray-700 px-4 mb-2 text-sm`}>{t('parent_grades')}</h2>
            <Card className="mx-4 p-0 overflow-hidden">
              {Object.values(subjectGrades).map((g, i) => (
                <GradeSubjectRow
                  key={i}
                  subjectNameAr={g.name}
                  score={g.score}
                  maxScore={g.max}
                />
              ))}
            </Card>
          </div>
        )}

        {/* Upcoming assignments */}
        {assignments.length > 0 && (
          <div>
            <h2 className={`font-bold ${fa} text-gray-700 px-4 mb-1 text-sm`}>{t('upcoming_hw')}</h2>
            {assignments.map(a => <AssignmentCard key={a.id} assignment={a} />)}
          </div>
        )}

        {/* Attendance calendar */}
        <div>
          <h2 className={`font-bold ${fa} text-gray-700 px-4 mb-2 text-sm`}>{t('attendance_log')}</h2>
          <AttendanceCalendar records={attendance} />
        </div>
      </div>
    </div>
  )
}

ParentDashboard.displayName = 'ParentDashboard'
