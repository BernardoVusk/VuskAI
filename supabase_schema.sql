-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique,
  full_name text,
  avatar_url text,
  website text,
  updated_at timestamp with time zone,
  
  -- Subscription/Access Expiry Dates
  identity_expiry timestamp with time zone,
  architecture_expiry timestamp with time zone,
  marketplace_expiry timestamp with time zone,

  constraint username_length check (char_length(full_name) >= 3)
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- This trigger automatically creates a profile entry when a new user signs up via Auth.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create a table for analysis history (Background Functions)
create table history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  status text not null default 'processando',
  mode text not null,
  result jsonb,
  error text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table history enable row level security;

create policy "Users can view their own history." on history
  for select using (auth.uid() = user_id);

create policy "Users can insert their own history." on history
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own history." on history
  for update using (auth.uid() = user_id);

-- Create a table for the Prompt Library
create table if not exists neural_library (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  prompt_text text not null,
  category text not null,
  type text not null check (type in ('image', 'video')),
  mode text not null,
  tutorial_url text,
  image_before_url text,
  image_after_url text,
  video_url text,
  created_at timestamp with time zone default now()
);

alter table neural_library enable row level security;

create policy "Library items are viewable by everyone." on neural_library
  for select using (true);

create policy "Only admins can insert library items." on neural_library
  for insert with check (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR 
    auth.email() = 'espetoclips@gmail.com'
  );

create policy "Only admins can update library items." on neural_library
  for update using (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR 
    auth.email() = 'espetoclips@gmail.com'
  );

create policy "Only admins can delete library items." on neural_library
  for delete using (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' OR 
    auth.email() = 'espetoclips@gmail.com'
  );

-- Enable realtime for history table
alter publication supabase_realtime add table history;

-- Sample data for neural_library
INSERT INTO public.neural_library (name, prompt_text, image_after_url, category, type, mode)
VALUES 
('Modern Minimalist Living Room', 'Ultra-realistic 8k render of a modern minimalist living room, floor-to-ceiling windows, soft natural lighting, neutral color palette, high-end furniture, architectural photography.', 'https://picsum.photos/seed/living/800/600', 'Interior', 'image', 'ARCHITECTURE'),
('Futuristic Glass Pavilion', 'Futuristic glass pavilion in a lush forest, organic shapes, evening lighting with warm interior glow, reflections on glass, cinematic atmosphere, 4k resolution.', 'https://picsum.photos/seed/pavilion/800/600', 'Exterior', 'image', 'ARCHITECTURE'),
('Scandinavian Kitchen', 'Scandinavian style kitchen, light wood cabinets, white marble countertops, morning sunlight, realistic textures, clean design.', 'https://picsum.photos/seed/kitchen/800/600', 'Interior', 'image', 'ARCHITECTURE'),
('Luxury Villa Poolside', 'Luxury villa poolside at sunset, infinity pool, tropical landscaping, soft ambient lighting, high-end materials, realistic water reflections.', 'https://picsum.photos/seed/pool/800/600', 'Exterior', 'image', 'ARCHITECTURE')
ON CONFLICT DO NOTHING;
