import { useContext, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { useLang } from '../../app/providers/LangProvider'
import { toArabicNumerals } from '../../lib/arabic'
import type { UserRole } from '../../types/enums'

// ── Types ─────────────────────────────────────────────────────────────────────
interface User {
  id:             string
  first_name_ar:  string
  last_name_ar:   string
  role:           UserRole
  email:          string | null
  phone:          string | null
  is_active:      boolean
  created_at:     string
  custom_role_id: string | null
}

interface StudentProfile {
  grade_year:   number
  section:      string
  student_code: string
}

interface CustomRole { id: string; name_ar: string; name_en: string | null }

// ── Constants ─────────────────────────────────────────────────────────────────
const ROLE_T_KEY: Record<UserRole, string> = {
  kg_primary_student:     'role_kg_primary',
  prep_secondary_student: 'role_prep_sec',
  subject_teacher:        'role_sub_teacher',
  homeroom_teacher:       'role_homeroom',
  parent:                 'role_parent',
  school_admin:           'role_school_admin',
  it_admin:               'role_it_admin',
  chain_admin:            'role_chain_admin',
  moe_supervisor:         'role_moe_sup',
}

const ROLE_COLOR: Record<string, string> = {
  kg_primary_student:     '#2980b9',
  prep_secondary_student: '#2980b9',
  subject_teacher:        '#27ae60',
  homeroom_teacher:       '#27ae60',
  parent:                 '#8e44ad',
  school_admin:           '#1a3c5e',
  it_admin:               '#c0392b',
  chain_admin:            '#e67e22',
  moe_supervisor:         '#7f8c8d',
}

const ROLE_ICON: Record<string, string> = {
  kg_primary_student:     '🎒',
  prep_secondary_student: '📚',
  subject_teacher:        '👩‍🏫',
  homeroom_teacher:       '🏫',
  parent:                 '👪',
  school_admin:           '👨‍💼',
  it_admin:               '💻',
  chain_admin:            '🏢',
  moe_supervisor:         '🔍',
}

type FilterTab = 'all' | 'teachers' | 'students' | 'parents' | 'admins'

const FILTER_ROLES: Record<FilterTab, UserRole[] | null> = {
  all:      null,
  teachers: ['subject_teacher', 'homeroom_teacher'],
  students: ['kg_primary_student', 'prep_secondary_student'],
  parents:  ['parent'],
  admins:   ['school_admin', 'it_admin', 'chain_admin', 'moe_supervisor'],
}

// ── Component ─────────────────────────────────────────────────────────────────
export function UserManagementPage() {
  const { t, fa, dir } = useLang()
  const auth     = useContext(AuthContext)
  const navigate = useNavigate()

  const [users,       setUsers]       = useState<User[]>([])
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [activeTab,   setActiveTab]   = useState<FilterTab>('all')

  // Edit sheet
  const [editUser,       setEditUser]       = useState<User | null>(null)
  const [stuProfile,     setStuProfile]     = useState<StudentProfile | null>(null)
  const [editRole,       setEditRole]       = useState<UserRole>('subject_teacher')
  const [editActive,     setEditActive]     = useState(true)
  const [editGrade,      setEditGrade]      = useState('')
  const [editSection,    setEditSection]    = useState('')
  const [editCustomRole, setEditCustomRole] = useState('')
  const [editPassword,   setEditPassword]   = useState('')
  const [saving,         setSaving]         = useState(false)
  const [saveMsg,        setSaveMsg]        = useState('')
  const [pwResetting,    setPwResetting]    = useState(false)

  // Create sheet
  const [creating,      setCreating]      = useState(false)
  const [newFirst,      setNewFirst]      = useState('')
  const [newLast,       setNewLast]       = useState('')
  const [newPhone,      setNewPhone]      = useState('')
  const [newEmail,      setNewEmail]      = useState('')
  const [newPassword,   setNewPassword]   = useState('')
  const [newRole,       setNewRole]       = useState<UserRole>('subject_teacher')
  const [newGrade,      setNewGrade]      = useState('')
  const [newSection,    setNewSection]    = useState('أ')
  const [newCode,       setNewCode]       = useState('')
  const [createSaving,  setCreateSaving]  = useState(false)
  const [createError,   setCreateError]   = useState('')
  const [createSuccess, setCreateSuccess] = useState(false)

  // CSV import
  const [csvOpen,      setCsvOpen]      = useState(false)
  const [csvText,      setCsvText]      = useState('')
  const [csvImporting, setCsvImporting] = useState(false)
  const [csvProgress,  setCsvProgress]  = useState(0)
  const [csvDone,      setCsvDone]      = useState(0)
  const [csvRole,      setCsvRole]      = useState<'kg_primary_student' | 'prep_secondary_student'>('kg_primary_student')

  useEffect(() => {
    if (!auth?.schoolId) return
    Promise.all([
      (supabase as any).from('users')
        .select('id, first_name_ar, last_name_ar, role, email, phone, is_active, created_at, custom_role_id')
        .eq('school_id', auth.schoolId)
        .order('role').order('first_name_ar'),
      (supabase as any).from('custom_roles')
        .select('id, name_ar, name_en')
        .eq('school_id', auth.schoolId)
        .eq('is_active', true),
    ]).then(([usersRes, crRes]: any[]) => {
      if (usersRes.data) setUsers(usersRes.data as User[])
      setCustomRoles(crRes.data ?? [])
      setLoading(false)
    })
  }, [auth?.schoolId])

  const filtered = users.filter(u => {
    const roleMatch = !FILTER_ROLES[activeTab] || FILTER_ROLES[activeTab]!.includes(u.role)
    const q = search.toLowerCase()
    const nameMatch = !q ||
      u.first_name_ar.includes(q) || u.last_name_ar.includes(q) ||
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.phone ?? '').includes(q)
    return roleMatch && nameMatch
  })

  // ── Open edit ────────────────────────────────────────────────────────────
  async function openEdit(user: User) {
    setEditUser(user); setEditRole(user.role); setEditActive(user.is_active)
    setEditCustomRole(user.custom_role_id ?? ''); setEditPassword(''); setSaveMsg('')
    setStuProfile(null); setEditGrade(''); setEditSection('')
    const isStudent = user.role === 'kg_primary_student' || user.role === 'prep_secondary_student'
    if (isStudent) {
      const { data } = await supabase.from('student_profiles')
        .select('grade_year, section, student_code').eq('user_id', user.id).single()
      if (data) { setStuProfile(data as StudentProfile); setEditGrade(String(data.grade_year)); setEditSection(data.section) }
    }
  }

  // ── Save changes ─────────────────────────────────────────────────────────
  async function handleSave() {
    if (!editUser) return
    setSaving(true); setSaveMsg('')
    const { error } = await (supabase as any).from('users').update({
      role: editRole, is_active: editActive,
      custom_role_id: editCustomRole || null,
    }).eq('id', editUser.id)
    if (error) { setSaveMsg(error.message); setSaving(false); return }
    const isStudent = editRole === 'kg_primary_student' || editRole === 'prep_secondary_student'
    if (isStudent && stuProfile && editGrade) {
      await supabase.from('student_profiles')
        .update({ grade_year: parseInt(editGrade), section: editSection || 'أ' })
        .eq('user_id', editUser.id)
    }
    setUsers(prev => prev.map(u => u.id === editUser.id
      ? { ...u, role: editRole, is_active: editActive, custom_role_id: editCustomRole || null }
      : u))
    setSaving(false); setSaveMsg('✓ ' + t('settings_saved'))
    setTimeout(() => { setEditUser(null); setSaveMsg('') }, 800)
  }

  // ── Password reset ───────────────────────────────────────────────────────
  async function handleResetPassword() {
    if (!editUser || !editPassword.trim() || editPassword.length < 8) return
    setPwResetting(true)
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-reset-password`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: editUser.id, password: editPassword }),
      })
      if (res.ok) { setEditPassword(''); setSaveMsg('✓ ' + t('password') + ' ' + t('settings_saved')) }
      else { const j = await res.json(); setSaveMsg('❌ ' + (j.error ?? 'Error')) }
    } catch { setSaveMsg('❌ Edge function not deployed') }
    setPwResetting(false)
  }

  // ── Create user ──────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!newFirst.trim() || !newLast.trim()) { setCreateError(t('err_name_req')); return }
    if (!newEmail.trim()) { setCreateError(t('err_contact_req')); return }
    setCreateSaving(true); setCreateError('')
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-create-user`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name_ar: newFirst.trim(), last_name_ar: newLast.trim(),
          role: newRole, phone: newPhone.trim() || undefined,
          email: newEmail.trim(), password: newPassword.trim() || undefined,
          grade_year: newGrade ? parseInt(newGrade) : undefined,
          section: newSection || 'أ', student_code: newCode.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setCreateError(json.error ?? 'Error'); setCreateSaving(false); return }
      setUsers(prev => [{ id: json.id, first_name_ar: newFirst.trim(), last_name_ar: newLast.trim(), role: newRole, email: newEmail.trim() || null, phone: newPhone.trim() || null, is_active: true, created_at: new Date().toISOString(), custom_role_id: null }, ...prev])
      setCreateSuccess(true)
      setTimeout(() => { setCreating(false); setCreateSuccess(false) }, 1200)
    } catch { setCreateError('Edge function not deployed') }
    setCreateSaving(false)
  }

  // ── CSV import ───────────────────────────────────────────────────────────
  interface CsvRow { first: string; last: string; grade: number; section: string; code: string }
  const parseCsv = useCallback((text: string): CsvRow[] =>
    text.trim().split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
      .map(l => { const s = l.includes('\t') ? '\t' : ','; const p = l.split(s).map(x => x.trim()); return { first: p[0]??'', last: p[1]??'', grade: parseInt(p[2]??'')||0, section: p[3]??'أ', code: p[4]??'' } })
      .filter(r => r.first && r.last && r.grade > 0),
  [])

  async function handleBulkImport() {
    const rows = parseCsv(csvText); if (!rows.length) return
    setCsvImporting(true); setCsvProgress(0); setCsvDone(0)
    const { data: { session } } = await supabase.auth.getSession()
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
    const newUsers: User[] = []
    for (let i = 0; i < rows.length; i++) {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-create-user`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ first_name_ar: rows[i].first, last_name_ar: rows[i].last, role: csvRole, grade_year: rows[i].grade, section: rows[i].section, student_code: rows[i].code || undefined }),
        })
        const json = await res.json()
        if (res.ok && json.id) { newUsers.push({ id: json.id, first_name_ar: rows[i].first, last_name_ar: rows[i].last, role: csvRole, email: null, phone: null, is_active: true, created_at: new Date().toISOString(), custom_role_id: null }); setCsvDone(d => d+1) }
      } catch {}
      setCsvProgress(Math.round(((i+1)/rows.length)*100))
    }
    setUsers(prev => [...newUsers, ...prev]); setCsvImporting(false)
    setTimeout(() => { setCsvOpen(false); setCsvText(''); setCsvProgress(0); setCsvDone(0) }, 1500)
  }

  const count = (tab: FilterTab) => {
    const roles = FILTER_ROLES[tab]; return roles ? users.filter(u => roles.includes(u.role)).length : users.length
  }

  const TABS: { key: FilterTab; tKey: string }[] = [
    { key: 'all', tKey: 'tab_all' }, { key: 'teachers', tKey: 'tab_teachers' },
    { key: 'students', tKey: 'tab_students' }, { key: 'parents', tKey: 'tab_parents' },
    { key: 'admins', tKey: 'tab_admins' },
  ]

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageWrapper>
      <AppBar title={t('user_mgmt')} subtitle={t('user_mgmt_sub')} onBack={() => navigate(-1)}
        action={
          <div className="flex gap-1.5">
            <button onClick={() => { setCsvOpen(true); setCsvText(''); setCsvProgress(0); setCsvDone(0) }}
              className={`bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg ${fa}`}>
              {t('csv_import')}
            </button>
            <button onClick={() => { setCreating(true); setNewFirst(''); setNewLast(''); setNewPhone(''); setNewEmail(''); setNewPassword(''); setNewRole('subject_teacher'); setNewGrade(''); setNewSection('أ'); setNewCode(''); setCreateError(''); setCreateSuccess(false) }}
              className={`bg-teal hover:bg-teal/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg ${fa}`}>
              + {t('add_user')}
            </button>
          </div>
        }
      />

      {/* Stats row */}
      {!loading && (
        <div className="grid grid-cols-4 bg-white border-b border-gray-100">
          {[
            { label: t('tab_all'),      count: count('all'),      color: 'text-navy' },
            { label: t('tab_teachers'), count: count('teachers'), color: 'text-green-700' },
            { label: t('tab_students'), count: count('students'), color: 'text-blue-700' },
            { label: t('tab_parents'),  count: count('parents'),  color: 'text-purple-700' },
          ].map(s => (
            <div key={s.label} className="py-3 text-center border-l border-gray-100 last:border-0 first:border-0">
              <p className={`text-xl font-bold ${s.color} ${fa}`}>{toArabicNumerals(s.count)}</p>
              <p className={`text-[10px] text-gray-400 ${fa}`}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="px-4 py-2.5 bg-white border-b border-gray-100">
        <div className="relative">
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('search_user')} dir="rtl"
            className={`w-full pr-9 pl-4 py-2.5 rounded-xl border border-gray-200 ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 bg-gray-50`}
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex overflow-x-auto gap-1 px-4 py-2 bg-white border-b border-gray-100">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${fa} transition-colors ${activeTab === tab.key ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600'}`}>
            {t(tab.tKey)} <span className={activeTab === tab.key ? 'text-white/70' : 'text-gray-400'}>{toArabicNumerals(count(tab.key))}</span>
          </button>
        ))}
      </div>

      {/* User list */}
      <div className="bg-white flex-1 overflow-y-auto pb-24">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <span className="text-4xl mb-3">👥</span>
            <p className={`${fa} text-sm`}>{t('no_users')}</p>
          </div>
        ) : (
          filtered.map(user => {
            const color = ROLE_COLOR[user.role] ?? '#999'
            const cr    = customRoles.find(r => r.id === user.custom_role_id)
            return (
              <button key={user.id} onClick={() => openEdit(user)}
                className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0 active:bg-gray-50 transition-colors text-right">

                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold ${fa} text-white text-sm`}
                    style={{ backgroundColor: color + (user.is_active ? '' : '50') }}>
                    {user.first_name_ar.charAt(0)}
                  </div>
                  {!user.is_active && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-white text-[8px]">✕</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-right">
                  <p className={`text-sm font-bold text-gray-900 ${fa} truncate ${!user.is_active ? 'opacity-50' : ''}`}>
                    {user.first_name_ar} {user.last_name_ar}
                  </p>
                  <p className="text-xs text-gray-400 truncate dir-ltr text-left">
                    {user.email ?? user.phone ?? '—'}
                  </p>
                </div>

                {/* Role badges */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${fa}`}
                    style={{ backgroundColor: color + '18', color }}>
                    {ROLE_ICON[user.role]} {t(ROLE_T_KEY[user.role])}
                  </span>
                  {cr && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal/10 text-teal ${fa}`}>
                      {cr.name_ar}
                    </span>
                  )}
                </div>

                <svg className="w-4 h-4 text-gray-300 rotate-180 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )
          })
        )}
      </div>

      {/* ── EDIT MODAL ─────────────────────────────────────────────────────── */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl max-h-[92vh] overflow-y-auto">

            {/* Modal header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                style={{ backgroundColor: ROLE_COLOR[editUser.role] ?? '#999' }}>
                {editUser.first_name_ar.charAt(0)}
              </div>
              <div className="flex-1 text-right">
                <p className={`font-bold text-gray-900 text-base ${fa}`}>{editUser.first_name_ar} {editUser.last_name_ar}</p>
                <p className="text-xs text-gray-400">{editUser.email ?? editUser.phone ?? '—'}</p>
              </div>
              <button onClick={() => setEditUser(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xl">×</button>
            </div>

            <div className="p-5 space-y-5">

              {/* Role */}
              <div>
                <label className={`block text-xs font-bold text-gray-500 uppercase tracking-wide ${fa} mb-2`}>{t('role')}</label>
                <select value={editRole} onChange={e => setEditRole(e.target.value as UserRole)} dir={dir}
                  className={`w-full px-4 py-3 rounded-xl border border-gray-200 bg-white ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30`}>
                  {(Object.keys(ROLE_T_KEY) as UserRole[]).map(r => (
                    <option key={r} value={r}>{ROLE_ICON[r]} {t(ROLE_T_KEY[r])}</option>
                  ))}
                </select>
              </div>

              {/* Custom role */}
              {customRoles.length > 0 && (
                <div>
                  <label className={`block text-xs font-bold text-gray-500 uppercase tracking-wide ${fa} mb-2`}>{t('custom_roles_title')}</label>
                  <select value={editCustomRole} onChange={e => setEditCustomRole(e.target.value)} dir={dir}
                    className={`w-full px-4 py-3 rounded-xl border border-gray-200 bg-white ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30`}>
                    <option value="">{t('no_teacher')}</option>
                    {customRoles.map(cr => <option key={cr.id} value={cr.id}>{cr.name_ar}</option>)}
                  </select>
                </div>
              )}

              {/* Student fields */}
              {(editRole === 'kg_primary_student' || editRole === 'prep_secondary_student') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-bold text-gray-500 uppercase tracking-wide ${fa} mb-1`}>{t('grade_year')}</label>
                    <input type="number" min={0} max={12} value={editGrade} onChange={e => setEditGrade(e.target.value)} dir="ltr"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" placeholder="6" />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold text-gray-500 uppercase tracking-wide ${fa} mb-1`}>{t('section')}</label>
                    <input value={editSection} onChange={e => setEditSection(e.target.value)} dir="rtl"
                      className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30`} placeholder="أ" />
                  </div>
                  {stuProfile && (
                    <p className={`col-span-2 text-xs text-gray-400 ${fa}`}>{t('student_code')}: {stuProfile.student_code}</p>
                  )}
                </div>
              )}

              {/* Active toggle */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <button type="button" onClick={() => setEditActive(v => !v)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${editActive ? 'bg-teal' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editActive ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
                <div className="text-right">
                  <p className={`text-sm font-bold text-gray-800 ${fa}`}>{t('active_account')}</p>
                  <p className={`text-xs text-gray-400 ${fa}`}>{t('active_account_sub')}</p>
                </div>
              </div>

              {saveMsg && (
                <p className={`text-sm font-bold ${saveMsg.startsWith('✓') ? 'text-teal' : 'text-red-500'} ${fa} text-center`}>{saveMsg}</p>
              )}

              {/* Save button */}
              <div className="flex gap-3">
                <button onClick={() => setEditUser(null)}
                  className={`flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 ${fa} font-bold`}>{t('cancel')}</button>
                <button onClick={handleSave} disabled={saving}
                  className={`flex-1 py-3.5 rounded-xl bg-teal text-white font-bold ${fa} disabled:opacity-50`}>
                  {saving ? t('saving') : t('save_changes')}
                </button>
              </div>

              {/* Password reset section */}
              <div className="border-t border-gray-100 pt-4">
                <label className={`block text-xs font-bold text-gray-500 uppercase tracking-wide ${fa} mb-2`}>{t('password')} — {t('save')}</label>
                <div className="flex gap-2">
                  <input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)}
                    placeholder="••••••••" dir="ltr" minLength={8}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                  />
                  <button onClick={handleResetPassword} disabled={pwResetting || editPassword.length < 8}
                    className={`px-4 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-sm ${fa} disabled:opacity-40`}>
                    {pwResetting ? '...' : t('save')}
                  </button>
                </div>
                <p className={`text-xs text-gray-400 mt-1 ${fa}`}>8 {t('minutes')} {t('error_required')}</p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── CREATE MODAL ───────────────────────────────────────────────────── */}
      {creating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <button onClick={() => setCreating(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xl">×</button>
              <p className={`font-bold text-gray-900 text-base ${fa}`}>{t('add_user')}</p>
            </div>

            {createSuccess ? (
              <div className="flex flex-col items-center py-12 gap-3">
                <span className="text-6xl">✅</span>
                <p className={`${fa} font-bold text-green-700 text-lg`}>{t('user_created')}</p>
              </div>
            ) : (
              <div className="p-5 space-y-4">

                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-bold text-gray-500 uppercase mb-1 ${fa}`}>{t('first_name_ar')}</label>
                    <input value={newFirst} onChange={e => setNewFirst(e.target.value)} dir="rtl"
                      className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30`} />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold text-gray-500 uppercase mb-1 ${fa}`}>{t('last_name_ar')}</label>
                    <input value={newLast} onChange={e => setNewLast(e.target.value)} dir="rtl"
                      className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30`} />
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <label className={`block text-xs font-bold text-gray-500 uppercase mb-1 ${fa}`}>{t('email')}</label>
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} dir="ltr" placeholder="user@school.edu.eg"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
                </div>
                <div>
                  <label className={`block text-xs font-bold text-gray-500 uppercase mb-1 ${fa}`}>{t('phone_num')}</label>
                  <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} dir="ltr" placeholder="+201234567890"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
                </div>
                <div>
                  <label className={`block text-xs font-bold text-gray-500 uppercase mb-1 ${fa}`}>{t('password')}</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} dir="ltr" placeholder="••••••••" minLength={8}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
                </div>

                {/* Role */}
                <div>
                  <label className={`block text-xs font-bold text-gray-500 uppercase mb-1 ${fa}`}>{t('role')}</label>
                  <select value={newRole} onChange={e => setNewRole(e.target.value as UserRole)} dir={dir}
                    className={`w-full px-4 py-3 rounded-xl border border-gray-200 bg-white ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30`}>
                    {(Object.keys(ROLE_T_KEY) as UserRole[]).map(r => (
                      <option key={r} value={r}>{ROLE_ICON[r]} {t(ROLE_T_KEY[r])}</option>
                    ))}
                  </select>
                </div>

                {/* Student fields */}
                {(newRole === 'kg_primary_student' || newRole === 'prep_secondary_student') && (
                  <div className="grid grid-cols-3 gap-3 p-3 bg-blue-50 rounded-xl">
                    <div>
                      <label className={`block text-xs font-bold text-gray-500 mb-1 ${fa}`}>{t('grade_year')}</label>
                      <input type="number" min={0} max={12} value={newGrade} onChange={e => setNewGrade(e.target.value)} dir="ltr"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" placeholder="6" />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold text-gray-500 mb-1 ${fa}`}>{t('section')}</label>
                      <input value={newSection} onChange={e => setNewSection(e.target.value)} dir="rtl"
                        className={`w-full px-3 py-2 rounded-xl border border-gray-200 ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30`} placeholder="أ" />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold text-gray-500 mb-1 ${fa}`}>{t('student_code')}</label>
                      <input value={newCode} onChange={e => setNewCode(e.target.value)} dir="ltr" placeholder="STU-001"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
                    </div>
                  </div>
                )}

                {createError && (
                  <p className={`text-sm text-red-500 ${fa} bg-red-50 px-3 py-2 rounded-xl`}>{createError}</p>
                )}

                <div className="flex gap-3 pb-2">
                  <button onClick={() => setCreating(false)}
                    className={`flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 ${fa} font-bold`}>{t('cancel')}</button>
                  <button onClick={handleCreate} disabled={createSaving}
                    className={`flex-1 py-3.5 rounded-xl bg-teal text-white font-bold ${fa} disabled:opacity-50`}>
                    {createSaving ? t('saving') : t('create_user')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CSV MODAL ──────────────────────────────────────────────────────── */}
      {csvOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <button onClick={() => setCsvOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xl">×</button>
              <p className={`font-bold text-gray-900 text-base ${fa}`}>{t('csv_import')}</p>
            </div>

            {csvImporting || csvDone > 0 ? (
              <div className="py-6 space-y-4">
                <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-teal transition-all duration-300 rounded-full" style={{ width: `${csvProgress}%` }} />
                </div>
                <p className={`text-center text-sm ${fa} ${csvImporting ? 'text-gray-600' : 'text-teal font-bold'}`}>
                  {csvImporting ? `${t('csv_importing')} ${csvDone} / ${parseCsv(csvText).length}` : `✅ ${t('csv_done')} ${toArabicNumerals(csvDone)} ${t('students')}`}
                </p>
              </div>
            ) : (
              <>
                <p className={`text-xs text-gray-500 ${fa}`}>{t('csv_help')}</p>
                <div className="flex gap-2">
                  {([{ val: 'kg_primary_student', label: t('role_kg_primary') }, { val: 'prep_secondary_student', label: t('role_prep_sec') }] as const).map(({ val, label }) => (
                    <button key={val} onClick={() => setCsvRole(val)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold ${fa} border transition-colors ${csvRole === val ? 'bg-navy text-white border-transparent' : 'bg-white text-gray-600 border-gray-200'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={8} dir="rtl" placeholder={t('csv_ph')}
                  className={`w-full px-4 py-3 rounded-xl border border-gray-200 ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none font-mono`} />
                {csvText.trim() && (
                  <p className={`text-xs ${parseCsv(csvText).length > 0 ? 'text-teal' : 'text-red-500'} ${fa}`}>
                    {parseCsv(csvText).length > 0 ? `${t('matched')} ${toArabicNumerals(parseCsv(csvText).length)} ${t('students')}` : t('csv_no_match')}
                  </p>
                )}
                <div className="flex gap-3 pb-2">
                  <button onClick={() => setCsvOpen(false)} className={`flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 ${fa} font-bold`}>{t('cancel')}</button>
                  <button onClick={handleBulkImport} disabled={parseCsv(csvText).length === 0}
                    className={`flex-1 py-3.5 rounded-xl bg-teal text-white font-bold ${fa} disabled:opacity-50`}>
                    {t('csv_start')} ({toArabicNumerals(parseCsv(csvText).length)})
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </PageWrapper>
  )
}

UserManagementPage.displayName = 'UserManagementPage'
