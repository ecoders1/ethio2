-- ============================================================
-- EEE – CRITICAL FIX: Remove deny_all RLS policies
-- Run this in Supabase SQL Editor IMMEDIATELY
-- This fixes "no questions after unlock" bug
-- ============================================================

-- The deny_all policies block service_role in some Supabase versions.
-- We remove them and instead rely on service_role key bypass (default behavior).

-- Drop all deny_all policies
DROP POLICY IF EXISTS deny_all ON users;
DROP POLICY IF EXISTS deny_all ON departments;
DROP POLICY IF EXISTS deny_all ON exams;
DROP POLICY IF EXISTS deny_all ON questions;
DROP POLICY IF EXISTS deny_all ON payments;
DROP POLICY IF EXISTS deny_all ON user_department_access;
DROP POLICY IF EXISTS deny_all ON exam_results;
DROP POLICY IF EXISTS deny_all ON app_settings;

-- Disable RLS entirely on all tables
-- (Our API uses service_role key which is safe server-side)
ALTER TABLE users                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments            DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions              DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments               DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_department_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results           DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings           DISABLE ROW LEVEL SECURITY;

-- Grant full access to service_role (should already exist but make explicit)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- Verify: check user_department_access rows
-- SELECT * FROM user_department_access LIMIT 10;
-- SELECT * FROM payments WHERE status = 'approved' LIMIT 10;

-- ============================================================
-- After running this, test by:
-- 1. Admin approves a payment in /admin/payments
-- 2. User opens the department → clicks exam year
-- 3. Exam should show ALL questions
-- ============================================================
