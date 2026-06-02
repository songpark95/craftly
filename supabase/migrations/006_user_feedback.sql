-- Migration 006: Todo list, project dates, yarn colors, sock weight

-- ============================================================
-- 1. Project todos (checklist items)
-- ============================================================
CREATE TABLE IF NOT EXISTS project_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE project_todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own todos"
  ON project_todos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own todos"
  ON project_todos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own todos"
  ON project_todos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own todos"
  ON project_todos FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_project_todos_project_id ON project_todos(project_id);

-- ============================================================
-- 2. Project date columns
-- ============================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS date_started DATE DEFAULT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deadline_date DATE DEFAULT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deadline_notes TEXT DEFAULT NULL;

-- ============================================================
-- 3. Yarn multiple colors + sock weight
-- ============================================================
-- Add colors array (JSONB) — primary color stays in color_hex for backward compat
ALTER TABLE yarn ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT NULL;

-- Drop old CHECK constraint and add new one with 'sock' and 'super_bulky'
ALTER TABLE yarn DROP CONSTRAINT IF EXISTS yarn_weight_check;
ALTER TABLE yarn ADD CONSTRAINT yarn_weight_check
  CHECK (weight IN ('lace', 'fingering', 'sock', 'sport', 'dk', 'worsted', 'bulky', 'super_bulky', 'jumbo'));
