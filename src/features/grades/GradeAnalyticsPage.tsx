import { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { AuthContext } from '../../app/providers/AuthProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { useLang } from '../../app/providers/LangProvider'
import { getMoELetterGrade, MOE_LETTER_GRADES } from '../../lib/moe'
import { toArabicNumerals } from '../../lib/arabic'
import type { StudentCard } from '../../types/domain'

interface RawEntry { student_id: string; grade_type: string; total_grade: number }
interface Summary {
  id: string; name: string
  written: number; oral: number; practical: number; activity: number
  total: number; pct: number
}

export function GradeAnalyticsPage() {
  const { t, fa } = useLang()
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const [students,    setStudents]    = useState<StudentCard[]>([])
  const [entries,     setEntries]     = useState<RawEntry[]>([])
  const [subjectName, setSubjectName] = useState('')
  const [totalMarks,  setTotalMarks]  = useState(100)
  const [loading,     setLoading]     = useState(true)
  const [sortAsc,     setSortAsc]     = useState(false)

  useEffect(() => {
    if (!auth?.profile?.id || !auth?.schoolId) return
    Promise.all([
      supabase.from('teacher_subjects')
        .select('subject_id, grade_year, section, subjects(name_ar, total_marks)')
        .eq('teacher_id', auth.profile.id).limit(1).single(),
      supabase.from('academic_terms')
        .select('id').eq('school_id', auth.schoolId).eq('is_active', true).single(),
    ]).then(async ([tsRes, termRes]) => {
      if (!tsRes.data) { setLoading(false); return }
      const sid = tsRes.data.subject_id
      const subj = tsRes.data.subjects as unknown as { name_ar: string; total_marks: number } | null
      setSubjectName(subj?.name_ar ?? '')
      setTotalMarks(subj?.total_marks ?? 100)
      const tid = termRes.data?.id ?? ''
      const [sRes, eRes] = await Promise.all([
        supabase.from('v_student_card').select('*')
          .eq('school_id', auth.schoolId!).eq('grade_year', tsRes.data.grade_year)
          .eq('section', tsRes.data.section).order('full_name_ar'),
        supabase.from('grade_entries').select('student_id, grade_type, total_grade')
          .eq('subject_id', sid).eq('term_id', tid),
      ])
      if (sRes.data) setStudents(sRes.data as StudentCard[])
      if (eRes.data) setEntries(eRes.data as RawEntry[])
      setLoading(false)
    })
  }, [auth?.profile?.id, auth?.schoolId])

  const summaries = useMemo<Summary[]>(() => {
    const get = (sid: string, type: string) =>
      entries.find(e => e.student_id === sid && e.grade_type === type)?.total_grade ?? 0
    return students.map(s => {
      const written    = get(s.id, 'written')
      const oral       = get(s.id, 'oral')
      const practical  = get(s.id, 'practical')
      const activity   = get(s.id, 'activity')
      const total      = written + oral + practical + activity
      const pct        = totalMarks > 0 ? (total / totalMarks) * 100 : 0
      return { id: s.id, name: s.full_name_ar, written, oral, practical, activity, total, pct }
    }).sort((a, b) => sortAsc ? a.pct - b.pct : b.pct - a.pct)
  }, [students, entries, totalMarks, sortAsc])

  const stats = useMemo(() => {
    if (!summaries.length) return null
    const pcts     = summaries.map(s => s.pct)
    const avg      = pcts.reduce((a, b) => a + b, 0) / pcts.length
    const passed   = pcts.filter(p => p >= 50).length
    return {
      avg:      Math.round(avg),
      passRate: Math.round((passed / pcts.length) * 100),
      top:      Math.round(Math.max(...pcts)),
      low:      Math.round(Math.min(...pcts)),
    }
  }, [summaries])

  const distribution = [
    { label: t('moe_excellent'), color: MOE_LETTER_GRADES.excellent.color, count: summaries.filter(s => s.pct >= 90).length },
    { label: t('moe_vgood'),     color: MOE_LETTER_GRADES.veryGood.color,  count: summaries.filter(s => s.pct >= 80 && s.pct < 90).length },
    { label: t('moe_good'),      color: MOE_LETTER_GRADES.good.color,      count: summaries.filter(s => s.pct >= 65 && s.pct < 80).length },
    { label: t('moe_pass'),      color: MOE_LETTER_GRADES.pass.color,      count: summaries.filter(s => s.pct >= 50 && s.pct < 65).length },
    { label: t('moe_fail'),      color: MOE_LETTER_GRADES.fail.color,      count: summaries.filter(s => s.pct < 50).length },
  ]

  function exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(summaries.map(s => ({
      [t('col_student_name')]: s.name,
      [t('written')]:          s.written,
      [t('oral')]:             s.oral,
      [t('practical')]:        s.practical,
      [t('activity')]:         s.activity,
      [t('col_total')]:        s.total,
      [t('col_pct')]:          Math.round(s.pct),
      [t('col_grade_lbl')]:    getMoELetterGrade(s.pct, 100).label,
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, subjectName.slice(0, 31) || 'Grades')
    XLSX.writeFile(wb, `grades_${subjectName}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  if (loading) return (
    <PageWrapper>
      <AppBar title={t('analytics')} onBack={() => navigate(-1)} />
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
      </div>
    </PageWrapper>
  )

  const maxCount = Math.max(...distribution.map(d => d.count), 1)

  return (
    <PageWrapper>
      <AppBar title={t('analytics')} subtitle={subjectName} onBack={() => navigate(-1)} />

      <div className="p-4 space-y-5 pb-24 overflow-y-auto">
        {/* Stat cards */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t('class_avg'),    value: `${toArabicNumerals(stats.avg)}%`,      color: '#1a3c5e' },
              { label: t('pass_rate_lbl'), value: `${toArabicNumerals(stats.passRate)}%`, color: stats.passRate >= 70 ? MOE_LETTER_GRADES.excellent.color : MOE_LETTER_GRADES.pass.color },
              { label: t('top_score'),    value: `${toArabicNumerals(stats.top)}%`,      color: MOE_LETTER_GRADES.excellent.color },
              { label: t('low_score'),    value: `${toArabicNumerals(stats.low)}%`,      color: MOE_LETTER_GRADES.fail.color },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className={`text-xs text-gray-500 ${fa} mt-1`}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Distribution chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className={`text-sm font-bold text-gray-700 ${fa} mb-4`}>{t('grade_dist')}</p>
          <div className="flex items-end gap-2 h-28">
            {distribution.map(d => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-gray-700">{d.count}</span>
                <div
                  className="w-full rounded-t-lg"
                  style={{ height: `${Math.max((d.count / maxCount) * 72, d.count > 0 ? 8 : 0)}px`, backgroundColor: d.color }}
                />
                <span className={`text-xs text-gray-500 ${fa} leading-tight text-center`}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Export + sort */}
        <div className="flex gap-2">
          <button
            onClick={exportToExcel}
            className={`flex-1 py-3 rounded-xl bg-teal text-white font-bold ${fa} text-sm flex items-center justify-center gap-2`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('export_excel')}
          </button>
          <button
            onClick={() => setSortAsc(v => !v)}
            className="px-4 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold"
          >
            {sortAsc ? '↑' : '↓'}
          </button>
        </div>

        {/* Student list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <p className={`text-sm font-bold text-gray-700 ${fa} p-4 border-b border-gray-100`}>
            {t('student_grades')} ({summaries.length})
          </p>
          {summaries.length === 0 ? (
            <p className={`text-center text-gray-400 ${fa} py-8`}>{t('no_grades')}</p>
          ) : (
            summaries.map((s, i) => {
              const grade = getMoELetterGrade(s.pct, 100)
              return (
                <button
                  key={s.id}
                  onClick={() => navigate(`/teacher/student/${s.id}/progress`)}
                  className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-xs text-gray-400 text-center font-bold">{i + 1}</span>
                    <span className={`text-sm text-gray-800 ${fa} text-right`}>{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-700">{toArabicNumerals(s.total)}</span>
                    <span
                      className={`text-xs font-bold ${fa} px-2 py-0.5 rounded-full whitespace-nowrap`}
                      style={{ backgroundColor: grade.color + '20', color: grade.color }}
                    >
                      {grade.label}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </PageWrapper>
  )
}

GradeAnalyticsPage.displayName = 'GradeAnalyticsPage'
