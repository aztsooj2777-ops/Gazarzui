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

-- ============================================================================
--  ЭРХИЙН СИСТЕМ: сурагч · багш · админ багш
--  (Энэ хэсгийг дахин ажиллуулахад аюулгүй)
-- ============================================================================

-- ---- profiles: эрх, баталгаажуулалт нэмэх ----
alter table public.profiles add column if not exists role     text not null default 'student';
alter table public.profiles add column if not exists verified boolean not null default false;
alter table public.profiles add column if not exists bio      text;
alter table public.profiles add column if not exists subject  text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_role_check') then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('student', 'teacher', 'admin'));
  end if;
end $$;

-- ---- Багшийн оруулсан хичээл ----
create table if not exists public.user_lessons (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  author_name text not null default 'Багш',
  title       text not null,
  summary     text not null,
  body        text,                                  -- бичмэл хичээлийн агуулга
  kind        text not null default 'text',          -- text | video | link
  url         text,                                  -- видео / гадаад холбоос
  track       text not null default '9-р анги',
  grade       integer,
  tags        text[] not null default '{}',
  status      text not null default 'pending',       -- pending | published | rejected
  reject_note text,
  views       integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists ul_status_idx  on public.user_lessons (status, created_at desc);
create index if not exists ul_user_idx    on public.user_lessons (user_id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_lessons_status_check') then
    alter table public.user_lessons
      add constraint user_lessons_status_check check (status in ('pending', 'published', 'rejected'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'user_lessons_kind_check') then
    alter table public.user_lessons
      add constraint user_lessons_kind_check check (kind in ('text', 'video', 'link'));
  end if;
end $$;

-- ============================================================================
--  Туслах функцууд (RLS дүрэмд ашиглана)
-- ============================================================================
create or replace function public.my_role()
returns text
language sql stable security definer
set search_path = public
as $$ select coalesce((select role from public.profiles where id = auth.uid()), 'student') $$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$ select public.my_role() = 'admin' $$;

create or replace function public.is_verified_teacher()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('teacher', 'admin') and verified = true
  )
$$;

-- ---- Баталгаажсан багшийн хичээл шууд нийтлэгдэнэ ----
create or replace function public.ul_autopublish()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if public.is_verified_teacher() then
    new.status := 'published';
  else
    new.status := 'pending';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ul_autopublish on public.user_lessons;
create trigger trg_ul_autopublish
  before insert on public.user_lessons
  for each row execute function public.ul_autopublish();

-- ============================================================================
--  RLS
-- ============================================================================
alter table public.user_lessons enable row level security;

drop policy if exists "ul read published" on public.user_lessons;
drop policy if exists "ul read own"       on public.user_lessons;
drop policy if exists "ul insert teacher" on public.user_lessons;
drop policy if exists "ul update own"     on public.user_lessons;
drop policy if exists "ul update admin"   on public.user_lessons;
drop policy if exists "ul delete"         on public.user_lessons;

-- Нийтлэгдсэн хичээлийг хэн ч харна; өөрийн болон админ бүгдийг харна
create policy "ul read published" on public.user_lessons for select
  using (status = 'published' or user_id = auth.uid() or public.is_admin());

-- Зөвхөн багш/админ хичээл нэмнэ, өөрийн нэр дээр
create policy "ul insert teacher" on public.user_lessons for insert
  with check (user_id = auth.uid() and public.my_role() in ('teacher', 'admin'));

-- Зохиогч өөрийн хичээлээ засна (статусаа өөрчилж чадахгүй — триггер хамгаална)
create policy "ul update own" on public.user_lessons for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Админ бүгдийг засна (батлах / буцаах)
create policy "ul update admin" on public.user_lessons for update
  using (public.is_admin()) with check (public.is_admin());

create policy "ul delete" on public.user_lessons for delete
  using (user_id = auth.uid() or public.is_admin());

-- ---- profiles: админ бусдын эрхийг өөрчилнө ----
drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

-- ---- Админ хэлэлцүүлгийг модерацлана ----
drop policy if exists "posts admin delete"    on public.posts;
drop policy if exists "comments admin delete" on public.comments;
create policy "posts admin delete"    on public.posts    for delete using (public.is_admin());
create policy "comments admin delete" on public.comments for delete using (public.is_admin());

-- ---- Админ санал хүсэлтийг уншина ----
drop policy if exists "messages admin read" on public.messages;
create policy "messages admin read" on public.messages for select using (public.is_admin());

-- ============================================================================
--  ⚠️  ЭХНИЙ АДМИН БАГШИЙГ ТОМИЛОХ
--  Бүртгүүлсний ДАРАА доорх мөрийг и-мэйлээ бичээд нэг удаа ажиллуулна:
--
--    update public.profiles set role = 'admin', verified = true
--    where id = (select id from auth.users where email = 'таны@имэйл.com');
--
--  Үүний дараа бусад багшийг сайтын «Админ» хуудаснаас баталгаажуулна.
-- ============================================================================

-- ============================================================================
--  Бүртгүүлэхэд сонгосон эрхийг профайлд бичих (дээрх хувилбарыг орлуулна)
--  Багш сонговол verified = false → админ баталгаажуулна.
--  «admin» эрхийг бүртгэлээр авах БОЛОМЖГҮЙ — зөвхөн SQL/админаар олгоно.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  want_role text;
begin
  want_role := coalesce(new.raw_user_meta_data->>'role', 'student');
  if want_role not in ('student', 'teacher') then
    want_role := 'student';
  end if;

  insert into public.profiles (id, display_name, role, verified, school, subject)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Сурагч'),
    want_role,
    false,
    nullif(new.raw_user_meta_data->>'school', ''),
    nullif(new.raw_user_meta_data->>'subject', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Хэрэглэгч өөрөө өөрийн эрх/баталгаажуулалтыг ӨӨРЧИЛЖ ЧАДАХГҮЙ
create or replace function public.guard_profile_update()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;                       -- админ бүгдийг өөрчилнө
  end if;
  new.role := old.role;               -- бусад нь эрхээ өөрчилж чадахгүй
  new.verified := old.verified;
  return new;
end;
$$;

drop trigger if exists trg_guard_profile on public.profiles;
create trigger trg_guard_profile
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ============================================================================
--  ФАЙЛ ХАВСРАЛТ, БАГШ НАРЫН ХЭЛЭЛЦҮҮЛЭГ, СИСТЕМИЙН АДМИН
-- ============================================================================

-- ---- Хичээлд хавсаргасан файл (видео, зураг, хөтөлбөр, баримт) ----
alter table public.user_lessons add column if not exists files jsonb not null default '[]'::jsonb;

-- ---- Хичээл дээрх багш нарын хэлэлцүүлэг ----
create table if not exists public.lesson_comments (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references public.user_lessons(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  author_name text not null default 'Багш',
  author_role text not null default 'teacher',
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists lc_lesson_idx on public.lesson_comments (lesson_id, created_at);

alter table public.lesson_comments enable row level security;

drop policy if exists "lc read"   on public.lesson_comments;
drop policy if exists "lc insert" on public.lesson_comments;
drop policy if exists "lc delete" on public.lesson_comments;

-- Хэлэлцүүлгийг хэн ч уншина (нээлттэй)
create policy "lc read" on public.lesson_comments for select using (true);
-- Санал бичих эрх: багш ба админ
create policy "lc insert" on public.lesson_comments for insert
  with check (user_id = auth.uid() and public.my_role() in ('teacher', 'admin'));
-- Өөрийн саналаа, эсвэл админ бүгдийг устгана
create policy "lc delete" on public.lesson_comments for delete
  using (user_id = auth.uid() or public.is_admin());

-- ============================================================================
--  ФАЙЛЫН САН (Supabase Storage)
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('lesson-files', 'lesson-files', true, 52428800)   -- 50 МБ
on conflict (id) do update set public = true, file_size_limit = 52428800;

drop policy if exists "lf public read"   on storage.objects;
drop policy if exists "lf teacher write" on storage.objects;
drop policy if exists "lf owner delete"  on storage.objects;

create policy "lf public read" on storage.objects for select
  using (bucket_id = 'lesson-files');

create policy "lf teacher write" on storage.objects for insert
  with check (
    bucket_id = 'lesson-files'
    and public.my_role() in ('teacher', 'admin')
    and (storage.foldername(name))[1] = auth.uid()::text   -- өөрийн фолдерт л
  );

create policy "lf owner delete" on storage.objects for delete
  using (
    bucket_id = 'lesson-files'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- ============================================================================
--  СИСТЕМИЙН АДМИН — aztsooj2iiph@moes.edu.mn
--  Энэ хаягаар бүртгүүлмэгц автоматаар админ эрхтэй болно.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  want_role text;
  want_ver  boolean := false;
begin
  want_role := coalesce(new.raw_user_meta_data->>'role', 'student');
  if want_role not in ('student', 'teacher') then
    want_role := 'student';
  end if;

  -- Системийн админ
  if lower(new.email) = 'aztsooj2iiph@moes.edu.mn' then
    want_role := 'admin';
    want_ver  := true;
  end if;

  insert into public.profiles (id, display_name, role, verified, school, subject)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Сурагч'),
    want_role, want_ver,
    nullif(new.raw_user_meta_data->>'school', ''),
    nullif(new.raw_user_meta_data->>'subject', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Хэрэв тухайн хаяг аль хэдийн бүртгүүлсэн бол одоо нь админ болгоно
update public.profiles
   set role = 'admin', verified = true
 where id in (select id from auth.users where lower(email) = 'aztsooj2iiph@moes.edu.mn');
