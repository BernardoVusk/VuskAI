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

-- Enable realtime for history table
alter publication supabase_realtime add table history;
