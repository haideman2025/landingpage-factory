-- LP-Factory user accounts + storage schema.
-- Run sections 1-5 in Supabase SQL Editor first.
-- Create the 'lp-assets' PRIVATE Storage bucket, THEN run section 6 (storage policies).

-- ============ 1. profiles: one row per auth user ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  gemini_key_enc text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

-- ============ 2. projects: lightweight config + copy (no image bytes) ============
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled',
  brand text,
  product text,
  status text not null default 'draft',
  config jsonb not null default '{}'::jsonb,
  thumbnail_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.projects enable row level security;
create policy "own projects" on public.projects for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index projects_user_updated on public.projects(user_id, updated_at desc);

-- ============ 3. project_images: index of image files in Storage ============
create table public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  lp_index int not null,
  slot_key text not null,
  kind text not null check (kind in ('lp','ad','ugc')),
  storage_path text not null,
  content_hash text,
  bytes int not null default 0,
  created_at timestamptz not null default now(),
  unique (project_id, lp_index, slot_key)
);
alter table public.project_images enable row level security;
create policy "own images" on public.project_images for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ 4. templates: migrated from localStorage.lpf_templates ============
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.templates enable row level security;
create policy "own templates" on public.templates for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ 5. auto-create a profile row on signup ============
create function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ 6. Storage policies (RUN AFTER creating the 'lp-assets' bucket) ============
-- Path convention: {user_id}/{project_id}/{lp_index}/{slot_key}.jpg  -> foldername[1] = user id
create policy "own files read" on storage.objects for select
  using (bucket_id = 'lp-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files insert" on storage.objects for insert
  with check (bucket_id = 'lp-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files update" on storage.objects for update
  using (bucket_id = 'lp-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files delete" on storage.objects for delete
  using (bucket_id = 'lp-assets' and (storage.foldername(name))[1] = auth.uid()::text);
