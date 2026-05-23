import { useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthContext } from './providers/AuthProvider'
import type { UserRole } from '../types/enums'

// Phase 3 — Advanced teacher tools
import { GradeAnalyticsPage }  from '../features/grades/GradeAnalyticsPage'
import { StudentProgressPage } from '../features/student/StudentProgressPage'
import { ReportCardPage }      from '../features/grades/ReportCardPage'
import { ClassRosterPage }     from '../features/admin/ClassRosterPage'

// Phase 1 pages
import { LoginPage }           from '../features/auth/LoginPage'
import { AttendancePage }      from '../features/attendance/AttendancePage'
import { GradebookPage }       from '../features/grades/GradebookPage'
import { AssignmentListPage }  from '../features/assignments/AssignmentListPage'
import { CreateAssignmentPage } from '../features/assignments/CreateAssignmentPage'
import { ParentDashboard }     from '../features/parent/ParentDashboard'
import { StudentDashboard }    from '../features/student/StudentDashboard'
import { SecondaryDashboard }  from '../features/student/SecondaryDashboard'
import { KGDashboard }         from '../features/student/KGDashboard'
import { AdminDashboard }      from '../features/admin/AdminDashboard'

// Phase 2 — Courses
import { SubjectsListPage }    from '../features/subjects/SubjectsListPage'
import { CoursePage }          from '../features/course/CoursePage'
import { UnitPage }            from '../features/course/UnitPage'
import { LessonPage }          from '../features/course/LessonPage'
import { CreateUnitPage }      from '../features/course/CreateUnitPage'
import { CreateLessonPage }    from '../features/course/CreateLessonPage'

// Phase 2 — Quizzes
import { QuizPage }            from '../features/quizzes/QuizPage'
import { QuizResultPage }      from '../features/quizzes/QuizResultPage'
import { CreateQuizPage }      from '../features/quizzes/CreateQuizPage'

// Phase 2 — Announcements
import { AnnouncementsPage }      from '../features/announcements/AnnouncementsPage'
import { CreateAnnouncementPage } from '../features/announcements/CreateAnnouncementPage'

// Phase 2 — Discussions
import { DiscussionPage }      from '../features/discussions/DiscussionPage'
import { ThreadPage }          from '../features/discussions/ThreadPage'
import { CreateThreadPage }    from '../features/discussions/CreateThreadPage'

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
        <Route path="/login"  element={<LoginPage />} />
        <Route path="/parent" element={<ParentDashboard />} />

        {/* Role redirect */}
        <Route path="/" element={<RoleRedirect />} />

        {/* Teacher — Phase 1 */}
        <Route path="/teacher/attendance"        element={<RequireAuth><AttendancePage /></RequireAuth>} />
        <Route path="/teacher/grades"            element={<RequireAuth><GradebookPage /></RequireAuth>} />
        <Route path="/teacher/grades/analytics"  element={<RequireAuth><GradeAnalyticsPage /></RequireAuth>} />
        <Route path="/teacher/student/:studentId/progress" element={<RequireAuth><StudentProgressPage /></RequireAuth>} />
        <Route path="/teacher/report-card/:studentId"      element={<RequireAuth><ReportCardPage /></RequireAuth>} />
        <Route path="/teacher/assignments"       element={<RequireAuth><AssignmentListPage /></RequireAuth>} />
        <Route path="/teacher/assignments/new"   element={<RequireAuth><CreateAssignmentPage /></RequireAuth>} />

        {/* Students — Phase 1 */}
        <Route path="/student/primary"   element={<RequireAuth><StudentDashboard /></RequireAuth>} />
        <Route path="/student/secondary" element={<RequireAuth><SecondaryDashboard /></RequireAuth>} />
        <Route path="/student/kg"        element={<RequireAuth><KGDashboard /></RequireAuth>} />

        {/* Admin */}
        <Route path="/admin"                         element={<RequireAuth><AdminDashboard /></RequireAuth>} />
        <Route path="/admin/class/:grade/:section"   element={<RequireAuth><ClassRosterPage /></RequireAuth>} />

        {/* Phase 2 — Subjects & Courses */}
        <Route path="/courses"                                                        element={<RequireAuth><SubjectsListPage /></RequireAuth>} />
        <Route path="/course/:subjectId"                                              element={<RequireAuth><CoursePage /></RequireAuth>} />
        <Route path="/course/:subjectId/unit/:unitId"                                 element={<RequireAuth><UnitPage /></RequireAuth>} />
        <Route path="/course/:subjectId/unit/:unitId/lesson/:lessonId"                element={<RequireAuth><LessonPage /></RequireAuth>} />
        <Route path="/teacher/course/:subjectId/unit/new"                             element={<RequireAuth><CreateUnitPage /></RequireAuth>} />
        <Route path="/teacher/course/:subjectId/unit/:unitId/lesson/new"              element={<RequireAuth><CreateLessonPage /></RequireAuth>} />
        <Route path="/teacher/course/:subjectId/quiz/new"                             element={<RequireAuth><CreateQuizPage /></RequireAuth>} />

        {/* Phase 2 — Quizzes */}
        <Route path="/quiz/:lessonId"                    element={<RequireAuth><QuizPage /></RequireAuth>} />
        <Route path="/quiz/:lessonId/result/:attemptId"  element={<RequireAuth><QuizResultPage /></RequireAuth>} />

        {/* Phase 2 — Announcements */}
        <Route path="/announcements"     element={<RequireAuth><AnnouncementsPage /></RequireAuth>} />
        <Route path="/announcements/new" element={<RequireAuth><CreateAnnouncementPage /></RequireAuth>} />

        {/* Phase 2 — Discussions */}
        <Route path="/discussions/:subjectId"               element={<RequireAuth><DiscussionPage /></RequireAuth>} />
        <Route path="/discussions/:subjectId/new"           element={<RequireAuth><CreateThreadPage /></RequireAuth>} />
        <Route path="/discussions/:subjectId/thread/:threadId" element={<RequireAuth><ThreadPage /></RequireAuth>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
