# DMS - Supabase Migration Guide

This document explains how to set up Supabase for the DMS (Discipline Management System) application.

## Prerequisites

- A Supabase account (free tier available at https://supabase.com)
- Node.js installed locally
- The DMS application files

## Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up/login
2. Create a new project
3. Choose a database password (save it securely)
4. Wait for the project to initialize

## Step 2: Get Your Credentials

Once your project is created:

1. Go to **Settings > API**
2. Copy your:
   - **Project URL** (SUPABASE_URL)
   - **anon key** (SUPABASE_ANON_KEY)

## Step 3: Create Database Tables

In your Supabase project, go to **SQL Editor** and run the following SQL:

```sql
-- Schools table
CREATE TABLE schools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_name VARCHAR(255) NOT NULL,
    dod_username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    promo_code VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teachers table
CREATE TABLE teachers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    phone VARCHAR(20),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    profile_image LONGTEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff table
CREATE TABLE staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    position VARCHAR(255),
    phone VARCHAR(20),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    profile_image LONGTEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    class VARCHAR(100) NOT NULL,
    gender VARCHAR(20) CHECK (gender IN ('Male', 'Female')),
    parent_name VARCHAR(255),
    parent_phone VARCHAR(20),
    profile_image LONGTEXT,
    discipline_marks INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classes table
CREATE TABLE classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discipline Requests table
CREATE TABLE discipline_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    class_name VARCHAR(255),
    mistake TEXT NOT NULL,
    marks_removed INTEGER NOT NULL,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('individual', 'class')),
    date TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- Logs table
CREATE TABLE logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    user VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('auth', 'student', 'teacher', 'class', 'discipline', 'staff')),
    action_type VARCHAR(100),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_teachers_school_id ON teachers(school_id);
CREATE INDEX idx_staff_school_id ON staff(school_id);
CREATE INDEX idx_students_school_id ON students(school_id);
CREATE INDEX idx_classes_school_id ON classes(school_id);
CREATE INDEX idx_discipline_requests_school_id ON discipline_requests(school_id);
CREATE INDEX idx_logs_school_id ON logs(school_id);
```

## Step 4: Set Environment Variables

Create or update your `.env` file in the `server` directory:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
PORT=5000
```

Replace the values with your actual Supabase credentials from Step 2.

## Step 5: Install Dependencies

```bash
cd server
npm install
```

The migration removed MongoDB/Mongoose dependencies and added @supabase/supabase-js:
- Removed: `mongoose`
- Added: `@supabase/supabase-js`

## Step 6: Run the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

Your server should start successfully and display:
```
Connected to Supabase successfully!
Server is running on http://localhost:5000
```

## Migration Notes

### What Changed

1. **Models**: Replaced Mongoose schemas with Supabase utility functions
   - Models now return `{ data, error }` objects
   - All model functions accept `supabase` client as first parameter

2. **Routes**: Updated to use Supabase queries
   - All routes now access Supabase via `req.app.locals.supabase`
   - Error handling follows Supabase pattern

3. **ID Format**: 
   - MongoDB ObjectIds → UUID (Supabase default)
   - All ID fields now use UUID format
   - Update frontend code if it references `_id` → use `id` instead

4. **Timestamps**:
   - MongoDB Date objects → ISO 8601 strings (TIMESTAMPTZ)
   - Supabase automatically handles timestamp conversion

### Frontend Changes Required

The frontend (db.js) uses localStorage, so minimal changes needed:
- Update ID references from `_id` to `id` in the API responses
- The current implementation should work as-is since it handles both formats

### Testing the Migration

1. Register a school via `/api/auth/register/school`
2. Register a teacher via `/api/auth/register/teacher`
3. Login as a teacher via `/api/auth/login/teacher`
4. Create students, classes, and discipline requests
5. Check Supabase dashboard to verify data is being stored

## Troubleshooting

### "SUPABASE_URL and SUPABASE_ANON_KEY must be set"
- Verify your `.env` file is in the `server` directory
- Check that the values are copied correctly (no extra spaces)

### Connection errors
- Verify your Supabase project is active
- Check your internet connection
- Ensure the URLs don't have trailing slashes

### "relation does not exist" errors
- Verify all tables were created successfully
- Run the SQL script again in Supabase SQL Editor
- Check table names match exactly (case-sensitive)

### CORS errors
- Supabase handles CORS automatically for anon key
- If issues persist, check your API settings in Supabase console

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Database Best Practices](https://supabase.com/docs/guides/database)

## Security Notes

1. **Never commit `.env` to version control**
2. For production, consider Row Level Security (RLS) policies
3. Use the service role key for admin operations (if needed)
4. Regularly rotate API keys in Supabase settings

## Reverting to MongoDB

If you need to revert, install mongoose and the original models are still in version control.
