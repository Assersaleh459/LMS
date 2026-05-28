import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang } from '../../app/providers/LangProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'

interface Subject { id: string; name_ar: string }
interface Student { id: string; full_name_ar: string; student_code: string }

export function SubjectEnrollmentPage() {
  const auth = useContext(AuthContext)
  const { t, fa } = useLang()
  const navigate = useNavigate()
  const { subjectId } = useParams<{ subjectId: string }>()

  const [subject,  setSubject]  = useState<Subject | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set())
  const [loading,  setLoading]  = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    if (!subjectId || !auth?.schoolId) return
    Promise.all([
      supabase.from('subjects').select('id, name_ar').eq('id', subjectId).single(),
      (supabase as any).from('users').select('id, full_name_ar, student_code')
        .eq('school_id', auth.schoolId)
        .in('role', ['kg_primary_student', 'prep_secondary_student'])
        .order('full_name_ar'),
      (supabase as any).from('subject_enrollments').select('student_id').eq('subject_id', subjectId),
    ]).then(([subRes, stuRes, enrollRes]) => {
      if (subRes.data) setSubject(subRes.data)
      if (stuRes.data) setStudents(stuRes.data)
      if (enrollRes.data) setEnrolled(new Set(enrollRes.data.map((e: any) => e.student_id)))
      setLoading(false)
    })
  }, [subjectId, auth?.schoolId])

  async function toggle(studentId: string) {
    if (!subjectId) return
    setToggling(studentId)
    if (enrolled.has(studentId)) {
      await (supabase as any).from('subject_enrollments')
        .delete().eq('student_id', studentId).eq('subject_id', subjectId)
      setEnrolled(prev => { const s = new Set(prev); s.delete(studentId); return s })
    } else {
      await (supabase as any).from('subject_enrollments')
        .insert({ student_id: studentId, subject_id: subjectId })
      setEnrolled(prev => new Set([...prev, studentId]))
    }
    setToggling(null)
  }

  async function enrollAll() {
    if (!subjectId) return
    const unenrolled = students.filter(s => !enrolled.has(s.id))
    if (unenrolled.length === 0) return
    await (supabase as any).from('subject_enrollments').upsert(
      unenrolled.map(s => ({ student_id: s.id, subject_id: subjectId })),
      { onConflict: 'student_id,subject_id' }
    )
    setEnrolled(new Set(students.map(s => s.id)))
  }

  return (
    <PageWrapper>
      <AppBar
        title={subject?.name_ar ?? t('enrollment')}
        subtitle={t('enrollment')}
        onBack={() => navigate(-1)}
        action={
          <button
            onClick={enrollAll}
            className={`text-xs text-white/80 ${fa} underline`}
          >
            {t('enroll_all')}
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-5xl mb-4">👥</span>
          <p className={`text-sm ${fa}`}>{t('no_students')}</p>
        </div>
      ) : (
        <div className="py-2 pb-24">
          <div className="px-4 py-2">
            <p className={`text-xs text-gray-400 ${fa}`}>
              {enrolled.size} / {students.length} {t('enrolled')}
            </p>
          </div>
          {students.map(s => {
            const isEnrolled = enrolled.has(s.id)
            const isToggling = toggling === s.id
            return (
              <div key={s.id} className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50 bg-white">
                <button
                  onClick={() => toggle(s.id)}
                  disabled={isToggling}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isEnrolled ? 'bg-teal text-white' : 'border-2 border-gray-200 text-transparent'
                  } disabled:opacity-50`}
                >
                  {isToggling
                    ? <div className="w-4 h-4 rounded-full border border-white border-t-transparent animate-spin" />
                    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                  }
                </button>
                <div className="text-right">
                  <p className={`font-bold text-gray-800 text-sm ${fa}`}>{s.full_name_ar}</p>
                  <p className={`text-xs text-gray-400 ${fa}`}>{s.student_code}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PageWrapper>
  )
}

SubjectEnrollmentPage.displayName = 'SubjectEnrollmentPage'
