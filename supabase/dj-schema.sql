-- No Dice — DJ portal schema + seed. Run once in Supabase → SQL Editor → New query → Run.
-- Tables are accessed ONLY via the edge functions (service role); no public RLS policies.

create extension if not exists pgcrypto;

create table if not exists public.djs (
  id          uuid primary key default gen_random_uuid(),
  token       text not null unique default encode(gen_random_bytes(16),'hex'),  -- the DJ's private link key
  dj_name     text not null,
  real_name   text,
  genres      text,
  instagram   text,
  format      text,
  phone       text,
  email       text,
  image_url   text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.djs enable row level security;

create table if not exists public.dj_slots (
  id          uuid primary key default gen_random_uuid(),
  date        date not null unique,
  status      text not null default 'open',          -- open | pending | confirmed
  dj_id       uuid references public.djs(id) on delete set null,
  night_name  text,
  genre       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table public.dj_slots enable row level security;

-- Columns added after the first release (kept here so a fresh run matches live).
-- djs.format holds " / "-joined tick-box values: CDJ / Vinyl / Live.
alter table public.djs add column if not exists soundcloud text;
alter table public.djs add column if not exists spotify text;
alter table public.djs add column if not exists youtube text;
-- Vetted vs pending (unvetted) roster. Existing rows default to 'vetted'.
alter table public.djs add column if not exists status text not null default 'vetted';   -- 'vetted' | 'pending'
alter table public.djs add column if not exists source text;          -- 'import' | 'instagram' | 'csv-extended' | 'manual'
alter table public.djs add column if not exists vetted_at timestamptz;
-- First time the profile became complete — drives the one-time "DJ signed up" email
-- (admin + DJ). Back-filled for already-complete DJs so they don't get it retroactively.
alter table public.djs add column if not exists signed_up_at timestamptz;
-- Resident tier — guaranteed-monthly DJs who get first dibs on each month's new dates.
alter table public.djs add column if not exists resident boolean not null default false;

-- Single-row state for the monthly resident release window (messaging-order, not a
-- hard booking lock). started_at = when the priority group was messaged; the admin
-- UI counts 24h from there, with a 6h "closing soon" marker. opened_all_at = when the
-- founder released to everyone else.
create table if not exists public.dj_release_state (
  id           smallint primary key default 1,
  month        text,
  started_at   timestamptz,
  opened_all_at timestamptz,
  updated_at   timestamptz default now(),
  constraint dj_release_singleton check (id = 1)
);
alter table public.dj_release_state enable row level security;   -- service-role only

alter table public.dj_slots add column if not exists genres jsonb default '[]'::jsonb;
alter table public.dj_slots add column if not exists subgenres jsonb default '[]'::jsonb;
alter table public.dj_slots add column if not exists kind text;          -- session | opendecks
alter table public.dj_slots add column if not exists promo_track text;   -- required for every night (drives the IG post)
alter table public.dj_slots add column if not exists promo_ok boolean default false;
alter table public.dj_slots add column if not exists set_type text;      -- open decks: dj_set | records | listening
-- Date-hold reservation: a DJ picks an open date (status='held') and has 24h to finish.
alter table public.dj_slots add column if not exists held_at timestamptz;        -- when the hold started (deadline = +24h)
alter table public.dj_slots add column if not exists reminder_sent boolean default false;  -- 2h-warning email sent
alter table public.dj_slots add column if not exists event_image_url text;  -- per-event artwork (overrides DJ profile photo for that night)
-- Admin can temporarily hide a confirmed event from the public feed without deleting
-- it (Events tab → Suspend / Restore). Stays in admin; excluded from events-feed.
alter table public.dj_slots add column if not exists suspended boolean not null default false;
-- A day can have >1 session (Saturdays: 'main' evening + 'sat_pm' afternoon). Key by (date, slot).
alter table public.dj_slots add column if not exists slot text not null default 'main';
-- Replace the original UNIQUE(date) with UNIQUE(date, slot). Idempotent — already
-- applied to the live DB; safe to re-run on a fresh setup.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'dj_slots_date_slot_key' and conrelid = 'public.dj_slots'::regclass) then
    alter table public.dj_slots drop constraint if exists dj_slots_date_key;
    alter table public.dj_slots add constraint dj_slots_date_slot_key unique (date, slot);
  end if;
end $$;

-- ── AI caption rate limiting (cost kill-switch for the dj-caption function) ──
-- dj-caption calls a PAID API (Claude). SEND_SECRET ships in the public bundle,
-- so it isn't a real secret — we cap spend server-side regardless of who calls.
-- One row per (bucket, time-window): 'global:<date>' and 'ip:<ip>:<window>'.
create table if not exists public.ai_rate (
  bucket      text primary key,
  count       int not null default 0,
  expires_at  timestamptz not null default now() + interval '1 day'
);
alter table public.ai_rate enable row level security;   -- service-role only; no public policies

-- Atomically increment a bucket's counter and return the new value (so a burst of
-- concurrent calls can't slip past the cap via read-modify-write races).
create or replace function public.bump_ai_rate(p_bucket text, p_ttl_seconds int)
returns int language plpgsql as $$
declare c int;
begin
  insert into public.ai_rate (bucket, count, expires_at)
    values (p_bucket, 1, now() + make_interval(secs => p_ttl_seconds))
  on conflict (bucket) do update set count = public.ai_rate.count + 1
  returning count into c;
  delete from public.ai_rate where expires_at < now() - interval '1 day';  -- opportunistic cleanup
  return c;
end $$;

-- Public photo storage for DJ profile images
insert into storage.buckets (id, name, public) values ('dj-photos','dj-photos',true)
  on conflict (id) do nothing;

-- Seed the vetted roster
insert into public.djs (dj_name, real_name, genres, instagram, format, phone, email) values
  ('Aaliah','Aaliah','Vocal House / Funk / Garage','@aaliahsimpson','CDJ','07794543074',''),
  ('Andre Masters','Andreas Constantinou','Sould / Funk / High Life','@andremasters_','VINYL','07366347118',''),
  ('Beats Kebab','Babi Jani','Middle eastern Folk / global / rare grooves','@babak_jani','VINYL','07519574982',''),
  ('Bruno Balbino','Bruno Balbino','Amapiano / Afrobeat / Garage / House / Hiphop','@balbinobruno','','07734435445',''),
  ('Bruno Spadale','Bruno Spadale','Global Beats / Down Tempo / Disco Edits','@petrasdreamparty','CDJ','07498563242',''),
  ('Chalie A','Chalie Alcantara Ramos Hadjuk','Soul / High Tech Jazz / Electro / Brazillian Grooves','@djcharliea','VINYL','07851985769',''),
  ('Cheb Emir','Cheb Emir','House / Carribean / Arabic','@emir.nader_','Vinyl / CDJ','',''),
  ('Club of Jacks','Max and Mike','Hip Hop / Fiunk / Garage / UK Bass','@club_of_jacks','CDJ','07957427745',''),
  ('CroBar','Steve Letch','Old School East Coast Hip Hop - B boy Breaks','https://youtube.com/@djcrobar','','07885390478',''),
  ('DAMIAN THOMAS','DAMIAN THOMAS','Deep, Rare Disco, Rare Groove, Soul, Funk,','','Vinyl / CDJ','07432718708',''),
  ('Dani Dunkl','Dani Dunkl','Techno / Tech house / Jazz Tech / Latin Rare Grooves','@danidunkl','CDJ','07514537006',''),
  ('Deli','Jack Deli','Deep House / Shimmer Disco / Groove Funk','@jack_deli','CDJ','07530718201',''),
  ('Diffriend','Krzystof','Broken Beats / Jazzy House / Disco Edits','@diffriend','CDJ','07986811887',''),
  ('DJ Tunesmith','Joan','Jazz Funk / Disco / Broken Beat','@dj_tunesmith','VINYL','07736469170',''),
  ('Hugo Arena','Hugo Arena','Funk / Disco /','@_arenamusic','CDJ','07874382882',''),
  ('Josh FB','Josh FB','Afro / Carribean / Zouk / Disco / High LIfe','@joshffb //. @discotheque_tropicale','VINYL','07531823379',''),
  ('Juliana Branco','Juliana Branco','Electro / Break / EBM / Indie Dance','@butekamusic','','07599436877',''),
  ('Leandro Fidelis','Leandro Fidelis','Rare Grooves / Reggae / Dub','@fidelis080980','VINYL','07482702676',''),
  ('Leonardo Cruz','Leonardo Cruz','Garage / House / Break','@square.emusic','','07542590191',''),
  ('Lizzie','Lizzie DJ','Wobblecore, garage, latin','@lizziegrilli','CDJ','07889190359',''),
  ('Monica','Monica','Electro / Techno / Disco House / Organic House','@monika_boutike','','07391442311',''),
  ('Siclano','Sias','Brazillian Groove / Funk / Soul / Hip Hop','@siclanosilva','VINYL','07540472420',''),
  ('Simoon Pedro','Simoon Pedro','Italo Disco / House','@breathedeeplyparty','VINYL','07946468450',''),
  ('Teksova','Oli Grant','Amapiano / UK Funky / House','@teksova','','07812602636',''),
  ('Thays Alviano','Thays Alviano','Disco / Soul / Brazillian Beats','@alvianothays','','07551871727',''),
  ('Wafa Love','Wafa','Global Grooves / Funk / Disco / Soul','@wafalovesrecord','VINYL','07909062433',''),
  ('Ash','Ash','UK G, Funky, High Life, Dub Step, Electro','@ashlikeschips','CDJ','07875588080',''),
  ('Dek One','Dek One','Old School East Coast Hip Hop - B boy Breaks','https://www.instagram.com/dj_dek_one','','',''),
  ('Broky B','Thomas','Hip hop / breaks / boogie / reggae','instabroky','Vinyl','07802745425',''),
  ('SOLMAN','Sam solman','Soul/disco/house/garage/jungle','Samsolman_','CDJ','07548108834','Samsolman2003@icloud.com')
on conflict do nothing;
