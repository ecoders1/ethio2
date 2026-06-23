-- ============================================================
-- EEE (Exit Exam Ethiopia) – Full Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → Run)
-- Safe to re-run: uses IF NOT EXISTS and ON CONFLICT DO NOTHING
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Tables ──────────────────────────────────────────────────

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

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_exams_department ON exams(department_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam   ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_payments_user    ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status  ON payments(status);
CREATE INDEX IF NOT EXISTS idx_access_user      ON user_department_access(user_id);
CREATE INDEX IF NOT EXISTS idx_results_user     ON exam_results(user_id);

-- ─── updated_at trigger ──────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_updated_at    ON users;
DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Storage buckets ─────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-screenshots', 'payment-screenshots', FALSE, 5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exam-files', 'exam-files', FALSE, 20971520,
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/plain','text/csv'
  ]
) ON CONFLICT (id) DO NOTHING;

-- ─── Row Level Security ───────────────────────────────────────
ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_department_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results           ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings           ENABLE ROW LEVEL SECURITY;

-- All real access is via service-role key (bypasses RLS).
-- Block direct anon/authenticated access to all tables.
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users','departments','exams','questions',
    'payments','user_department_access','exam_results','app_settings'
  ] LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS deny_all ON %I;
       CREATE POLICY deny_all ON %I FOR ALL TO anon, authenticated USING (FALSE);',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ─── Seed: App settings ───────────────────────────────────────
INSERT INTO app_settings (key, value) VALUES
  ('department_price',  '200'),
  ('cbe_account',       '1000458067857'),
  ('telebirr_account',  '0943133184'),
  ('cbe_birr_account',  '0991575614'),
  ('telegram_username', '@milkibn')
ON CONFLICT (key) DO NOTHING;

-- ─── Seed: Departments ───────────────────────────────────────
INSERT INTO departments (name, name_am, name_om, description) VALUES
  ('Computer Science',       'ኮምፒዩተር ሳይንስ',    'Saayinsii Kompiyuutaraa',     'Computer Science Department'),
  ('Information Technology', 'የመረጃ ቴክኖሎጂ',     'Teeknooloojii Odeeffannoo',   'Information Technology Department'),
  ('Software Engineering',   'ሶፍትዌር ምህንድስና',   'Injinariingii Sooftiweeraa',  'Software Engineering Department'),
  ('ICT',                    'ኢሲቲ',             'ICT',                         'Information & Communications Technology'),
  ('Nursing',                'ነርሲንግ',            'Narsii',                      'Nursing Department'),
  ('Accounting',             'አካውንቲንግ',         'Herreegaa',                   'Accounting Department'),
  ('Economics',              'ኢኮኖሚክስ',          'Dinagdee',                    'Economics Department'),
  ('Management',             'አስተዳደር',           'Bulchiinsa',                  'Management Department'),
  ('Civil Engineering',      'ሲቪል ምህንድስና',      'Injinariingii Siviilii',      'Civil Engineering Department'),
  ('Electrical Engineering', 'ኤሌክትሪካል ምህንድስና', 'Injinariingii Elektirikaala', 'Electrical Engineering Department')
ON CONFLICT DO NOTHING;

-- ─── Seed: Admin account ─────────────────────────────────────
-- Password: Ayyuu@4313@  (bcrypt hash, 12 rounds)
-- Generated with: bcrypt.hash('Ayyuu@4313@', 12)
-- To regenerate: https://bcrypt-generator.com (rounds=12)
INSERT INTO users (id, full_name, email, password_hash, is_admin)
VALUES (
  uuid_generate_v4(),
  'EEE Administrator',
  'milkiyaas43@gmail.com',
  '$2a$12$8kWkwiBpQbfYBbnRDFNVnOenp.48ZtpX.6sHhfbRIBL8bbnfZf6tS',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- ─── Done ────────────────────────────────────────────────────
-- Admin login:
--   Email:    milkiyaas43@gmail.com
--   Password: Ayyuu@4313@
--   URL:      /auth/signin  →  auto-redirects to /admin
