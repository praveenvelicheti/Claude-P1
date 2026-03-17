-- Framelight initial schema

-- Photographer profiles (extends auth.users)
create table profiles (
  id uuid references auth.users primary key,
  studio_name text,
  logo_url text,
  accent_color text default '#5cbdb9',
  plan text default 'free',
  storage_used_bytes bigint default 0,
  created_at timestamptz default now()
);

-- Galleries
create table galleries (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid references profiles(id) on delete cascade,
  slug text unique not null,
  title text not null,
  client_name text,
  client_email text,
  cover_url text,
  layout text default 'masonry',
  theme text default 'framelight',
  pin_enabled boolean default false,
  pin_code text,
  admin_bypass boolean default true,
  downloads_enabled boolean default true,
  zip_enabled boolean default true,
  favorites_enabled boolean default true,
  download_sizes text default 'both',
  expiry_date date,
  expiry_reminder_days int default 7,
  status text default 'draft',
  view_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Photos within a gallery
create table photos (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid references galleries(id) on delete cascade,
  r2_key text not null,
  url text not null,
  thumb_url text not null,
  filename text,
  size_bytes bigint,
  width int,
  height int,
  position int default 0,
  created_at timestamptz default now()
);

-- Client favorites
create table favorites (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid references galleries(id) on delete cascade,
  session_token text not null,
  photo_id uuid references photos(id) on delete cascade,
  created_at timestamptz default now(),
  unique(session_token, photo_id)
);

-- Download tracking
create table downloads (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid references galleries(id) on delete cascade,
  photo_id uuid references photos(id),
  session_token text,
  is_bulk boolean default false,
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table galleries enable row level security;
alter table photos enable row level security;
alter table favorites enable row level security;
alter table downloads enable row level security;

-- Photographer policies
create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own galleries" on galleries for all using (auth.uid() = photographer_id);
create policy "own photos" on photos for all using (
  gallery_id in (select id from galleries where photographer_id = auth.uid())
);

-- Public read policies
create policy "public galleries" on galleries for select using (status = 'published');
create policy "public photos" on photos for select using (
  gallery_id in (select id from galleries where status = 'published')
);

-- Public write policies
create policy "public favorites" on favorites for all using (true);
create policy "public downloads" on downloads for all using (true);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Updated_at trigger for galleries
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger galleries_updated_at
  before update on galleries
  for each row execute procedure set_updated_at();
