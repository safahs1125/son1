-- Yeni Özellikler için Database Tabloları
-- Supabase SQL Editor'da çalıştırın

-- Coach Calendar Events
CREATE TABLE IF NOT EXISTS coach_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coach Personal Notes
CREATE TABLE IF NOT EXISTS coach_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Book Recommendations
CREATE TABLE IF NOT EXISTS book_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Kolay', 'Orta', 'Zor')),
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Pool (unassigned tasks)
CREATE TABLE IF NOT EXISTS task_pool (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  aciklama TEXT NOT NULL,
  sure INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coach_calendar_date ON coach_calendar(date);
CREATE INDEX IF NOT EXISTS idx_coach_notes_created ON coach_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_book_recommendations_level ON book_recommendations(level);
CREATE INDEX IF NOT EXISTS idx_task_pool_student ON task_pool(student_id);

-- Enable RLS
ALTER TABLE coach_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_pool ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable all for coach_calendar" ON coach_calendar FOR ALL USING (true);
CREATE POLICY "Enable all for coach_notes" ON coach_notes FOR ALL USING (true);
CREATE POLICY "Enable all for book_recommendations" ON book_recommendations FOR ALL USING (true);
CREATE POLICY "Enable all for task_pool" ON task_pool FOR ALL USING (true);
