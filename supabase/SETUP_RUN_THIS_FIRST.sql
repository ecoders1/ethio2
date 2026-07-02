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
  amount         DECIMAL(10,2) NOT NULL DEFAULT 100.00,
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
CREATE INDEX IF NOT EXISTS idx_exams_dept      ON exams(department_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam  ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_payments_user   ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_access_user     ON user_department_access(user_id);
CREATE INDEX IF NOT EXISTS idx_results_user    ON exam_results(user_id);

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
  ('department_price',  '100'),
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

-- ── Exam records only (NO placeholder questions) ─────────────
-- Real questions are added via Admin → Seed Exams in the app
DO $$
DECLARE
  dept_rec  RECORD;
  v_exam_id UUID;
  yr        INTEGER;
BEGIN
  FOR dept_rec IN SELECT id, name FROM departments LOOP
    FOR yr IN SELECT * FROM unnest(ARRAY[2015,2016,2017,2018]) AS t(yr) LOOP
      SELECT id INTO v_exam_id FROM exams
      WHERE department_id = dept_rec.id AND year = yr;

      IF v_exam_id IS NULL THEN
        INSERT INTO exams (id, department_id, year, title, is_free, is_active)
        VALUES (
          uuid_generate_v4(), dept_rec.id, yr,
          dept_rec.name || ' ' || yr || ' Exit Exam',
          FALSE, TRUE
        );
      END IF;
    END LOOP;
  END LOOP;
  RAISE NOTICE 'Done — exam records created. Use Admin → Seed Exams to add real questions.';
END $$;

-- ── Final verification ────────────────────────────────────────
SELECT
  'departments' AS table_name, COUNT(*)::TEXT AS rows FROM departments
UNION ALL SELECT 'exams',     COUNT(*)::TEXT FROM exams
UNION ALL SELECT 'questions', COUNT(*)::TEXT FROM questions
UNION ALL SELECT 'users',     COUNT(*)::TEXT FROM users
UNION ALL SELECT 'settings',  COUNT(*)::TEXT FROM app_settings
ORDER BY table_name;
