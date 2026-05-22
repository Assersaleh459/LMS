import type { AttendanceStatus, GradeType, AssignmentType, EducationStage, SubmissionStatus, UserRole } from './enums'

export type { UserRole }

export type StudentCard = {
  id:                      string
  school_id:               string
  full_name_ar:            string
  student_code:            string
  grade_year:              number
  section:                 string
  stage:                   EducationStage
  total_points:            number
  attendance_streak_days:  number
  avatar_url:              string | null
  parent_whatsapp:         string | null
  parent_name_ar:          string | null
  school_name_ar:          string
}

export type AttendanceRecord = {
  id:               string
  student_id:       string
  teacher_id:       string
  subject_id:       string | null
  status:           AttendanceStatus
  attendance_date:  string   // YYYY-MM-DD
  period_number:    number
  note_ar:          string | null
  parent_notified:  boolean
  notified_at:      string | null
  created_at:       string
}

export type GradeEntry = {
  id:                  string
  student_id:          string
  subject_id:          string
  term_id:             string | null
  grade_type:          GradeType
  total_grade:         number
  teacher_comment_ar:  string | null
  entered_by:          string
  voice_note_url:      string | null
  photo_url:           string | null
  created_at:          string
}

export type Subject = {
  id:                string
  school_id:         string
  name_ar:           string
  name_en:           string | null
  stage:             EducationStage
  grade_year:        number
  moe_subject_code:  string | null
  total_marks:       number
  written_marks:     number
  oral_marks:        number
  practical_marks:   number
  activity_marks:    number
}

export type Assignment = {
  id:               string
  subject_id:       string
  teacher_id:       string
  title_ar:         string
  description_ar:   string | null
  assignment_type:  AssignmentType
  grade_category:   GradeType | null
  max_grade:        number
  due_date:         string
  grade_year:       number
  section:          string
  whatsapp_notify:  boolean
  is_published:     boolean
  published_at:     string | null
  created_at:       string
}

export type AssignmentSubmission = {
  id:              string
  assignment_id:   string
  student_id:      string
  status:          SubmissionStatus
  photo_url:       string | null
  voice_note_url:  string | null
  text_answer:     string | null
  grade:           number | null
  teacher_comment: string | null
  submitted_at:    string | null
  graded_at:       string | null
}

export type School = {
  id:           string
  name_ar:      string
  name_en:      string | null
  school_type:  string
  governorate:  string
  moe_code:     string | null
  logo_url:     string | null
}

export type UserProfile = {
  id:             string
  school_id:      string
  first_name_ar:  string
  last_name_ar:   string
  role:           UserRole
  phone:          string | null
  whatsapp_phone: string | null
  avatar_url:     string | null
}
