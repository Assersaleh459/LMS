import { NavLink } from 'react-router-dom'
import { useRole } from '../../hooks/useRole'

type NavItem = { to: string; labelAr: string; icon: React.ReactNode }

const TEACHER_NAV: NavItem[] = [
  {
    to: '/teacher/attendance',
    labelAr: 'الحضور',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    to: '/teacher/grades',
    labelAr: 'الدرجات',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    to: '/teacher/assignments',
    labelAr: 'الواجبات',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
]

const PARENT_NAV: NavItem[] = [
  { to: '/parent',            labelAr: 'الرئيسية', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { to: '/parent?tab=grades', labelAr: 'الدرجات',  icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
]

export function BottomNav() {
  const role = useRole()

  const items = (role === 'subject_teacher' || role === 'homeroom_teacher')
    ? TEACHER_NAV
    : role === 'parent'
    ? PARENT_NAV
    : []

  if (!items.length) return null

  return (
    <nav className="bottom-nav safe-area-pb">
      <div className="flex">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-arabic transition-colors ${
                isActive ? 'text-teal' : 'text-gray-400'
              }`
            }
          >
            {item.icon}
            <span>{item.labelAr}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

BottomNav.displayName = 'BottomNav'
