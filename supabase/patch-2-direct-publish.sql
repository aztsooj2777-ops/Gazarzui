-- ============================================================================
--  ЗАСВАР 2 — ХИЧЭЭЛ ШУУД НИЙТЛЭГДЭХ + СИСТЕМИЙН АДМИН ТОМИЛОХ
--  Supabase → SQL Editor → энэ файлыг бүхэлд нь хуулж тавиад RUN дарна.
--  Дахин дахин ажиллуулж болно (аюулгүй).
-- ============================================================================
-- ############################################################################
--  ЗАСВАР (v2) — ХИЧЭЭЛ БАТЛАХГҮЙГЭЭР ШУУД НИЙТЛЭГДЭНЭ
--  Багш хичээлээ оруулмагц шууд нийтэд харагдана.
--  Дүрэм зөрчсөн, буруу агуулгыг АДМИН өөрөө нуух / устгах эрхтэй.
-- ############################################################################

-- ---------------------------------------------------------------------------
-- 1) Профайлын хамгаалалт: SQL Editor (сервер тал)-аас эрх олгохыг зөвшөөрөх
--    auth.uid() null = JWT байхгүй → зөвхөн SQL Editor / service_role.
--    Анонимыг RLS аль хэдийн хаасан тул энд зөвшөөрөх нь аюулгүй.
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_update()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;                       -- SQL Editor эсвэл админ
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

-- ---------------------------------------------------------------------------
-- 2) Төлөвт «hidden» нэмэх, анхны утгыг «published» болгох
-- ---------------------------------------------------------------------------
alter table public.user_lessons alter column status set default 'published';
alter table public.user_lessons drop constraint if exists user_lessons_status_check;
alter table public.user_lessons
  add constraint user_lessons_status_check
  check (status in ('pending', 'published', 'rejected', 'hidden'));

-- ---------------------------------------------------------------------------
-- 3) Багш/админы хичээл ШУУД нийтлэгдэнэ (хяналт байхгүй)
-- ---------------------------------------------------------------------------
create or replace function public.ul_autopublish()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.my_role() in ('teacher', 'admin') then
    new.status := 'published';
  else
    new.status := 'pending';          -- багш биш хүн ямар ч байсан insert хийж чадахгүй
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ul_autopublish on public.user_lessons;
create trigger trg_ul_autopublish
  before insert on public.user_lessons
  for each row execute function public.ul_autopublish();

-- ---------------------------------------------------------------------------
-- 4) Төлөвийг зөвхөн АДМИН өөрчилнө
--    Админ нуусан хичээлийг зохиогч нь буцааж нийтэлж чадахгүй.
-- ---------------------------------------------------------------------------
create or replace function public.ul_guard_status()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  new.status := old.status;
  new.reject_note := old.reject_note;
  return new;
end;
$$;

drop trigger if exists trg_ul_guard_status on public.user_lessons;
create trigger trg_ul_guard_status
  before update on public.user_lessons
  for each row execute function public.ul_guard_status();

-- ---------------------------------------------------------------------------
-- 5) Шинэ багш шууд идэвхтэй (баталгаажуулалт хүлээхгүй)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  want_role text;
  want_ver  boolean;
begin
  want_role := coalesce(new.raw_user_meta_data->>'role', 'student');
  if want_role not in ('student', 'teacher') then
    want_role := 'student';
  end if;

  if lower(new.email) = 'aztsooj2iiph@moes.edu.mn' then
    want_role := 'admin';             -- системийн админ
  end if;

  want_ver := want_role in ('teacher', 'admin');

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

-- ---------------------------------------------------------------------------
-- 6) Одоо байгаа өгөгдлийг шинэ дүрэмд оруулах
-- ---------------------------------------------------------------------------
-- системийн админ
update public.profiles
   set role = 'admin', verified = true
 where id in (select id from auth.users where lower(email) = 'aztsooj2iiph@moes.edu.mn');

-- бүх багш идэвхтэй
update public.profiles set verified = true where role in ('teacher', 'admin');

-- хяналт хүлээж байсан хичээлүүдийг нийтлэх
update public.user_lessons set status = 'published' where status = 'pending';
