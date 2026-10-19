create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (id, created_by)
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'readonly')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  address text not null default '',
  kind text not null default 'Etkinlik alanı',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (workspace_id, id)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  email text,
  phone text,
  created_at timestamptz not null default now(),
  unique (workspace_id, id)
);

create unique index if not exists customers_workspace_email_unique
  on public.customers (workspace_id, lower(email))
  where email is not null;

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  space_id uuid not null,
  customer_id uuid not null,
  title text not null check (length(trim(title)) between 1 and 160),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  foreign key (workspace_id, space_id)
    references public.spaces (workspace_id, id) on delete restrict,
  foreign key (workspace_id, customer_id)
    references public.customers (workspace_id, id) on delete restrict,
  unique (workspace_id, id)
);

create index if not exists workspace_members_user_id_idx on public.workspace_members (user_id);
create index if not exists spaces_workspace_active_idx on public.spaces (workspace_id, is_active);
create index if not exists customers_workspace_name_idx on public.customers (workspace_id, name);
create index if not exists reservations_workspace_start_idx on public.reservations (workspace_id, starts_at);

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
  );
$$;

create or replace function public.can_edit_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'admin', 'member')
  );
$$;

revoke all on function public.is_workspace_member(uuid) from public, anon;
revoke all on function public.can_edit_workspace(uuid) from public, anon;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.can_edit_workspace(uuid) to authenticated;

create or replace function public.create_workspace_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
  workspace_label text;
begin
  workspace_label := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'workspace_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    'Çalışma alanım'
  );

  insert into public.workspaces (name, created_by)
  values (workspace_label, new.id)
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_workspace on auth.users;
create trigger on_auth_user_created_workspace
  after insert on auth.users
  for each row execute procedure public.create_workspace_for_new_user();

with users_without_workspaces as (
  select u.id, coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), 'Çalışma alanım') as workspace_name
  from auth.users u
  where not exists (
    select 1 from public.workspace_members wm where wm.user_id = u.id
  )
), new_workspaces as (
  insert into public.workspaces (name, created_by)
  select workspace_name, id from users_without_workspaces
  returning id, created_by
)
insert into public.workspace_members (workspace_id, user_id, role)
select id, created_by, 'owner' from new_workspaces;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.spaces enable row level security;
alter table public.customers enable row level security;
alter table public.reservations enable row level security;

drop policy if exists "Members can view their workspaces" on public.workspaces;
create policy "Members can view their workspaces"
  on public.workspaces for select to authenticated
  using ((select public.is_workspace_member(id)));

drop policy if exists "Workspace admins can update their workspace" on public.workspaces;
create policy "Workspace admins can update their workspace"
  on public.workspaces for update to authenticated
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = id and wm.user_id = (select auth.uid()) and wm.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = id and wm.user_id = (select auth.uid()) and wm.role in ('owner', 'admin')
    )
  );

drop policy if exists "Members can view workspace membership" on public.workspace_members;
create policy "Members can view workspace membership"
  on public.workspace_members for select to authenticated
  using ((select public.is_workspace_member(workspace_id)));

drop policy if exists "Workspace admins can manage membership" on public.workspace_members;

drop policy if exists "Members can view spaces" on public.spaces;
create policy "Members can view spaces" on public.spaces
  for select to authenticated using ((select public.is_workspace_member(workspace_id)));
drop policy if exists "Editors can manage spaces" on public.spaces;
create policy "Editors can manage spaces" on public.spaces
  for all to authenticated
  using ((select public.can_edit_workspace(workspace_id)))
  with check ((select public.can_edit_workspace(workspace_id)));

drop policy if exists "Members can view customers" on public.customers;
create policy "Members can view customers" on public.customers
  for select to authenticated using ((select public.is_workspace_member(workspace_id)));
drop policy if exists "Editors can manage customers" on public.customers;
create policy "Editors can manage customers" on public.customers
  for all to authenticated
  using ((select public.can_edit_workspace(workspace_id)))
  with check ((select public.can_edit_workspace(workspace_id)));

drop policy if exists "Members can view reservations" on public.reservations;
create policy "Members can view reservations" on public.reservations
  for select to authenticated using ((select public.is_workspace_member(workspace_id)));
drop policy if exists "Editors can create reservations" on public.reservations;
create policy "Editors can create reservations" on public.reservations
  for insert to authenticated
  with check (
    (select public.can_edit_workspace(workspace_id))
    and created_by = (select auth.uid())
  );
drop policy if exists "Editors can update reservations" on public.reservations;
create policy "Editors can update reservations" on public.reservations
  for update to authenticated
  using ((select public.can_edit_workspace(workspace_id)))
  with check ((select public.can_edit_workspace(workspace_id)));
drop policy if exists "Editors can delete reservations" on public.reservations;
create policy "Editors can delete reservations" on public.reservations
  for delete to authenticated
  using ((select public.can_edit_workspace(workspace_id)));

grant usage on schema public to authenticated;
grant select, update on public.workspaces to authenticated;
grant select on public.workspace_members to authenticated;
grant select, insert, update, delete on public.spaces, public.customers, public.reservations to authenticated;

create or replace function public.create_reservation(
  p_workspace_id uuid,
  p_space_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_title text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_status text default 'pending'
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_customer_id uuid;
  new_reservation_id uuid;
  normalized_email text;
begin
  if not (select public.can_edit_workspace(p_workspace_id)) then
    raise exception 'Bu çalışma alanında kayıt oluşturma yetkiniz yok.' using errcode = '42501';
  end if;

  normalized_email := nullif(lower(trim(p_customer_email)), '');

  if normalized_email is null then
    insert into public.customers (workspace_id, name, email, phone)
    values (p_workspace_id, trim(p_customer_name), null, nullif(trim(p_customer_phone), ''))
    returning id into new_customer_id;
  else
    insert into public.customers (workspace_id, name, email, phone)
    values (p_workspace_id, trim(p_customer_name), normalized_email, nullif(trim(p_customer_phone), ''))
    on conflict (workspace_id, (lower(email))) where email is not null do update set
      name = excluded.name,
      phone = coalesce(excluded.phone, public.customers.phone)
    returning id into new_customer_id;
  end if;

  insert into public.reservations (
    workspace_id, space_id, customer_id, title, starts_at, ends_at, status, created_by
  ) values (
    p_workspace_id, p_space_id, new_customer_id, trim(p_title), p_starts_at, p_ends_at, p_status, (select auth.uid())
  ) returning id into new_reservation_id;

  return new_reservation_id;
end;
$$;

revoke all on function public.create_reservation(uuid, uuid, text, text, text, text, timestamptz, timestamptz, text) from public, anon;
grant execute on function public.create_reservation(uuid, uuid, text, text, text, text, timestamptz, timestamptz, text) to authenticated;
