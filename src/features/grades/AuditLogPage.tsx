import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { useLang } from '../../app/providers/LangProvider'
import { toArabicNumerals } from '../../lib/arabic'
import { GRADE_TYPE_LABELS } from '../../lib/arabic'
import type { GradeType } from '../../types/enums'

interface AuditRow {
  id:         string
  student_id: string
  subject_id: string
  grade_type: string
  old_grade:  number | null
  new_grade:  number
  changed_by: string
  changed_at: string
  student_name?: string
  subject_name?: string
  teacher_name?: string
}

export function AuditLogPage() {
  const { t, fa } = useLang()
  const navigate = useNavigate()

  const [rows,    setRows]    = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rawData } = await (supabase as any)
        .from('grade_audit_log')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(200)

      const data = rawData as AuditRow[] | null
      if (!data?.length) { setLoading(false); return }

      // Enrich with names
      const studentIds = [...new Set(data.map((r: AuditRow) => r.student_id))]
      const subjectIds = [...new Set(data.map((r: AuditRow) => r.subject_id))]
      const teacherIds = [...new Set(data.map((r: AuditRow) => r.changed_by))]

      const [studentsRes, subjectsRes, teachersRes] = await Promise.all([
        supabase.from('users').select('id, first_name_ar, last_name_ar').in('id', studentIds),
        supabase.from('subjects').select('id, name_ar').in('id', subjectIds),
        supabase.from('users').select('id, first_name_ar, last_name_ar').in('id', teacherIds),
      ])

      const studentMap: Record<string, string> = {}
      ;(studentsRes.data ?? []).forEach(u => { studentMap[u.id] = `${u.first_name_ar} ${u.last_name_ar}` })

      const subjectMap: Record<string, string> = {}
      ;(subjectsRes.data ?? []).forEach(s => { subjectMap[s.id] = s.name_ar })

      const teacherMap: Record<string, string> = {}
      ;(teachersRes.data ?? []).forEach(u => { teacherMap[u.id] = `${u.first_name_ar} ${u.last_name_ar}` })

      setRows(data.map((r: AuditRow) => ({
        ...r,
        student_name: studentMap[r.student_id] ?? r.student_id,
        subject_name: subjectMap[r.subject_id] ?? r.subject_id,
        teacher_name: teacherMap[r.changed_by] ?? r.changed_by,
      })))
      setLoading(false)
    }
    load()
  }, [])

  function formatTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <PageWrapper>
      <AppBar title={t('audit_log')} subtitle={t('audit_log_sub')} onBack={() => navigate(-1)} />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className={`text-center text-gray-400 ${fa} py-20 text-sm`}>{t('no_data')}</p>
      ) : (
        <div className="bg-white divide-y divide-gray-50 pb-24">
          {rows.map(row => {
            const isNew     = row.old_grade === null
            const increased = !isNew && row.new_grade > (row.old_grade ?? 0)
            const decreased = !isNew && row.new_grade < (row.old_grade ?? 0)
            return (
              <div key={row.id} className="px-4 py-3 space-y-0.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className={`text-sm font-bold text-gray-800 ${fa}`}>{row.student_name}</p>
                    <p className={`text-xs text-gray-500 ${fa}`}>
                      {row.subject_name} · {GRADE_TYPE_LABELS[row.grade_type as GradeType] ?? row.grade_type}
                    </p>
                    <p className={`text-xs text-gray-400 ${fa} mt-0.5`}>
                      {t('by_teacher')} {row.teacher_name}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1.5 justify-end">
                      {!isNew && (
                        <>
                          <span className="text-xs text-gray-400 line-through">
                            {toArabicNumerals(row.old_grade ?? 0)}
                          </span>
                          <span className="text-xs text-gray-400">→</span>
                        </>
                      )}
                      <span className={`text-sm font-bold ${
                        isNew ? 'text-teal' : increased ? 'text-green-600' : decreased ? 'text-red-500' : 'text-gray-700'
                      }`}>
                        {toArabicNumerals(row.new_grade)}
                      </span>
                    </div>
                    <p className={`text-xs text-gray-400 ${fa}`}>{formatTime(row.changed_at)}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PageWrapper>
  )
}

AuditLogPage.displayName = 'AuditLogPage'
