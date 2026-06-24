-- ============================================================
-- EEE (Exit Exam Ethiopia) – COMPLETE SETUP
-- Run this ONCE in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Tables ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name     TEXT        NOT NULL,
  email         TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  device_id     TEXT,
  is_admin      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS departments (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  name_am     TEXT        NOT NULL DEFAULT '',
  name_om     TEXT        NOT NULL DEFAULT '',
  description TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exams (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID        NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  year          INTEGER     NOT NULL,
  title         TEXT        NOT NULL,
  is_free       BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id         UUID        NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_number INTEGER     NOT NULL,
  question_text   TEXT        NOT NULL,
  option_a        TEXT        NOT NULL,
  option_b        TEXT        NOT NULL,
  option_c        TEXT        NOT NULL,
  option_d        TEXT        NOT NULL,
  correct_answer  TEXT        NOT NULL CHECK (correct_answer IN ('A','B','C','D')),
  explanation     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id  UUID          NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  amount         DECIMAL(10,2) NOT NULL DEFAULT 200.00,
  screenshot_url TEXT,
  status         TEXT          NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','approved','rejected')),
  telegram_sent  BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_department_access (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID        NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  granted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, department_id)
);

CREATE TABLE IF NOT EXISTS exam_results (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_id         UUID        NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  score           INTEGER     NOT NULL,
  total_questions INTEGER     NOT NULL,
  answers         JSONB       NOT NULL DEFAULT '{}',
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  key        TEXT        UNIQUE NOT NULL,
  value      TEXT        NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_exams_department ON exams(department_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam   ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_payments_user    ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_access_user      ON user_department_access(user_id);
CREATE INDEX IF NOT EXISTS idx_results_user     ON exam_results(user_id);

-- ── Disable RLS (API uses service_role which is safe) ────────
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

-- ── Storage buckets ──────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES
  ('payment-screenshots', 'payment-screenshots', false),
  ('exam-files', 'exam-files', false)
ON CONFLICT (id) DO NOTHING;

-- ── App settings ─────────────────────────────────────────────
INSERT INTO app_settings (key, value) VALUES
  ('department_price',  '200'),
  ('cbe_account',       '1000458067857'),
  ('telebirr_account',  '0943133184'),
  ('cbe_birr_account',  '0991575614'),
  ('telegram_username', '@milkibn')
ON CONFLICT (key) DO NOTHING;

-- ── Departments ──────────────────────────────────────────────
INSERT INTO departments (id, name, name_am, name_om, description) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'Computer Science',       'ኮምፒዩተር ሳይንስ',    'Saayinsii Kompiyuutaraa',     'Computer Science'),
  ('d0000001-0000-0000-0000-000000000002', 'Information Technology', 'የመረጃ ቴክኖሎጂ',     'Teeknooloojii Odeeffannoo',   'Information Technology'),
  ('d0000001-0000-0000-0000-000000000003', 'Software Engineering',   'ሶፍትዌር ምህንድስና',   'Injinariingii Sooftiweeraa',  'Software Engineering'),
  ('d0000001-0000-0000-0000-000000000004', 'ICT',                    'ኢሲቲ',             'ICT',                         'ICT'),
  ('d0000001-0000-0000-0000-000000000005', 'Nursing',                'ነርሲንግ',            'Narsii',                      'Nursing'),
  ('d0000001-0000-0000-0000-000000000006', 'Accounting',             'አካውንቲንግ',         'Herreegaa',                   'Accounting'),
  ('d0000001-0000-0000-0000-000000000007', 'Economics',              'ኢኮኖሚክስ',          'Dinagdee',                    'Economics'),
  ('d0000001-0000-0000-0000-000000000008', 'Management',             'አስተዳደር',           'Bulchiinsa',                  'Management'),
  ('d0000001-0000-0000-0000-000000000009', 'Civil Engineering',      'ሲቪል ምህንድስና',      'Injinariingii Siviilii',      'Civil Engineering'),
  ('d0000001-0000-0000-0000-000000000010', 'Electrical Engineering', 'ኤሌክትሪካል ምህንድስና', 'Injinariingii Elektirikaala', 'Electrical Engineering')
ON CONFLICT (id) DO NOTHING;

-- ── Sample exam: CS 2015 ──────────────────────────────────────
INSERT INTO exams (id, department_id, year, title, is_free, is_active) VALUES
  ('e0000001-0000-0000-0000-000000000001',
   'd0000001-0000-0000-0000-000000000001',
   2015, 'Computer Science 2015 Exit Exam', FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ── Sample questions for CS 2015 ────────────────────────────
INSERT INTO questions (id, exam_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES
('q0000001-0000-0000-0000-000000000001','e0000001-0000-0000-0000-000000000001',1,'Which data structure follows LIFO?','Queue','Stack','Linked List','Binary Tree','B','Stack follows Last In First Out.'),
('q0000001-0000-0000-0000-000000000002','e0000001-0000-0000-0000-000000000001',2,'Time complexity of Binary Search?','O(n)','O(n²)','O(log n)','O(n log n)','C','Binary Search halves the search space each step.'),
('q0000001-0000-0000-0000-000000000003','e0000001-0000-0000-0000-000000000001',3,'Which is NOT a feature of OOP?','Encapsulation','Inheritance','Compilation','Polymorphism','C','OOP pillars are Encapsulation, Inheritance, Polymorphism, Abstraction.'),
('q0000001-0000-0000-0000-000000000004','e0000001-0000-0000-0000-000000000001',4,'SQL command to retrieve data?','INSERT','UPDATE','SELECT','DELETE','C','SELECT retrieves data from tables.'),
('q0000001-0000-0000-0000-000000000005','e0000001-0000-0000-0000-000000000001',5,'OSI layer for routing?','Data Link','Transport','Network Layer','Session','C','Network Layer (Layer 3) handles IP routing.'),
('q0000001-0000-0000-0000-000000000006','e0000001-0000-0000-0000-000000000001',6,'What does CPU stand for?','Central Processing Unit','Central Program Unit','Computer Processing Unit','Core Processing Unit','A','CPU = Central Processing Unit.'),
('q0000001-0000-0000-0000-000000000007','e0000001-0000-0000-0000-000000000001',7,'Which paradigm uses pure mathematical functions?','Object-Oriented','Procedural','Functional','Imperative','C','Functional programming uses pure functions.'),
('q0000001-0000-0000-0000-000000000008','e0000001-0000-0000-0000-000000000001',8,'Primary purpose of an OS?','Run browsers','Manage hardware and software','Compile code','Store data','B','OS manages CPU, memory, storage.'),
('q0000001-0000-0000-0000-000000000009','e0000001-0000-0000-0000-000000000001',9,'What does IP stand for?','Internet Protocol','Internal Process','Input Protocol','Integrated Port','A','IP provides addressing and routing.'),
('q0000001-0000-0000-0000-000000000010','e0000001-0000-0000-0000-000000000001',10,'Which is non-volatile storage?','RAM','Cache','Hard Disk Drive','CPU Register','C','HDD keeps data without power.')
ON CONFLICT (id) DO NOTHING;

-- ── Admin user (password: Ayyuu@4313@) ───────────────────────
INSERT INTO users (id, full_name, email, password_hash, is_admin) VALUES
  ('a0000001-0000-0000-0000-000000000001',
   'EEE Administrator',
   'milkiyaas43@gmail.com',
   '$2a$12$8kWkwiBpQbfYBbnRDFNVnOenp.48ZtpX.6sHhfbRIBL8bbnfZf6tS',
   TRUE)
ON CONFLICT (email) DO NOTHING;

-- ── Verify setup ─────────────────────────────────────────────
SELECT 'departments' as tbl, COUNT(*) FROM departments
UNION ALL SELECT 'exams', COUNT(*) FROM exams
UNION ALL SELECT 'questions', COUNT(*) FROM questions
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'settings', COUNT(*) FROM app_settings;
