export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academic_terms: {
        Row: {
          academic_year: string
          end_date: string
          id: string
          is_active: boolean
          name_ar: string
          school_id: string
          start_date: string
          term_number: number
        }
        Insert: {
          academic_year?: string
          end_date: string
          id?: string
          is_active?: boolean
          name_ar: string
          school_id: string
          start_date: string
          term_number: number
        }
        Update: {
          academic_year?: string
          end_date?: string
          id?: string
          is_active?: boolean
          name_ar?: string
          school_id?: string
          start_date?: string
          term_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "academic_terms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string
          body_ar: string
          created_at: string
          grade_year: number | null
          id: string
          is_pinned: boolean
          school_id: string
          section: string | null
          subject_id: string | null
          title_ar: string
        }
        Insert: {
          author_id: string
          body_ar: string
          created_at?: string
          grade_year?: number | null
          id?: string
          is_pinned?: boolean
          school_id: string
          section?: string | null
          subject_id?: string | null
          title_ar: string
        }
        Update: {
          author_id?: string
          body_ar?: string
          created_at?: string
          grade_year?: number | null
          id?: string
          is_pinned?: boolean
          school_id?: string
          section?: string | null
          subject_id?: string | null
          title_ar?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_student_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          created_at: string
          grade: number | null
          graded_at: string | null
          id: string
          photo_url: string | null
          status: Database["public"]["Enums"]["submission_status"]
          student_id: string
          submitted_at: string | null
          teacher_comment: string | null
          text_answer: string | null
          voice_note_url: string | null
        }
        Insert: {
          assignment_id: string
          created_at?: string
          grade?: number | null
          graded_at?: string | null
          id?: string
          photo_url?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          student_id: string
          submitted_at?: string | null
          teacher_comment?: string | null
          text_answer?: string | null
          voice_note_url?: string | null
        }
        Update: {
          assignment_id?: string
          created_at?: string
          grade?: number | null
          graded_at?: string | null
          id?: string
          photo_url?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          student_id?: string
          submitted_at?: string | null
          teacher_comment?: string | null
          text_answer?: string | null
          voice_note_url?: string | null
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
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_card"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          assignment_type: Database["public"]["Enums"]["assignment_type"]
          created_at: string
          description_ar: string | null
          due_date: string
          grade_category: Database["public"]["Enums"]["grade_type"] | null
          grade_year: number
          id: string
          is_published: boolean
          max_grade: number
          published_at: string | null
          section: string
          subject_id: string
          teacher_id: string
          title_ar: string
          whatsapp_notify: boolean
        }
        Insert: {
          assignment_type: Database["public"]["Enums"]["assignment_type"]
          created_at?: string
          description_ar?: string | null
          due_date: string
          grade_category?: Database["public"]["Enums"]["grade_type"] | null
          grade_year: number
          id?: string
          is_published?: boolean
          max_grade?: number
          published_at?: string | null
          section: string
          subject_id: string
          teacher_id: string
          title_ar: string
          whatsapp_notify?: boolean
        }
        Update: {
          assignment_type?: Database["public"]["Enums"]["assignment_type"]
          created_at?: string
          description_ar?: string | null
          due_date?: string
          grade_category?: Database["public"]["Enums"]["grade_type"] | null
          grade_year?: number
          id?: string
          is_published?: boolean
          max_grade?: number
          published_at?: string | null
          section?: string
          subject_id?: string
          teacher_id?: string
          title_ar?: string
          whatsapp_notify?: boolean
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
          },
          {
            foreignKeyName: "assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "v_student_card"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          attendance_date: string
          created_at: string
          id: string
          note_ar: string | null
          notified_at: string | null
          parent_notified: boolean
          period_number: number
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          subject_id: string | null
          teacher_id: string
        }
        Insert: {
          attendance_date: string
          created_at?: string
          id?: string
          note_ar?: string | null
          notified_at?: string | null
          parent_notified?: boolean
          period_number?: number
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          subject_id?: string | null
          teacher_id: string
        }
        Update: {
          attendance_date?: string
          created_at?: string
          id?: string
          note_ar?: string | null
          notified_at?: string | null
          parent_notified?: boolean
          period_number?: number
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
          subject_id?: string | null
          teacher_id?: string
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
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "v_student_card"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_replies: {
        Row: {
          author_id: string
          body_ar: string
          created_at: string
          id: string
          thread_id: string
        }
        Insert: {
          author_id: string
          body_ar: string
          created_at?: string
          id?: string
          thread_id: string
        }
        Update: {
          author_id?: string
          body_ar?: string
          created_at?: string
          id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_student_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_replies_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "discussion_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_threads: {
        Row: {
          author_id: string
          body_ar: string
          created_at: string
          id: string
          is_locked: boolean
          is_pinned: boolean
          reply_count: number
          subject_id: string
          title_ar: string
        }
        Insert: {
          author_id: string
          body_ar: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          reply_count?: number
          subject_id: string
          title_ar: string
        }
        Update: {
          author_id?: string
          body_ar?: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          reply_count?: number
          subject_id?: string
          title_ar?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_threads_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_threads_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_student_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_threads_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_entries: {
        Row: {
          created_at: string
          entered_by: string
          grade_type: Database["public"]["Enums"]["grade_type"]
          id: string
          photo_url: string | null
          student_id: string
          subject_id: string
          teacher_comment_ar: string | null
          term_id: string | null
          total_grade: number
          voice_note_url: string | null
        }
        Insert: {
          created_at?: string
          entered_by: string
          grade_type: Database["public"]["Enums"]["grade_type"]
          id?: string
          photo_url?: string | null
          student_id: string
          subject_id: string
          teacher_comment_ar?: string | null
          term_id?: string | null
          total_grade: number
          voice_note_url?: string | null
        }
        Update: {
          created_at?: string
          entered_by?: string
          grade_type?: Database["public"]["Enums"]["grade_type"]
          id?: string
          photo_url?: string | null
          student_id?: string
          subject_id?: string
          teacher_comment_ar?: string | null
          term_id?: string | null
          total_grade?: number
          voice_note_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grade_entries_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_entries_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "v_student_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_entries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_entries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_entries_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_entries_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "academic_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string
          id: string
          lesson_id: string
          student_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          lesson_id: string
          student_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          lesson_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_card"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content_text: string | null
          content_type: string
          content_url: string | null
          created_at: string
          duration_min: number | null
          id: string
          is_published: boolean
          order_num: number
          title_ar: string
          unit_id: string
        }
        Insert: {
          content_text?: string | null
          content_type: string
          content_url?: string | null
          created_at?: string
          duration_min?: number | null
          id?: string
          is_published?: boolean
          order_num?: number
          title_ar: string
          unit_id: string
        }
        Update: {
          content_text?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string
          duration_min?: number | null
          id?: string
          is_published?: boolean
          order_num?: number
          title_ar?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_sessions: {
        Row: {
          created_at: string
          duration_min: number
          grade_year: number
          id: string
          meeting_url: string
          scheduled_at: string
          section: string
          subject_id: string
          teacher_id: string
          title_ar: string
        }
        Insert: {
          created_at?: string
          duration_min?: number
          grade_year: number
          id?: string
          meeting_url: string
          scheduled_at: string
          section: string
          subject_id: string
          teacher_id: string
          title_ar: string
        }
        Update: {
          created_at?: string
          duration_min?: number
          grade_year?: number
          id?: string
          meeting_url?: string
          scheduled_at?: string
          section?: string
          subject_id?: string
          teacher_id?: string
          title_ar?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_sessions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_sessions_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "v_student_card"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_student_links: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          parent_id: string
          relationship: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          parent_id: string
          relationship?: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          parent_id?: string
          relationship?: string
          student_id?: string
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
            foreignKeyName: "parent_student_links_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_student_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_student_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_student_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_card"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempt_answers: {
        Row: {
          answer_text: string | null
          attempt_id: string
          id: string
          is_correct: boolean | null
          question_id: string
        }
        Insert: {
          answer_text?: string | null
          attempt_id: string
          id?: string
          is_correct?: boolean | null
          question_id: string
        }
        Update: {
          answer_text?: string | null
          attempt_id?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          id: string
          is_complete: boolean
          max_score: number | null
          quiz_id: string
          score: number | null
          started_at: string
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          id?: string
          is_complete?: boolean
          max_score?: number | null
          quiz_id: string
          score?: number | null
          started_at?: string
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          id?: string
          is_complete?: boolean
          max_score?: number | null
          quiz_id?: string
          score?: number | null
          started_at?: string
          student_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_card"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string | null
          id: string
          options: Json | null
          order_num: number
          points: number
          question_ar: string
          question_type: string
          quiz_id: string
        }
        Insert: {
          correct_answer?: string | null
          id?: string
          options?: Json | null
          order_num?: number
          points?: number
          question_ar: string
          question_type: string
          quiz_id: string
        }
        Update: {
          correct_answer?: string | null
          id?: string
          options?: Json | null
          order_num?: number
          points?: number
          question_ar?: string
          question_type?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          created_by: string
          due_date: string | null
          duration_min: number | null
          grade_year: number
          id: string
          instructions_ar: string | null
          is_published: boolean
          lesson_id: string | null
          max_attempts: number
          pass_score: number
          section: string
          subject_id: string
          title_ar: string
        }
        Insert: {
          created_at?: string
          created_by: string
          due_date?: string | null
          duration_min?: number | null
          grade_year: number
          id?: string
          instructions_ar?: string | null
          is_published?: boolean
          lesson_id?: string | null
          max_attempts?: number
          pass_score?: number
          section: string
          subject_id: string
          title_ar: string
        }
        Update: {
          created_at?: string
          created_by?: string
          due_date?: string | null
          duration_min?: number | null
          grade_year?: number
          id?: string
          instructions_ar?: string | null
          is_published?: boolean
          lesson_id?: string | null
          max_attempts?: number
          pass_score?: number
          section?: string
          subject_id?: string
          title_ar?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_student_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address_ar: string | null
          created_at: string
          governorate: string
          id: string
          is_active: boolean
          logo_url: string | null
          moe_code: string | null
          name_ar: string
          name_en: string | null
          phone: string | null
          school_type: Database["public"]["Enums"]["school_type"]
        }
        Insert: {
          address_ar?: string | null
          created_at?: string
          governorate: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          moe_code?: string | null
          name_ar: string
          name_en?: string | null
          phone?: string | null
          school_type: Database["public"]["Enums"]["school_type"]
        }
        Update: {
          address_ar?: string | null
          created_at?: string
          governorate?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          moe_code?: string | null
          name_ar?: string
          name_en?: string | null
          phone?: string | null
          school_type?: Database["public"]["Enums"]["school_type"]
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          attendance_streak: number
          enrollment_date: string
          grade_year: number
          national_id: string | null
          points_total: number
          section: string
          stage: Database["public"]["Enums"]["education_stage"]
          student_code: string
          user_id: string
        }
        Insert: {
          attendance_streak?: number
          enrollment_date: string
          grade_year: number
          national_id?: string | null
          points_total?: number
          section?: string
          stage: Database["public"]["Enums"]["education_stage"]
          student_code: string
          user_id: string
        }
        Update: {
          attendance_streak?: number
          enrollment_date?: string
          grade_year?: number
          national_id?: string | null
          points_total?: number
          section?: string
          stage?: Database["public"]["Enums"]["education_stage"]
          student_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_student_card"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          activity_marks: number
          grade_year: number
          id: string
          is_active: boolean
          moe_subject_code: string | null
          name_ar: string
          name_en: string | null
          oral_marks: number
          practical_marks: number
          school_id: string
          stage: Database["public"]["Enums"]["education_stage"]
          total_marks: number
          written_marks: number
        }
        Insert: {
          activity_marks?: number
          grade_year: number
          id?: string
          is_active?: boolean
          moe_subject_code?: string | null
          name_ar: string
          name_en?: string | null
          oral_marks?: number
          practical_marks?: number
          school_id: string
          stage: Database["public"]["Enums"]["education_stage"]
          total_marks?: number
          written_marks?: number
        }
        Update: {
          activity_marks?: number
          grade_year?: number
          id?: string
          is_active?: boolean
          moe_subject_code?: string | null
          name_ar?: string
          name_en?: string | null
          oral_marks?: number
          practical_marks?: number
          school_id?: string
          stage?: Database["public"]["Enums"]["education_stage"]
          total_marks?: number
          written_marks?: number
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_subjects: {
        Row: {
          academic_year: string
          grade_year: number
          id: string
          section: string
          subject_id: string
          teacher_id: string
        }
        Insert: {
          academic_year?: string
          grade_year: number
          id?: string
          section: string
          subject_id: string
          teacher_id: string
        }
        Update: {
          academic_year?: string
          grade_year?: number
          id?: string
          section?: string
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "v_student_card"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string
          description_ar: string | null
          id: string
          is_published: boolean
          order_num: number
          subject_id: string
          title_ar: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          id?: string
          is_published?: boolean
          order_num?: number
          subject_id: string
          title_ar: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          id?: string
          is_published?: boolean
          order_num?: number
          subject_id?: string
          title_ar?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name_ar: string
          id: string
          is_active: boolean
          last_login_at: string | null
          last_name_ar: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_id: string
          whatsapp_phone: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name_ar: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          last_name_ar: string
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_id: string
          whatsapp_phone?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name_ar?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          last_name_ar?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string
          whatsapp_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_student_card: {
        Row: {
          attendance_streak_days: number | null
          avatar_url: string | null
          full_name_ar: string | null
          grade_year: number | null
          id: string | null
          parent_name_ar: string | null
          parent_whatsapp: string | null
          school_id: string | null
          school_name_ar: string | null
          section: string | null
          stage: Database["public"]["Enums"]["education_stage"] | null
          student_code: string | null
          total_points: number | null
        }
        Relationships: [
          {
            foreignKeyName: "users_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      assignment_type:
        | "written"
        | "oral"
        | "practical"
        | "project"
        | "quiz"
        | "notebook_photo"
      attendance_status:
        | "present"
        | "absent"
        | "late"
        | "excused"
        | "early_departure"
      education_stage: "kg" | "primary" | "prep" | "secondary"
      grade_type:
        | "written"
        | "oral"
        | "practical"
        | "activity"
        | "exam"
        | "monthly"
        | "final"
      school_type:
        | "public_arabic"
        | "public_experimental"
        | "private_arabic"
        | "private_language"
        | "international"
      submission_status: "pending" | "submitted" | "graded" | "late"
      user_role:
        | "kg_primary_student"
        | "prep_secondary_student"
        | "subject_teacher"
        | "homeroom_teacher"
        | "parent"
        | "school_admin"
        | "it_admin"
        | "chain_admin"
        | "moe_supervisor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      assignment_type: [
        "written",
        "oral",
        "practical",
        "project",
        "quiz",
        "notebook_photo",
      ],
      attendance_status: [
        "present",
        "absent",
        "late",
        "excused",
        "early_departure",
      ],
      education_stage: ["kg", "primary", "prep", "secondary"],
      grade_type: [
        "written",
        "oral",
        "practical",
        "activity",
        "exam",
        "monthly",
        "final",
      ],
      school_type: [
        "public_arabic",
        "public_experimental",
        "private_arabic",
        "private_language",
        "international",
      ],
      submission_status: ["pending", "submitted", "graded", "late"],
      user_role: [
        "kg_primary_student",
        "prep_secondary_student",
        "subject_teacher",
        "homeroom_teacher",
        "parent",
        "school_admin",
        "it_admin",
        "chain_admin",
        "moe_supervisor",
      ],
    },
  },
} as const
