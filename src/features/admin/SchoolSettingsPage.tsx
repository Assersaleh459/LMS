import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang } from '../../app/providers/LangProvider'
import { useSchool } from '../../app/providers/SchoolProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'

const SCHOOL_TYPES = ['primary', 'prep', 'secondary', 'combined', 'kg'] as const
const GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'الدقهلية', 'البحيرة',
  'المنوفية', 'الغربية', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط',
  'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد',
  'مطروح', 'شمال سيناء', 'جنوب سيناء', 'بورسعيد', 'الإسماعيلية', 'السويس',
  'دمياط', 'كفر الشيخ', 'القليوبية',
]

function Field({
  label, children, hint,
}: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-bold text-gray-600">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

export function SchoolSettingsPage() {
  const auth     = useContext(AuthContext)
  const { t, fa } = useLang()
  const navigate  = useNavigate()
  const { school, setSchool } = useSchool()

  const [nameAr,    setNameAr]    = useState('')
  const [nameEn,    setNameEn]    = useState('')
  const [phone,     setPhone]     = useState('')
  const [address,   setAddress]   = useState('')
  const [logoUrl,   setLogoUrl]   = useState('')
  const [webhook,   setWebhook]   = useState('')
  const [govr,      setGovr]      = useState('')
  const [schoolType,setSchoolType]= useState('')

  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState('')

  // Populate form from loaded school
  useEffect(() => {
    if (!school) return
    setNameAr(school.name_ar ?? '')
    setNameEn(school.name_en ?? '')
    setPhone(school.phone ?? '')
    setAddress(school.address_ar ?? '')
    setLogoUrl(school.logo_url ?? '')
    setWebhook(school.whatsapp_webhook_url ?? '')
    setGovr(school.governorate ?? '')
    setSchoolType(school.school_type ?? '')
  }, [school])

  async function handleSave() {
    if (!auth?.schoolId || !nameAr.trim()) { setError(t('settings_name_required')); return }
    setSaving(true)
    setError('')

    const updates = {
      name_ar:              nameAr.trim(),
      name_en:              nameEn.trim() || null,
      phone:                phone.trim() || null,
      address_ar:           address.trim() || null,
      logo_url:             logoUrl.trim() || null,
      whatsapp_webhook_url: webhook.trim() || null,
      governorate:          govr,
      school_type:          schoolType,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: dbErr } = await (supabase as any)
      .from('schools')
      .update(updates)
      .eq('id', auth.schoolId)

    setSaving(false)

    if (dbErr) { setError(dbErr.message); return }

    // Update provider cache
    if (school) setSchool({ ...school, ...updates })

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!school) {
    return (
      <PageWrapper>
        <AppBar title={t('school_settings')} onBack={() => navigate(-1)} />
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <AppBar title={t('school_settings')} subtitle={school.name_ar} onBack={() => navigate(-1)} />

      <div className="overflow-y-auto pb-32">
        {/* Logo preview */}
        {logoUrl && (
          <div className="flex justify-center pt-6">
            <img
              src={logoUrl}
              alt="school logo"
              className="w-20 h-20 rounded-2xl object-contain border border-gray-100 shadow-sm"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        )}

        <div className="px-4 pt-6 space-y-5">

          {/* Identity */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
            <p className={`text-xs font-bold text-gray-400 uppercase tracking-wide ${fa}`}>{t('settings_identity')}</p>

            <Field label={t('settings_name_ar')}>
              <input
                value={nameAr}
                onChange={e => setNameAr(e.target.value)}
                dir="rtl"
                className={`w-full px-4 py-3 rounded-xl border border-gray-200 ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30`}
              />
            </Field>

            <Field label={t('settings_name_en')}>
              <input
                value={nameEn}
                onChange={e => setNameEn(e.target.value)}
                dir="ltr"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </Field>

            <Field label={t('settings_moe_code')} hint={t('settings_moe_hint')}>
              <input
                value={school.moe_code ?? '—'}
                readOnly
                dir="ltr"
                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-400 cursor-not-allowed"
              />
            </Field>
          </section>

          {/* School type + governorate */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
            <p className={`text-xs font-bold text-gray-400 uppercase tracking-wide ${fa}`}>{t('settings_profile')}</p>

            <Field label={t('settings_school_type')}>
              <select
                value={schoolType}
                onChange={e => setSchoolType(e.target.value)}
                dir="rtl"
                className={`w-full px-4 py-3 rounded-xl border border-gray-200 ${fa} text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal/30`}
              >
                {SCHOOL_TYPES.map(st => (
                  <option key={st} value={st}>{t(`school_type_${st}`)}</option>
                ))}
              </select>
            </Field>

            <Field label={t('settings_governorate')}>
              <select
                value={govr}
                onChange={e => setGovr(e.target.value)}
                dir="rtl"
                className={`w-full px-4 py-3 rounded-xl border border-gray-200 ${fa} text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal/30`}
              >
                {GOVERNORATES.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </Field>
          </section>

          {/* Contact */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
            <p className={`text-xs font-bold text-gray-400 uppercase tracking-wide ${fa}`}>{t('settings_contact')}</p>

            <Field label={t('settings_phone')}>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                dir="ltr"
                type="tel"
                placeholder="+20..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </Field>

            <Field label={t('settings_address')}>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={2}
                dir="rtl"
                className={`w-full px-4 py-3 rounded-xl border border-gray-200 ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none`}
              />
            </Field>

            <Field label={t('settings_logo_url')} hint={t('settings_logo_hint')}>
              <input
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                dir="ltr"
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </Field>
          </section>

          {/* WhatsApp integration */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
            <p className={`text-xs font-bold text-gray-400 uppercase tracking-wide ${fa}`}>{t('settings_whatsapp')}</p>

            <Field label={t('settings_webhook_url')} hint={t('settings_webhook_hint')}>
              <input
                value={webhook}
                onChange={e => setWebhook(e.target.value)}
                dir="ltr"
                placeholder="https://api.whatsapp.com/..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </Field>
          </section>

          {error && (
            <p className={`text-sm text-red-500 ${fa} bg-red-50 px-4 py-3 rounded-xl`}>{error}</p>
          )}
        </div>
      </div>

      {/* Sticky save button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-white border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-4 rounded-xl font-bold ${fa} text-base transition-colors ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-teal text-white disabled:opacity-50'
          }`}
        >
          {saved ? `✓ ${t('settings_saved')}` : saving ? t('saving') : t('save_changes')}
        </button>
      </div>
    </PageWrapper>
  )
}

SchoolSettingsPage.displayName = 'SchoolSettingsPage'
