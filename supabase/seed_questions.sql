-- ============================================================
-- EEE – Add questions to ANY existing exam
-- Run in Supabase SQL Editor
-- ============================================================

-- Step 1: Find your exam IDs
SELECT e.id, e.title, e.year, d.name as dept_name,
       COUNT(q.id) as question_count
FROM exams e
JOIN departments d ON d.id = e.department_id
LEFT JOIN questions q ON q.exam_id = e.id
GROUP BY e.id, e.title, e.year, d.name
ORDER BY d.name, e.year;

-- Step 2: Copy an exam ID from above, paste it below, then run the INSERT

-- ============================================================
-- EXAMPLE: Insert 10 sample questions into an exam
-- Replace 'PASTE_EXAM_ID_HERE' with the real exam UUID
-- ============================================================

DO $$
DECLARE
  v_exam_id UUID := 'PASTE_EXAM_ID_HERE';  -- ← CHANGE THIS
  v_dept TEXT;
BEGIN
  -- Verify exam exists
  SELECT d.name INTO v_dept
  FROM exams e JOIN departments d ON d.id = e.department_id
  WHERE e.id = v_exam_id;

  IF v_dept IS NULL THEN
    RAISE EXCEPTION 'Exam not found: %', v_exam_id;
  END IF;

  RAISE NOTICE 'Adding questions to exam for department: %', v_dept;

  INSERT INTO questions
    (id, exam_id, question_number, question_text,
     option_a, option_b, option_c, option_d, correct_answer, explanation)
  VALUES
  (uuid_generate_v4(), v_exam_id, 1,
   'Which data structure follows the Last In First Out (LIFO) principle?',
   'Queue', 'Stack', 'Linked List', 'Binary Tree', 'B',
   'A Stack follows LIFO — the last element inserted is the first removed.'),

  (uuid_generate_v4(), v_exam_id, 2,
   'What is the time complexity of Binary Search on a sorted array of n elements?',
   'O(n)', 'O(n²)', 'O(log n)', 'O(n log n)', 'C',
   'Binary Search halves the search space at each step: O(log n).'),

  (uuid_generate_v4(), v_exam_id, 3,
   'Which of the following is NOT a feature of Object-Oriented Programming?',
   'Encapsulation', 'Inheritance', 'Compilation', 'Polymorphism', 'C',
   'OOP pillars: Encapsulation, Inheritance, Polymorphism, Abstraction. Compilation is not one.'),

  (uuid_generate_v4(), v_exam_id, 4,
   'Which SQL command is used to retrieve data from a table?',
   'INSERT', 'UPDATE', 'SELECT', 'DELETE', 'C',
   'SELECT retrieves data from tables in a relational database.'),

  (uuid_generate_v4(), v_exam_id, 5,
   'Which OSI layer is responsible for routing packets between networks?',
   'Data Link Layer', 'Transport Layer', 'Network Layer', 'Session Layer', 'C',
   'Network Layer (Layer 3) handles routing using protocols like IP.'),

  (uuid_generate_v4(), v_exam_id, 6,
   'What does CPU stand for?',
   'Central Processing Unit', 'Central Program Unit',
   'Computer Processing Unit', 'Core Processing Unit', 'A',
   'CPU stands for Central Processing Unit — the brain of the computer.'),

  (uuid_generate_v4(), v_exam_id, 7,
   'Which programming paradigm treats computation as evaluation of mathematical functions?',
   'Object-Oriented', 'Procedural', 'Functional', 'Imperative', 'C',
   'Functional programming uses pure functions and avoids mutable state.'),

  (uuid_generate_v4(), v_exam_id, 8,
   'What is the primary purpose of an operating system?',
   'Run web browsers', 'Manage hardware and software resources',
   'Compile programs', 'Store data permanently', 'B',
   'An OS manages CPU, memory, storage, and provides services to programs.'),

  (uuid_generate_v4(), v_exam_id, 9,
   'In computer networking, what does IP stand for?',
   'Internet Protocol', 'Internal Process',
   'Input Protocol', 'Integrated Port', 'A',
   'IP (Internet Protocol) provides addressing and routing for packets.'),

  (uuid_generate_v4(), v_exam_id, 10,
   'Which of the following is a non-volatile storage device?',
   'RAM', 'Cache', 'Hard Disk Drive', 'CPU Register', 'C',
   'HDD retains data without power. RAM and Cache are volatile.')

  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Done! 10 questions added to exam %.', v_exam_id;
END $$;

-- Verify
SELECT exam_id, COUNT(*) as total_questions
FROM questions
GROUP BY exam_id
ORDER BY total_questions DESC;
