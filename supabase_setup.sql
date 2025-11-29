-- TYT-AYT Coaching System Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad TEXT NOT NULL,
  soyad TEXT,
  bolum TEXT NOT NULL,
  hedef TEXT,
  notlar TEXT,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create topics table
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  ders TEXT NOT NULL,
  konu TEXT NOT NULL,
  durum TEXT DEFAULT 'baslanmadi' CHECK (durum IN ('baslanmadi', 'devam', 'tamamlandi')),
  sinav_turu TEXT DEFAULT 'TYT' CHECK (sinav_turu IN ('TYT', 'AYT')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  aciklama TEXT NOT NULL,
  sure INTEGER NOT NULL,
  tarih DATE NOT NULL,
  gun TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  tarih DATE NOT NULL,
  sinav_tipi TEXT NOT NULL CHECK (sinav_tipi IN ('TYT', 'AYT')),
  ders TEXT NOT NULL,
  dogru INTEGER NOT NULL DEFAULT 0,
  yanlis INTEGER NOT NULL DEFAULT 0,
  net DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create calendar_notes table
CREATE TABLE IF NOT EXISTS calendar_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_topics_student_id ON topics(student_id);
CREATE INDEX IF NOT EXISTS idx_tasks_student_id ON tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_exams_student_id ON exams(student_id);
CREATE INDEX IF NOT EXISTS idx_calendar_notes_student_id ON calendar_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_students_token ON students(token);

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since we're using tokens)
-- In production, you'd want more sophisticated policies

-- Students policies
CREATE POLICY "Enable read access for all users" ON students FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON students FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON students FOR DELETE USING (true);

-- Topics policies
CREATE POLICY "Enable read access for all users" ON topics FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON topics FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON topics FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON topics FOR DELETE USING (true);

-- Tasks policies
CREATE POLICY "Enable read access for all users" ON tasks FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON tasks FOR DELETE USING (true);

-- Exams policies
CREATE POLICY "Enable read access for all users" ON exams FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON exams FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON exams FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON exams FOR DELETE USING (true);

-- Calendar notes policies
CREATE POLICY "Enable read access for all users" ON calendar_notes FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON calendar_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON calendar_notes FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON calendar_notes FOR DELETE USING (true);
