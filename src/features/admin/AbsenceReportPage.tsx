import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang } from '../../app/providers/LangProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { toArabicNumerals } from '../../lib/arabic'

const MOE_THRESHOLD = 25   // % — MoE fail threshold
const WARN_THRESHOLD = 15  // % — warning zone

interface StudentAbsence {
  id:          string
  name:        string
  gradeYear:   number
  section:     string
  totalDays:   number
  absentDays:  number
  pct:         number
  level:       'critical' | 'warning' | 'ok'
}

type FilterTab = 'all' | 'critical' | 'warning'

export function AbsenceReportPage() {
  const auth = useContext(AuthContext)
  const { t, fa } = useLang()
  const navigate = useNavigate()

  const [rows,    setRows]    = useState<StudentAbsence[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<FilterTab>('all')

  useEffect(() => {
    if (!auth?.schoolId) return
    async function load() {
      // 1. Get all students for this school
      const { data: students } = await supabase
        .from('v_student_card')
        .select('id, full_name_ar, grade_year, section')
        .eq('school_id', auth!.schoolId!)

      if (!students?.length) { setLoading(false); return }

      // 2. Get attendance records for these students
      const ids = students.map(s => s.id).filter((id): id is string => !!id)
      const { data: records } = await supabase
        .from('attendance_records')
        .select('student_id, status')
        .in('student_id', ids)

      if (!records) { setLoading(false); return }

      // 3. Aggregate per student
      const agg: Record<string, { absent: number; total: number }> = {}
      for (const r of records) {
        if (!r.student_id) continue
        if (!agg[r.student_id]) agg[r.student_id] = { absent: 0, total: 0 }
        agg[r.student_id].total++
        if (r.status === 'absent') agg[r.student_id].absent++
      }

      const result: StudentAbsence[] = students
        .filter(s => s.id && s.full_name_ar && (agg[s.id]?.total ?? 0) > 0)
        .map(s => {
          const sid = s.id as string
          const { absent, total } = agg[sid] ?? { absent: 0, total: 0 }
          const pct = total > 0 ? (absent / total) * 100 : 0
          const level: StudentAbsence['level'] = pct >= MOE_THRESHOLD ? 'critical' : pct >= WARN_THRESHOLD ? 'warning' : 'ok'
          return {
            id:         sid,
            name:       s.full_name_ar as string,
            gradeYear:  (s.grade_year as number) ?? 0,
            section:    (s.section as string) ?? '',
            totalDays:  total,
            absentDays: absent,
            pct:        Math.round(pct * 10) / 10,
            level,
          }
        })
        .sort((a, b) => b.pct - a.pct)

      setRows(result)
      setLoading(false)
    }
    load()
  }, [auth?.schoolId])

  const criticalCount = rows.filter(r => r.level === 'critical').length
  const warningCount  = rows.filter(r => r.level === 'warning').length

  const visible = rows.filter(r =>
    filter === 'all'      ? true :
    filter === 'critical' ? r.level === 'critical' :
                            r.level === 'warning'
  )

  function exportExcel() {
    const ws = XLSX.utils.json_to_sheet(visible.map(r => ({
      'الاسم':       r.name,
      'الصف':        `${r.gradeYear} ${r.section}`,
      'أيام الحضور': r.totalDays - r.absentDays,
      'أيام الغياب': r.absentDays,
      'الإجمالي':    r.totalDays,
      'نسبة الغياب %': r.pct,
      'الحالة':      r.level === 'critical' ? 'خطر' : r.level === 'warning' ? 'تحذير' : 'جيد',
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Absence Report')
    XLSX.writeFile(wb, `absence_report_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const LEVEL_STYLE = {
    critical: { bg: 'bg-red-100',    text: 'text-red-700',    bar: 'bg-red-500'    },
    warning:  { bg: 'bg-yellow-100', text: 'text-yellow-700', bar: 'bg-yellow-500' },
    ok:       { bg: 'bg-green-100',  text: 'text-green-700',  bar: 'bg-green-500'  },
  }

  return (
    <PageWrapper>
      <AppBar title={t('absence_report')} subtitle={t('moe_threshold_sub')} onBack={() => navigate(-1)} />

      {/* Summary */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <div className="text-center">
            <p className="text-xl font-bold text-red-600">{toArabicNumerals(criticalCount)}</p>
            <p className={`text-xs text-gray-500 ${fa}`}>{t('moe_critical')}</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-yellow-600">{toArabicNumerals(warningCount)}</p>
            <p className={`text-xs text-gray-500 ${fa}`}>{t('moe_warning')}</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-700">{toArabicNumerals(rows.length)}</p>
            <p className={`text-xs text-gray-500 ${fa}`}>{t('students')}</p>
          </div>
        </div>
      )}

      {/* Filter + export toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-100">
        {(['all', 'critical', 'warning'] as FilterTab[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold ${fa} transition-colors ${
              filter === f ? 'bg-navy text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {f === 'all'      ? t('tab_all') :
             f === 'critical' ? `⚠️ ${t('moe_critical')}` :
                                `🔔 ${t('moe_warning')}`}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={exportExcel}
          disabled={visible.length === 0}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal/10 text-teal text-xs font-bold ${fa} disabled:opacity-40`}
        >
          {t('export_excel')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <p className={`text-center text-gray-400 ${fa} py-20 text-sm`}>{t('no_data')}</p>
      ) : (
        <div className="bg-white divide-y divide-gray-50 pb-24">
          {visible.map(row => {
            const style = LEVEL_STYLE[row.level]
            const barWidth = Math.min(row.pct, 100)
            return (
              <div key={row.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <p className={`text-sm font-bold text-gray-800 ${fa}`}>{row.name}</p>
                    <p className={`text-xs text-gray-400 ${fa}`}>
                      {t('grade_label')} {row.gradeYear} {row.section}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text} ${fa}`}>
                      {toArabicNumerals(row.pct)}%
                    </span>
                    <p className={`text-xs text-gray-400 ${fa} mt-0.5`}>
                      {toArabicNumerals(row.absentDays)}/{toArabicNumerals(row.totalDays)}
                    </p>
                  </div>
                </div>
                {/* Absence bar */}
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${style.bar} transition-all`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                {row.level === 'critical' && (
                  <div className={`mt-1 h-px bg-red-200`} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </PageWrapper>
  )
}

AbsenceReportPage.displayName = 'AbsenceReportPage'
