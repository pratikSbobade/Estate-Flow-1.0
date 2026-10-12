-- Estate Flow: lock the database to signed-in, approved users.
-- Run once in Supabase -> SQL Editor.

-- Helpers (security definer so policies can read users without recursion)
create or replace function public.ef_is_approved() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from users where id = auth.uid() and approval_status = 'Approved');
$$;

create or replace function public.ef_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from users where id = auth.uid() and approval_status = 'Approved'
                 and role in ('role_super_admin', 'role_admin'));
$$;

-- Data tables: approved users can read/add/edit; only admins can delete.
do $$
declare t text;
begin
  foreach t in array array['clients','properties','site_visits'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "app_full_access" on %I', t);
    execute format('drop policy if exists "ef_read" on %I', t);
    execute format('drop policy if exists "ef_insert" on %I', t);
    execute format('drop policy if exists "ef_update" on %I', t);
    execute format('drop policy if exists "ef_delete" on %I', t);
    execute format('create policy "ef_read" on %I for select to authenticated using (ef_is_approved())', t);
    execute format('create policy "ef_insert" on %I for insert to authenticated with check (ef_is_approved())', t);
    execute format('create policy "ef_update" on %I for update to authenticated using (ef_is_approved()) with check (ef_is_approved())', t);
    execute format('create policy "ef_delete" on %I for delete to authenticated using (ef_is_admin())', t);
  end loop;
end $$;

-- users table
alter table users enable row level security;
drop policy if exists "app_read_users" on users;
drop policy if exists "Enable insert for authenticated users only" on users;
drop policy if exists "Users can update their own profile" on users;
drop policy if exists "Users can view their own profile" on users;
drop policy if exists "ef_users_read" on users;
drop policy if exists "ef_users_self_signup" on users;
drop policy if exists "ef_users_admin_insert" on users;
drop policy if exists "ef_users_admin_update" on users;

-- Everyone sees their own row; approved users see the team.
create policy "ef_users_read" on users for select to authenticated
  using (id = auth.uid() or ef_is_approved());
-- A new sign-up can only create its own row, as a Pending agent.
create policy "ef_users_self_signup" on users for insert to authenticated
  with check (id = auth.uid() and approval_status = 'Pending' and role = 'role_agent');
-- Admins add teammates and approve / change roles.
create policy "ef_users_admin_insert" on users for insert to authenticated with check (ef_is_admin());
create policy "ef_users_admin_update" on users for update to authenticated using (ef_is_admin()) with check (ef_is_admin());
