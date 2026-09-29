-- ============================================================================
-- Row Level Security. This is the actual security boundary for the app —
-- not the application code. Every table below is unreadable and unwritable
-- by default the moment RLS is enabled; each policy below is an explicit
-- exception, scoped to "rows belonging to the caller's own firm."
-- ============================================================================

-- Looks up the caller's firm_id from their profile row. SECURITY DEFINER so
-- it can read public.profiles even though profiles has its own restrictive
-- RLS policy below — without this, checking "what firm am I in" would itself
-- be blocked by RLS, which would break every other policy that calls it.
-- search_path is pinned to prevent a classic SECURITY DEFINER hijack (a
-- malicious function elsewhere named public.profiles could otherwise be
-- resolved instead of the real table).
create or replace function public.current_firm_id()
returns uuid
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select firm_id from public.profiles where id = auth.uid()
$$;

alter table public.firms enable row level security;
alter table public.profiles enable row level security;
alter table public.landlords enable row level security;
alter table public.properties enable row level security;
alter table public.units enable row level security;
alter table public.tenants enable row level security;
alter table public.leases enable row level security;
alter table public.rent_ledger enable row level security;
alter table public.valuation_jobs enable row level security;
alter table public.documents enable row level security;

-- ---------- firms ----------
-- A user can see their own firm's row, and nothing else. Firm creation and
-- edits go through the security-definer RPCs in 03_functions.sql, not
-- direct table access, so there is deliberately no INSERT/UPDATE policy here.
create policy firms_select_own on public.firms
  for select using (id = public.current_firm_id());

-- ---------- profiles ----------
-- Visible to anyone in the same firm (a staff directory), but a user can
-- only ever modify their own row. Creation goes through the signup RPC.
create policy profiles_select_same_firm on public.profiles
  for select using (firm_id = public.current_firm_id());
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------- everything else: standard "own firm only" CRUD ----------
create policy landlords_all_own_firm on public.landlords
  for all using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());

create policy properties_all_own_firm on public.properties
  for all using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());

create policy units_all_own_firm on public.units
  for all using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());

create policy tenants_all_own_firm on public.tenants
  for all using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());

create policy leases_all_own_firm on public.leases
  for all using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());

create policy rent_ledger_all_own_firm on public.rent_ledger
  for all using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());

create policy valuation_jobs_all_own_firm on public.valuation_jobs
  for all using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());

create policy documents_all_own_firm on public.documents
  for all using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());

-- ---------- grants ----------
-- RLS restricts which ROWS are visible; these grants restrict which
-- OPERATIONS are possible at all. Note firms/profiles get no INSERT grant —
-- creation is only possible through the SECURITY DEFINER RPCs, never directly.
grant select on public.firms to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.landlords to authenticated;
grant select, insert, update, delete on public.properties to authenticated;
grant select, insert, update, delete on public.units to authenticated;
grant select, insert, update, delete on public.tenants to authenticated;
grant select, insert, update, delete on public.leases to authenticated;
grant select, insert, update, delete on public.rent_ledger to authenticated;
grant select, insert, update, delete on public.valuation_jobs to authenticated;
grant select, insert, update, delete on public.documents to authenticated;
