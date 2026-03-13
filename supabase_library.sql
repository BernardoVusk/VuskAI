-- Create neural_library table
CREATE TABLE IF NOT EXISTS neural_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  image_before_url TEXT NOT NULL,
  image_after_url TEXT NOT NULL,
  video_url TEXT,
  category TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'image',
  mode TEXT NOT NULL DEFAULT 'ARCHITECTURE',
  tutorial_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE neural_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read access for neural_library"
  ON neural_library FOR SELECT
  USING (true);

CREATE POLICY "Allow admin insert for neural_library"
  ON neural_library FOR INSERT
  WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

CREATE POLICY "Allow admin update for neural_library"
  ON neural_library FOR UPDATE
  USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

CREATE POLICY "Allow admin delete for neural_library"
  ON neural_library FOR DELETE
  USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
