-- ============================================================
-- EEE – View and manage questions
-- ============================================================

-- See all exams and question counts
SELECT e.id AS exam_id, e.title, e.year, d.name AS department,
       e.is_active, COUNT(q.id) AS question_count
FROM exams e
JOIN departments d ON d.id = e.department_id
LEFT JOIN questions q ON q.exam_id = e.id
GROUP BY e.id, e.title, e.year, d.name, e.is_active
ORDER BY d.name, e.year;

-- See all questions for a specific exam (replace the UUID):
-- SELECT * FROM questions WHERE exam_id = 'paste-exam-uuid-here' ORDER BY question_number;

-- Delete all questions from an exam (replace the UUID):
-- DELETE FROM questions WHERE exam_id = 'paste-exam-uuid-here';

-- Delete all questions from ALL exams (use with caution):
-- TRUNCATE questions;
