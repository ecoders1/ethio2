-- ============================================================
-- Fix duplicate exam records
-- Keeps the OLDEST exam (with questions), deletes the extras
-- Run in Supabase SQL Editor
-- ============================================================

-- Step 1: Preview duplicates before deleting
SELECT
  d.name AS department,
  e.year,
  COUNT(*) AS duplicate_count,
  array_agg(e.id ORDER BY e.created_at) AS exam_ids
FROM exams e
JOIN departments d ON d.id = e.department_id
GROUP BY d.name, e.year
HAVING COUNT(*) > 1
ORDER BY d.name, e.year;

-- Step 2: Delete duplicate exams — keeps oldest, removes newer duplicates
-- Questions cascade-delete with the exam due to ON DELETE CASCADE
DELETE FROM exams
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY department_id, year
        ORDER BY created_at ASC  -- keep oldest
      ) AS rn
    FROM exams
  ) ranked
  WHERE rn > 1
);

-- Step 3: Verify — all should now show count = 1
SELECT
  d.name        AS department,
  e.year,
  COUNT(q.id)   AS questions,
  e.is_active,
  e.is_free
FROM exams e
JOIN departments d ON d.id = e.department_id
LEFT JOIN questions q ON q.exam_id = e.id
GROUP BY d.name, e.year, e.is_active, e.is_free
ORDER BY d.name, e.year;
