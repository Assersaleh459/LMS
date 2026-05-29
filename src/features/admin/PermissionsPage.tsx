import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang } from '../../app/providers/LangProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'

type PermMap      = Record<string, Record<string, boolean>>
type CustomRole   = { id: string; name_ar: string; name_en: string | null; base_role: string }

const BASE_ROLES = [
  { key: 'subject_teacher',        labelKey: 'role_sub_teacher' },
  { key: 'homeroom_teacher',       labelKey: 'role_homeroom' },
  { key: 'kg_primary_student',     labelKey: 'role_kg_primary' },
  { key: 'prep_secondary_student', labelKey: 'role_prep_sec' },
  { key: 'parent',                 labelKey: 'role_parent' },
  { key: 'it_admin',               labelKey: 'role_it_admin' },
  { key: 'chain_admin',            labelKey: 'role_chain_admin' },
  { key: 'moe_supervisor',         labelKey: 'role_moe_sup' },
]

const FEATURES = [
  { key: 'attendance',      icon: '✅', labelKey: 'feat_attendance' },
  { key: 'grades',          icon: '📊', labelKey: 'feat_grades' },
  { key: 'assignments',     icon: '📋', labelKey: 'feat_assignments' },
  { key: 'courses',         icon: '📚', labelKey: 'feat_courses' },
  { key: 'conduct',         icon: '📓', labelKey: 'feat_conduct' },
  { key: 'timetable',       icon: '📅', labelKey: 'feat_timetable' },
  { key: 'announcements',   icon: '📢', labelKey: 'feat_announcements' },
  { key: 'messages',        icon: '💬', labelKey: 'feat_messages' },
  { key: 'notifications',   icon: '🔔', labelKey: 'feat_notifications' },
  { key: 'analytics',       icon: '📈', labelKey: 'feat_analytics' },
  { key: 'user_management', icon: '👥', labelKey: 'feat_user_mgmt' },
  { key: 'settings',        icon: '⚙️', labelKey: 'feat_settings' },
  { key: 'audit_log',       icon: '🔍', labelKey: 'feat_audit_log' },
]

export function PermissionsPage() {
  const auth = useContext(AuthContext)
  const { t, fa, dir } = useLang()
  const navigate = useNavigate()

  const [perms,        setPerms]        = useState<PermMap>({})
  const [customRoles,  setCustomRoles]  = useState<CustomRole[]>([])
  const [customPerms,  setCustomPerms]  = useState<PermMap>({})
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState<string | null>(null)
  const [saved,        setSaved]        = useState<string | null>(null)
  const [showModal,    setShowModal]    = useState(false)
  const [newNameAr,    setNewNameAr]    = useState('')
  const [newNameEn,    setNewNameEn]    = useState('')
  const [newBaseRole,  setNewBaseRole]  = useState('subject_teacher')
  const [creating,     setCreating]     = useState(false)

  useEffect(() => {
    if (!auth?.schoolId) return
    Promise.all([
      (supabase as any).from('role_permissions').select('role, feature, can_access').eq('school_id', auth.schoolId),
      (supabase as any).from('custom_roles').select('*').eq('school_id', auth.schoolId).eq('is_active', true),
      (supabase as any).from('custom_role_permissions').select('custom_role_id, feature, can_access'),
    ]).then(([baseRes, customRes, cpRes]: any[]) => {
      const map: PermMap = {}
      ;(baseRes.data ?? []).forEach((r: any) => {
        if (!map[r.role]) map[r.role] = {}
        map[r.role][r.feature] = r.can_access
      })
      setPerms(map)
      setCustomRoles(customRes.data ?? [])
      const cmap: PermMap = {}
      ;(cpRes.data ?? []).forEach((r: any) => {
        if (!cmap[r.custom_role_id]) cmap[r.custom_role_id] = {}
        cmap[r.custom_role_id][r.feature] = r.can_access
      })
      setCustomPerms(cmap)
      setLoading(false)
    })
  }, [auth?.schoolId])

  async function toggle(roleKey: string, feature: string, isCustom = false) {
    if (!auth?.schoolId) return
    const current = isCustom
      ? (customPerms[roleKey]?.[feature] ?? false)
      : (perms[roleKey]?.[feature] ?? false)
    const next = !current
    const key  = `${roleKey}:${feature}`
    setSaving(key)

    if (isCustom) {
      setCustomPerms(prev => ({ ...prev, [roleKey]: { ...prev[roleKey], [feature]: next } }))
      await (supabase as any).from('custom_role_permissions').upsert(
        { custom_role_id: roleKey, feature, can_access: next },
        { onConflict: 'custom_role_id,feature' }
      )
    } else {
      setPerms(prev => ({ ...prev, [roleKey]: { ...prev[roleKey], [feature]: next } }))
      await (supabase as any).from('role_permissions').upsert(
        { school_id: auth.schoolId, role: roleKey, feature, can_access: next, updated_at: new Date().toISOString() },
        { onConflict: 'school_id,role,feature' }
      )
    }

    await (supabase as any).from('system_audit_log').insert({
      school_id: auth.schoolId, actor_id: auth.profile?.id,
      actor_name: auth.profile ? `${auth.profile.first_name_ar} ${auth.profile.last_name_ar}` : null,
      actor_role: auth.role, action: 'UPDATE', entity_type: 'permission',
      entity_desc: `${roleKey} → ${feature}`, details: { from: current, to: next },
    })

    setSaving(null); setSaved(key)
    setTimeout(() => setSaved(null), 1500)
  }

  async function createCustomRole() {
    if (!newNameAr.trim() || !auth?.schoolId) return
    setCreating(true)
    const { data: cr } = await (supabase as any)
      .from('custom_roles')
      .insert({ school_id: auth.schoolId, name_ar: newNameAr.trim(), name_en: newNameEn.trim() || null, base_role: newBaseRole })
      .select('*').single()

    if (cr) {
      // Copy base role permissions
      const basePermsForRole = FEATURES.map(f => ({
        custom_role_id: cr.id,
        feature:        f.key,
        can_access:     perms[newBaseRole]?.[f.key] ?? false,
      }))
      await (supabase as any).from('custom_role_permissions').insert(basePermsForRole)
      const cpMap: Record<string, boolean> = {}
      basePermsForRole.forEach(r => { cpMap[r.feature] = r.can_access })
      setCustomRoles(prev => [...prev, cr])
      setCustomPerms(prev => ({ ...prev, [cr.id]: cpMap }))
    }
    setCreating(false); setShowModal(false)
    setNewNameAr(''); setNewNameEn(''); setNewBaseRole('subject_teacher')
  }

  async function deleteCustomRole(id: string) {
    await (supabase as any).from('custom_roles').update({ is_active: false }).eq('id', id)
    setCustomRoles(prev => prev.filter(r => r.id !== id))
  }

  function RoleBlock({ roleKey, label, isCustom = false, onDelete }: {
    roleKey: string; label: string; isCustom?: boolean; onDelete?: () => void
  }) {
    return (
      <div className="mb-5 mx-4">
        <div className={`${isCustom ? 'bg-teal' : 'bg-navy'} rounded-t-2xl px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            {isCustom && <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">{t('custom_roles_title')}</span>}
            {onDelete && (
              <button onClick={onDelete} className="text-white/60 hover:text-red-300 transition-colors text-xs">
                {t('custom_role_del')}
              </button>
            )}
          </div>
          <p className={`font-bold text-white text-sm ${fa}`}>{label}</p>
        </div>
        <div className="bg-white rounded-b-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {FEATURES.map(feat => {
            const isOn = isCustom
              ? (customPerms[roleKey]?.[feat.key] ?? false)
              : (perms[roleKey]?.[feat.key] ?? false)
            const key = `${roleKey}:${feat.key}`
            return (
              <div key={feat.key} className="flex items-center justify-between px-4 py-3">
                <button
                  onClick={() => toggle(roleKey, feat.key, isCustom)}
                  disabled={saving === key}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${isOn ? 'bg-teal' : 'bg-gray-200'} disabled:opacity-60`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isOn ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
                <div className="flex items-center gap-2">
                  {saved === key && <span className="text-xs text-teal">✓</span>}
                  <p className={`text-sm ${isOn ? 'text-gray-800 font-bold' : 'text-gray-400'} ${fa}`}>
                    {feat.icon} {t(feat.labelKey)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <PageWrapper>
      <AppBar title={t('permissions_title')} subtitle={t('permissions_sub')} onBack={() => navigate('/admin')} />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="pb-24 pt-4">

          {/* Base roles */}
          <p className={`text-xs font-bold text-gray-500 uppercase tracking-wide px-4 mb-3 ${fa}`}>
            {t('base_roles_title')}
          </p>
          {BASE_ROLES.map(r => (
            <RoleBlock key={r.key} roleKey={r.key} label={t(r.labelKey)} />
          ))}

          {/* Custom roles */}
          <div className="flex items-center justify-between px-4 mb-3 mt-4">
            <button
              onClick={() => setShowModal(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-teal text-white font-bold text-sm ${fa}`}
            >
              {t('custom_role_add')}
            </button>
            <p className={`text-xs font-bold text-gray-500 uppercase tracking-wide ${fa}`}>
              {t('custom_roles_title')}
            </p>
          </div>
          {customRoles.length === 0 && (
            <p className={`text-center text-gray-400 text-sm ${fa} py-4`}>{t('no_data')}</p>
          )}
          {customRoles.map(cr => (
            <RoleBlock
              key={cr.id}
              roleKey={cr.id}
              label={cr.name_ar}
              isCustom
              onDelete={() => deleteCustomRole(cr.id)}
            />
          ))}
        </div>
      )}

      {/* New role modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setShowModal(false)} className="text-gray-400 text-2xl leading-none">×</button>
              <p className={`font-bold text-gray-800 ${fa}`}>{t('custom_role_add')}</p>
            </div>

            <div>
              <label className={`block text-sm font-bold text-gray-700 ${fa} mb-1 text-right`}>{t('custom_role_title')}</label>
              <input
                value={newNameAr}
                onChange={e => setNewNameAr(e.target.value)}
                dir="rtl"
                placeholder="مثال: معلم الصف السادس"
                className={`w-full px-3 py-3 rounded-xl border border-gray-200 ${fa} focus:outline-none focus:ring-2 focus:ring-teal/30`}
              />
            </div>

            <div>
              <label className={`block text-sm font-bold text-gray-700 ${fa} mb-1 text-right`}>{t('custom_role_en')}</label>
              <input
                value={newNameEn}
                onChange={e => setNewNameEn(e.target.value)}
                dir="ltr"
                placeholder="e.g. Grade 6 Teacher"
                className="w-full px-3 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </div>

            <div>
              <label className={`block text-sm font-bold text-gray-700 ${fa} mb-1 text-right`}>{t('custom_role_base')}</label>
              <select
                value={newBaseRole}
                onChange={e => setNewBaseRole(e.target.value)}
                dir={dir}
                className={`w-full px-3 py-3 rounded-xl border border-gray-200 ${fa} focus:outline-none focus:ring-2 focus:ring-teal/30 bg-white`}
              >
                {BASE_ROLES.map(r => (
                  <option key={r.key} value={r.key}>{t(r.labelKey)}</option>
                ))}
              </select>
            </div>

            <p className={`text-xs text-gray-400 ${fa} text-right`}>
              {t('custom_role_base')}: {t(BASE_ROLES.find(r => r.key === newBaseRole)?.labelKey ?? '')} — سيرث صلاحياته ابتداءً
            </p>

            <div className="flex gap-3 pb-2">
              <button
                onClick={() => setShowModal(false)}
                className={`flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 ${fa} font-bold`}
              >
                {t('cancel')}
              </button>
              <button
                onClick={createCustomRole}
                disabled={creating || !newNameAr.trim()}
                className={`flex-1 py-3 rounded-xl bg-teal text-white font-bold ${fa} disabled:opacity-50`}
              >
                {creating ? t('saving') : t('custom_role_create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

PermissionsPage.displayName = 'PermissionsPage'
