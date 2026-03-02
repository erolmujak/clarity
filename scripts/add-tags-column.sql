-- Add tags column to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create a GIN index for fast tag-based queries
CREATE INDEX IF NOT EXISTS idx_expenses_tags ON expenses USING GIN (tags);
