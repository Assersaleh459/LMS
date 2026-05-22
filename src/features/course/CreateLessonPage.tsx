import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { ArabicInput } from '../../components/forms/ArabicInput'
import { TypeSelector } from '../../components/forms/TypeSelector'

const CONTENT_TYPES = [
  { value: 'video', label: 'فيديو',  icon: '🎬' },
  { value: 'pdf',   label: 'PDF',    icon: '📄' },
  { value: 'text',  label: 'نص',    icon: '📝' },
  { value: 'link',  label: 'رابط',  icon: '🔗' },
  { value: 'quiz',  label: 'اختبار', icon: '✅' },
]

export function CreateLessonPage() {
  const { subjectId, unitId } = useParams<{ subjectId: string; unitId: string }>()
  const navigate = useNavigate()
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
      <AppBar title="درس جديد" onBack={() => navigate(-1)} />
      <form onSubmit={handleSubmit} className="p-4 space-y-5">
        <ArabicInput
          label="عنوان الدرس"
          placeholder="مثال: مقدمة في الضرب"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 font-arabic text-right mb-3">نوع المحتوى</label>
          <TypeSelector options={CONTENT_TYPES} value={type} onChange={setType} />
        </div>

        {(type === 'video' || type === 'pdf' || type === 'link') && (
          <ArabicInput
            label={type === 'video' ? 'رابط الفيديو (YouTube أو مباشر)' : type === 'pdf' ? 'رابط الملف' : 'الرابط'}
            placeholder="https://..."
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
        )}

        {type === 'text' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 font-arabic text-right mb-1">المحتوى</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={8}
              dir="rtl"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-right font-arabic text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-none"
              placeholder="اكتب محتوى الدرس..."
            />
          </div>
        )}

        {(type === 'video') && (
          <ArabicInput
            label="المدة (بالدقائق)"
            type="number"
            placeholder="45"
            value={duration}
            onChange={e => setDuration(e.target.value)}
          />
        )}

        <div className="flex items-center justify-between bg-teal/10 rounded-xl px-4 py-3">
          <p className="font-arabic text-gray-800 text-sm font-medium">نشر الآن</p>
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
          className="w-full py-4 rounded-xl bg-teal text-white font-bold font-arabic text-base disabled:opacity-50"
        >
          {saving ? 'جاري الحفظ...' : 'إضافة الدرس'}
        </button>
      </form>
    </PageWrapper>
  )
}

CreateLessonPage.displayName = 'CreateLessonPage'
