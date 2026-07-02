-- ============================================================
-- EEE (Exit Exam Ethiopia) – Schema Only (no seed data)
-- Use SETUP_RUN_THIS_FIRST.sql for full setup with sample data
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exams_dept      ON exams(department_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam  ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_payments_user   ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_access_user     ON user_department_access(user_id);
CREATE INDEX IF NOT EXISTS idx_results_user    ON exam_results(user_id);

-- Disable RLS (API uses service_role key)
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
GRANT USAGE ON SCHEMA public TO service_role;

INSERT INTO storage.buckets (id, name, public) VALUES
  ('payment-screenshots', 'payment-screenshots', false),
  ('exam-files', 'exam-files', false)
ON CONFLICT (id) DO NOTHING;
