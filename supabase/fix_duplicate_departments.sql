-- ============================================================
-- Fix duplicate departments — guaranteed safe approach
-- Run ALL statements at once in Supabase SQL Editor
-- ============================================================

DO $$
DECLARE
  dup_rec  RECORD;
  keep_id  UUID;
  dup_id   UUID;
BEGIN
  -- Loop over every duplicated department name
  FOR dup_rec IN
    SELECT name
    FROM departments
    GROUP BY name
    HAVING COUNT(*) > 1
  LOOP
    -- Find the ID to keep (oldest)
    SELECT id INTO keep_id
    FROM departments
    WHERE name = dup_rec.name
    ORDER BY created_at ASC
    LIMIT 1;

    -- Process each duplicate (all except the keeper)
    FOR dup_id IN
      SELECT id FROM departments
      WHERE name = dup_rec.name AND id != keep_id
    LOOP
      RAISE NOTICE 'Merging dept "%" dup=% into keep=%', dup_rec.name, dup_id, keep_id;

      -- Move exams
      UPDATE exams SET department_id = keep_id
      WHERE department_id = dup_id;

      -- Move payments
      UPDATE payments SET department_id = keep_id
      WHERE department_id = dup_id;

      -- Delete conflicting access rows (user already has access to keeper)
      DELETE FROM user_department_access
      WHERE department_id = dup_id
        AND user_id IN (
          SELECT user_id FROM user_department_access
          WHERE department_id = keep_id
        );

      -- Move remaining access rows
      UPDATE user_department_access
      SET department_id = keep_id
      WHERE department_id = dup_id;

      -- Delete the duplicate department
      DELETE FROM departments WHERE id = dup_id;

    END LOOP;
  END LOOP;

  -- Remove duplicate exams (same dept + same year, keep the one with most questions)
  FOR dup_rec IN
    SELECT department_id, year
    FROM exams
    GROUP BY department_id, year
    HAVING COUNT(*) > 1
  LOOP
    -- Keep the exam with the most questions
    SELECT id INTO keep_id
    FROM exams
    WHERE department_id = dup_rec.department_id AND year = dup_rec.year
    ORDER BY (SELECT COUNT(*) FROM questions WHERE exam_id = exams.id) DESC, created_at ASC
    LIMIT 1;

    DELETE FROM exams
    WHERE department_id = dup_rec.department_id
      AND year = dup_rec.year
      AND id != keep_id;

    RAISE NOTICE 'Kept exam % for dept % year %', keep_id, dup_rec.department_id, dup_rec.year;
  END LOOP;

  RAISE NOTICE 'Done. All duplicates removed.';
END $$;

-- ── Verify ────────────────────────────────────────────────────
SELECT
  d.name        AS department,
  e.year,
  COUNT(q.id)   AS questions,
  e.is_active,
  e.is_free
FROM departments d
LEFT JOIN exams e ON e.department_id = d.id
LEFT JOIN questions q ON q.exam_id = e.id
GROUP BY d.name, e.year, e.is_active, e.is_free
ORDER BY d.name, e.year;
