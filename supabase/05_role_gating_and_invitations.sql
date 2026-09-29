-- ============================================================================
-- Role-gating on valuation approval + a staff invite flow.
-- Run this in the Supabase SQL Editor, same as the earlier migrations.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS
-- throughout).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Part 1: current_role() helper + role-gated valuation approval.
-- ---------------------------------------------------------------------------

-- Same pattern as current_firm_id() in 02_rls.sql: SECURITY DEFINER so it
-- can read the caller's own profiles row regardless of what else RLS would
-- otherwise allow them to see.
create or replace function public.current_role()
returns text
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- valuation_jobs previously had one blanket "for all" policy. Splitting it
-- so the UPDATE policy can carry an extra condition: this is the real
-- enforcement behind "only an owner or senior surveyor can approve a
-- valuation" — lib/actions/valuations.ts checks the role too, but only for
-- a friendly error message; this policy is what actually stops the write.
drop policy if exists valuation_jobs_all_own_firm on public.valuation_jobs;

create policy valuation_jobs_select_own_firm on public.valuation_jobs
  for select using (firm_id = public.current_firm_id());

create policy valuation_jobs_insert_own_firm on public.valuation_jobs
  for insert with check (firm_id = public.current_firm_id());

create policy valuation_jobs_delete_own_firm on public.valuation_jobs
  for delete using (firm_id = public.current_firm_id());

create policy valuation_jobs_update_own_firm on public.valuation_jobs
  for update using (firm_id = public.current_firm_id())
  with check (
    firm_id = public.current_firm_id()
    and (stage <> 'approved' or public.current_role() in ('owner', 'senior_surveyor'))
  );

-- ---------------------------------------------------------------------------
-- Part 2: staff invitations.
--
-- There's no admin API call here (that needs the service_role key, which
-- this project deliberately never puts in the app). Instead: an owner
-- creates an invitation row, the app shows them a link to copy and send
-- themselves, and accepting it runs a SECURITY DEFINER RPC that creates the
-- new profile from the invitation — the same chicken-and-egg pattern
-- create_firm_and_profile() already uses for a brand-new firm's owner.
-- ---------------------------------------------------------------------------

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  email text not null,
  role text not null default 'staff' check (role in ('owner', 'senior_surveyor', 'staff', 'read_only')),
  token text not null unique,
  invited_by uuid references public.profiles(id),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create index if not exists idx_invitations_firm on public.invitations(firm_id);
create index if not exists idx_invitations_token on public.invitations(token);

alter table public.invitations enable row level security;

drop policy if exists invitations_select_own_firm on public.invitations;
create policy invitations_select_own_firm on public.invitations
  for select using (firm_id = public.current_firm_id());

-- Only an owner can create or revoke invitations for their firm.
drop policy if exists invitations_insert_owner_only on public.invitations;
create policy invitations_insert_owner_only on public.invitations
  for insert with check (firm_id = public.current_firm_id() and public.current_role() = 'owner');

drop policy if exists invitations_update_owner_only on public.invitations;
create policy invitations_update_owner_only on public.invitations
  for update using (firm_id = public.current_firm_id() and public.current_role() = 'owner')
  with check (firm_id = public.current_firm_id() and public.current_role() = 'owner');

grant select, insert, update on public.invitations to authenticated;

-- Looked up by an unauthenticated visitor on the accept-invite page, so it
-- can't go through the normal RLS-scoped select above. SECURITY DEFINER,
-- but only ever returns the firm name / role / email for one exact token
-- match — never the invitations table itself — so it can't be used to
-- enumerate a firm's pending invitations.
create or replace function public.get_invitation_by_token(p_token text)
returns table (firm_name text, role text, email text, valid boolean)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select f.name, i.role, i.email,
    (i.status = 'pending' and i.expires_at > now()) as valid
  from public.invitations i
  join public.firms f on f.id = i.firm_id
  where i.token = p_token
$$;

revoke all on function public.get_invitation_by_token(text) from public;
grant execute on function public.get_invitation_by_token(text) to anon, authenticated;

-- The other half of the chicken-and-egg door: like create_firm_and_profile(),
-- SECURITY DEFINER, but refuses to run if the caller already belongs to a
-- firm, and only accepts a token that's still pending and unexpired.
create or replace function public.accept_invitation(p_token text)
returns table (firm_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invitation record;
  v_name text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated.';
  end if;

  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'This account is already linked to a firm.';
  end if;

  select * into v_invitation
  from public.invitations
  where token = p_token
    and status = 'pending'
    and expires_at > now()
  for update;

  if not found then
    raise exception 'This invitation is invalid or has expired.';
  end if;

  select coalesce(nullif(trim(raw_user_meta_data ->> 'invitee_name'), ''), split_part(email, '@', 1))
  into v_name
  from auth.users
  where id = auth.uid();

  insert into public.profiles (id, firm_id, name, role)
  values (auth.uid(), v_invitation.firm_id, v_name, v_invitation.role);

  update public.invitations set status = 'accepted' where id = v_invitation.id;

  return query select v_invitation.firm_id;
end;
$$;

revoke all on function public.accept_invitation(text) from public;
grant execute on function public.accept_invitation(text) to authenticated;
