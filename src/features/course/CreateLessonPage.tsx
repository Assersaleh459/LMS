import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { ArabicInput } from '../../components/forms/ArabicInput'
import { TypeSelector } from '../../components/forms/TypeSelector'
import { useLang } from '../../app/providers/LangProvider'

export function CreateLessonPage() {
  const { t, ta, fa, dir } = useLang()
  const { subjectId, unitId } = useParams<{ subjectId: string; unitId: string }>()
  const navigate = useNavigate()

  const CONTENT_TYPES = [
    { value: 'video', label: t('type_video'), icon: '🎬' },
    { value: 'pdf',   label: t('type_pdf'),   icon: '📄' },
    { value: 'text',  label: t('type_text'),  icon: '📝' },
    { value: 'link',  label: t('type_link'),  icon: '🔗' },
    { value: 'quiz',  label: t('type_quiz'),  icon: '✅' },
  ]

  const [title,       setTitle]       = useState('')
  const [type,        setType]        = useState('video')
  const [url,         setUrl]         = useState('')
  const [text,        setText]        = useState('')
  const [duration,    setDuration]    = useState('')
  const [isPublished, setIsPublished] = useState(true)
  const [saving,      setSaving]      = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !unitId) return
    setSaving(true)
    await supabase.from('lessons').insert({
      unit_id:      unitId,
      title_ar:     title.trim(),
      content_type: type,
      content_url:  (type === 'video' || type === 'pdf' || type === 'link') ? url.trim() || null : null,
      content_text: type === 'text' ? text.trim() || null : null,
      duration_min: duration ? parseInt(duration) : null,
      is_published: isPublished,
    })
    setSaving(false)
    navigate(`/course/${subjectId}/unit/${unitId}`, { replace: true })
  }

  return (
    <PageWrapper>
      <AppBar title={t('new_lesson')} onBack={() => navigate(-1)} />
      <form onSubmit={handleSubmit} className="p-4 space-y-5">
        <ArabicInput
          label={t('lesson_title')}
          placeholder={t('lesson_title_ph')}
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        <div>
          <label className={`block text-sm font-medium text-gray-700 ${fa} ${ta} mb-3`}>{t('content_type')}</label>
          <TypeSelector options={CONTENT_TYPES} value={type} onChange={setType} />
        </div>

        {(type === 'video' || type === 'pdf' || type === 'link') && (
          <ArabicInput
            label={type === 'video' ? t('video_url') : type === 'pdf' ? t('pdf_url') : t('ext_url')}
            placeholder={t('url_ph')}
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
        )}

        {type === 'text' && (
          <div>
            <label className={`block text-sm font-medium text-gray-700 ${fa} ${ta} mb-1`}>{t('text_content')}</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={8}
              dir={dir}
              className={`w-full px-4 py-3 rounded-xl border border-gray-200 ${ta} ${fa} text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-none`}
              placeholder={t('text_ph')}
            />
          </div>
        )}

        {(type === 'video') && (
          <ArabicInput
            label={t('duration')}
            type="number"
            placeholder="45"
            value={duration}
            onChange={e => setDuration(e.target.value)}
          />
        )}

        <div className="flex items-center justify-between bg-teal/10 rounded-xl px-4 py-3">
          <p className={`${fa} text-gray-800 text-sm font-medium`}>{t('publish_lesson')}</p>
          <button
            type="button"
            onClick={() => setIsPublished(v => !v)}
            className={`w-12 h-6 rounded-full transition-colors ${isPublished ? 'bg-teal' : 'bg-gray-300'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${isPublished ? 'translate-x-1' : 'translate-x-6'}`} />
          </button>
        </div>

        <button
          type="submit"
          disabled={saving || !title.trim()}
          className={`w-full py-4 rounded-xl bg-teal text-white font-bold ${fa} text-base disabled:opacity-50`}
        >
          {saving ? t('saving') : t('create_lesson')}
        </button>
      </form>
    </PageWrapper>
  )
}

CreateLessonPage.displayName = 'CreateLessonPage'
