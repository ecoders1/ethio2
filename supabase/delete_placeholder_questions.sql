-- ============================================================
-- Delete all placeholder/sample questions from ALL exams
-- Keeps exam records intact — only removes questions
-- Run in Supabase SQL Editor
-- ============================================================

-- Step 1: See what will be deleted first (optional preview)
SELECT
  d.name        AS department,
  e.year,
  COUNT(q.id)   AS questions_to_delete
FROM questions q
JOIN exams e ON e.id = q.exam_id
JOIN departments d ON d.id = e.department_id
GROUP BY d.name, e.year
ORDER BY d.name, e.year;

-- Step 2: Delete ALL questions from ALL exams
TRUNCATE questions;

-- Step 3: Verify — all should show 0
SELECT
  d.name        AS department,
  e.year,
  COUNT(q.id)   AS questions_remaining
FROM exams e
JOIN departments d ON d.id = e.department_id
LEFT JOIN questions q ON q.exam_id = e.id
GROUP BY d.name, e.year
ORDER BY d.name, e.year;
