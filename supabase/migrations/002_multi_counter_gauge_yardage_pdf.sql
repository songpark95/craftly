-- Migration: Add multi-counter, gauge, yardage, and PDF pattern support
-- Run in Supabase SQL Editor

-- ============================================================
-- 1. PROJECT COUNTERS (multiple labeled row counters per project)
-- ============================================================
CREATE TABLE IF NOT EXISTS project_counters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Main',
  current_row INTEGER DEFAULT 0,
  total_rows INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_counters_project ON project_counters(project_id, sort_order);

ALTER TABLE project_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own counters" ON project_counters
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own counters" ON project_counters
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own counters" ON project_counters
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own counters" ON project_counters
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER counters_updated_at BEFORE UPDATE ON project_counters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed: create a "Main" counter for every existing project
INSERT INTO project_counters (project_id, user_id, name, current_row, total_rows, sort_order)
SELECT id, user_id, 'Main', current_row, total_rows, 0
FROM projects
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. GAUGE SWATCH (add to projects table)
-- ============================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS gauge_stitches FLOAT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS gauge_rows FLOAT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS gauge_unit TEXT DEFAULT '4in';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS hook_size TEXT;

-- ============================================================
-- 3. YARDAGE TRACKING
-- ============================================================
ALTER TABLE yarn ADD COLUMN IF NOT EXISTS yardage_per_skein FLOAT;
ALTER TABLE yarn ADD COLUMN IF NOT EXISTS skein_weight TEXT;

ALTER TABLE project_yarn ADD COLUMN IF NOT EXISTS yardage_used FLOAT;
ALTER TABLE project_yarn ADD COLUMN IF NOT EXISTS skeins_used FLOAT;

-- ============================================================
-- 4. PDF PATTERN STORAGE
-- ============================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pattern_pdf_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pattern_pdf_name TEXT;

-- Storage bucket for pattern PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('pattern-pdfs', 'pattern-pdfs', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload pattern PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pattern-pdfs' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view pattern PDFs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pattern-pdfs');

CREATE POLICY "Users can delete own pattern PDFs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'pattern-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);
