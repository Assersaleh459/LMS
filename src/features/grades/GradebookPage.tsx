import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang }     from '../../app/providers/LangProvider'
import { supabase } from '../../lib/supabase'
import { AppBar }      from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { OfflineBanner } from '../../components/ui/OfflineBanner'
import { GradeTypeTabs } from './GradeTypeTabs'
import { GradeRow }      from './GradeRow'
import { useGrades }     from './useGrades'
import { useTeacherSubjects } from '../../hooks/useTeacherSubjects'
import type { StudentCard } from '../../types/domain'
import type { GradeType } from '../../types/enums'
import { GRADE_TYPE_LABELS } from '../../lib/arabic'

function parsePastedGrades(text: string, students: StudentCard[]): { studentId: string; grade: string }[] {
  return text.trim().split('\n')
    .map(line => line.split('\t'))
    .filter(parts => parts.length >= 2)
    .flatMap(parts => {
      const name  = parts[0].trim()
      const grade = parts[1].trim()
      if (!name || isNaN(Number(grade))) return []
      const student = students.find(s =>
        s.full_name_ar === name ||
        s.full_name_ar.includes(name) ||
        name.includes(s.full_name_ar)
      )
      return student ? [{ studentId: student.id, grade }] : []
    })
}

export function GradebookPage() {
  const auth = useContext(AuthContext)
  const { t, fa } = useLang()
  const navigate = useNavigate()

  const { subjects, active, setActive, loading: loadingSubjects } = useTeacherSubjects()

  const [activeTab,       setActiveTab]       = useState<GradeType>('written')
  const [students,        setStudents]        = useState<StudentCard[]>([])
  const [termId,          setTermId]          = useState('')
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [importOpen,      setImportOpen]      = useState(false)
  const [pasteText,       setPasteText]       = useState('')

  const { grades, setGrade, saveAll, saving, loading: loadingGrades } =
    useGrades(students, active?.subjectId ?? '', termId)

  // Fetch active term once
  useEffect(() => {
    if (!auth?.schoolId) return
    supabase.from('academic_terms')
      .select('id').eq('school_id', auth.schoolId).eq('is_active', true).single()
      .then(({ data }) => { if (data) setTermId(data.id) })
  }, [auth?.schoolId])

  // Reload students whenever active class changes
  useEffect(() => {
    if (!active || !auth?.schoolId) return
    setLoadingStudents(true)
    supabase.from('v_student_card').select('*')
      .eq('school_id', auth.schoolId)
      .eq('grade_year', active.gradeYear)
      .eq('section', active.section)
      .order('full_name_ar')
      .then(({ data }) => {
        setStudents((data ?? []) as StudentCard[])
        setLoadingStudents(false)
      })
  }, [active, auth?.schoolId])

  const isLoading = loadingSubjects || loadingStudents || loadingGrades
  const subjectName = active?.subjectName ?? ''

  function exportGrades() {
    const ws = XLSX.utils.json_to_sheet(students.map(s => ({
      [t('col_student_name')]: s.full_name_ar,
      [t('col_student_code')]: s.student_code,
      [t('written')]:          grades[`${s.id}:written`]   || '',
      [t('oral')]:             grades[`${s.id}:oral`]       || '',
      [t('practical')]:        grades[`${s.id}:practical`]  || '',
      [t('activity')]:         grades[`${s.id}:activity`]   || '',
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, subjectName.slice(0, 31) || 'Grades')
    XLSX.writeFile(wb, `grades_${subjectName}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  function applyPaste() {
    const parsed = parsePastedGrades(pasteText, students)
    parsed.forEach(({ studentId, grade }) => setGrade(studentId, activeTab, grade))
    setImportOpen(false)
    setPasteText('')
  }

  const parsedPreview = pasteText.trim() ? parsePastedGrades(pasteText, students) : []

  return (
    <PageWrapper>
      <AppBar
        title={t('grade_entry')}
        subtitle={active ? `${subjectName} · ${t('grade_label')} ${active.gradeYear} ${active.section}` : t('loading')}
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

      <OfflineBanner />

      {/* Toolbar */}
      <div className="flex gap-2 px-4 py-2 bg-white border-b border-gray-100">
        <button
          onClick={() => navigate('/teacher/grades/analytics')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg bg-navy/10 text-navy text-xs font-bold ${fa}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {t('view_analytics')}
        </button>
        <button
          onClick={exportGrades}
          disabled={isLoading || students.length === 0}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal/10 text-teal text-xs font-bold ${fa} disabled:opacity-40`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {t('export_excel')}
        </button>
        <button
          onClick={() => setImportOpen(true)}
          disabled={isLoading || students.length === 0}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold ${fa} disabled:opacity-40`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
          </svg>
          {t('bulk_import')}
        </button>
      </div>

      <GradeTypeTabs active={activeTab} onChange={setActiveTab} />

      <div className="bg-white flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
          </div>
        ) : (
          students.map(student => (
            <GradeRow
              key={student.id}
              student={student}
              gradeType={activeTab}
              value={grades[`${student.id}:${activeTab}`] ?? ''}
              onChange={val => setGrade(student.id, activeTab, val)}
            />
          ))
        )}
      </div>

      <div className="sticky bottom-0 px-4 pb-4 bg-lms-bg border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={() => saveAll([activeTab])}
          disabled={saving || isLoading}
          className={`w-full py-4 rounded-xl bg-teal text-white font-bold ${fa} text-base disabled:opacity-50`}
        >
          {saving ? t('saving') : `${t('save')} ${GRADE_TYPE_LABELS[activeTab]}`}
        </button>
      </div>

      {/* Bulk import modal */}
      {importOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className={`font-bold text-gray-800 ${fa}`}>{t('bulk_import')} — {GRADE_TYPE_LABELS[activeTab]}</p>
              <button onClick={() => { setImportOpen(false); setPasteText('') }} className="text-gray-400 text-xl leading-none">×</button>
            </div>
            <p className={`text-xs text-gray-500 ${fa}`}>{t('paste_help')}</p>
            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              rows={6}
              dir="rtl"
              placeholder={t('paste_ph')}
              className={`w-full px-3 py-2 rounded-xl border border-gray-200 ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none`}
            />
            {pasteText.trim() && (
              <p className={`text-xs ${parsedPreview.length > 0 ? 'text-teal' : 'text-red-500'} ${fa}`}>
                {parsedPreview.length > 0
                  ? `${t('matched')} ${parsedPreview.length} ${t('students')}`
                  : t('no_match')}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setImportOpen(false); setPasteText('') }}
                className={`flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 ${fa} text-sm`}
              >
                {t('cancel')}
              </button>
              <button
                onClick={applyPaste}
                disabled={parsedPreview.length === 0}
                className={`flex-1 py-3 rounded-xl bg-teal text-white font-bold ${fa} text-sm disabled:opacity-50`}
              >
                {t('apply')} ({parsedPreview.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

GradebookPage.displayName = 'GradebookPage'
