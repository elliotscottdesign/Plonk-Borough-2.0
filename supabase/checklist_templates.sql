-- Founder-editable checklist overrides (bar lane). ADDITIVE ONLY — one new table.
-- Each row overrides ONE checklist's whole definition; if there's no row for a
-- checklist_key the app uses the built-in code default. So an empty table = today's
-- behaviour exactly, and a bad/blank row can't wipe a checklist (the display falls
-- back to code when a def is missing).
--
--   system        'kitchen'  → the food-safety sheets (KITCHEN_TEMPLATES)
--                 'shift'    → the venue/bar shift lists (CHECKLISTS)
--   checklist_key e.g. 'opening','closing','deep-clean','foh','weekly','service'…
--   def           the full checklist definition JSON, same shape as the code default
--                 for that system (kitchen: {id,title,icon,blurb,groups:[…]}; shift:
--                 {key,title,icon,blurb,sections:[…]} or {…,byWeekday:{0..6:[…]}}).

create extension if not exists pgcrypto;

create table if not exists public.checklist_templates (
  id            uuid primary key default gen_random_uuid(),
  system        text not null check (system in ('kitchen','shift')),
  checklist_key text not null,
  def           jsonb not null,
  updated_at    timestamptz not null default now(),
  updated_by    text,
  unique (system, checklist_key)
);

alter table public.checklist_templates enable row level security;
