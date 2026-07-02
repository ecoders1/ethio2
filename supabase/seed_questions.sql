-- ============================================================
-- EEE – Query: View Exam & Question Status
-- Use this to check what's in the database
-- ============================================================

-- See all exams and their question counts
SELECT
  d.name        AS department,
  e.year,
  e.title,
  e.is_active,
  e.is_free,
  COUNT(q.id)   AS question_count
FROM exams e
JOIN departments d ON d.id = e.department_id
LEFT JOIN questions q ON q.exam_id = e.id
GROUP BY d.name, e.year, e.title, e.is_active, e.is_free
ORDER BY d.name, e.year;
