-- Migration 007: Project photos (start, progress, final)
-- Replaces single photo_url with a dedicated photos table

-- 1. Create project_photos table
CREATE TABLE IF NOT EXISTS project_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('start', 'progress', 'final')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Unique constraint: one photo per type per project (first wins)
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_photos_type_unique
  ON project_photos(project_id, photo_type);

-- 3. Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_project_photos_project
  ON project_photos(project_id);

-- 4. RLS policies
ALTER TABLE project_photos ENABLE ROW LEVEL SECURITY;

-- Users can read their own project photos
CREATE POLICY "Users read own project photos"
  ON project_photos FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Users can insert photos for their own projects
CREATE POLICY "Users insert own project photos"
  ON project_photos FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Users can update their own project photos
CREATE POLICY "Users update own project photos"
  ON project_photos FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Users can delete their own project photos
CREATE POLICY "Users delete own project photos"
  ON project_photos FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- 5. Migrate existing photo_url data into the new table
-- Existing single photos become 'progress' type (most likely mid-project shots)
INSERT INTO project_photos (project_id, photo_url, photo_type, sort_order, created_at)
SELECT id, photo_url, 'progress', 0, now()
FROM projects
WHERE photo_url IS NOT NULL AND photo_url != ''
ON CONFLICT (project_id, photo_type) DO NOTHING;

-- 6. Drop the old photo_url column (projects table)
ALTER TABLE projects DROP COLUMN IF EXISTS photo_url;
