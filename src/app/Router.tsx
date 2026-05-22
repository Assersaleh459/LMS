import { useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthContext } from './providers/AuthProvider'
import type { UserRole } from '../types/enums'

// Feature pages
import { LoginPage }     from '../features/auth/LoginPage'
import { OTPPage }       from '../features/auth/OTPPage'
import { AttendancePage } from '../features/attendance/AttendancePage'
import { GradebookPage }  from '../features/grades/GradebookPage'
import { AssignmentListPage } from '../features/assignments/AssignmentListPage'
import { CreateAssignmentPage } from '../features/assignments/CreateAssignmentPage'
import { ParentDashboard }  from '../features/parent/ParentDashboard'
import { StudentDashboard } from '../features/student/StudentDashboard'
import { SecondaryDashboard } from '../features/student/SecondaryDashboard'
import { KGDashboard }    from '../features/student/KGDashboard'
import { AdminDashboard } from '../features/admin/AdminDashboard'

const ROLE_ROUTES: Record<UserRole, string> = {
  subject_teacher:        '/teacher/attendance',
  homeroom_teacher:       '/teacher/attendance',
  kg_primary_student:     '/student/primary',
  prep_secondary_student: '/student/secondary',
  parent:                 '/parent',
  school_admin:           '/admin',
  chain_admin:            '/admin',
  it_admin:               '/admin',
  moe_supervisor:         '/admin',
}

function RoleRedirect() {
  const auth = useContext(AuthContext)
  if (!auth || auth.loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-navy font-arabic">جاري التحميل...</p></div>
  if (!auth.session) return <Navigate to="/login" replace />
  const dest = auth.role ? ROLE_ROUTES[auth.role] : '/login'
  return <Navigate to={dest} replace />
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const auth = useContext(AuthContext)
  if (!auth || auth.loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-navy font-arabic">جاري التحميل...</p></div>
  if (!auth.session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"      element={<LoginPage />} />
        <Route path="/login/otp"  element={<OTPPage />} />
        <Route path="/parent"     element={<ParentDashboard />} />

        {/* Role redirect */}
        <Route path="/" element={<RoleRedirect />} />

        {/* Teacher */}
        <Route path="/teacher/attendance" element={<RequireAuth><AttendancePage /></RequireAuth>} />
        <Route path="/teacher/grades"     element={<RequireAuth><GradebookPage /></RequireAuth>} />
        <Route path="/teacher/assignments" element={<RequireAuth><AssignmentListPage /></RequireAuth>} />
        <Route path="/teacher/assignments/new" element={<RequireAuth><CreateAssignmentPage /></RequireAuth>} />

        {/* Students */}
        <Route path="/student/primary"   element={<RequireAuth><StudentDashboard /></RequireAuth>} />
        <Route path="/student/secondary" element={<RequireAuth><SecondaryDashboard /></RequireAuth>} />
        <Route path="/student/kg"        element={<RequireAuth><KGDashboard /></RequireAuth>} />

        {/* Admin */}
        <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
