-- ============================================================================
--  Газарзүй — Supabase өгөгдлийн сангийн бүтэц
--  Ашиглах: Supabase Dashboard → SQL Editor → энэ файлыг бүтнээр нь наагаад Run
--  Дахин ажиллуулахад аюулгүй (idempotent).
-- ============================================================================

-- ---------------------------------------------------------------- profiles --
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Сурагч',
  grade        text,
  school       text,
  created_at   timestamptz not null default now()
);

-- --------------------------------------------------------------- scores ----
create table if not exists public.scores (
  id         bigserial primary key,
  user_id    uuid references auth.users(id) on delete cascade,
  user_name  text not null default 'Зочин',
  kind       text not null,                       -- quiz | game | lesson
  game       text,                                -- quiz | aimag | flags | ...
  score      integer not null default 0,
  max_score  integer,
  meta       jsonb  not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists scores_created_idx on public.scores (created_at desc);
create index if not exists scores_game_idx    on public.scores (game);
create index if not exists scores_user_idx    on public.scores (user_id);

-- ---------------------------------------------------------------- posts ----
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  author_name text not null default 'Зочин',
  category    text not null default 'Асуулт',
  title       text not null,
  body        text not null,
  likes       integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists posts_created_idx  on public.posts (created_at desc);
create index if not exists posts_category_idx on public.posts (category);

-- ----------------------------------------------------------- post_likes ----
create table if not exists public.post_likes (
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ------------------------------------------------------------- comments ----
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  author_name text not null default 'Зочин',
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, created_at);

-- ------------------------------------------------------- lesson_progress ---
create table if not exists public.lesson_progress (
  user_id      uuid not null references auth.users(id) on delete cascade,
  lesson_id    text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- ------------------------------------------------------------- messages ----
-- Санал хүсэлтийн хайрцаг. Бичих нь нээлттэй, унших нь зөвхөн админ.
create table if not exists public.messages (
  id         bigserial primary key,
  name       text not null,
  email      text,
  body       text not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
--  Таалагдсаны тоог автоматаар шинэчлэх
-- ============================================================================
create or replace function public.sync_post_likes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set likes = likes + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.posts set likes = greatest(0, likes - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_post_likes on public.post_likes;
create trigger trg_post_likes
  after insert or delete on public.post_likes
  for each row execute function public.sync_post_likes();

-- ============================================================================
--  Шинэ хэрэглэгч бүртгүүлэхэд профайл автоматаар үүсгэх
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Сурагч')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
--  Row Level Security
-- ============================================================================
alter table public.profiles        enable row level security;
alter table public.scores          enable row level security;
alter table public.posts           enable row level security;
alter table public.post_likes      enable row level security;
alter table public.comments        enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.messages        enable row level security;

-- ---- profiles: бүгд харна, өөрийнхөө мөрийг л засна ----
drop policy if exists "profiles read"   on public.profiles;
drop policy if exists "profiles insert" on public.profiles;
drop policy if exists "profiles update" on public.profiles;
create policy "profiles read"   on public.profiles for select using (true);
create policy "profiles insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---- scores: бүгд харна (тэргүүлэгчид), өөрийн нэрээр л бичнэ ----
drop policy if exists "scores read"   on public.scores;
drop policy if exists "scores insert" on public.scores;
create policy "scores read"   on public.scores for select using (true);
create policy "scores insert" on public.scores for insert with check (auth.uid() = user_id);

-- ---- posts ----
drop policy if exists "posts read"   on public.posts;
drop policy if exists "posts insert" on public.posts;
drop policy if exists "posts update" on public.posts;
drop policy if exists "posts delete" on public.posts;
create policy "posts read"   on public.posts for select using (true);
create policy "posts insert" on public.posts for insert with check (auth.uid() = user_id);
create policy "posts update" on public.posts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "posts delete" on public.posts for delete using (auth.uid() = user_id);

-- ---- post_likes ----
drop policy if exists "likes read"   on public.post_likes;
drop policy if exists "likes insert" on public.post_likes;
drop policy if exists "likes delete" on public.post_likes;
create policy "likes read"   on public.post_likes for select using (true);
create policy "likes insert" on public.post_likes for insert with check (auth.uid() = user_id);
create policy "likes delete" on public.post_likes for delete using (auth.uid() = user_id);

-- ---- comments ----
drop policy if exists "comments read"   on public.comments;
drop policy if exists "comments insert" on public.comments;
drop policy if exists "comments delete" on public.comments;
create policy "comments read"   on public.comments for select using (true);
create policy "comments insert" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments delete" on public.comments for delete using (auth.uid() = user_id);

-- ---- lesson_progress: зөвхөн өөрийнх ----
drop policy if exists "progress own"    on public.lesson_progress;
drop policy if exists "progress insert" on public.lesson_progress;
drop policy if exists "progress update" on public.lesson_progress;
create policy "progress own"    on public.lesson_progress for select using (auth.uid() = user_id);
create policy "progress insert" on public.lesson_progress for insert with check (auth.uid() = user_id);
create policy "progress update" on public.lesson_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- messages: хэн ч бичиж болно, зөвхөн админ (service_role) уншина ----
drop policy if exists "messages insert" on public.messages;
create policy "messages insert" on public.messages for insert with check (true);
-- select policy санаатайгаар үүсгээгүй → anon/authenticated уншиж чадахгүй.

-- ============================================================================
--  Эхлэлийн өгөгдөл (нэг л удаа орно)
-- ============================================================================
insert into public.posts (author_name, category, title, body, likes)
select 'Ц. Азцоож (багш)', 'Зарлал',
       'Тавтай морил! Энэ бол бидний нээлттэй газарзүйн орчин',
       E'Сайн байцгаана уу, сурагчид аа!\n\nЭнд та хичээлээ давтах, тест бөглөх, тоглоом тоглох, асуултаа асуух боломжтой. Хичээлийн явцад ойлгомжгүй зүйл гарвал энд бичээрэй — би болон бусад сурагчид хариулна.\n\nДүрэм ганцхан: бие биенээ хүндэтгэе.',
       0
where not exists (select 1 from public.posts where category = 'Зарлал');
