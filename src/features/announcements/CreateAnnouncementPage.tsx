import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { ArabicInput } from '../../components/forms/ArabicInput'
import { useLang } from '../../app/providers/LangProvider'

export function CreateAnnouncementPage() {
  const auth = useContext(AuthContext)
  const navigate = useNavigate()
  const { t, ta, fa, dir } = useLang()
  const [title,     setTitle]     = useState('')
  const [body,      setBody]      = useState('')
  const [isPinned,  setIsPinned]  = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) { setError(t('ann_required')); return }
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
      <AppBar title={t('new_announce')} onBack={() => navigate(-1)} />
      <form onSubmit={handleSubmit} className="p-4 space-y-5">
        <ArabicInput
          label={t('announce_title')}
          placeholder={t('announce_ph')}
          value={title}
          onChange={e => setTitle(e.target.value)}
          error={error && !title ? error : undefined}
        />
        <div>
          <label className={`block text-sm font-medium text-gray-700 ${fa} ${ta} mb-1`}>{t('announce_body')}</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={5}
            dir={dir}
            className={`w-full px-4 py-3 rounded-xl border border-gray-200 ${ta} ${fa} text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-none`}
            placeholder={t('announce_body_ph')}
            required
          />
        </div>
        <div className="flex items-center justify-between bg-gold/10 rounded-xl px-4 py-3">
          <div>
            <p className={`${fa} text-gray-800 text-sm font-medium`}>{t('pin_announce')}</p>
            <p className={`text-xs text-gray-500 ${fa}`}>{t('pin_sub')}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsPinned(v => !v)}
            className={`w-12 h-6 rounded-full transition-colors ${isPinned ? 'bg-gold' : 'bg-gray-300'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${isPinned ? 'translate-x-1' : 'translate-x-6'}`} />
          </button>
        </div>
        {error && <p className={`text-red-600 text-xs ${fa} ${ta}`}>{error}</p>}
        <button
          type="submit"
          disabled={saving || !title.trim() || !body.trim()}
          className={`w-full py-4 rounded-xl bg-teal text-white font-bold ${fa} text-base disabled:opacity-50`}
        >
          {saving ? t('saving') : t('publish_ann')}
        </button>
      </form>
    </PageWrapper>
  )
}

CreateAnnouncementPage.displayName = 'CreateAnnouncementPage'
