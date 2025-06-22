-- =====================================================================
-- DATABASE FUNCTIONS
-- =====================================================================

-- Profile update trigger function
create or replace function handle_profile_updated()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Group update trigger function
create or replace function handle_group_updated()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Auto-create profile for new users
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  base_username text;
  final_username text;
  counter integer := 1;
begin
  if new.email is null or length(trim(new.email)) = 0 then
    base_username := 'user_' || substr(new.id::text, 1, 8);
  else
    base_username := split_part(new.email, '@', 1);
    base_username := regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g');
    base_username := lower(substring(base_username from 1 for 20));
  end if;
  
  if length(base_username) < 3 then
    base_username := 'user_' || substr(new.id::text, 1, 8);
  end if;
  
  final_username := base_username;
  
  while exists (select 1 from profiles where username = final_username) and counter <= 100 loop
    final_username := base_username || '_' || counter;
    counter := counter + 1;
  end loop;
  
  insert into profiles (id, username)
  values (new.id, final_username)
  on conflict (id) do nothing;
  
  return new;
exception
  when others then
    insert into profiles (id) values (new.id) on conflict (id) do nothing;
    return new;
end;
$$;

-- Handle new group creation
create or replace function handle_new_group()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into group_settings (group_id) values (new.id);
  insert into group_members (group_id, user_id, role) values (new.id, new.owner_id, 'admin');
  insert into activities (group_id, actor_id, action) values (new.id, new.owner_id, 'group_created');
  return new;
end;
$$;

-- Update group's last message
create or replace function update_group_last_message()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'INSERT' then
    update groups set last_message_id = NEW.id, updated_at = NOW() where id = NEW.group_id;
    return NEW;
  end if;
  return null;
end;
$$;

-- Update message search vector
create or replace function update_message_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector := to_tsvector('english', coalesce(new.content, ''));
  return new;
end;
$$;

-- Check group membership
create or replace function is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return exists (select 1 from group_members where group_id = p_group_id and user_id = p_user_id);
end;
$$;

-- Check group moderator
create or replace function is_group_moderator(p_group_id uuid, p_user_id uuid)
returns boolean
language plpgsql
security definer
stable
as $$
begin
  return p_user_id = (select owner_id from groups where id = p_group_id)
    or exists (select 1 from group_members where group_id = p_group_id and user_id = p_user_id and role = 'admin');
end;
$$;

-- Fetch user rooms
create or replace function fetch_user_rooms(user_id uuid)
returns table(
  group_id uuid, group_name text, is_private boolean, created_at timestamptz, updated_at timestamptz,
  member_count bigint, last_message text, last_activity timestamptz, unread_count bigint
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    g.id, g.name, g.is_private, g.created_at, g.updated_at, count(gm2.user_id),
    coalesce(case when length(m.content) > 50 then substring(m.content from 1 for 50) || '...' else m.content end, 'No messages yet'),
    coalesce(m.created_at, g.updated_at), 0::bigint
  from groups g
  inner join group_members gm on g.id = gm.group_id
  left join group_members gm2 on g.id = gm2.group_id
  left join messages m on g.last_message_id = m.id and m.deleted = false
  where gm.user_id = fetch_user_rooms.user_id
  group by g.id, g.name, g.is_private, g.created_at, g.updated_at, m.content, m.created_at
  order by coalesce(m.created_at, g.updated_at) desc;
end;
$$; 