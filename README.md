# EEE – Exit Exam Ethiopia

> **"Prepare, Practice, Pass."**

A modern, secure, multilingual Exit Exam preparation platform for Ethiopian university students.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Backend | Next.js API Routes (Node.js) |
| Database | Supabase (PostgreSQL) |
| Auth | JWT (jose) + bcryptjs + Cookie sessions |
| Hosting | Vercel |
| Offline | PWA (Service Worker) |
| Languages | English, Amharic (አማርኛ), Afaan Oromo |

---

## Quick Start

### 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/schema.sql`
3. Copy your **Project URL**, **Anon Key**, and **Service Role Key**

### 2. Configure environment

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-32-char-secret-key-here
```

### 3. Create admin account

After starting the app, call once:
```bash
curl -X POST http://localhost:3000/api/admin/seed \
  -H "Content-Type: application/json" \
  -d '{"secret":"eee-seed-2024"}'
```

### 4. Run locally

```bash
npm install
npm run dev
# Open http://localhost:3000
```

### 5. Deploy to Vercel

```bash
npm install -g vercel
vercel
# Add env vars in Vercel dashboard → Settings → Environment Variables
```

---

## Admin Access

| Field | Value |
|-------|-------|
| URL | `/auth/signin` |
| Email | `milkiyaas43@gmail.com` |
| Password | `Ayyuu@4313@` |
| Admin Panel | `/admin` |

---

## Features

### Users
- Sign Up / Sign In with JWT sessions (30-day auto-login)
- Device binding (one account per device)
- Multilingual UI (EN / አማርኛ / Afaan Oromoo)
- PWA — install on phone, works offline

### Exams
- Department-based exam selection (10+ departments)
- 2015–2018 yearly exams
- Questions 1–20 free, 21–100 locked (pay to unlock)
- One question per screen with A/B/C/D options
- Results with score, correct/wrong answers, explanations

### Exam Security
- Copy/paste/cut disabled during exam
- Right-click disabled
- Keyboard shortcuts blocked
- Text selection prevented
- Warning banner on violation

### Payment
- CBE, Telebirr, CBE Birr payment info shown
- Screenshot upload
- Telegram redirect to `@milkibn`
- Admin approves → department unlocked permanently

### Admin Panel
- Dashboard with stats (users, departments, exams, revenue)
- Full CRUD: Users, Departments, Exams, Questions
- File upload + MCQ auto-extraction (TXT/CSV format)
- Payment management (approve/reject → auto-unlock)
- Settings: change prices, payment accounts

### Offline Mode
- Service Worker caches pages
- Continues working without internet
- Auto-syncs when reconnected

---

## MCQ Upload Format (TXT)

```
Q: What is the output of print("Hello")?
A) hello
B) Hello
C) HELLO
D) Error
Answer: B
Explanation: Python print is case-sensitive and outputs as-is.

Q: Which data structure uses LIFO order?
A) Queue
B) Array
C) Stack
D) Tree
Answer: C
Explanation: Stack follows Last In, First Out (LIFO) principle.
```

Separate questions with a blank line. Upload via Admin → Upload Files.

---

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens (HS256, 30-day expiry)
- HttpOnly cookies (XSS protection)
- Rate limiting on auth endpoints
- Admin-only API routes protected server-side
- Middleware guards all protected pages
- Device binding prevents account sharing
- CSRF-safe (SameSite=Lax cookies)

---

## Project Structure

```
eee-app/
├── app/
│   ├── (app)/          # Authenticated user pages
│   │   ├── home/
│   │   ├── departments/
│   │   ├── exams/
│   │   ├── payment/
│   │   └── settings/
│   ├── admin/          # Admin panel
│   ├── auth/           # Sign in / Sign up
│   └── api/            # API routes
├── components/         # Shared UI components
├── contexts/           # Auth & Language providers
├── lib/                # Utilities (auth, supabase, i18n)
├── public/             # Static assets + PWA files
└── supabase/           # Database schema
```
