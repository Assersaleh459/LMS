-- View: v_at_risk_students
-- Flags students meeting any of the three at-risk criteria:
--   1. Absence rate >= 20% in the last 30 days
--   2. Average grade across all entries in the active term < 50%
--   3. Two or more past-due assignments not submitted
CREATE OR REPLACE VIEW public.v_at_risk_students AS
WITH attendance_stats AS (
  SELECT
    u.id                                                        AS student_id,
    u.school_id,
    COUNT(ar.id)                                                AS total_sessions,
    COUNT(ar.id) FILTER (WHERE ar.status = 'absent')            AS absent_sessions,
    CASE
      WHEN COUNT(ar.id) = 0 THEN 0
      ELSE ROUND(COUNT(ar.id) FILTER (WHERE ar.status = 'absent') * 100.0 / COUNT(ar.id), 1)
    END                                                         AS absence_rate
  FROM public.users u
  LEFT JOIN public.attendance_records ar
    ON ar.student_id = u.id
    AND ar.attendance_date >= CURRENT_DATE - INTERVAL '30 days'
  WHERE u.role IN ('kg_primary_student', 'prep_secondary_student')
  GROUP BY u.id, u.school_id
),
grade_stats AS (
  SELECT
    ge.student_id,
    AVG(ge.total_grade * 100.0 / NULLIF(s.total_marks, 0)) AS avg_grade_pct
  FROM public.grade_entries ge
  JOIN public.subjects s ON s.id = ge.subject_id
  JOIN public.academic_terms at2 ON at2.id = ge.term_id AND at2.is_active = true
  GROUP BY ge.student_id
),
missing_assignments AS (
  SELECT
    asub.student_id,
    COUNT(*) AS overdue_count
  FROM public.assignment_submissions asub
  JOIN public.assignments a ON a.id = asub.assignment_id
  WHERE asub.status IN ('pending', 'late')
    AND a.due_date < CURRENT_DATE
  GROUP BY asub.student_id
),
student_info AS (
  SELECT
    u.id, u.school_id,
    (u.first_name_ar || ' ' || u.last_name_ar) AS full_name_ar,
    sp.grade_year, sp.section, sp.stage
  FROM public.users u
  JOIN public.student_profiles sp ON sp.user_id = u.id
  WHERE u.role IN ('kg_primary_student', 'prep_secondary_student')
)
SELECT
  si.id              AS student_id,
  si.school_id,
  si.full_name_ar,
  si.grade_year,
  si.section,
  si.stage,
  COALESCE(ast.absence_rate, 0)    AS absence_rate,
  COALESCE(gs.avg_grade_pct, 0)    AS avg_grade_pct,
  COALESCE(ma.overdue_count, 0)    AS overdue_assignments,
  (COALESCE(ast.absence_rate, 0) >= 20)            AS flag_attendance,
  (COALESCE(gs.avg_grade_pct, 0) < 50
   AND gs.avg_grade_pct IS NOT NULL)               AS flag_grades,
  (COALESCE(ma.overdue_count, 0) >= 2)             AS flag_assignments,
  (
    (COALESCE(ast.absence_rate, 0) >= 20)::int +
    ((COALESCE(gs.avg_grade_pct, 0) < 50 AND gs.avg_grade_pct IS NOT NULL)::int) +
    (COALESCE(ma.overdue_count, 0) >= 2)::int
  )                                                AS risk_score
FROM student_info si
LEFT JOIN attendance_stats ast ON ast.student_id = si.id
LEFT JOIN grade_stats gs       ON gs.student_id  = si.id
LEFT JOIN missing_assignments ma ON ma.student_id = si.id
WHERE (
  COALESCE(ast.absence_rate, 0) >= 20
  OR (COALESCE(gs.avg_grade_pct, 0) < 50 AND gs.avg_grade_pct IS NOT NULL)
  OR COALESCE(ma.overdue_count, 0) >= 2
);
