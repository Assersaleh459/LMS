export type UserRole =
  | 'kg_primary_student'
  | 'prep_secondary_student'
  | 'subject_teacher'
  | 'homeroom_teacher'
  | 'parent'
  | 'school_admin'
  | 'it_admin'
  | 'chain_admin'
  | 'moe_supervisor'

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late'
  | 'excused'
  | 'early_departure'

export type GradeType =
  | 'written'
  | 'oral'        // شفهي
  | 'practical'
  | 'activity'
  | 'exam'
  | 'monthly'
  | 'final'

export type AssignmentType =
  | 'written'
  | 'oral'        // شفهي
  | 'practical'
  | 'project'
  | 'quiz'
  | 'notebook_photo'

export type EducationStage = 'kg' | 'primary' | 'prep' | 'secondary'

export type SubmissionStatus = 'pending' | 'submitted' | 'graded' | 'late'
