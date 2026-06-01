-- Craftly Database Schema
-- Run this in Supabase Dashboard → SQL Editor → New Query → Paste → Run

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('knit', 'crochet')),
  status TEXT NOT NULL DEFAULT 'wip' CHECK (status IN ('wip', 'queued', 'done')),
  stitch_name TEXT,
  yarn_weight TEXT,
  needle_size TEXT,
  pattern_url TEXT,
  notes TEXT DEFAULT '',
  current_row INTEGER DEFAULT 0,
  total_rows INTEGER,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(user_id, status);

-- ============================================================
-- CRAFTING SESSIONS (timer logs)
-- ============================================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  rows_added INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_project ON sessions(project_id);
CREATE INDEX idx_sessions_user ON sessions(user_id, started_at DESC);

-- ============================================================
-- YARN
-- ============================================================
CREATE TABLE yarn (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  color_hex TEXT DEFAULT '#4A7C59',
  weight TEXT CHECK (weight IN ('lace', 'fingering', 'sport', 'dk', 'worsted', 'bulky', 'jumbo')),
  fiber TEXT,
  quantity INTEGER DEFAULT 1,
  notes TEXT DEFAULT '',
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_yarn_user ON yarn(user_id);

-- ============================================================
-- PROJECT <-> YARN (many-to-many)
-- ============================================================
CREATE TABLE project_yarn (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  yarn_id UUID REFERENCES yarn(id) ON DELETE CASCADE NOT NULL,
  quantity_used INTEGER DEFAULT 1,
  PRIMARY KEY (project_id, yarn_id)
);

-- ============================================================
-- STITCH PATTERNS
-- ============================================================
CREATE TABLE patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('knit', 'crochet')),
  category TEXT CHECK (category IN ('texture', 'cable', 'lace', 'colorwork', 'foundation', 'edging')),
  difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  description TEXT DEFAULT '',
  instructions TEXT DEFAULT '',
  stitch_key JSONB DEFAULT '[]'::jsonb,
  chart_data JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  saved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patterns_user ON patterns(user_id);
CREATE INDEX idx_patterns_saved ON patterns(user_id, saved) WHERE saved = true;

-- ============================================================
-- PROJECT PHOTOS
-- ============================================================
CREATE TABLE project_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_photos_project ON project_photos(project_id);

-- ============================================================
-- ROW HISTORY (daily aggregates)
-- ============================================================
CREATE TABLE row_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  rows_added INTEGER DEFAULT 0,
  time_seconds INTEGER DEFAULT 0,
  UNIQUE(project_id, date)
);

CREATE INDEX idx_row_history_project ON row_history(project_id, date DESC);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE yarn ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_yarn ENABLE ROW LEVEL SECURITY;
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE row_history ENABLE ROW LEVEL SECURITY;

-- Projects: users see only their own
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Sessions
CREATE POLICY "Users can view own sessions" ON sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON sessions FOR UPDATE USING (auth.uid() = user_id);

-- Yarn
CREATE POLICY "Users can view own yarn" ON yarn FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own yarn" ON yarn FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own yarn" ON yarn FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own yarn" ON yarn FOR DELETE USING (auth.uid() = user_id);

-- Project Yarn (check via project ownership)
CREATE POLICY "Users can view own project_yarn" ON project_yarn
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_yarn.project_id AND projects.user_id = auth.uid())
  );
CREATE POLICY "Users can manage own project_yarn" ON project_yarn
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_yarn.project_id AND projects.user_id = auth.uid())
  );

-- Patterns
CREATE POLICY "Users can view own patterns" ON patterns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own patterns" ON patterns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own patterns" ON patterns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own patterns" ON patterns FOR DELETE USING (auth.uid() = user_id);

-- Photos
CREATE POLICY "Users can view own photos" ON project_photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own photos" ON project_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own photos" ON project_photos FOR DELETE USING (auth.uid() = user_id);

-- Row History
CREATE POLICY "Users can view own row_history" ON row_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own row_history" ON row_history FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('project-photos', 'project-photos', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('yarn-photos', 'yarn-photos', true)
  ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('project-photos', 'yarn-photos') AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view photos"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('project-photos', 'yarn-photos'));

CREATE POLICY "Users can delete own photos"
  ON storage.objects FOR DELETE
  USING (bucket_id IN ('project-photos', 'yarn-photos') AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER yarn_updated_at BEFORE UPDATE ON yarn
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER patterns_updated_at BEFORE UPDATE ON patterns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
