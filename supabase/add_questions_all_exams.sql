-- ============================================================
-- EEE – Add 10 sample questions to every exam that has 0 questions
-- Just run this as-is — no UUID needed, no placeholders
-- ============================================================

DO $$
DECLARE
  rec RECORD;
  inserted INT := 0;
BEGIN
  FOR rec IN
    SELECT e.id AS exam_id, e.title, d.name AS dept
    FROM exams e
    JOIN departments d ON d.id = e.department_id
    WHERE NOT EXISTS (
      SELECT 1 FROM questions q WHERE q.exam_id = e.id
    )
  LOOP
    RAISE NOTICE 'Adding questions to: % (%)', rec.title, rec.dept;

    INSERT INTO questions
      (id, exam_id, question_number, question_text,
       option_a, option_b, option_c, option_d, correct_answer, explanation)
    VALUES
    (uuid_generate_v4(), rec.exam_id, 1,
     'Which data structure follows the Last In First Out (LIFO) principle?',
     'Queue','Stack','Linked List','Binary Tree','B',
     'A Stack follows LIFO — the last element inserted is the first removed.'),
    (uuid_generate_v4(), rec.exam_id, 2,
     'What is the time complexity of Binary Search on a sorted array?',
     'O(n)','O(n²)','O(log n)','O(n log n)','C',
     'Binary Search halves the search space at each step: O(log n).'),
    (uuid_generate_v4(), rec.exam_id, 3,
     'Which of the following is NOT a feature of Object-Oriented Programming?',
     'Encapsulation','Inheritance','Compilation','Polymorphism','C',
     'OOP pillars: Encapsulation, Inheritance, Polymorphism, Abstraction.'),
    (uuid_generate_v4(), rec.exam_id, 4,
     'Which SQL command is used to retrieve data from a table?',
     'INSERT','UPDATE','SELECT','DELETE','C',
     'SELECT retrieves data from tables in a relational database.'),
    (uuid_generate_v4(), rec.exam_id, 5,
     'Which OSI layer is responsible for routing packets between networks?',
     'Data Link Layer','Transport Layer','Network Layer','Session Layer','C',
     'Network Layer (Layer 3) handles routing using protocols like IP.'),
    (uuid_generate_v4(), rec.exam_id, 6,
     'What does CPU stand for?',
     'Central Processing Unit','Central Program Unit',
     'Computer Processing Unit','Core Processing Unit','A',
     'CPU = Central Processing Unit — the brain of a computer.'),
    (uuid_generate_v4(), rec.exam_id, 7,
     'Which programming paradigm treats computation as mathematical functions?',
     'Object-Oriented','Procedural','Functional','Imperative','C',
     'Functional programming uses pure functions and avoids mutable state.'),
    (uuid_generate_v4(), rec.exam_id, 8,
     'What is the primary purpose of an operating system?',
     'Run web browsers','Manage hardware and software resources',
     'Compile programs','Store data permanently','B',
     'OS manages CPU, memory, storage and provides services to programs.'),
    (uuid_generate_v4(), rec.exam_id, 9,
     'In networking, what does IP stand for?',
     'Internet Protocol','Internal Process',
     'Input Protocol','Integrated Port','A',
     'IP provides addressing and routing for data packets.'),
    (uuid_generate_v4(), rec.exam_id, 10,
     'Which of the following is a non-volatile storage device?',
     'RAM','Cache','Hard Disk Drive','CPU Register','C',
     'HDD retains data without power. RAM and Cache are volatile.');

    inserted := inserted + 1;
  END LOOP;

  IF inserted = 0 THEN
    RAISE NOTICE 'All exams already have questions. Nothing to do.';
  ELSE
    RAISE NOTICE 'Done! Added questions to % exam(s).', inserted;
  END IF;
END $$;

-- Show result
SELECT
  e.title,
  e.year,
  d.name AS department,
  e.is_active,
  COUNT(q.id) AS question_count
FROM exams e
JOIN departments d ON d.id = e.department_id
LEFT JOIN questions q ON q.exam_id = e.id
GROUP BY e.title, e.year, d.name, e.is_active
ORDER BY d.name, e.year;
