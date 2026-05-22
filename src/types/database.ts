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
