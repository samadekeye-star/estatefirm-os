-- ============================================================================
-- Storage bucket + RLS policies for the documents module.
-- Run this in the Supabase SQL Editor, same as 01_schema.sql / 02_rls.sql /
-- 03_functions.sql were. Safe to re-run (uses IF NOT EXISTS / OR REPLACE /
-- DROP POLICY IF EXISTS throughout).
-- ============================================================================

-- A single private bucket for every firm's documents. Objects are uploaded
-- under a path of the form <firm_id>/<related_type>/<related_id>/<filename>
-- — the firm_id folder segment is what the policies below check against, the
-- same way every other table in this app is scoped by firm_id.
insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 15728640) -- 15 MB, matches next.config.ts
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

-- storage.objects already has RLS enabled by default in every Supabase
-- project — these are the policies that actually grant access, keyed off
-- the same current_firm_id() helper every other table's policies use.
drop policy if exists documents_select_own_firm on storage.objects;
create policy documents_select_own_firm on storage.objects
  for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_firm_id()::text
  );

drop policy if exists documents_insert_own_firm on storage.objects;
create policy documents_insert_own_firm on storage.objects
  for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_firm_id()::text
  );

drop policy if exists documents_delete_own_firm on storage.objects;
create policy documents_delete_own_firm on storage.objects
  for delete
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_firm_id()::text
  );
