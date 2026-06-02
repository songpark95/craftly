-- Migration: Create stitches table
-- Description: Stores stitch techniques separate from full project patterns.
-- Dependencies: None (no ALTER TABLE or data migration for patterns table).

-- 1. Create the stitches table
CREATE TABLE IF NOT EXISTS public.stitches (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name        text NOT NULL,
    type        text NOT NULL CHECK (type IN ('knit', 'crochet')),
    category    text,
    difficulty  integer CHECK (difficulty >= 1 AND difficulty <= 5),
    description text,
    instructions text,
    stitch_key  jsonb,
    chart_data  jsonb,
    tags        text[],
    notes       text,
    saved       boolean NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable Row-Level Security
ALTER TABLE public.stitches ENABLE ROW LEVEL SECURITY;

-- 2a. RLS policies — users can only access their own stitches
CREATE POLICY "Users can select their own stitches"
    ON public.stitches
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own stitches"
    ON public.stitches
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own stitches"
    ON public.stitches
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own stitches"
    ON public.stitches
    FOR DELETE
    USING (user_id = auth.uid());

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stitches_user_id ON public.stitches (user_id);
CREATE INDEX IF NOT EXISTS idx_stitches_type    ON public.stitches (type);

-- 4. Trigger to auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION public.update_stitches_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_stitches_updated_at
    BEFORE UPDATE ON public.stitches
    FOR EACH ROW
    EXECUTE FUNCTION public.update_stitches_updated_at();