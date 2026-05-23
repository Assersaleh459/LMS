import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../app/providers/AuthProvider'
import { supabase } from '../../lib/supabase'
import { AppBar } from '../../components/layout/AppBar'
import { PageWrapper } from '../../components/layout/PageWrapper'
import { useLang } from '../../app/providers/LangProvider'
import { toArabicNumerals } from '../../lib/arabic'
import type { UserRole } from '../../types/enums'

// ── Types ────────────────────────────────────────────────────────────────────

interface User {
  id:            string
  first_name_ar: string
  last_name_ar:  string
  role:          UserRole
  email:         string | null
  phone:         string | null
  is_active:     boolean
  created_at:    string
}

interface StudentProfile {
  grade_year:   number
  section:      string
  student_code: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<UserRole, string> = {
  kg_primary_student:     'طالب ابتدائي/روضة',
  prep_secondary_student: 'طالب إعدادي/ثانوي',
  subject_teacher:        'معلم مادة',
  homeroom_teacher:       'معلم فصل',
  parent:                 'ولي أمر',
  school_admin:           'مدير مدرسة',
  it_admin:               'مسؤول IT',
  chain_admin:            'مدير مجموعة',
  moe_supervisor:         'مشرف تربوي',
}

const ROLE_LABEL_EN: Record<UserRole, string> = {
  kg_primary_student:     'Primary/KG Student',
  prep_secondary_student: 'Secondary Student',
  subject_teacher:        'Subject Teacher',
  homeroom_teacher:       'Homeroom Teacher',
  parent:                 'Parent',
  school_admin:           'School Admin',
  it_admin:               'IT Admin',
  chain_admin:            'Chain Admin',
  moe_supervisor:         'MoE Supervisor',
}

const ROLE_COLOR: Record<string, string> = {
  kg_primary_student:     '#2980b9',
  prep_secondary_student: '#2980b9',
  subject_teacher:        '#27ae60',
  homeroom_teacher:       '#27ae60',
  parent:                 '#8e44ad',
  school_admin:           '#1a3c5e',
  it_admin:               '#1a3c5e',
  chain_admin:            '#1a3c5e',
  moe_supervisor:         '#c0392b',
}

type FilterTab = 'all' | 'teachers' | 'students' | 'parents' | 'admins'

const FILTER_ROLES: Record<FilterTab, UserRole[] | null> = {
  all:      null,
  teachers: ['subject_teacher', 'homeroom_teacher'],
  students: ['kg_primary_student', 'prep_secondary_student'],
  parents:  ['parent'],
  admins:   ['school_admin', 'it_admin', 'chain_admin', 'moe_supervisor'],
}

// ── Component ────────────────────────────────────────────────────────────────

export function UserManagementPage() {
  const { t, fa, lang } = useLang()
  const auth    = useContext(AuthContext)
  const navigate = useNavigate()

  const [users,       setUsers]       = useState<User[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [activeTab,   setActiveTab]   = useState<FilterTab>('all')
  const [editUser,    setEditUser]    = useState<User | null>(null)
  const [stuProfile,  setStuProfile]  = useState<StudentProfile | null>(null)
  const [editRole,    setEditRole]    = useState<UserRole>('subject_teacher')
  const [editActive,  setEditActive]  = useState(true)
  const [editGrade,   setEditGrade]   = useState('')
  const [editSection, setEditSection] = useState('')
  const [saving,      setSaving]      = useState(false)
  const [saveError,   setSaveError]   = useState('')

  useEffect(() => {
    if (!auth?.schoolId) return
    supabase.from('users')
      .select('id, first_name_ar, last_name_ar, role, email, phone, is_active, created_at')
      .eq('school_id', auth.schoolId)
      .order('role').order('first_name_ar')
      .then(({ data }) => {
        if (data) setUsers(data as User[])
        setLoading(false)
      })
  }, [auth?.schoolId])

  // ── Filtered list ────────────────────────────────────────────────────────

  const filtered = users.filter(u => {
    const roleMatch = !FILTER_ROLES[activeTab] || FILTER_ROLES[activeTab]!.includes(u.role)
    const q = search.toLowerCase()
    const nameMatch = !q ||
      u.first_name_ar.includes(q) ||
      u.last_name_ar.includes(q) ||
      (u.email ?? '').toLowerCase().includes(q)
    return roleMatch && nameMatch
  })

  // ── Open edit sheet ──────────────────────────────────────────────────────

  async function openEdit(user: User) {
    setEditUser(user)
    setEditRole(user.role)
    setEditActive(user.is_active)
    setStuProfile(null)
    setEditGrade('')
    setEditSection('')
    setSaveError('')

    const isStudent = user.role === 'kg_primary_student' || user.role === 'prep_secondary_student'
    if (isStudent) {
      const { data } = await supabase.from('student_profiles')
        .select('grade_year, section, student_code')
        .eq('user_id', user.id).single()
      if (data) {
        setStuProfile(data as StudentProfile)
        setEditGrade(String(data.grade_year))
        setEditSection(data.section)
      }
    }
  }

  // ── Save changes ─────────────────────────────────────────────────────────

  async function handleSave() {
    if (!editUser) return
    setSaving(true)
    setSaveError('')

    const { error: userError } = await supabase.from('users')
      .update({ role: editRole, is_active: editActive })
      .eq('id', editUser.id)

    if (userError) {
      setSaveError(userError.message)
      setSaving(false)
      return
    }

    // Update student profile if applicable
    const isStudent = editRole === 'kg_primary_student' || editRole === 'prep_secondary_student'
    if (isStudent && stuProfile && editGrade) {
      await supabase.from('student_profiles')
        .update({ grade_year: parseInt(editGrade), section: editSection || 'أ' })
        .eq('user_id', editUser.id)
    }

    // Update local list
    setUsers(prev => prev.map(u =>
      u.id === editUser.id ? { ...u, role: editRole, is_active: editActive } : u
    ))
    setEditUser(null)
    setSaving(false)
  }

  // ── Tab counts ───────────────────────────────────────────────────────────

  const count = (tab: FilterTab) => {
    const roles = FILTER_ROLES[tab]
    return roles ? users.filter(u => roles.includes(u.role)).length : users.length
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const TABS: { key: FilterTab; label: string; labelEn: string }[] = [
    { key: 'all',      label: 'الكل',   labelEn: 'All' },
    { key: 'teachers', label: 'معلمون', labelEn: 'Teachers' },
    { key: 'students', label: 'طلاب',   labelEn: 'Students' },
    { key: 'parents',  label: 'أولياء', labelEn: 'Parents' },
    { key: 'admins',   label: 'إدارة',  labelEn: 'Admins' },
  ]

  return (
    <PageWrapper>
      <AppBar title={t('user_mgmt')} onBack={() => navigate(-1)} />

      {/* Search */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="relative">
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('search_user')}
            dir="rtl"
            className={`w-full pr-9 pl-4 py-2.5 rounded-xl border border-gray-200 ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal bg-gray-50`}
          />
        </div>
      </div>

      {/* Role filter tabs */}
      <div className="flex overflow-x-auto gap-1 px-4 py-2 bg-white border-b border-gray-100 no-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${fa} ${
              activeTab === tab.key
                ? 'bg-navy text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {lang === 'ar' ? tab.label : tab.labelEn}
            {' '}
            <span className={activeTab === tab.key ? 'text-white/80' : 'text-gray-400'}>
              {toArabicNumerals(count(tab.key))}
            </span>
          </button>
        ))}
      </div>

      {/* User list */}
      <div className="bg-white flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className={`text-center text-gray-400 ${fa} py-16 text-sm`}>{t('no_users')}</p>
        ) : (
          filtered.map(user => {
            const color  = ROLE_COLOR[user.role] ?? '#999'
            const label  = lang === 'ar' ? ROLE_LABEL[user.role] : ROLE_LABEL_EN[user.role]
            return (
              <button
                key={user.id}
                onClick={() => openEdit(user)}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 active:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar initial */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold font-arabic text-white text-sm flex-shrink-0"
                    style={{ backgroundColor: color + (user.is_active ? '' : '60') }}
                  >
                    {user.first_name_ar.charAt(0)}
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold text-gray-800 ${fa} ${!user.is_active ? 'opacity-50' : ''}`}>
                      {user.first_name_ar} {user.last_name_ar}
                    </p>
                    <p className="text-xs text-gray-400">{user.email ?? user.phone ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!user.is_active && (
                    <span className={`text-xs ${fa} bg-red-100 text-red-500 px-2 py-0.5 rounded-full`}>
                      {t('inactive')}
                    </span>
                  )}
                  <span
                    className={`text-xs font-bold ${fa} px-2 py-0.5 rounded-full`}
                    style={{ backgroundColor: color + '20', color }}
                  >
                    {label}
                  </span>
                  <svg className="w-4 h-4 text-gray-300 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Edit bottom sheet */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between">
              <p className={`font-bold text-gray-800 text-base ${fa}`}>
                {editUser.first_name_ar} {editUser.last_name_ar}
              </p>
              <button
                onClick={() => setEditUser(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-gray-400">{editUser.email ?? editUser.phone ?? ''}</p>

            {/* Role selector */}
            <div>
              <label className={`block text-sm font-bold text-gray-700 ${fa} mb-2`}>{t('role')}</label>
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(ROLE_LABEL) as UserRole[]).map(role => {
                  const color   = ROLE_COLOR[role] ?? '#999'
                  const isChosen = editRole === role
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setEditRole(role)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-right transition-colors ${
                        isChosen ? 'border-teal bg-teal/5' : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: isChosen ? color : '#d1d5db' }}
                      />
                      <span className={`text-sm ${fa} ${isChosen ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                        {lang === 'ar' ? ROLE_LABEL[role] : ROLE_LABEL_EN[role]}
                      </span>
                      {isChosen && (
                        <svg className="w-4 h-4 text-teal mr-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Student profile fields */}
            {(editRole === 'kg_primary_student' || editRole === 'prep_secondary_student') && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className={`block text-sm font-bold text-gray-700 ${fa} mb-1`}>{t('grade_year')}</label>
                  <input
                    type="number" min={0} max={12}
                    value={editGrade}
                    onChange={e => setEditGrade(e.target.value)}
                    dir="rtl"
                    className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30`}
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-bold text-gray-700 ${fa} mb-1`}>{t('section')}</label>
                  <input
                    type="text"
                    value={editSection}
                    onChange={e => setEditSection(e.target.value)}
                    dir="rtl"
                    className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 ${fa} text-sm focus:outline-none focus:ring-2 focus:ring-teal/30`}
                    placeholder="أ"
                  />
                </div>
                {stuProfile && (
                  <p className={`col-span-2 text-xs text-gray-400 ${fa}`}>
                    {t('student_code')}: {stuProfile.student_code}
                  </p>
                )}
              </div>
            )}

            {/* Active toggle */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <div>
                <p className={`text-sm font-bold text-gray-800 ${fa}`}>{t('active_account')}</p>
                <p className={`text-xs text-gray-400 ${fa}`}>{t('active_account_sub')}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditActive(v => !v)}
                className={`w-12 h-6 rounded-full transition-colors ${editActive ? 'bg-teal' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${editActive ? 'translate-x-1' : 'translate-x-6'}`} />
              </button>
            </div>

            {saveError && (
              <p className={`text-xs text-red-500 ${fa} bg-red-50 px-3 py-2 rounded-lg`}>
                {saveError}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-1 pb-2">
              <button
                onClick={() => setEditUser(null)}
                className={`flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 ${fa} text-sm font-bold`}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex-1 py-3.5 rounded-xl bg-teal text-white font-bold ${fa} text-sm disabled:opacity-50`}
              >
                {saving ? t('saving') : t('save_changes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

UserManagementPage.displayName = 'UserManagementPage'
