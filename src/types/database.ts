// Auto-generated stub — replace by running:
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string; name_ar: string; name_en: string | null; school_type: string
          governorate: string; moe_code: string | null; logo_url: string | null
          phone: string | null; address_ar: string | null; is_active: boolean; created_at: string
        }
        Insert: {
          id?: string; name_ar: string; name_en?: string | null; school_type: string
          governorate: string; moe_code?: string | null; logo_url?: string | null
          phone?: string | null; address_ar?: string | null; is_active?: boolean
        }
        Update: {
          id?: string; name_ar?: string; name_en?: string | null; school_type?: string
          governorate?: string; moe_code?: string | null; logo_url?: string | null
          phone?: string | null; address_ar?: string | null; is_active?: boolean
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string; school_id: string; first_name_ar: string; last_name_ar: string
          role: string; phone: string | null; whatsapp_phone: string | null
          email: string | null; avatar_url: string | null; is_active: boolean
          created_at: string; last_login_at: string | null
        }
        Insert: {
          id?: string; school_id: string; first_name_ar: string; last_name_ar: string
          role: string; phone?: string | null; whatsapp_phone?: string | null
          email?: string | null; avatar_url?: string | null; is_active?: boolean
        }
        Update: {
          school_id?: string; first_name_ar?: string; last_name_ar?: string
          role?: string; phone?: string | null; whatsapp_phone?: string | null
          email?: string | null; avatar_url?: string | null; is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "users_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          }
        ]
      }
      student_profiles: {
        Row: {
          user_id: string; student_code: string; grade_year: number; stage: string
          section: string; national_id: string | null; enrollment_date: string
          points_total: number; attendance_streak: number
        }
        Insert: {
          user_id: string; student_code: string; grade_year: number; stage: string
          section?: string; national_id?: string | null; enrollment_date: string
          points_total?: number; attendance_streak?: number
        }
        Update: {
          student_code?: string; grade_year?: number; stage?: string; section?: string
          national_id?: string | null; enrollment_date?: string
          points_total?: number; attendance_streak?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      parent_student_links: {
        Row: {
          id: string; parent_id: string; student_id: string
          relationship: string; is_primary: boolean; created_at: string
        }
        Insert: {
          id?: string; parent_id: string; student_id: string
          relationship?: string; is_primary?: boolean
        }
        Update: {
          parent_id?: string; student_id?: string
          relationship?: string; is_primary?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "parent_student_links_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_student_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      subjects: {
        Row: {
          id: string; school_id: string; name_ar: string; name_en: string | null
          stage: string; grade_year: number; moe_subject_code: string | null
          total_marks: number; written_marks: number; oral_marks: number
          practical_marks: number; activity_marks: number; is_active: boolean
        }
        Insert: {
          id?: string; school_id: string; name_ar: string; name_en?: string | null
          stage: string; grade_year: number; moe_subject_code?: string | null
          total_marks?: number; written_marks?: number; oral_marks?: number
          practical_marks?: number; activity_marks?: number; is_active?: boolean
        }
        Update: {
          name_ar?: string; name_en?: string | null; stage?: string
          grade_year?: number; moe_subject_code?: string | null
          total_marks?: number; written_marks?: number; oral_marks?: number
          practical_marks?: number; activity_marks?: number; is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          }
        ]
      }
      teacher_subjects: {
        Row: {
          id: string; teacher_id: string; subject_id: string
          grade_year: number; section: string; academic_year: string
        }
        Insert: {
          id?: string; teacher_id: string; subject_id: string
          grade_year: number; section: string; academic_year?: string
        }
        Update: {
          teacher_id?: string; subject_id?: string
          grade_year?: number; section?: string; academic_year?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          }
        ]
      }
      academic_terms: {
        Row: {
          id: string; school_id: string; name_ar: string; term_number: number
          start_date: string; end_date: string; academic_year: string; is_active: boolean
        }
        Insert: {
          id?: string; school_id: string; name_ar: string; term_number: number
          start_date: string; end_date: string; academic_year?: string; is_active?: boolean
        }
        Update: {
          name_ar?: string; term_number?: number; start_date?: string
          end_date?: string; academic_year?: string; is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "academic_terms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          }
        ]
      }
      attendance_records: {
        Row: {
          id: string; student_id: string; teacher_id: string; subject_id: string | null
          status: string; attendance_date: string; period_number: number
          note_ar: string | null; parent_notified: boolean; notified_at: string | null; created_at: string
        }
        Insert: {
          id?: string; student_id: string; teacher_id: string; subject_id?: string | null
          status: string; attendance_date: string; period_number?: number
          note_ar?: string | null; parent_notified?: boolean; notified_at?: string | null
        }
        Update: {
          student_id?: string; teacher_id?: string; subject_id?: string | null
          status?: string; attendance_date?: string; period_number?: number
          note_ar?: string | null; parent_notified?: boolean; notified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      grade_entries: {
        Row: {
          id: string; student_id: string; subject_id: string; term_id: string | null
          grade_type: string; total_grade: number; teacher_comment_ar: string | null
          entered_by: string; voice_note_url: string | null; photo_url: string | null; created_at: string
        }
        Insert: {
          id?: string; student_id: string; subject_id: string; term_id?: string | null
          grade_type: string; total_grade: number; teacher_comment_ar?: string | null
          entered_by: string; voice_note_url?: string | null; photo_url?: string | null
        }
        Update: {
          student_id?: string; subject_id?: string; term_id?: string | null
          grade_type?: string; total_grade?: number; teacher_comment_ar?: string | null
          entered_by?: string; voice_note_url?: string | null; photo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grade_entries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_entries_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          }
        ]
      }
      assignments: {
        Row: {
          id: string; subject_id: string; teacher_id: string; title_ar: string
          description_ar: string | null; assignment_type: string; grade_category: string | null
          max_grade: number; due_date: string; grade_year: number; section: string
          whatsapp_notify: boolean; is_published: boolean; published_at: string | null; created_at: string
        }
        Insert: {
          id?: string; subject_id: string; teacher_id: string; title_ar: string
          description_ar?: string | null; assignment_type: string; grade_category?: string | null
          max_grade?: number; due_date: string; grade_year: number; section: string
          whatsapp_notify?: boolean; is_published?: boolean; published_at?: string | null
        }
        Update: {
          subject_id?: string; teacher_id?: string; title_ar?: string
          description_ar?: string | null; assignment_type?: string; grade_category?: string | null
          max_grade?: number; due_date?: string; grade_year?: number; section?: string
          whatsapp_notify?: boolean; is_published?: boolean; published_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      units: {
        Row: {
          id: string; subject_id: string; title_ar: string; description_ar: string | null
          order_num: number; is_published: boolean; created_at: string
        }
        Insert: {
          id?: string; subject_id: string; title_ar: string; description_ar?: string | null
          order_num?: number; is_published?: boolean
        }
        Update: {
          subject_id?: string; title_ar?: string; description_ar?: string | null
          order_num?: number; is_published?: boolean
        }
        Relationships: [{ foreignKeyName: "units_subject_id_fkey"; columns: ["subject_id"]; isOneToOne: false; referencedRelation: "subjects"; referencedColumns: ["id"] }]
      }
      lessons: {
        Row: {
          id: string; unit_id: string; title_ar: string; content_type: string
          content_url: string | null; content_text: string | null; duration_min: number | null
          order_num: number; is_published: boolean; created_at: string
        }
        Insert: {
          id?: string; unit_id: string; title_ar: string; content_type: string
          content_url?: string | null; content_text?: string | null; duration_min?: number | null
          order_num?: number; is_published?: boolean
        }
        Update: {
          unit_id?: string; title_ar?: string; content_type?: string
          content_url?: string | null; content_text?: string | null; duration_min?: number | null
          order_num?: number; is_published?: boolean
        }
        Relationships: [{ foreignKeyName: "lessons_unit_id_fkey"; columns: ["unit_id"]; isOneToOne: false; referencedRelation: "units"; referencedColumns: ["id"] }]
      }
      lesson_progress: {
        Row: { id: string; lesson_id: string; student_id: string; completed_at: string }
        Insert: { id?: string; lesson_id: string; student_id: string; completed_at?: string }
        Update: { lesson_id?: string; student_id?: string; completed_at?: string }
        Relationships: []
      }
      announcements: {
        Row: {
          id: string; school_id: string; subject_id: string | null; author_id: string
          title_ar: string; body_ar: string; grade_year: number | null; section: string | null
          is_pinned: boolean; created_at: string
        }
        Insert: {
          id?: string; school_id: string; subject_id?: string | null; author_id: string
          title_ar: string; body_ar: string; grade_year?: number | null; section?: string | null
          is_pinned?: boolean
        }
        Update: {
          title_ar?: string; body_ar?: string; is_pinned?: boolean
        }
        Relationships: [{ foreignKeyName: "announcements_school_id_fkey"; columns: ["school_id"]; isOneToOne: false; referencedRelation: "schools"; referencedColumns: ["id"] }]
      }
      quizzes: {
        Row: {
          id: string; subject_id: string; lesson_id: string | null; created_by: string
          title_ar: string; instructions_ar: string | null; duration_min: number | null
          max_attempts: number; pass_score: number; is_published: boolean
          due_date: string | null; grade_year: number; section: string; created_at: string
        }
        Insert: {
          id?: string; subject_id: string; lesson_id?: string | null; created_by: string
          title_ar: string; instructions_ar?: string | null; duration_min?: number | null
          max_attempts?: number; pass_score?: number; is_published?: boolean
          due_date?: string | null; grade_year: number; section: string
        }
        Update: {
          title_ar?: string; instructions_ar?: string | null; duration_min?: number | null
          max_attempts?: number; pass_score?: number; is_published?: boolean
          due_date?: string | null; grade_year?: number; section?: string
        }
        Relationships: [{ foreignKeyName: "quizzes_subject_id_fkey"; columns: ["subject_id"]; isOneToOne: false; referencedRelation: "subjects"; referencedColumns: ["id"] }]
      }
      quiz_questions: {
        Row: {
          id: string; quiz_id: string; question_ar: string; question_type: string
          options: Json | null; correct_answer: string | null; points: number; order_num: number
        }
        Insert: {
          id?: string; quiz_id: string; question_ar: string; question_type: string
          options?: Json | null; correct_answer?: string | null; points?: number; order_num?: number
        }
        Update: {
          question_ar?: string; question_type?: string; options?: Json | null
          correct_answer?: string | null; points?: number; order_num?: number
        }
        Relationships: [{ foreignKeyName: "quiz_questions_quiz_id_fkey"; columns: ["quiz_id"]; isOneToOne: false; referencedRelation: "quizzes"; referencedColumns: ["id"] }]
      }
      quiz_attempts: {
        Row: {
          id: string; quiz_id: string; student_id: string; score: number | null
          max_score: number | null; is_complete: boolean; started_at: string; submitted_at: string | null
        }
        Insert: {
          id?: string; quiz_id: string; student_id: string; score?: number | null
          max_score?: number | null; is_complete?: boolean; submitted_at?: string | null
        }
        Update: {
          score?: number | null; max_score?: number | null; is_complete?: boolean; submitted_at?: string | null
        }
        Relationships: [
          { foreignKeyName: "quiz_attempts_quiz_id_fkey"; columns: ["quiz_id"]; isOneToOne: false; referencedRelation: "quizzes"; referencedColumns: ["id"] },
          { foreignKeyName: "quiz_attempts_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }
        ]
      }
      quiz_attempt_answers: {
        Row: { id: string; attempt_id: string; question_id: string; answer_text: string | null; is_correct: boolean | null }
        Insert: { id?: string; attempt_id: string; question_id: string; answer_text?: string | null; is_correct?: boolean | null }
        Update: { answer_text?: string | null; is_correct?: boolean | null }
        Relationships: [
          { foreignKeyName: "quiz_attempt_answers_attempt_id_fkey"; columns: ["attempt_id"]; isOneToOne: false; referencedRelation: "quiz_attempts"; referencedColumns: ["id"] },
          { foreignKeyName: "quiz_attempt_answers_question_id_fkey"; columns: ["question_id"]; isOneToOne: false; referencedRelation: "quiz_questions"; referencedColumns: ["id"] }
        ]
      }
      discussion_threads: {
        Row: {
          id: string; subject_id: string; author_id: string; title_ar: string; body_ar: string
          is_pinned: boolean; is_locked: boolean; reply_count: number; created_at: string
        }
        Insert: {
          id?: string; subject_id: string; author_id: string; title_ar: string; body_ar: string
          is_pinned?: boolean; is_locked?: boolean
        }
        Update: { title_ar?: string; body_ar?: string; is_pinned?: boolean; is_locked?: boolean }
        Relationships: [
          { foreignKeyName: "discussion_threads_subject_id_fkey"; columns: ["subject_id"]; isOneToOne: false; referencedRelation: "subjects"; referencedColumns: ["id"] },
          { foreignKeyName: "discussion_threads_author_id_fkey"; columns: ["author_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }
        ]
      }
      discussion_replies: {
        Row: { id: string; thread_id: string; author_id: string; body_ar: string; created_at: string }
        Insert: { id?: string; thread_id: string; author_id: string; body_ar: string }
        Update: { body_ar?: string }
        Relationships: [
          { foreignKeyName: "discussion_replies_thread_id_fkey"; columns: ["thread_id"]; isOneToOne: false; referencedRelation: "discussion_threads"; referencedColumns: ["id"] },
          { foreignKeyName: "discussion_replies_author_id_fkey"; columns: ["author_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }
        ]
      }
      meeting_sessions: {
        Row: {
          id: string; subject_id: string; teacher_id: string; title_ar: string
          meeting_url: string; scheduled_at: string; duration_min: number
          grade_year: number; section: string; created_at: string
        }
        Insert: {
          id?: string; subject_id: string; teacher_id: string; title_ar: string
          meeting_url: string; scheduled_at: string; duration_min?: number
          grade_year: number; section: string
        }
        Update: {
          title_ar?: string; meeting_url?: string; scheduled_at?: string; duration_min?: number
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          id: string; assignment_id: string; student_id: string; status: string
          photo_url: string | null; voice_note_url: string | null; text_answer: string | null
          grade: number | null; teacher_comment: string | null
          submitted_at: string | null; graded_at: string | null; created_at: string
        }
        Insert: {
          id?: string; assignment_id: string; student_id: string; status?: string
          photo_url?: string | null; voice_note_url?: string | null; text_answer?: string | null
          grade?: number | null; teacher_comment?: string | null
          submitted_at?: string | null; graded_at?: string | null
        }
        Update: {
          assignment_id?: string; student_id?: string; status?: string
          photo_url?: string | null; voice_note_url?: string | null; text_answer?: string | null
          grade?: number | null; teacher_comment?: string | null
          submitted_at?: string | null; graded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      v_student_card: {
        Row: {
          id: string; school_id: string; full_name_ar: string; student_code: string
          grade_year: number; section: string; stage: string; total_points: number
          attendance_streak_days: number; avatar_url: string | null
          parent_whatsapp: string | null; parent_name_ar: string | null; school_name_ar: string
        }
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
