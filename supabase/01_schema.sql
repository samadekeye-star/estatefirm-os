-- ============================================================================
-- Core schema. This file is portable to a real Supabase project as-is —
-- Supabase already provides the auth schema this references.
-- ============================================================================

create extension if not exists pgcrypto; -- gen_random_uuid()

create table public.firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subdomain text unique not null,
  subscription_tier text not null default 'trial',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- One row per authenticated user, linking them to exactly one firm.
-- This is the table every RLS policy in the app ultimately keys off.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  firm_id uuid not null references public.firms(id) on delete cascade,
  name text not null,
  role text not null default 'staff' check (role in ('owner', 'senior_surveyor', 'staff', 'read_only')),
  created_at timestamptz not null default now()
);

create table public.landlords (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  bank_name text,
  bank_account text,
  commission_rate numeric not null default 10,
  kyc_status text not null default 'pending' check (kyc_status in ('pending', 'verified')),
  created_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  landlord_id uuid references public.landlords(id) on delete set null,
  name text not null,
  address text not null,
  property_type text not null default 'residential' check (property_type in ('residential', 'commercial', 'industrial', 'land')),
  title_type text,
  size_sqm numeric,
  created_at timestamptz not null default now()
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade, -- denormalized on purpose: lets unit policies key off firm_id directly without a join
  property_id uuid not null references public.properties(id) on delete cascade,
  label text not null,
  size_sqm numeric,
  status text not null default 'vacant' check (status in ('vacant', 'occupied')),
  created_at timestamptz not null default now()
);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  guarantor_name text,
  guarantor_phone text,
  created_at timestamptz not null default now()
);

create table public.leases (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  rent_amount numeric not null,
  frequency text not null default 'annual' check (frequency in ('annual', 'quarterly', 'monthly')),
  status text not null default 'active' check (status in ('active', 'renewal_due', 'notice_served', 'vacated')),
  created_at timestamptz not null default now()
);

create table public.rent_ledger (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  lease_id uuid not null references public.leases(id) on delete cascade,
  due_date date not null,
  amount numeric not null,
  status text not null default 'due' check (status in ('due', 'paid', 'partial', 'overdue')),
  paid_date date,
  paid_amount numeric default 0,
  created_at timestamptz not null default now()
);

create table public.valuation_jobs (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  client_name text not null,
  purpose text not null check (purpose in ('mortgage', 'insurance', 'probate', 'rating', 'litigation', 'sale')),
  method text not null default 'comparative' check (method in ('comparative', 'investment', 'cost', 'profits')),
  fee numeric default 0,
  stage text not null default 'instructed' check (stage in ('instructed', 'inspection', 'draft', 'approved')),
  passing_rent numeric,
  yield_pct numeric,
  adjustments numeric default 0,
  market_value numeric,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  related_type text not null check (related_type in ('landlord', 'property', 'tenant', 'valuation_job')),
  related_id uuid not null,
  tag text not null default 'general' check (tag in ('lease', 'title', 'inspection', 'arrears', 'report', 'general')),
  storage_path text not null, -- path inside the Supabase Storage bucket, not a local disk path
  file_name text not null,
  version int not null default 1,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index idx_profiles_firm on public.profiles(firm_id);
create index idx_landlords_firm on public.landlords(firm_id);
create index idx_properties_firm on public.properties(firm_id);
create index idx_units_firm on public.units(firm_id);
create index idx_units_property on public.units(property_id);
create index idx_tenants_firm on public.tenants(firm_id);
create index idx_leases_firm on public.leases(firm_id);
create index idx_rent_ledger_firm on public.rent_ledger(firm_id);
create index idx_valuation_jobs_firm on public.valuation_jobs(firm_id);
create index idx_documents_firm on public.documents(firm_id);
create index idx_documents_related on public.documents(related_type, related_id);
