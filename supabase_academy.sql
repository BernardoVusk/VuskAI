-- Create academy_modules table
CREATE TABLE IF NOT EXISTS academy_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create academy_lessons table
CREATE TABLE IF NOT EXISTS academy_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES academy_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_id TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE academy_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_lessons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for academy_modules
CREATE POLICY "Allow public read access for academy_modules"
  ON academy_modules FOR SELECT
  USING (true);

CREATE POLICY "Allow admin insert for academy_modules"
  ON academy_modules FOR INSERT
  WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

CREATE POLICY "Allow admin update for academy_modules"
  ON academy_modules FOR UPDATE
  USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

CREATE POLICY "Allow admin delete for academy_modules"
  ON academy_modules FOR DELETE
  USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- RLS Policies for academy_lessons
CREATE POLICY "Allow public read access for academy_lessons"
  ON academy_lessons FOR SELECT
  USING (true);

CREATE POLICY "Allow admin insert for academy_lessons"
  ON academy_lessons FOR INSERT
  WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

CREATE POLICY "Allow admin update for academy_lessons"
  ON academy_lessons FOR UPDATE
  USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

CREATE POLICY "Allow admin delete for academy_lessons"
  ON academy_lessons FOR DELETE
  USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
