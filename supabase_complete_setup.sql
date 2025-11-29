-- TYT–AYT Koçluk Sistemi - Tam Database Kurulumu
-- Supabase SQL Editor'da bu kodu çalıştırın

-- ====================================
-- 1. TABLOLARI OLUŞTUR
-- ====================================

-- Students tablosu
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

-- Topics tablosu (güncellenmiş - sinav_turu kolonu ile)
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

-- Tasks tablosu (güncellenmiş - verilme_tarihi kolonu ile)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  aciklama TEXT NOT NULL,
  sure INTEGER NOT NULL,
  tarih DATE NOT NULL,
  gun TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  verilme_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exams tablosu
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

-- Calendar notes tablosu
CREATE TABLE IF NOT EXISTS calendar_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================
-- 2. MEVCUT TABLOLARA YENİ KOLONLAR EKLE
-- ====================================

-- Topics tablosuna sinav_turu ekle (eğer yoksa)
ALTER TABLE topics ADD COLUMN IF NOT EXISTS sinav_turu TEXT DEFAULT 'TYT' CHECK (sinav_turu IN ('TYT', 'AYT'));

-- Tasks tablosuna verilme_tarihi ekle (eğer yoksa)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS verilme_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ====================================
-- 3. MEVCUT VERİLERİ GÜNCELLE
-- ====================================

-- Mevcut topics için sinav_turu güncelle
UPDATE topics SET sinav_turu = 'TYT' WHERE ders LIKE '%TYT%' OR sinav_turu IS NULL;
UPDATE topics SET sinav_turu = 'AYT' WHERE ders LIKE '%AYT%';

-- Mevcut tasks için verilme_tarihi yoksa, created_at'i kullan
UPDATE tasks SET verilme_tarihi = created_at WHERE verilme_tarihi IS NULL;

-- ====================================
-- 4. INDEX'LER OLUŞTUR
-- ====================================

CREATE INDEX IF NOT EXISTS idx_topics_student_id ON topics(student_id);
CREATE INDEX IF NOT EXISTS idx_topics_sinav_turu ON topics(sinav_turu);
CREATE INDEX IF NOT EXISTS idx_tasks_student_id ON tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tarih ON tasks(tarih);
CREATE INDEX IF NOT EXISTS idx_tasks_verilme_tarihi ON tasks(verilme_tarihi);
CREATE INDEX IF NOT EXISTS idx_exams_student_id ON exams(student_id);
CREATE INDEX IF NOT EXISTS idx_calendar_notes_student_id ON calendar_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_students_token ON students(token);

-- ====================================
-- 5. ROW LEVEL SECURITY (RLS) AYARLARI
-- ====================================

-- RLS'yi aktif et
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_notes ENABLE ROW LEVEL SECURITY;

-- Students policies
DROP POLICY IF EXISTS "Enable read access for all users" ON students;
CREATE POLICY "Enable read access for all users" ON students FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON students;
CREATE POLICY "Enable insert for all users" ON students FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON students;
CREATE POLICY "Enable update for all users" ON students FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON students;
CREATE POLICY "Enable delete for all users" ON students FOR DELETE USING (true);

-- Topics policies
DROP POLICY IF EXISTS "Enable read access for all users" ON topics;
CREATE POLICY "Enable read access for all users" ON topics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON topics;
CREATE POLICY "Enable insert for all users" ON topics FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON topics;
CREATE POLICY "Enable update for all users" ON topics FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON topics;
CREATE POLICY "Enable delete for all users" ON topics FOR DELETE USING (true);

-- Tasks policies
DROP POLICY IF EXISTS "Enable read access for all users" ON tasks;
CREATE POLICY "Enable read access for all users" ON tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON tasks;
CREATE POLICY "Enable insert for all users" ON tasks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON tasks;
CREATE POLICY "Enable update for all users" ON tasks FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON tasks;
CREATE POLICY "Enable delete for all users" ON tasks FOR DELETE USING (true);

-- Exams policies
DROP POLICY IF EXISTS "Enable read access for all users" ON exams;
CREATE POLICY "Enable read access for all users" ON exams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON exams;
CREATE POLICY "Enable insert for all users" ON exams FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON exams;
CREATE POLICY "Enable update for all users" ON exams FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON exams;
CREATE POLICY "Enable delete for all users" ON exams FOR DELETE USING (true);

-- Calendar notes policies
DROP POLICY IF EXISTS "Enable read access for all users" ON calendar_notes;
CREATE POLICY "Enable read access for all users" ON calendar_notes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON calendar_notes;
CREATE POLICY "Enable insert for all users" ON calendar_notes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON calendar_notes;
CREATE POLICY "Enable update for all users" ON calendar_notes FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON calendar_notes;
CREATE POLICY "Enable delete for all users" ON calendar_notes FOR DELETE USING (true);
