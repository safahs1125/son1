-- Deneme Analiz Sistemi Migration
-- Bu dosya Supabase'e manuel olarak uygulanmalıdır

-- 1. Deneme dosya yüklemeleri tablosu
CREATE TABLE IF NOT EXISTS exam_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    uploaded_by VARCHAR(50) NOT NULL CHECK (uploaded_by IN ('student', 'coach')),
    file_url TEXT,
    file_type VARCHAR(20) CHECK (file_type IN ('pdf', 'image', 'manual')),
    exam_date DATE,
    exam_name VARCHAR(255),
    analysis_status VARCHAR(50) DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. AI analiz sonuçları tablosu
CREATE TABLE IF NOT EXISTS exam_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID REFERENCES exam_uploads(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    total_net DECIMAL(10,2),
    subject_breakdown JSONB,
    topic_breakdown JSONB,
    weak_topics JSONB,
    recommendations TEXT,
    ai_raw_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Konu ilerleme durumu tablosu
CREATE TABLE IF NOT EXISTS topic_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    subject VARCHAR(100),
    topic_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'cozulmedi' CHECK (status IN ('tamamlandi', 'devam-ediyor', 'cozulmedi')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, topic_id)
);

-- 4. Branş tarama testi tablosu
CREATE TABLE IF NOT EXISTS brans_tarama (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    lesson VARCHAR(100) NOT NULL,
    correct INTEGER DEFAULT 0,
    wrong INTEGER DEFAULT 0,
    blank INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0,
    net DECIMAL(10,2),
    accuracy DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_exam_uploads_student ON exam_uploads(student_id);
CREATE INDEX idx_exam_uploads_status ON exam_uploads(analysis_status);
CREATE INDEX idx_exam_analysis_student ON exam_analysis(student_id);
CREATE INDEX idx_exam_analysis_upload ON exam_analysis(upload_id);
CREATE INDEX idx_topic_progress_student ON topic_progress(student_id);
CREATE INDEX idx_topic_progress_status ON topic_progress(status);
CREATE INDEX idx_brans_tarama_student ON brans_tarama(student_id);
CREATE INDEX idx_brans_tarama_date ON brans_tarama(date);

-- RLS (Row Level Security) Policies
ALTER TABLE exam_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE brans_tarama ENABLE ROW LEVEL SECURITY;

-- exam_uploads policies
CREATE POLICY "Users can view their own uploads" ON exam_uploads
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own uploads" ON exam_uploads
    FOR INSERT WITH CHECK (true);

-- exam_analysis policies
CREATE POLICY "Users can view their own analysis" ON exam_analysis
    FOR SELECT USING (true);

CREATE POLICY "System can insert analysis" ON exam_analysis
    FOR INSERT WITH CHECK (true);

-- topic_progress policies
CREATE POLICY "Students can view their own progress" ON topic_progress
    FOR SELECT USING (true);

CREATE POLICY "Students can update their own progress" ON topic_progress
    FOR ALL USING (true);

-- brans_tarama policies
CREATE POLICY "Users can view their own tests" ON brans_tarama
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own tests" ON brans_tarama
    FOR INSERT WITH CHECK (true);
