-- Add PDF attachment columns to patterns table
ALTER TABLE patterns ADD COLUMN pdf_url TEXT DEFAULT NULL;
ALTER TABLE patterns ADD COLUMN pdf_name TEXT DEFAULT NULL;
