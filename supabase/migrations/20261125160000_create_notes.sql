create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null,
  is_pinned boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint notes_title_not_blank check (title ~ '[^[:space:]]'),
  constraint notes_description_not_blank check (description ~ '[^[:space:]]')
);

create index notes_user_pinned_created_at_idx
  on public.notes (user_id, is_pinned desc, created_at desc, id desc);

create or replace function public.set_notes_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_notes_updated_at
before update on public.notes
for each row
execute function public.set_notes_updated_at();

alter table public.notes enable row level security;

revoke all on table public.notes from anon, public;
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.notes to authenticated;

create policy "Users can read their own notes"
  on public.notes
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own notes"
  on public.notes
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own notes"
  on public.notes
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own notes"
  on public.notes
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
