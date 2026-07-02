-- ============================================================
-- EEE – Remove placeholder/sample questions from ALL exams
-- then replace with real questions via the Admin Seed page.
--
-- WARNING: This deletes ALL questions from ALL exams.
-- Only run this if you want to start fresh before seeding
-- real questions via Admin → Seed Exams.
-- ============================================================

-- Step 1: Delete all placeholder questions
TRUNCATE questions;

-- Step 2: Verify — all exams should now show 0 questions
SELECT
  d.name      AS department,
  e.year,
  e.title,
  COUNT(q.id) AS question_count
FROM exams e
JOIN departments d ON d.id = e.department_id
LEFT JOIN questions q ON q.exam_id = e.id
GROUP BY d.name, e.year, e.title
ORDER BY d.name, e.year;

-- Step 3: Go to Admin → Seed Exams and click:
--   🌱 Seed CS 2015    (40 questions)
--   🌱 Seed CS 2018    (100 questions)
--   🌱 Seed Civil 2015 (101 questions)
