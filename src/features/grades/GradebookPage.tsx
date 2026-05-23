import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang }     from '../../app/providers/LangProvider'
import { supabase } from '../../lib/supabase'
import { AppBar }      from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { OfflineBanner } from '../../components/ui/OfflineBanner'
import { GradeTypeTabs } from './GradeTypeTabs'
import { GradeRow }      from './GradeRow'
import { useGrades }     from './useGrades'
import type { StudentCard } from '../../types/domain'
import type { GradeType } from '../../types/enums'
import { GRADE_TYPE_LABELS } from '../../lib/arabic'

export function GradebookPage() {
  const auth = useContext(AuthContext)
  const { t, fa } = useLang()
  const [activeTab, setActiveTab] = useState<GradeType>('written')
  const [students,  setStudents]  = useState<StudentCard[]>([])
  const [subjectId, setSubjectId] = useState('')
  const [termId,    setTermId]    = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [loadingStudents, setLoadingStudents] = useState(true)

  const { grades, setGrade, saveAll, saving, loading: loadingGrades } = useGrades(students, subjectId, termId)

  useEffect(() => {
    if (!auth?.profile?.id) return

    // Load teacher's subject + active term
    Promise.all([
      supabase
        .from('teacher_subjects')
        .select('subject_id, grade_year, section, subjects(name_ar)')
        .eq('teacher_id', auth.profile.id)
        .limit(1)
        .single(),
      supabase
        .from('academic_terms')
        .select('id')
        .eq('school_id', auth.schoolId ?? '')
        .eq('is_active', true)
        .single(),
    ]).then(([tsRes, termRes]) => {
      if (tsRes.data) {
        setSubjectId(tsRes.data.subject_id)
        const subj = tsRes.data.subjects as unknown as { name_ar: string } | null
        setSubjectName(subj?.name_ar ?? '')

        if (auth.schoolId) {
          supabase
            .from('v_student_card')
            .select('*')
            .eq('school_id', auth.schoolId)
            .eq('grade_year', tsRes.data.grade_year)
            .eq('section', tsRes.data.section)
            .order('full_name_ar')
            .then(({ data }) => {
              if (data) setStudents(data as StudentCard[])
              setLoadingStudents(false)
            })
        }
      }
      if (termRes.data) setTermId(termRes.data.id)
    })
  }, [auth?.profile?.id, auth?.schoolId])

  const isLoading = loadingStudents || loadingGrades

  return (
    <PageWrapper>
      <AppBar
        title={t('grade_entry')}
        subtitle={subjectName || t('loading')}
      />

      <OfflineBanner />
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

      {/* Save button */}
      <div className="sticky bottom-20 px-4 pb-4 bg-lms-bg border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={() => saveAll([activeTab])}
          disabled={saving || isLoading}
          className={`w-full py-4 rounded-xl bg-teal text-white font-bold ${fa} text-base disabled:opacity-50`}
        >
          {saving ? t('saving') : `${t('save')} ${GRADE_TYPE_LABELS[activeTab]}`}
        </button>
      </div>
    </PageWrapper>
  )
}

GradebookPage.displayName = 'GradebookPage'
