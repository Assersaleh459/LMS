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

// Human-readable Arabic labels for each DB field
const FIELD_LABELS: Record<string, string> = {
  name_ar:              'الاسم (عربي)',
  name_en:              'الاسم (إنجليزي)',
  phone:                'رقم الهاتف',
  address_ar:           'العنوان',
  logo_url:             'رابط الشعار',
  whatsapp_webhook_url: 'رابط واتساب',
  governorate:          'المحافظة',
  school_type:          'نوع المدرسة',
}

// Fields whose values we mask in the log (sensitive URLs)
const MASKED_FIELDS = new Set(['whatsapp_webhook_url', 'logo_url'])

interface AuditChange { field: string; old_value: string | null; new_value: string | null }
interface AuditEntry {
  id:         string
  changed_by: string
  changed_at: string
  changes:    AuditChange[]
  admin_name?: string
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-bold text-gray-600">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

function maskValue(field: string, value: string | null): string {
  if (!value) return '—'
  if (MASKED_FIELDS.has(field)) return value.length > 0 ? '••••' + value.slice(-8) : '—'
  return value
}

export function SchoolSettingsPage() {
  const auth      = useContext(AuthContext)
  const { t, fa } = useLang()
  const navigate  = useNavigate()
  const { school, setSchool } = useSchool()

  const [nameAr,     setNameAr]     = useState('')
  const [nameEn,     setNameEn]     = useState('')
  const [phone,      setPhone]      = useState('')
  const [address,    setAddress]    = useState('')
  const [logoUrl,    setLogoUrl]    = useState('')
  const [webhook,    setWebhook]    = useState('')
  const [govr,       setGovr]       = useState('')
  const [schoolType, setSchoolType] = useState('')

  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  const [auditLog,        setAuditLog]        = useState<AuditEntry[]>([])
  const [auditLoading,    setAuditLoading]    = useState(true)

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

  // Load audit log
  useEffect(() => {
    if (!auth?.schoolId) return
    async function loadAudit() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rows } = await (supabase as any)
        .from('school_settings_audit')
        .select('*')
        .eq('school_id', auth!.schoolId)
        .order('changed_at', { ascending: false })
        .limit(50)

      const raw = (rows ?? []) as AuditEntry[]
      if (!raw.length) { setAuditLog([]); setAuditLoading(false); return }

      const adminIds = [...new Set(raw.map(r => r.changed_by))]
      const { data: admins } = await supabase
        .from('users')
        .select('id, first_name_ar, last_name_ar')
        .in('id', adminIds)

      const adminMap: Record<string, string> = {}
      ;(admins ?? []).forEach(u => { adminMap[u.id] = `${u.first_name_ar} ${u.last_name_ar}` })

      setAuditLog(raw.map(r => ({ ...r, admin_name: adminMap[r.changed_by] ?? r.changed_by })))
      setAuditLoading(false)
    }
    loadAudit()
  }, [auth?.schoolId])

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

    // Diff against current school values
    const oldValues: Record<string, string | null> = {
      name_ar:              school?.name_ar ?? null,
      name_en:              school?.name_en ?? null,
      phone:                school?.phone ?? null,
      address_ar:           school?.address_ar ?? null,
      logo_url:             school?.logo_url ?? null,
      whatsapp_webhook_url: school?.whatsapp_webhook_url ?? null,
      governorate:          school?.governorate ?? null,
      school_type:          school?.school_type ?? null,
    }

    const changes: AuditChange[] = Object.entries(updates)
      .filter(([key, newVal]) => String(newVal ?? '') !== String(oldValues[key] ?? ''))
      .map(([field, newVal]) => ({
        field,
        old_value: oldValues[field] ?? null,
        new_value: (newVal as string | null) ?? null,
      }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: dbErr } = await (supabase as any)
      .from('schools')
      .update(updates)
      .eq('id', auth.schoolId)

    if (dbErr) { setError(dbErr.message); setSaving(false); return }

    // Write audit entry if anything changed
    if (changes.length > 0) {
      const adminId = auth.session?.user?.id
      if (adminId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newEntry } = await (supabase as any)
          .from('school_settings_audit')
          .insert({ school_id: auth.schoolId, changed_by: adminId, changes })
          .select()
          .single()

        if (newEntry) {
          setAuditLog(prev => [{
            ...newEntry,
            admin_name: `${auth.profile?.first_name_ar ?? ''} ${auth.profile?.last_name_ar ?? ''}`.trim() || adminId,
          }, ...prev])
        }
      }
    }

    if (school) setSchool({ ...school, ...updates })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString('ar-EG', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
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
              <input value={nameAr} onChange={e => setNameAr(e.target.value)} dir="rtl"
                className={`w-full px-4 py-3 rounded-xl border border-gray-200 ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30`} />
            </Field>

            <Field label={t('settings_name_en')}>
              <input value={nameEn} onChange={e => setNameEn(e.target.value)} dir="ltr"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </Field>

            <Field label={t('settings_moe_code')} hint={t('settings_moe_hint')}>
              <input value={school.moe_code ?? '—'} readOnly dir="ltr"
                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-400 cursor-not-allowed" />
            </Field>
          </section>

          {/* Profile */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
            <p className={`text-xs font-bold text-gray-400 uppercase tracking-wide ${fa}`}>{t('settings_profile')}</p>

            <Field label={t('settings_school_type')}>
              <select value={schoolType} onChange={e => setSchoolType(e.target.value)} dir="rtl"
                className={`w-full px-4 py-3 rounded-xl border border-gray-200 ${fa} text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal/30`}>
                {SCHOOL_TYPES.map(st => <option key={st} value={st}>{t(`school_type_${st}`)}</option>)}
              </select>
            </Field>

            <Field label={t('settings_governorate')}>
              <select value={govr} onChange={e => setGovr(e.target.value)} dir="rtl"
                className={`w-full px-4 py-3 rounded-xl border border-gray-200 ${fa} text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal/30`}>
                {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
          </section>

          {/* Contact */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
            <p className={`text-xs font-bold text-gray-400 uppercase tracking-wide ${fa}`}>{t('settings_contact')}</p>

            <Field label={t('settings_phone')}>
              <input value={phone} onChange={e => setPhone(e.target.value)} dir="ltr" type="tel" placeholder="+20..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </Field>

            <Field label={t('settings_address')}>
              <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} dir="rtl"
                className={`w-full px-4 py-3 rounded-xl border border-gray-200 ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none`} />
            </Field>

            <Field label={t('settings_logo_url')} hint={t('settings_logo_hint')}>
              <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} dir="ltr" placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </Field>
          </section>

          {/* WhatsApp */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
            <p className={`text-xs font-bold text-gray-400 uppercase tracking-wide ${fa}`}>{t('settings_whatsapp')}</p>

            <Field label={t('settings_webhook_url')} hint={t('settings_webhook_hint')}>
              <input value={webhook} onChange={e => setWebhook(e.target.value)} dir="ltr" placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </Field>
          </section>

          {error && (
            <p className={`text-sm text-red-500 ${fa} bg-red-50 px-4 py-3 rounded-xl`}>{error}</p>
          )}

          {/* ── Audit log ──────────────────────────────────────────── */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className={`text-xs font-bold text-gray-400 uppercase tracking-wide ${fa}`}>{t('settings_audit_log')}</p>
            </div>

            {auditLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 rounded-full border-2 border-teal border-t-transparent animate-spin" />
              </div>
            ) : auditLog.length === 0 ? (
              <p className={`text-center text-gray-400 ${fa} py-8 text-xs`}>{t('no_data')}</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {auditLog.map(entry => (
                  <div key={entry.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className={`text-xs font-bold text-gray-700 ${fa}`}>{entry.admin_name}</p>
                      <p className={`text-xs text-gray-400 ${fa} flex-shrink-0`}>{formatTime(entry.changed_at)}</p>
                    </div>
                    <div className="space-y-1">
                      {entry.changes.map((ch, i) => (
                        <div key={i} className="flex items-baseline gap-1.5 flex-wrap">
                          <span className={`text-xs font-bold text-navy ${fa}`}>
                            {FIELD_LABELS[ch.field] ?? ch.field}:
                          </span>
                          {ch.old_value !== null && (
                            <>
                              <span className="text-xs text-gray-400 line-through">
                                {maskValue(ch.field, ch.old_value)}
                              </span>
                              <span className="text-xs text-gray-300">→</span>
                            </>
                          )}
                          <span className="text-xs font-bold text-teal">
                            {maskValue(ch.field, ch.new_value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Sticky save button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-white border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-4 rounded-xl font-bold ${fa} text-base transition-colors ${
            saved ? 'bg-green-500 text-white' : 'bg-teal text-white disabled:opacity-50'
          }`}
        >
          {saved ? `✓ ${t('settings_saved')}` : saving ? t('saving') : t('save_changes')}
        </button>
      </div>
    </PageWrapper>
  )
}

SchoolSettingsPage.displayName = 'SchoolSettingsPage'
