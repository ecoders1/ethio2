# Supabase SQL Files

Run these files in **Supabase Dashboard → SQL Editor** in order.

## ✅ Run Order

### 1. `SETUP_RUN_THIS_FIRST.sql`
Run **once** on a fresh database.
- Creates all tables (users, departments, exams, questions, payments, etc.)
- Creates all 10 departments
- Creates the admin account
- Creates placeholder exams (2015–2018) for all departments
- Disables RLS (app uses service_role key server-side)

### 2. `fix_rls.sql`
Run if users cannot see questions after unlocking.
- Drops any accidental deny-all RLS policies
- Re-grants service_role permissions

### 3. `civil_engineering_2015_exam.sql`
Inserts all **101 real Civil Engineering 2015** exit exam questions.

### 4. `computer_science_2018_exam.sql`
Inserts all **100 real Computer Science 2018** exit exam questions.

### 5. Admin → Seed Exams (in-app)
Use the admin panel to seed CS 2015 (40 questions) and future exams.

---

## 📋 Utility Files

| File | Purpose |
|---|---|
| `schema.sql` | Schema only (no data). Alternative to SETUP_RUN_THIS_FIRST.sql |
| `seed_questions.sql` | Query to check exam/question counts |
| `add_questions_all_exams.sql` | Clears all questions (use before re-seeding) |
| `seed_cs_exam.sql` | ⚠️ DEPRECATED — replaced by Admin Seed page |
