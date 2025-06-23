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

-- Fetch group messages with reply data support
create or replace function fetch_group_messages(
    p_group_id uuid,
    p_user_id uuid,
    p_offset integer DEFAULT 0,
    p_limit integer DEFAULT 50,
    p_include_reactions boolean DEFAULT true
) 
returns json 
language plpgsql 
as $$
declare
    v_is_member boolean;
    v_result json;
begin
    -- Check if user is a member of the group (security check)
    select exists (
        select 1 from group_members 
        where group_id = p_group_id and user_id = p_user_id
    ) into v_is_member;

    if not v_is_member then
        return json_build_object(
            'success', false,
            'error', 'Access denied: User is not a member of this group'
        );
    end if;

    -- Build the result using a CTE to avoid aggregation issues
    with message_data as (
        select 
            m.id,
            m.group_id,
            m.author_id,
            m.content,
            m.reply_to,
            m.created_at,
            m.updated_at,
            m.deleted,
            json_build_object(
                'id', p.id,
                'username', p.username,
                'full_name', p.full_name,
                'avatar_url', p.avatar_url
            ) as author,
            -- Enhanced reply data with JOIN for better performance
            case 
                when m.reply_to is not null then
                    json_build_object(
                        'id', rm.id,
                        'content', rm.content,
                        'author_id', rm.author_id,
                        'author', json_build_object(
                            'id', rp.id,
                            'username', rp.username,
                            'full_name', rp.full_name,
                            'avatar_url', rp.avatar_url
                        ),
                        'created_at', rm.created_at
                    )
                else null
            end as reply_data
        from messages m
        inner join profiles p on m.author_id = p.id
        -- Optimized JOINs instead of subquery for reply data
        left join messages rm on m.reply_to = rm.id and rm.deleted = false
        left join profiles rp on rm.author_id = rp.id
        where m.group_id = p_group_id
          and m.deleted = false
        order by m.created_at desc
        offset p_offset
        limit p_limit
    )
    select json_build_object(
        'success', true,
        'messages', coalesce(json_agg(
            json_build_object(
                'id', md.id,
                'group_id', md.group_id,
                'author_id', md.author_id,
                'content', md.content,
                'reply_to', md.reply_to,
                'created_at', md.created_at,
                'updated_at', md.updated_at,
                'deleted', md.deleted,
                'author', md.author,
                'reply_data', md.reply_data
            ) order by md.created_at desc
        ), '[]'::json)
    ) into v_result
    from message_data md;

    return v_result;
end;
$$; 