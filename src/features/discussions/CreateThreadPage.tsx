import { useContext, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { ArabicInput } from '../../components/forms/ArabicInput'

export function CreateThreadPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [body,  setBody]  = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim() || !auth?.profile?.id || !subjectId) return
    setSaving(true)
    const { data } = await supabase.from('discussion_threads').insert({
      subject_id: subjectId,
      author_id:  auth.profile.id,
      title_ar:   title.trim(),
      body_ar:    body.trim(),
    }).select('id').single()
    setSaving(false)
    if (data) navigate(`/discussions/${subjectId}/thread/${data.id}`, { replace: true })
  }

  return (
    <PageWrapper>
      <AppBar title="موضوع جديد" onBack={() => navigate(-1)} />
      <form onSubmit={handleSubmit} className="p-4 space-y-5">
        <ArabicInput
          label="عنوان الموضوع"
          placeholder="اكتب سؤالك أو موضوعك..."
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 font-arabic text-right mb-1">التفاصيل</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={6}
            dir="rtl"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-right font-arabic text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-none"
            placeholder="اشرح سؤالك أو فكرتك بالتفصيل..."
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving || !title.trim() || !body.trim()}
          className="w-full py-4 rounded-xl bg-teal text-white font-bold font-arabic text-base disabled:opacity-50"
        >
          {saving ? 'جاري النشر...' : 'نشر الموضوع'}
        </button>
      </form>
    </PageWrapper>
  )
}

CreateThreadPage.displayName = 'CreateThreadPage'
