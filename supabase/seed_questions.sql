-- ============================================================
-- EEE – Add questions to an existing exam
-- Run STEP 1 first, then STEP 2 with the UUID you copied
-- ============================================================

-- STEP 1: Run this alone to see your exam IDs
SELECT e.id, e.title, e.year, d.name, COUNT(q.id) AS questions
FROM exams e
JOIN departments d ON d.id = e.department_id
LEFT JOIN questions q ON q.exam_id = e.id
GROUP BY e.id, e.title, e.year, d.name
ORDER BY d.name, e.year;

-- ============================================================
-- STEP 2: Copy a UUID from the result above.
-- Then run this block — it will auto-insert into that exam.
-- Replace the ONE value on line below:
-- ============================================================

DO $$
DECLARE
  v_exam_id UUID;
BEGIN
  -- Paste your exam UUID here (from STEP 1 result):
  SELECT id INTO v_exam_id
  FROM exams
  WHERE title ILIKE '%computer science%'
     OR title ILIKE '%2015%'
  ORDER BY created_at
  LIMIT 1;

  IF v_exam_id IS NULL THEN
    RAISE EXCEPTION 'No exam found. Run STEP 1 first and check exam titles.';
  END IF;

  IF EXISTS (SELECT 1 FROM questions WHERE exam_id = v_exam_id) THEN
    RAISE NOTICE 'Questions already exist for this exam (id: %)', v_exam_id;
    RETURN;
  END IF;

  INSERT INTO questions
    (id, exam_id, question_number, question_text,
     option_a, option_b, option_c, option_d, correct_answer, explanation)
  VALUES
  (uuid_generate_v4(), v_exam_id, 1,
   'Which data structure follows LIFO?',
   'Queue','Stack','Linked List','Binary Tree','B',
   'Stack follows Last In First Out.'),
  (uuid_generate_v4(), v_exam_id, 2,
   'Time complexity of Binary Search?',
   'O(n)','O(n²)','O(log n)','O(n log n)','C',
   'Binary Search halves the search space: O(log n).'),
  (uuid_generate_v4(), v_exam_id, 3,
   'Which is NOT a feature of OOP?',
   'Encapsulation','Inheritance','Compilation','Polymorphism','C',
   'OOP: Encapsulation, Inheritance, Polymorphism, Abstraction.'),
  (uuid_generate_v4(), v_exam_id, 4,
   'SQL command to retrieve data?',
   'INSERT','UPDATE','SELECT','DELETE','C',
   'SELECT retrieves data from tables.'),
  (uuid_generate_v4(), v_exam_id, 5,
   'OSI layer for routing?',
   'Data Link','Transport','Network Layer','Session','C',
   'Network Layer handles IP routing.'),
  (uuid_generate_v4(), v_exam_id, 6,
   'What does CPU stand for?',
   'Central Processing Unit','Central Program Unit',
   'Computer Processing Unit','Core Processing Unit','A',
   'CPU = Central Processing Unit.'),
  (uuid_generate_v4(), v_exam_id, 7,
   'Which paradigm uses pure mathematical functions?',
   'Object-Oriented','Procedural','Functional','Imperative','C',
   'Functional programming uses pure functions.'),
  (uuid_generate_v4(), v_exam_id, 8,
   'Primary purpose of an OS?',
   'Run browsers','Manage hardware and software','Compile code','Store data','B',
   'OS manages CPU, memory, storage.'),
  (uuid_generate_v4(), v_exam_id, 9,
   'What does IP stand for in networking?',
   'Internet Protocol','Internal Process','Input Protocol','Integrated Port','A',
   'IP provides addressing and routing.'),
  (uuid_generate_v4(), v_exam_id, 10,
   'Which is non-volatile storage?',
   'RAM','Cache','Hard Disk Drive','CPU Register','C',
   'HDD keeps data without power. RAM is volatile.');

  RAISE NOTICE 'Done! 10 questions added to exam: %', v_exam_id;
END $$;

-- Verify
SELECT e.title, e.year, d.name, COUNT(q.id) AS total_questions
FROM questions q
JOIN exams e ON e.id = q.exam_id
JOIN departments d ON d.id = e.department_id
GROUP BY e.title, e.year, d.name;
