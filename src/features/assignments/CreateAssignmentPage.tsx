import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext }   from '../../app/providers/AuthProvider'
import { supabase }      from '../../lib/supabase'
import { AppBar }        from '../../components/layout/AppBar'
import { PageWrapper }   from '../../components/layout/PageWrapper'
import { ArabicInput }   from '../../components/forms/ArabicInput'
import { TypeSelector }  from '../../components/forms/TypeSelector'
import { useAssignments } from './useAssignments'
import { triggerAssignmentNotification } from '../../lib/notifications'
import { useLang } from '../../app/providers/LangProvider'
import type { AssignmentType, GradeType } from '../../types/enums'

export function CreateAssignmentPage() {
  const auth     = useContext(AuthContext)
  const navigate = useNavigate()
  const { t, fa } = useLang()

  const ASSIGNMENT_TYPES = [
    { value: 'written',        label: t('written'),      icon: '📝' },
    { value: 'oral',           label: t('oral'),         icon: '🗣️' },
    { value: 'practical',      label: t('practical'),    icon: '🔬' },
    { value: 'project',        label: t('type_project'), icon: '📁' },
    { value: 'quiz',           label: t('type_online'),  icon: '✅' },
    { value: 'notebook_photo', label: t('type_photo'),   icon: '📸' },
  ]

  const [subjectId, setSubjectId] = useState('')
  const [gradeYear, setGradeYear] = useState(6)
  const [section,   setSection]   = useState('أ')

  const [title,         setTitle]         = useState('')
  const [description,   setDescription]   = useState('')
  const [type,          setType]          = useState<AssignmentType>('written')
  const [gradeCategory] = useState<GradeType>('written')
  const [maxGrade,      setMaxGrade]      = useState('10')
  const [dueDate,       setDueDate]       = useState('')
  const [waNotify,      setWaNotify]      = useState(true)
  const [submitting,    setSubmitting]    = useState(false)
  const [errors,        setErrors]        = useState<Record<string, string>>({})

  useEffect(() => {
    if (!auth?.profile?.id) return
    supabase
      .from('teacher_subjects')
      .select('subject_id, grade_year, section')
      .eq('teacher_id', auth.profile.id)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setSubjectId(data.subject_id)
          setGradeYear(data.grade_year)
          setSection(data.section)
        }
      })
  }, [auth?.profile?.id])

  const { createAssignment } = useAssignments()

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = t('err_title_req')
    if (!dueDate)       errs.dueDate = t('err_date_req')
    const g = parseFloat(maxGrade)
    if (isNaN(g) || g <= 0) errs.maxGrade = t('err_grade_pos')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || !subjectId) return

    setSubmitting(true)
    const id = await createAssignment({
      subjectId,
      titleAr:        title.trim(),
      descriptionAr:  description.trim() || undefined,
      type,
      gradeCategory,
      maxGrade:       parseFloat(maxGrade),
      dueDate,
      gradeYear,
      section,
      whatsappNotify: waNotify,
    })

    setSubmitting(false)
    if (id) {
      if (waNotify) triggerAssignmentNotification(id)
      navigate('/teacher/assignments', { replace: true })
    }
  }

  return (
    <PageWrapper>
      <AppBar title={t('new_assignment')} onBack={() => navigate(-1)} />

      <form onSubmit={handleSubmit} className="p-4 space-y-6">

        <ArabicInput
          label={t('assign_title_lbl')}
          placeholder={t('assign_title_ph')}
          value={title}
          onChange={e => setTitle(e.target.value)}
          error={errors.title}
        />

        <div>
          <label className={`block text-sm font-medium text-gray-700 ${fa} text-right mb-3`}>
            {t('assign_type_lbl')}
          </label>
          <TypeSelector
            options={ASSIGNMENT_TYPES}
            value={type}
            onChange={v => setType(v as AssignmentType)}
            columns={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ArabicInput
            label={t('max_grade')}
            type="number"
            min="1"
            value={maxGrade}
            onChange={e => setMaxGrade(e.target.value)}
            error={errors.maxGrade}
          />
          <div>
            <label className={`block text-sm font-medium text-gray-700 ${fa} text-right mb-1`}>
              {t('due_date')}
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className={`w-full px-3 py-3 rounded-xl border text-right ${fa} focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal ${
                errors.dueDate ? 'border-red-400 bg-red-50' : 'border-gray-200'
              }`}
            />
            {errors.dueDate && <p className={`text-red-600 text-xs ${fa} mt-1`}>{errors.dueDate}</p>}
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium text-gray-700 ${fa} text-right mb-1`}>
            {t('assign_instr_lbl')}
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            dir="rtl"
            className={`w-full px-4 py-3 rounded-xl border border-gray-200 text-right ${fa} text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-none`}
            placeholder={t('assign_instr_ph')}
          />
        </div>

        {/* WhatsApp toggle */}
        <div className="flex items-center justify-between bg-[#25D366]/10 rounded-xl px-4 py-3">
          <div>
            <p className={`font-medium ${fa} text-gray-900 text-sm`}>{t('assign_wa_label')}</p>
            <p className={`text-xs text-gray-500 ${fa}`}>{t('assign_wa_sub')}</p>
          </div>
          <button
            type="button"
            onClick={() => setWaNotify(v => !v)}
            className={`w-12 h-6 rounded-full transition-colors ${waNotify ? 'bg-[#25D366]' : 'bg-gray-300'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${waNotify ? 'translate-x-1' : 'translate-x-6'}`} />
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-4 rounded-xl bg-teal text-white font-bold ${fa} text-base disabled:opacity-50`}
        >
          {submitting ? t('publishing') : `${t('publish')} ✓`}
        </button>
      </form>
    </PageWrapper>
  )
}

CreateAssignmentPage.displayName = 'CreateAssignmentPage'
