-- ============================================================
-- EEE – Add sample questions to an exam
-- STEP 1: Run the SELECT below to find your exam UUIDs
-- STEP 2: Copy a UUID and replace in the INSERT below
-- ============================================================

-- STEP 1: Find exam IDs
SELECT
  e.id        AS exam_id,
  e.title     AS exam_title,
  e.year,
  d.name      AS department,
  COUNT(q.id) AS questions_already
FROM exams e
JOIN departments d ON d.id = e.department_id
LEFT JOIN questions q ON q.exam_id = e.id
GROUP BY e.id, e.title, e.year, d.name
ORDER BY d.name, e.year;

-- ============================================================
-- STEP 2: Replace the UUID below with one from STEP 1 result
-- Example UUID format: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
-- ============================================================

-- SET THIS TO YOUR REAL EXAM UUID:
\set exam_id 'REPLACE_WITH_REAL_EXAM_UUID'

INSERT INTO questions
  (id, exam_id, question_number, question_text,
   option_a, option_b, option_c, option_d, correct_answer, explanation)
VALUES
(uuid_generate_v4(), :'exam_id'::uuid, 1,
 'Which data structure follows the Last In First Out (LIFO) principle?',
 'Queue', 'Stack', 'Linked List', 'Binary Tree', 'B',
 'A Stack follows LIFO — the last element inserted is the first removed.'),

(uuid_generate_v4(), :'exam_id'::uuid, 2,
 'What is the time complexity of Binary Search on a sorted array?',
 'O(n)', 'O(n²)', 'O(log n)', 'O(n log n)', 'C',
 'Binary Search halves the search space at each step: O(log n).'),

(uuid_generate_v4(), :'exam_id'::uuid, 3,
 'Which of the following is NOT a feature of Object-Oriented Programming?',
 'Encapsulation', 'Inheritance', 'Compilation', 'Polymorphism', 'C',
 'OOP pillars: Encapsulation, Inheritance, Polymorphism, Abstraction.'),

(uuid_generate_v4(), :'exam_id'::uuid, 4,
 'Which SQL command is used to retrieve data from a table?',
 'INSERT', 'UPDATE', 'SELECT', 'DELETE', 'C',
 'SELECT retrieves data from tables in a relational database.'),

(uuid_generate_v4(), :'exam_id'::uuid, 5,
 'Which OSI layer is responsible for routing packets between networks?',
 'Data Link Layer', 'Transport Layer', 'Network Layer', 'Session Layer', 'C',
 'Network Layer (Layer 3) handles routing using protocols like IP.'),

(uuid_generate_v4(), :'exam_id'::uuid, 6,
 'What does CPU stand for?',
 'Central Processing Unit', 'Central Program Unit',
 'Computer Processing Unit', 'Core Processing Unit', 'A',
 'CPU = Central Processing Unit — the brain of the computer.'),

(uuid_generate_v4(), :'exam_id'::uuid, 7,
 'Which programming paradigm treats computation as mathematical functions?',
 'Object-Oriented', 'Procedural', 'Functional', 'Imperative', 'C',
 'Functional programming uses pure functions and avoids mutable state.'),

(uuid_generate_v4(), :'exam_id'::uuid, 8,
 'What is the primary purpose of an operating system?',
 'Run web browsers', 'Manage hardware and software resources',
 'Compile programs', 'Store data permanently', 'B',
 'An OS manages CPU, memory, storage and provides services to applications.'),

(uuid_generate_v4(), :'exam_id'::uuid, 9,
 'In networking, what does IP stand for?',
 'Internet Protocol', 'Internal Process',
 'Input Protocol', 'Integrated Port', 'A',
 'IP (Internet Protocol) provides addressing and routing for data packets.'),

(uuid_generate_v4(), :'exam_id'::uuid, 10,
 'Which of the following is a non-volatile storage device?',
 'RAM', 'Cache', 'Hard Disk Drive', 'CPU Register', 'C',
 'HDD retains data without power. RAM and Cache are volatile.')

ON CONFLICT DO NOTHING;

-- Verify
SELECT exam_id, COUNT(*) as total FROM questions GROUP BY exam_id;
