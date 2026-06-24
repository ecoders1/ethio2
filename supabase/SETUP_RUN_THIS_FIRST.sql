-- ============================================================
-- EEE (Exit Exam Ethiopia) – COMPLETE SETUP
-- Run this ONCE in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste All → Run
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tables
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  device_id TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_am TEXT NOT NULL DEFAULT '',
  name_om TEXT NOT NULL DEFAULT '',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  title TEXT NOT NULL,
  is_free BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A','B','C','D')),
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 200.00,
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  telegram_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS user_department_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, department_id)
);
CREATE TABLE IF NOT EXISTS exam_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exams_dept    ON exams(department_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_payments_user  ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_access_user    ON user_department_access(user_id);
CREATE INDEX IF NOT EXISTS idx_results_user   ON exam_results(user_id);

-- Disable RLS (API uses service_role key — safe)
ALTER TABLE users                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments            DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions              DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments               DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_department_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results           DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings           DISABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('payment-screenshots', 'payment-screenshots', false),
  ('exam-files', 'exam-files', false)
ON CONFLICT (id) DO NOTHING;

-- App settings
INSERT INTO app_settings (key, value) VALUES
  ('department_price',  '200'),
  ('cbe_account',       '1000458067857'),
  ('telebirr_account',  '0943133184'),
  ('cbe_birr_account',  '0991575614'),
  ('telegram_username', '@milkibn')
ON CONFLICT (key) DO NOTHING;

-- Departments
INSERT INTO departments (name, name_am, name_om, description) VALUES
  ('Computer Science',       'ኮምፒዩተር ሳይንስ',    'Saayinsii Kompiyuutaraa',     'Computer Science'),
  ('Information Technology', 'የመረጃ ቴክኖሎጂ',     'Teeknooloojii Odeeffannoo',   'Information Technology'),
  ('Software Engineering',   'ሶፍትዌር ምህንድስና',   'Injinariingii Sooftiweeraa',  'Software Engineering'),
  ('ICT',                    'ኢሲቲ',             'ICT',                         'ICT'),
  ('Nursing',                'ነርሲንግ',            'Narsii',                      'Nursing'),
  ('Accounting',             'አካውንቲንግ',         'Herreegaa',                   'Accounting'),
  ('Economics',              'ኢኮኖሚክስ',          'Dinagdee',                    'Economics'),
  ('Management',             'አስተዳደር',           'Bulchiinsa',                  'Management'),
  ('Civil Engineering',      'ሲቪል ምህንድስና',      'Injinariingii Siviilii',      'Civil Engineering'),
  ('Electrical Engineering', 'ኤሌክትሪካል ምህንድስና', 'Injinariingii Elektirikaala', 'Electrical Engineering')
ON CONFLICT DO NOTHING;

-- Admin user  (password: Ayyuu@4313@)
INSERT INTO users (full_name, email, password_hash, is_admin) VALUES
  ('EEE Administrator', 'milkiyaas43@gmail.com',
   '$2a$12$8kWkwiBpQbfYBbnRDFNVnOenp.48ZtpX.6sHhfbRIBL8bbnfZf6tS',
   TRUE)
ON CONFLICT (email) DO NOTHING;

-- Sample exam + questions for Computer Science
DO $$
DECLARE
  v_dept_id UUID;
  v_exam_id UUID;
BEGIN
  SELECT id INTO v_dept_id FROM departments WHERE name = 'Computer Science' LIMIT 1;

  IF v_dept_id IS NULL THEN
    RAISE NOTICE 'Department not found, skipping sample exam.';
    RETURN;
  END IF;

  -- Create exam if it does not exist
  SELECT id INTO v_exam_id FROM exams
  WHERE department_id = v_dept_id AND year = 2015 LIMIT 1;

  IF v_exam_id IS NULL THEN
    INSERT INTO exams (id, department_id, year, title, is_free, is_active)
    VALUES (uuid_generate_v4(), v_dept_id, 2015,
            'Computer Science 2015 Exit Exam', FALSE, TRUE)
    RETURNING id INTO v_exam_id;
  END IF;

  -- Insert questions only if none exist yet
  IF NOT EXISTS (SELECT 1 FROM questions WHERE exam_id = v_exam_id) THEN
    INSERT INTO questions
      (id, exam_id, question_number, question_text,
       option_a, option_b, option_c, option_d, correct_answer, explanation)
    VALUES
    (uuid_generate_v4(), v_exam_id, 1,
     'Which data structure follows the Last In First Out (LIFO) principle?',
     'Queue','Stack','Linked List','Binary Tree','B',
     'A Stack follows LIFO — the last element inserted is the first removed.'),
    (uuid_generate_v4(), v_exam_id, 2,
     'What is the time complexity of Binary Search on a sorted array?',
     'O(n)','O(n²)','O(log n)','O(n log n)','C',
     'Binary Search halves the search space at each step: O(log n).'),
    (uuid_generate_v4(), v_exam_id, 3,
     'Which of the following is NOT a feature of Object-Oriented Programming?',
     'Encapsulation','Inheritance','Compilation','Polymorphism','C',
     'OOP pillars are Encapsulation, Inheritance, Polymorphism, Abstraction.'),
    (uuid_generate_v4(), v_exam_id, 4,
     'Which SQL command is used to retrieve data from a table?',
     'INSERT','UPDATE','SELECT','DELETE','C',
     'SELECT retrieves data from tables in a relational database.'),
    (uuid_generate_v4(), v_exam_id, 5,
     'Which OSI layer is responsible for routing packets between networks?',
     'Data Link Layer','Transport Layer','Network Layer','Session Layer','C',
     'Network Layer (Layer 3) handles routing using protocols like IP.'),
    (uuid_generate_v4(), v_exam_id, 6,
     'What does CPU stand for?',
     'Central Processing Unit','Central Program Unit',
     'Computer Processing Unit','Core Processing Unit','A',
     'CPU = Central Processing Unit — the brain of a computer.'),
    (uuid_generate_v4(), v_exam_id, 7,
     'Which programming paradigm treats computation as mathematical functions?',
     'Object-Oriented','Procedural','Functional','Imperative','C',
     'Functional programming uses pure functions and avoids mutable state.'),
    (uuid_generate_v4(), v_exam_id, 8,
     'What is the primary purpose of an operating system?',
     'Run web browsers','Manage hardware and software resources',
     'Compile programs','Store data permanently','B',
     'OS manages CPU, memory, storage and provides services to programs.'),
    (uuid_generate_v4(), v_exam_id, 9,
     'In networking, what does IP stand for?',
     'Internet Protocol','Internal Process','Input Protocol','Integrated Port','A',
     'IP (Internet Protocol) provides addressing and routing for data packets.'),
    (uuid_generate_v4(), v_exam_id, 10,
     'Which of the following is a non-volatile storage device?',
     'RAM','Cache','Hard Disk Drive','CPU Register','C',
     'HDD retains data without power. RAM and Cache are volatile.');

    RAISE NOTICE 'Inserted 10 questions for exam id: %', v_exam_id;
  ELSE
    RAISE NOTICE 'Questions already exist for exam id: %', v_exam_id;
  END IF;
END $$;

-- Final check
SELECT 'departments' AS table_name, COUNT(*) AS rows FROM departments
UNION ALL SELECT 'exams',     COUNT(*) FROM exams
UNION ALL SELECT 'questions', COUNT(*) FROM questions
UNION ALL SELECT 'users',     COUNT(*) FROM users
UNION ALL SELECT 'settings',  COUNT(*) FROM app_settings;
