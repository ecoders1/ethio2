-- ============================================================
-- EEE – RLS Fix: ensure service-role can read all tables
-- Run this in Supabase SQL Editor if users see no questions
-- after payment is approved.
-- ============================================================

-- The service_role key bypasses RLS by default in Supabase.
-- If you're still seeing issues, run this to explicitly grant
-- service_role full access on the affected tables.

-- Grant service_role full access
GRANT ALL ON user_department_access TO service_role;
GRANT ALL ON questions TO service_role;
GRANT ALL ON exams TO service_role;
GRANT ALL ON payments TO service_role;
GRANT ALL ON users TO service_role;
GRANT ALL ON departments TO service_role;
GRANT ALL ON exam_results TO service_role;
GRANT ALL ON app_settings TO service_role;

-- Also make sure sequences are accessible
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Verify: check if access row exists for a specific user
-- (replace the UUIDs with real values to debug)
-- SELECT * FROM user_department_access WHERE user_id = 'USER_UUID';
-- SELECT * FROM payments WHERE user_id = 'USER_UUID' AND status = 'approved';
