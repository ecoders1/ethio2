-- ============================================================
-- EEE – Sample Computer Science Exam (2015) with 5 Questions
-- Run AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- Step 1: Create the exam (linked to Computer Science department)
INSERT INTO exams (id, department_id, year, title, is_free, is_active)
SELECT
  '11111111-1111-1111-1111-111111111111',
  d.id,
  2015,
  'Computer Science 2015 Exit Exam',
  TRUE,   -- free exam (questions 1-20 accessible without payment)
  TRUE
FROM departments d
WHERE d.name = 'Computer Science'
ON CONFLICT (id) DO NOTHING;

-- Step 2: Insert 5 sample MCQ questions
INSERT INTO questions
  (id, exam_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation)
VALUES
(
  uuid_generate_v4(),
  '11111111-1111-1111-1111-111111111111',
  1,
  'Which data structure follows the Last In First Out (LIFO) principle?',
  'Queue',
  'Stack',
  'Linked List',
  'Binary Tree',
  'B',
  'A Stack follows LIFO — the last element inserted is the first to be removed. A Queue follows FIFO.'
),
(
  uuid_generate_v4(),
  '11111111-1111-1111-1111-111111111111',
  2,
  'What is the time complexity of Binary Search on a sorted array of n elements?',
  'O(n)',
  'O(n²)',
  'O(log n)',
  'O(n log n)',
  'C',
  'Binary Search divides the search space in half at each step, giving O(log n) time complexity.'
),
(
  uuid_generate_v4(),
  '11111111-1111-1111-1111-111111111111',
  3,
  'Which of the following is NOT a feature of Object-Oriented Programming?',
  'Encapsulation',
  'Inheritance',
  'Compilation',
  'Polymorphism',
  'C',
  'The four main pillars of OOP are Encapsulation, Inheritance, Polymorphism, and Abstraction. Compilation is not a feature of OOP.'
),
(
  uuid_generate_v4(),
  '11111111-1111-1111-1111-111111111111',
  4,
  'In a relational database, which SQL command is used to retrieve data from a table?',
  'INSERT',
  'UPDATE',
  'SELECT',
  'DELETE',
  'C',
  'SELECT is the SQL command used to query and retrieve data from one or more tables in a relational database.'
),
(
  uuid_generate_v4(),
  '11111111-1111-1111-1111-111111111111',
  5,
  'Which layer of the OSI model is responsible for routing packets between networks?',
  'Data Link Layer',
  'Transport Layer',
  'Network Layer',
  'Session Layer',
  'C',
  'The Network Layer (Layer 3) handles logical addressing and routing of data packets between different networks using protocols like IP.'
)
ON CONFLICT DO NOTHING;

-- Verify
SELECT e.title, e.year, count(q.id) as question_count
FROM exams e
LEFT JOIN questions q ON q.exam_id = e.id
WHERE e.id = '11111111-1111-1111-1111-111111111111'
GROUP BY e.title, e.year;
