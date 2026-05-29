import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { useLang } from '../../app/providers/LangProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'

type PermMap = Record<string, Record<string, boolean>> // role → feature → bool

const ROLES = [
  { key: 'subject_teacher',       label: 'معلم مادة' },
  { key: 'homeroom_teacher',      label: 'معلم فصل' },
  { key: 'kg_primary_student',    label: 'طالب ابتدائي/روضة' },
  { key: 'prep_secondary_student',label: 'طالب ثانوي' },
  { key: 'parent',                label: 'ولي أمر' },
  { key: 'it_admin',              label: 'مسؤول IT' },
  { key: 'chain_admin',           label: 'مدير مجموعة' },
  { key: 'moe_supervisor',        label: 'مشرف تربوي' },
]

const FEATURES = [
  { key: 'attendance',      label: 'الحضور',         icon: '✅' },
  { key: 'grades',          label: 'الدرجات',         icon: '📊' },
  { key: 'assignments',     label: 'الواجبات',        icon: '📋' },
  { key: 'courses',         label: 'الكورسات',        icon: '📚' },
  { key: 'conduct',         label: 'السلوك',          icon: '📓' },
  { key: 'timetable',       label: 'الجدول',          icon: '📅' },
  { key: 'announcements',   label: 'الإعلانات',       icon: '📢' },
  { key: 'messages',        label: 'الرسائل',         icon: '💬' },
  { key: 'notifications',   label: 'الإشعارات',       icon: '🔔' },
  { key: 'analytics',       label: 'التحليل',         icon: '📈' },
  { key: 'user_management', label: 'إدارة المستخدمين',icon: '👥' },
  { key: 'settings',        label: 'الإعدادات',       icon: '⚙️' },
  { key: 'audit_log',       label: 'سجل المراجعة',    icon: '🔍' },
]

export function PermissionsPage() {
  const auth = useContext(AuthContext)
  const { fa } = useLang()
  const navigate = useNavigate()

  const [perms,   setPerms]   = useState<PermMap>({})
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState<string | null>(null)
  const [saved,   setSaved]   = useState<string | null>(null)

  useEffect(() => {
    if (!auth?.schoolId) return
    ;(supabase as any)
      .from('role_permissions')
      .select('role, feature, can_access')
      .eq('school_id', auth.schoolId)
      .then(({ data }: { data: { role: string; feature: string; can_access: boolean }[] | null }) => {
        const map: PermMap = {}
        ;(data ?? []).forEach(r => {
          if (!map[r.role]) map[r.role] = {}
          map[r.role][r.feature] = r.can_access
        })
        setPerms(map)
        setLoading(false)
      })
  }, [auth?.schoolId])

  async function toggle(role: string, feature: string) {
    if (!auth?.schoolId) return
    const current = perms[role]?.[feature] ?? false
    const next    = !current
    const key     = `${role}:${feature}`

    setPerms(prev => ({ ...prev, [role]: { ...prev[role], [feature]: next } }))
    setSaving(key)

    await (supabase as any)
      .from('role_permissions')
      .upsert(
        { school_id: auth.schoolId, role, feature, can_access: next, updated_at: new Date().toISOString() },
        { onConflict: 'school_id,role,feature' }
      )

    // Log the change to audit log
    await (supabase as any).from('system_audit_log').insert({
      school_id:   auth.schoolId,
      actor_id:    auth.profile?.id,
      actor_name:  auth.profile ? `${auth.profile.first_name_ar} ${auth.profile.last_name_ar}` : null,
      actor_role:  auth.role,
      action:      'UPDATE',
      entity_type: 'permission',
      entity_desc: `${role} → ${feature}`,
      details:     { from: current, to: next },
    })

    setSaving(null)
    setSaved(key)
    setTimeout(() => setSaved(null), 1500)
  }

  return (
    <PageWrapper>
      <AppBar title="الصلاحيات والأدوار" subtitle="تحكم في صلاحيات كل دور" onBack={() => navigate('/admin')} />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="pb-24 overflow-x-auto">
          {ROLES.map(role => (
            <div key={role.key} className="mb-6 mx-4">
              {/* Role header */}
              <div className="bg-navy rounded-t-2xl px-4 py-3">
                <p className={`font-bold text-white text-sm ${fa}`}>{role.label}</p>
              </div>

              {/* Feature toggles */}
              <div className="bg-white rounded-b-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                {FEATURES.map(feat => {
                  const isOn  = perms[role.key]?.[feat.key] ?? false
                  const key   = `${role.key}:${feat.key}`
                  const isSaving = saving === key
                  const isSaved  = saved  === key

                  return (
                    <div key={feat.key} className="flex items-center justify-between px-4 py-3">
                      <button
                        onClick={() => toggle(role.key, feat.key)}
                        disabled={!!isSaving}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${isOn ? 'bg-teal' : 'bg-gray-200'} disabled:opacity-60`}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isOn ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                      <div className="flex items-center gap-2">
                        {isSaved && <span className="text-xs text-teal">✓</span>}
                        <p className={`text-sm ${isOn ? 'text-gray-800 font-bold' : 'text-gray-400'} ${fa}`}>
                          {feat.icon} {feat.label}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  )
}

PermissionsPage.displayName = 'PermissionsPage'
