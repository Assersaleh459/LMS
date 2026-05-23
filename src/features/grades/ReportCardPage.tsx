import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../app/providers/LangProvider'
import { getMoELetterGrade } from '../../lib/moe'
import { toArabicNumerals } from '../../lib/arabic'
import type { StudentCard, Subject } from '../../types/domain'

interface GradeRow {
  subjectId: string; subjectName: string; totalMarks: number
  writtenMax: number; oralMax: number; practicalMax: number; activityMax: number
  written: number; oral: number; practical: number; activity: number
  total: number; pct: number
}

export function ReportCardPage() {
  const { studentId } = useParams<{ studentId: string }>()
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const { t, fa } = useLang()

  const [student,      setStudent]      = useState<StudentCard | null>(null)
  const [rows,         setRows]         = useState<GradeRow[]>([])
  const [schoolName,   setSchoolName]   = useState('')
  const [presentCount, setPresentCount] = useState(0)
  const [absentCount,  setAbsentCount]  = useState(0)
  const [termLabel,    setTermLabel]    = useState('')
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    if (!studentId || !auth?.schoolId) return

    const schoolId = auth.schoolId

    supabase.from('v_student_card').select('*').eq('id', studentId).single()
      .then(async ({ data: s }) => {
        if (!s) { setLoading(false); return }
        setStudent(s as StudentCard)
        const sc = s as StudentCard

        const [termRes, subjectsRes, gradesRes, attendRes, schoolRes] = await Promise.all([
          supabase.from('academic_terms').select('id, name_ar').eq('school_id', schoolId).eq('is_active', true).single(),
          supabase.from('subjects').select('*').eq('school_id', schoolId).eq('grade_year', sc.grade_year),
          supabase.from('grade_entries').select('subject_id, grade_type, total_grade')
            .eq('student_id', studentId),
          supabase.from('attendance_records').select('status').eq('student_id', studentId),
          supabase.from('schools').select('name_ar').eq('id', schoolId).single(),
        ])

        if (termRes.data) setTermLabel(termRes.data.name_ar ?? '')
        if (schoolRes.data) setSchoolName(schoolRes.data.name_ar ?? '')

        const subjects = (subjectsRes.data ?? []) as Subject[]
        const entries  = gradesRes.data ?? []
        const att      = attendRes.data ?? []

        setPresentCount(att.filter(a => a.status === 'present').length)
        setAbsentCount(att.filter(a => a.status === 'absent').length)

        const gradeRows: GradeRow[] = subjects.map(sub => {
          const getGrade = (type: string) =>
            entries.find(e => e.subject_id === sub.id && e.grade_type === type)?.total_grade ?? 0
          const written    = getGrade('written')
          const oral       = getGrade('oral')
          const practical  = getGrade('practical')
          const activity   = getGrade('activity')
          const total      = written + oral + practical + activity
          const pct        = sub.total_marks > 0 ? (total / sub.total_marks) * 100 : 0
          return {
            subjectId: sub.id, subjectName: sub.name_ar, totalMarks: sub.total_marks,
            writtenMax: sub.written_marks, oralMax: sub.oral_marks,
            practicalMax: sub.practical_marks, activityMax: sub.activity_marks,
            written, oral, practical, activity, total, pct,
          }
        }).filter(r => r.total > 0)

        setRows(gradeRows)
        setLoading(false)
      })
  }, [studentId, auth?.schoolId])

  const overallPct = rows.length
    ? Math.round(rows.reduce((s, r) => s + r.pct, 0) / rows.length)
    : 0
  const overallGrade = overallPct > 0 ? getMoELetterGrade(overallPct, 100) : null

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Toolbar — hidden when printing */}
      <div className="print:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className={`text-navy text-sm font-bold ${fa}`}>← {t('back')}</button>
        <div className="flex-1" />
        <button
          onClick={() => window.print()}
          className={`bg-teal text-white font-bold ${fa} px-6 py-2 rounded-xl text-sm flex items-center gap-2`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          {t('print_card')}
        </button>
      </div>

      {/* A4 card */}
      <div className="max-w-2xl mx-auto p-4 print:p-0 print:max-w-full">
        <div className="bg-white shadow-lg print:shadow-none rounded-2xl print:rounded-none p-8" dir="rtl">

          {/* School header */}
          <div className="text-center border-b-2 border-navy pb-5 mb-6">
            <h1 className={`text-xl font-bold text-navy ${fa}`}>{schoolName}</h1>
            <p className={`text-base font-bold text-gray-700 ${fa} mt-1`}>{t('report_card')}</p>
            {termLabel && <p className={`text-sm text-gray-500 ${fa} mt-0.5`}>{termLabel}</p>}
          </div>

          {/* Student details */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6 text-sm">
            {[
              [t('col_student_name'), student?.full_name_ar ?? '—'],
              [t('col_student_code'), student?.student_code ?? '—'],
              [t('rc_grade_year'),    `${student?.grade_year ?? '—'}`],
              [t('section'),          student?.section ?? '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center gap-2">
                <span className={`text-gray-500 ${fa} whitespace-nowrap`}>{label}:</span>
                <span className={`font-bold text-gray-900 ${fa}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Grades table */}
          <table className={`w-full text-sm ${fa} border-collapse mb-6`} style={{ borderSpacing: 0 }}>
            <thead>
              <tr style={{ backgroundColor: '#1a3c5e', color: 'white' }}>
                {[t('col_subject'), t('written'), t('oral'), t('practical'), t('activity'), t('col_total'), t('col_grade_lbl')].map(h => (
                  <th key={h} className={`p-2 text-center ${fa} text-xs border border-gray-300`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const grade = getMoELetterGrade(row.pct, 100)
                return (
                  <tr key={row.subjectId} style={{ backgroundColor: i % 2 === 0 ? '#f9fafb' : 'white' }}>
                    <td className={`p-2 font-bold text-right ${fa} border border-gray-200`}>{row.subjectName}</td>
                    <td className="p-2 text-center border border-gray-200">
                      {toArabicNumerals(row.written)}/{toArabicNumerals(row.writtenMax)}
                    </td>
                    <td className="p-2 text-center border border-gray-200">
                      {toArabicNumerals(row.oral)}/{toArabicNumerals(row.oralMax)}
                    </td>
                    <td className="p-2 text-center border border-gray-200">
                      {toArabicNumerals(row.practical)}/{toArabicNumerals(row.practicalMax)}
                    </td>
                    <td className="p-2 text-center border border-gray-200">
                      {toArabicNumerals(row.activity)}/{toArabicNumerals(row.activityMax)}
                    </td>
                    <td className="p-2 text-center font-bold border border-gray-200">
                      {toArabicNumerals(row.total)}/{toArabicNumerals(row.totalMarks)}
                    </td>
                    <td className="p-2 text-center border border-gray-200">
                      <span className="text-xs font-bold rounded-full px-2 py-0.5"
                        style={{ backgroundColor: grade.color + '20', color: grade.color }}>
                        {grade.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {rows.length > 0 && overallGrade && (
              <tfoot>
                <tr style={{ backgroundColor: '#e8f4f8' }}>
                  <td colSpan={5} className={`p-2 font-bold text-right ${fa} border border-gray-300`}>{t('rc_overall_avg')}</td>
                  <td className={`p-2 text-center font-bold ${fa} border border-gray-300`}>
                    {toArabicNumerals(overallPct)}%
                  </td>
                  <td className="p-2 text-center border border-gray-300">
                    <span className="text-xs font-bold rounded-full px-2 py-0.5"
                      style={{ backgroundColor: overallGrade.color + '20', color: overallGrade.color }}>
                      {overallGrade.label}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>

          {/* Attendance summary */}
          <div className="border border-gray-200 rounded-xl p-4 flex justify-around">
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#27ae60' }}>{toArabicNumerals(presentCount)}</p>
              <p className={`text-xs text-gray-500 ${fa}`}>{t('rc_present_days')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: '#c0392b' }}>{toArabicNumerals(absentCount)}</p>
              <p className={`text-xs text-gray-500 ${fa}`}>{t('rc_absent_days')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-700">
                {presentCount + absentCount > 0
                  ? `${toArabicNumerals(Math.round((presentCount / (presentCount + absentCount)) * 100))}%`
                  : '—'}
              </p>
              <p className={`text-xs text-gray-500 ${fa}`}>{t('attend_rate')}</p>
            </div>
          </div>

          {/* Footer */}
          <div className={`mt-6 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-400 ${fa}`}>
            <span>تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</span>
            <span>مدرستي — نظام إدارة التعلم</span>
          </div>
        </div>
      </div>
    </div>
  )
}

ReportCardPage.displayName = 'ReportCardPage'
