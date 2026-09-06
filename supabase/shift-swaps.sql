-- Shift swaps (rota lane, 19 Aug 2026): a staffer offers one of their shifts up;
-- anyone eligible (not on that day, not booked off, right ability/rank) can
-- "intercept" it; a manager (Asst. Manager+ / founder) approves → the claim moves.
create table if not exists public.shift_swaps (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.staff_shifts(id) on delete cascade,
  from_staff uuid not null references public.staff(id) on delete cascade,
  to_staff uuid references public.staff(id) on delete set null,
  status text not null default 'open',   -- 'open' | 'claimed' (awaiting manager) | 'approved' | 'cancelled'
  created_at timestamptz default now(),
  claimed_at timestamptz,
  decided_at timestamptz,
  decided_by uuid                        -- manager staff id (null = founder via /ops)
);
create index if not exists shift_swaps_shift_idx on public.shift_swaps(shift_id);
create index if not exists shift_swaps_status_idx on public.shift_swaps(status);
