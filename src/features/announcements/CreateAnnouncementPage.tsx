import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { ArabicInput } from '../../components/forms/ArabicInput'

export function CreateAnnouncementPage() {
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const [title,     setTitle]     = useState('')
  const [body,      setBody]      = useState('')
  const [isPinned,  setIsPinned]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) { setError('العنوان والمحتوى مطلوبان'); return }
    if (!auth?.profile?.id || !auth?.schoolId) return
    setSaving(true)
    await supabase.from('announcements').insert({
      school_id: auth.schoolId,
      author_id: auth.profile.id,
      title_ar:  title.trim(),
      body_ar:   body.trim(),
      is_pinned: isPinned,
    })
    setSaving(false)
    navigate('/announcements', { replace: true })
  }

  return (
    <PageWrapper>
      <AppBar title="إعلان جديد" onBack={() => navigate(-1)} />
      <form onSubmit={handleSubmit} className="p-4 space-y-5">
        <ArabicInput
          label="عنوان الإعلان"
          placeholder="مثال: تغيير موعد الامتحان"
          value={title}
          onChange={e => setTitle(e.target.value)}
          error={error && !title ? error : undefined}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 font-arabic text-right mb-1">نص الإعلان</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={5}
            dir="rtl"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-right font-arabic text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-none"
            placeholder="اكتب تفاصيل الإعلان..."
            required
          />
        </div>
        <div className="flex items-center justify-between bg-gold/10 rounded-xl px-4 py-3">
          <div>
            <p className="font-arabic text-gray-800 text-sm font-medium">تثبيت الإعلان</p>
            <p className="text-xs text-gray-500 font-arabic">يظهر في الأعلى دائماً</p>
          </div>
          <button
            type="button"
            onClick={() => setIsPinned(v => !v)}
            className={`w-12 h-6 rounded-full transition-colors ${isPinned ? 'bg-gold' : 'bg-gray-300'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${isPinned ? 'translate-x-1' : 'translate-x-6'}`} />
          </button>
        </div>
        {error && <p className="text-red-600 text-xs font-arabic text-right">{error}</p>}
        <button
          type="submit"
          disabled={saving || !title.trim() || !body.trim()}
          className="w-full py-4 rounded-xl bg-teal text-white font-bold font-arabic text-base disabled:opacity-50"
        >
          {saving ? 'جاري النشر...' : 'نشر الإعلان'}
        </button>
      </form>
    </PageWrapper>
  )
}

CreateAnnouncementPage.displayName = 'CreateAnnouncementPage'
