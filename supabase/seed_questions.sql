-- ============================================================
-- EEE – Add sample questions to an exam
-- 
-- HOW TO USE:
-- 1. Run QUERY 1 to get your exam UUID
-- 2. Copy the UUID
-- 3. In QUERY 2, replace every 'YOUR-UUID-HERE' with your UUID
-- 4. Run QUERY 2
-- ============================================================

-- ── QUERY 1: Get exam UUIDs ───────────────────────────────
SELECT
  e.id          AS "exam_id (copy this)",
  e.title       AS exam_title,
  e.year,
  d.name        AS department,
  COUNT(q.id)   AS questions_uploaded
FROM exams e
JOIN departments d ON d.id = e.department_id
LEFT JOIN questions q ON q.exam_id = e.id
GROUP BY e.id, e.title, e.year, d.name
ORDER BY d.name, e.year;


-- ── QUERY 2: Insert questions ─────────────────────────────
-- Replace ALL 'YOUR-UUID-HERE' with the UUID from QUERY 1

INSERT INTO questions
  (id, exam_id, question_number, question_text,
   option_a, option_b, option_c, option_d, correct_answer, explanation)
VALUES
(uuid_generate_v4(), 'YOUR-UUID-HERE', 1,
 'Which data structure follows the Last In First Out (LIFO) principle?',
 'Queue', 'Stack', 'Linked List', 'Binary Tree', 'B',
 'A Stack follows LIFO — the last element inserted is the first removed.'),

(uuid_generate_v4(), 'YOUR-UUID-HERE', 2,
 'What is the time complexity of Binary Search on a sorted array?',
 'O(n)', 'O(n²)', 'O(log n)', 'O(n log n)', 'C',
 'Binary Search halves the search space at each step: O(log n).'),

(uuid_generate_v4(), 'YOUR-UUID-HERE', 3,
 'Which of the following is NOT a feature of Object-Oriented Programming?',
 'Encapsulation', 'Inheritance', 'Compilation', 'Polymorphism', 'C',
 'OOP pillars: Encapsulation, Inheritance, Polymorphism, Abstraction. Compilation is not one.'),

(uuid_generate_v4(), 'YOUR-UUID-HERE', 4,
 'Which SQL command is used to retrieve data from a table?',
 'INSERT', 'UPDATE', 'SELECT', 'DELETE', 'C',
 'SELECT is used to retrieve data from one or more tables.'),

(uuid_generate_v4(), 'YOUR-UUID-HERE', 5,
 'Which OSI layer is responsible for routing packets between networks?',
 'Data Link Layer', 'Transport Layer', 'Network Layer', 'Session Layer', 'C',
 'Network Layer (Layer 3) handles routing using protocols like IP.'),

(uuid_generate_v4(), 'YOUR-UUID-HERE', 6,
 'What does CPU stand for?',
 'Central Processing Unit', 'Central Program Unit',
 'Computer Processing Unit', 'Core Processing Unit', 'A',
 'CPU = Central Processing Unit — the brain of a computer.'),

(uuid_generate_v4(), 'YOUR-UUID-HERE', 7,
 'Which programming paradigm treats computation as mathematical functions?',
 'Object-Oriented', 'Procedural', 'Functional', 'Imperative', 'C',
 'Functional programming uses pure functions and avoids mutable state.'),

(uuid_generate_v4(), 'YOUR-UUID-HERE', 8,
 'What is the primary purpose of an operating system?',
 'Run web browsers', 'Manage hardware and software resources',
 'Compile programs', 'Store data permanently', 'B',
 'OS manages CPU, memory, storage and provides services to programs.'),

(uuid_generate_v4(), 'YOUR-UUID-HERE', 9,
 'In networking, what does IP stand for?',
 'Internet Protocol', 'Internal Process',
 'Input Protocol', 'Integrated Port', 'A',
 'IP (Internet Protocol) provides addressing and routing for data packets.'),

(uuid_generate_v4(), 'YOUR-UUID-HERE', 10,
 'Which of the following is a non-volatile storage device?',
 'RAM', 'Cache', 'Hard Disk Drive', 'CPU Register', 'C',
 'HDD retains data without power. RAM and Cache are volatile.')

ON CONFLICT DO NOTHING;

-- ── Verify: see question counts per exam ─────────────────
SELECT e.title, e.year, d.name, COUNT(q.id) as total_questions
FROM questions q
JOIN exams e ON e.id = q.exam_id
JOIN departments d ON d.id = e.department_id
GROUP BY e.title, e.year, d.name
ORDER BY d.name, e.year;
