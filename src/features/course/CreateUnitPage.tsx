import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { ArabicInput } from '../../components/forms/ArabicInput'
import { useLang } from '../../app/providers/LangProvider'

export function CreateUnitPage() {
  const { t, ta, fa, dir } = useLang()
  const { subjectId } = useParams<{ subjectId: string }>()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !subjectId) return
    setSaving(true)
    const { data } = await supabase
      .from('units')
      .insert({ subject_id: subjectId, title_ar: title.trim(), description_ar: description.trim() || null })
      .select('id')
      .single()
    setSaving(false)
    if (data) navigate(`/course/${subjectId}`, { replace: true })
  }

  return (
    <PageWrapper>
      <AppBar title={t('new_unit')} onBack={() => navigate(-1)} />
      <form onSubmit={handleSubmit} className="p-4 space-y-5">
        <ArabicInput
          label={t('unit_title')}
          placeholder={t('unit_title_ph')}
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <div>
          <label className={`block text-sm font-medium text-gray-700 ${fa} ${ta} mb-1`}>{t('unit_desc')}</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            dir={dir}
            className={`w-full px-4 py-3 rounded-xl border border-gray-200 ${ta} ${fa} text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-none`}
            placeholder={t('unit_desc_ph')}
          />
        </div>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className={`w-full py-4 rounded-xl bg-teal text-white font-bold ${fa} text-base disabled:opacity-50`}
        >
          {saving ? t('saving') : t('create_unit')}
        </button>
      </form>
    </PageWrapper>
  )
}

CreateUnitPage.displayName = 'CreateUnitPage'
