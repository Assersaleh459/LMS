import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang } from '../../app/providers/LangProvider'
import { useSchool } from '../../app/providers/SchoolProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'

interface Teacher { id: string; full_name_ar: string }
interface Subject { id: string; name_ar: string; grade_year: number; teacher_id: string | null; teacher_name?: string }

const CURRENT_YEAR = '2024-2025'

export function TeacherAssignmentPage() {
  const auth    = useContext(AuthContext)
  const { t, fa } = useLang()
  const { school } = useSchool()
  const navigate  = useNavigate()

  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState<string | null>(null)
  const [saved,    setSaved]    = useState<string | null>(null)

  useEffect(() => {
    if (!auth?.schoolId) return
    Promise.all([
      (supabase as any).from('users')
        .select('id, full_name_ar')
        .eq('school_id', auth.schoolId)
        .in('role', ['subject_teacher', 'homeroom_teacher'])
        .order('full_name_ar'),
      (supabase as any).from('subjects')
        .select('id, name_ar, grade_year, teacher_id')
        .eq('school_id', auth.schoolId)
        .order('name_ar'),
    ]).then(([tRes, sRes]) => {
      const teachList: Teacher[] = tRes.data ?? []
      setTeachers(teachList)
      const teachMap: Record<string, string> = {}
      teachList.forEach((tc: Teacher) => { teachMap[tc.id] = tc.full_name_ar })
      const subList: Subject[] = (sRes.data ?? []).map((s: any) => ({
        ...s,
        teacher_name: s.teacher_id ? teachMap[s.teacher_id] : undefined,
      }))
      setSubjects(subList)
      setLoading(false)
    })
  }, [auth?.schoolId])

  async function handleAssign(subjectId: string, teacherId: string | null) {
    if (!auth?.schoolId) return
    setSaving(subjectId)

    const sub = subjects.find(s => s.id === subjectId)
    const gradeYear = sub?.grade_year ?? 0

    // 1. Update subjects.teacher_id
    await (supabase as any).from('subjects').update({ teacher_id: teacherId || null }).eq('id', subjectId)

    // 2. Remove all existing teacher_subjects entries for this subject
    await supabase.from('teacher_subjects').delete().eq('subject_id', subjectId)

    // 3. If assigning (not clearing), insert teacher_subjects for every section in this grade
    if (teacherId && gradeYear > 0) {
      const { data: classRows } = await supabase
        .from('v_student_card')
        .select('section')
        .eq('school_id', auth.schoolId)
        .eq('grade_year', gradeYear)

      if (classRows?.length) {
        const sections = [...new Set(classRows.map(r => r.section).filter((s): s is string => !!s))]
        if (sections.length) {
          await supabase.from('teacher_subjects').upsert(
            sections.map(section => ({
              teacher_id:    teacherId,
              subject_id:    subjectId,
              grade_year:    gradeYear,
              section,
              academic_year: CURRENT_YEAR,
            })),
            { onConflict: 'teacher_id,subject_id,grade_year,section,academic_year' }
          )
        }
      }
    }

    setSubjects(prev => prev.map(s =>
      s.id === subjectId
        ? { ...s, teacher_id: teacherId, teacher_name: teachers.find(t => t.id === teacherId)?.full_name_ar }
        : s
    ))
    setSaving(null)
    setSaved(subjectId)
    setTimeout(() => setSaved(null), 1500)
  }

  return (
    <PageWrapper>
      <AppBar
        title={t('teacher_assign')}
        subtitle={school?.name_ar ?? ''}
        onBack={() => navigate(-1)}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-5xl mb-4">📚</span>
          <p className={`text-sm ${fa}`}>{t('no_subjects')}</p>
        </div>
      ) : (
        <div className="py-4 px-4 space-y-3 pb-24">
          <p className={`text-xs text-gray-400 ${fa} mb-4`}>{t('teacher_assign_sub')}</p>
          {subjects.map(sub => (
            <div key={sub.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {saved === sub.id && <span className="text-xs text-green-600 font-bold">✓</span>}
                  {saving === sub.id && <div className="w-3 h-3 rounded-full border border-teal border-t-transparent animate-spin" />}
                  <span className={`text-xs text-gray-400 ${fa}`}>{t('grade_label')} {sub.grade_year}</span>
                </div>
                <p className={`font-bold text-gray-800 text-sm ${fa}`}>{sub.name_ar}</p>
              </div>
              <select
                value={sub.teacher_id ?? ''}
                onChange={e => handleAssign(sub.id, e.target.value || null)}
                disabled={saving === sub.id}
                className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm ${fa} focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white disabled:opacity-60`}
              >
                <option value="">{t('no_teacher')}</option>
                {teachers.map(tc => (
                  <option key={tc.id} value={tc.id}>{tc.full_name_ar}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}

TeacherAssignmentPage.displayName = 'TeacherAssignmentPage'
