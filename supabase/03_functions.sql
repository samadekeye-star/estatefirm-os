-- ============================================================================
-- The one deliberate, narrow bypass of RLS: a brand-new authenticated user
-- has no profile yet, so current_firm_id() returns null and every ordinary
-- policy above would block them from creating anything — including their
-- own firm. This RPC is the single, audited door around that chicken-and-egg
-- problem. It is SECURITY DEFINER, but only does two inserts and refuses to
-- run at all if the caller already belongs to a firm.
-- ============================================================================

create or replace function public.create_firm_and_profile(
  p_firm_name text,
  p_subdomain text,
  p_owner_name text
)
returns table (firm_id uuid, subdomain text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_firm_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated.';
  end if;

  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'This account is already linked to a firm.';
  end if;

  insert into public.firms (name, subdomain, subscription_tier, status)
  values (p_firm_name, p_subdomain, 'trial', 'active')
  returning id into v_firm_id;

  insert into public.profiles (id, firm_id, name, role)
  values (auth.uid(), v_firm_id, p_owner_name, 'owner');

  return query select v_firm_id, p_subdomain;
end;
$$;

-- Callable by any logged-in user (the function's own guard clauses do the
-- real access control — see above), but explicitly NOT by anon, since
-- signup in this app always creates the auth user first, then calls this.
revoke all on function public.create_firm_and_profile(text, text, text) from public;
grant execute on function public.create_firm_and_profile(text, text, text) to authenticated;
