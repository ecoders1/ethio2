-- ============================================================
-- EEE (Exit Exam Ethiopia) – COMPLETE DATABASE SETUP
-- Run this ONCE in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Drop old deny_all policies if they exist ─────────────────
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users','departments','exams','questions',
    'payments','user_department_access','exam_results','app_settings'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS deny_all ON %I', tbl);
  END LOOP;
END $$;

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
CREATE INDEX IF NOT EXISTS idx_exams_dept    ON exams(department_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_payments_user  ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_access_user    ON user_department_access(user_id);
CREATE INDEX IF NOT EXISTS idx_results_user   ON exam_results(user_id);

-- ── Disable RLS (API uses service_role — safe server-side) ───
ALTER TABLE users                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments            DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions              DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments               DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_department_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results           DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings           DISABLE ROW LEVEL SECURITY;

-- ── Grants ───────────────────────────────────────────────────
GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- ── Storage buckets ──────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-files', 'exam-files', false)
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
INSERT INTO departments (name, name_am, name_om, description) VALUES
  ('Computer Science',       'ኮምፒዩተር ሳይንስ',    'Saayinsii Kompiyuutaraa',     'Computer Science Department'),
  ('Information Technology', 'የመረጃ ቴክኖሎጂ',     'Teeknooloojii Odeeffannoo',   'Information Technology Department'),
  ('Software Engineering',   'ሶፍትዌር ምህንድስና',   'Injinariingii Sooftiweeraa',  'Software Engineering Department'),
  ('ICT',                    'ኢሲቲ',             'ICT',                         'ICT Department'),
  ('Nursing',                'ነርሲንግ',            'Narsii',                      'Nursing Department'),
  ('Accounting',             'አካውንቲንግ',         'Herreegaa',                   'Accounting Department'),
  ('Economics',              'ኢኮኖሚክስ',          'Dinagdee',                    'Economics Department'),
  ('Management',             'አስተዳደር',           'Bulchiinsa',                  'Management Department'),
  ('Civil Engineering',      'ሲቪል ምህንድስና',      'Injinariingii Siviilii',      'Civil Engineering Department'),
  ('Electrical Engineering', 'ኤሌክትሪካል ምህንድስና', 'Injinariingii Elektirikaala', 'Electrical Engineering Department')
ON CONFLICT DO NOTHING;

-- ── Admin account (password: Ayyuu@4313@) ────────────────────
INSERT INTO users (full_name, email, password_hash, is_admin)
VALUES (
  'EEE Administrator',
  'milkiyaas43@gmail.com',
  '$2a$12$8kWkwiBpQbfYBbnRDFNVnOenp.48ZtpX.6sHhfbRIBL8bbnfZf6tS',
  TRUE
) ON CONFLICT (email) DO NOTHING;

-- ── Sample exams + questions for all departments ─────────────
DO $$
DECLARE
  dept_rec  RECORD;
  exam_id   UUID;
  yr        INTEGER;
BEGIN
  FOR dept_rec IN SELECT id, name FROM departments LOOP
    FOR yr IN SELECT * FROM unnest(ARRAY[2015,2016,2017,2018]) AS t(yr) LOOP

      -- Create exam if not exists
      SELECT id INTO exam_id
      FROM exams
      WHERE department_id = dept_rec.id AND year = yr;

      IF exam_id IS NULL THEN
        INSERT INTO exams (id, department_id, year, title, is_free, is_active)
        VALUES (
          uuid_generate_v4(),
          dept_rec.id,
          yr,
          dept_rec.name || ' ' || yr || ' Exit Exam',
          FALSE,
          TRUE
        ) RETURNING id INTO exam_id;
      END IF;

      -- Add questions only if exam is empty
      IF NOT EXISTS (SELECT 1 FROM questions WHERE exam_id = exam_id) THEN
        INSERT INTO questions
          (id, exam_id, question_number, question_text,
           option_a, option_b, option_c, option_d,
           correct_answer, explanation)
        VALUES
        (uuid_generate_v4(), exam_id, 1,
         'What is the primary function of an operating system?',
         'Store files permanently',
         'Manage hardware and software resources',
         'Browse the internet',
         'Run antivirus software',
         'B', 'An OS manages CPU, memory, I/O devices and provides services.'),

        (uuid_generate_v4(), exam_id, 2,
         'Which data structure follows Last In First Out (LIFO)?',
         'Queue', 'Array', 'Stack', 'Linked List',
         'C', 'Stack is LIFO — last inserted is first removed.'),

        (uuid_generate_v4(), exam_id, 3,
         'What does CPU stand for?',
         'Central Program Unit', 'Core Processing Unit',
         'Central Processing Unit', 'Computer Protocol Unit',
         'C', 'CPU = Central Processing Unit, the brain of a computer.'),

        (uuid_generate_v4(), exam_id, 4,
         'Which SQL statement is used to retrieve data?',
         'INSERT', 'DELETE', 'UPDATE', 'SELECT',
         'D', 'SELECT retrieves data from one or more tables.'),

        (uuid_generate_v4(), exam_id, 5,
         'Which of these is NOT a feature of OOP?',
         'Encapsulation', 'Compilation', 'Inheritance', 'Polymorphism',
         'B', 'OOP pillars: Encapsulation, Inheritance, Polymorphism, Abstraction.'),

        (uuid_generate_v4(), exam_id, 6,
         'What is the time complexity of Binary Search?',
         'O(n)', 'O(n²)', 'O(log n)', 'O(n log n)',
         'C', 'Binary search halves the array each step: O(log n).'),

        (uuid_generate_v4(), exam_id, 7,
         'Which protocol is used to send emails?',
         'FTP', 'HTTP', 'SMTP', 'SNMP',
         'C', 'SMTP = Simple Mail Transfer Protocol for sending emails.'),

        (uuid_generate_v4(), exam_id, 8,
         'What is the base of the binary number system?',
         '8', '10', '16', '2',
         'D', 'Binary uses base 2 — only digits 0 and 1.'),

        (uuid_generate_v4(), exam_id, 9,
         'Which OSI layer is responsible for routing?',
         'Session', 'Transport', 'Data Link', 'Network',
         'D', 'Network Layer (Layer 3) routes packets using IP.'),

        (uuid_generate_v4(), exam_id, 10,
         'What does RAM stand for?',
         'Read Access Memory', 'Random Access Memory',
         'Rapid Access Module', 'Read And Modify',
         'B', 'RAM = Random Access Memory, volatile primary storage.'),

        (uuid_generate_v4(), exam_id, 11,
         'Which sorting algorithm has O(n log n) average time complexity?',
         'Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort',
         'C', 'Merge Sort consistently performs at O(n log n).'),

        (uuid_generate_v4(), exam_id, 12,
         'What is polymorphism in OOP?',
         'Multiple inheritance only',
         'Same interface, different implementations',
         'Hiding internal data',
         'Creating multiple objects',
         'B', 'Polymorphism: one interface, many behaviors.'),

        (uuid_generate_v4(), exam_id, 13,
         'What does HTTP stand for?',
         'HyperText Transfer Protocol',
         'High Transfer Text Process',
         'Hyper Terminal Transfer Protocol',
         'HyperText Terminal Program',
         'A', 'HTTP is the foundation protocol of the World Wide Web.'),

        (uuid_generate_v4(), exam_id, 14,
         'Which of the following is a non-volatile storage device?',
         'RAM', 'Cache', 'Hard Disk Drive', 'CPU Register',
         'C', 'HDD retains data without power; RAM is volatile.'),

        (uuid_generate_v4(), exam_id, 15,
         'What is a compiler?',
         'Runs code line by line',
         'Translates source code to machine code',
         'Stores data permanently',
         'Manages memory allocation',
         'B', 'A compiler translates high-level source code to machine code.'),

        (uuid_generate_v4(), exam_id, 16,
         'Which HTML tag is used to create a hyperlink?',
         '<link>', '<a>', '<href>', '<url>',
         'B', 'The <a> anchor tag creates hyperlinks in HTML.'),

        (uuid_generate_v4(), exam_id, 17,
         'What is a primary key in a database?',
         'A key that can be NULL',
         'A key that uniquely identifies each row',
         'A key that can have duplicates',
         'A foreign reference key',
         'B', 'Primary key uniquely identifies each record in a table.'),

        (uuid_generate_v4(), exam_id, 18,
         'What is the result of 0 AND 1 in Boolean algebra?',
         '1', '0', 'True', 'Undefined',
         'B', 'AND returns 1 only when both inputs are 1.'),

        (uuid_generate_v4(), exam_id, 19,
         'Which OSI layer handles data encryption?',
         'Network', 'Transport', 'Presentation', 'Session',
         'C', 'Presentation Layer (Layer 6) handles encryption and formatting.'),

        (uuid_generate_v4(), exam_id, 20,
         'What is encapsulation in OOP?',
         'Inheriting properties from a parent class',
         'Wrapping data and methods into a single unit',
         'Creating multiple instances of a class',
         'Overriding parent class methods',
         'B', 'Encapsulation bundles data and methods, hiding internal details.');

      END IF; -- end if no questions
    END LOOP; -- end year loop
  END LOOP;   -- end dept loop

  RAISE NOTICE 'Sample exams and questions seeded for all departments.';
END $$;

-- ── Final verification ────────────────────────────────────────
SELECT
  'departments' AS table_name, COUNT(*)::TEXT AS rows FROM departments
UNION ALL SELECT 'exams',     COUNT(*)::TEXT FROM exams
UNION ALL SELECT 'questions', COUNT(*)::TEXT FROM questions
UNION ALL SELECT 'users',     COUNT(*)::TEXT FROM users
UNION ALL SELECT 'settings',  COUNT(*)::TEXT FROM app_settings
ORDER BY table_name;
