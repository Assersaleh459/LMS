import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang } from '../../app/providers/LangProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'

interface Subject { id: string; name_ar: string }

export function TeacherProfilePage() {
  const auth = useContext(AuthContext)
  const { t, fa } = useLang()
  const navigate = useNavigate()

  const [nameAr,   setNameAr]   = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)

  useEffect(() => {
    if (!auth?.profile?.id || !auth?.schoolId) return
    const me = auth.profile.id

    Promise.all([
      (supabase as any).from('users').select('full_name_ar, email, phone').eq('id', me).single(),
      (supabase as any).from('subjects').select('id, name_ar').eq('teacher_id', me).eq('school_id', auth.schoolId),
    ]).then(([userRes, subRes]) => {
      if (userRes.data) {
        setNameAr(userRes.data.full_name_ar ?? '')
        setEmail(userRes.data.email ?? '')
        setPhone(userRes.data.phone ?? '')
      }
      if (subRes.data) setSubjects(subRes.data)
      setLoading(false)
    })
  }, [auth?.profile?.id, auth?.schoolId])

  async function save() {
    if (!auth?.profile?.id) return
    setSaving(true)
    await (supabase as any).from('users').update({
      full_name_ar: nameAr.trim(),
      phone:        phone.trim() || null,
    }).eq('id', auth.profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <PageWrapper>
      <AppBar title={t('my_profile')} onBack={() => navigate(-1)} />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="py-4 px-4 space-y-4 pb-28">
          {/* Avatar initial */}
          <div className="flex justify-center py-4">
            <div className="w-20 h-20 rounded-full bg-navy flex items-center justify-center text-white text-3xl font-bold">
              {nameAr.charAt(0) || '?'}
            </div>
          </div>

          {/* Fields */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
            <div>
              <label className={`block text-xs font-bold text-gray-500 mb-1 ${fa}`}>{t('profile_name')}</label>
              <input
                value={nameAr}
                onChange={e => setNameAr(e.target.value)}
                dir="rtl"
                className={`w-full px-4 py-3 rounded-xl border border-gray-200 text-sm ${fa} focus:outline-none focus:ring-2 focus:ring-teal/30`}
              />
            </div>
            <div>
              <label className={`block text-xs font-bold text-gray-500 mb-1 ${fa}`}>{t('profile_email')}</label>
              <input
                value={email}
                readOnly
                dir="ltr"
                className="w-full px-4 py-3 rounded-xl border border-gray-100 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className={`block text-xs font-bold text-gray-500 mb-1 ${fa}`}>{t('profile_phone')}</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                dir="ltr"
                type="tel"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </div>
          </div>

          {/* Subjects */}
          {subjects.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className={`text-xs font-bold text-gray-500 mb-3 ${fa}`}>{t('profile_subjects')}</p>
              <div className="flex flex-wrap gap-2 justify-end">
                {subjects.map(s => (
                  <span key={s.id} className={`text-sm font-bold text-teal bg-teal/10 px-3 py-1.5 rounded-full ${fa}`}>
                    {s.name_ar}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save button */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-white border-t border-gray-100">
        <button
          onClick={save}
          disabled={saving || !nameAr.trim()}
          className={`w-full py-3.5 rounded-2xl font-bold text-white text-sm ${fa} transition-colors ${
            saved ? 'bg-green-500' : 'bg-teal hover:bg-teal/90'
          } disabled:opacity-50`}
        >
          {saved ? `✓ ${t('profile_saved')}` : saving ? t('saving') : t('save')}
        </button>
      </div>
    </PageWrapper>
  )
}

TeacherProfilePage.displayName = 'TeacherProfilePage'
