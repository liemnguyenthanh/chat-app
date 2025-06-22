-- =====================================================================
-- UTILITY FUNCTIONS (OPTIONAL)
-- =====================================================================

-- Function to cleanup expired data
create or replace function cleanup_expired_data()
returns json
language plpgsql
security definer
as $$
declare
  typing_cleaned integer;
  invitations_cleaned integer;
begin
  -- Clean expired typing indicators
  delete from typing_indicators where expires_at < now();
  get diagnostics typing_cleaned = row_count;
  
  -- Clean expired invitations
  update invitations 
  set status = 'expired', responded_at = now()
  where status = 'pending' and expires_at < now();
  get diagnostics invitations_cleaned = row_count;
  
  return json_build_object(
    'typing_indicators_cleaned', typing_cleaned,
    'invitations_expired', invitations_cleaned,
    'cleaned_at', now()
  );
end;
$$;

-- Function to get system status
create or replace function get_system_status()
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  select json_build_object(
    'database_status', 'healthy',
    'tables_created', (
      select count(*) from information_schema.tables 
      where table_schema = 'public' 
        and table_name in ('profiles', 'groups', 'messages', 'group_members', 'invitations')
    ),
    'rls_enabled', (
      select bool_and(relrowsecurity) from pg_class 
      where relname in ('profiles', 'groups', 'messages', 'group_members')
    ),
    'total_users', (select count(*) from profiles),
    'total_groups', (select count(*) from groups),
    'total_messages', (select count(*) from messages where not deleted),
    'checked_at', now()
  ) into result;
  
  return result;
end;
$$;

-- Function to populate existing groups with their last message (migration helper)
create or replace function populate_last_message_ids()
returns integer
security definer
as $$
declare
  updated_count integer;
begin
  update groups 
  set last_message_id = sub.latest_message_id
  from (
    select distinct on (group_id)
      group_id,
      id as latest_message_id
    from messages 
    where deleted = false
    order by group_id, created_at desc
  ) sub
  where groups.id = sub.group_id
    and groups.last_message_id is null;
  
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$ language plpgsql;

-- Function to get unread message count for a user
create or replace function get_unread_count(p_user_id uuid, p_group_id uuid)
returns bigint
language plpgsql
security definer
stable
as $$
declare
  last_read timestamptz;
  unread_count bigint;
begin
  -- Get user's last read timestamp for this group
  select last_read_at into last_read
  from user_read_status
  where user_id = p_user_id and group_id = p_group_id;
  
  -- If no read status, count all messages
  if last_read is null then
    select count(*) into unread_count
    from messages
    where group_id = p_group_id 
      and author_id != p_user_id 
      and not deleted;
  else
    -- Count messages since last read
    select count(*) into unread_count
    from messages
    where group_id = p_group_id 
      and author_id != p_user_id 
      and created_at > last_read
      and not deleted;
  end if;
  
  return coalesce(unread_count, 0);
end;
$$;

-- Function to mark messages as read
create or replace function mark_messages_read(p_user_id uuid, p_group_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  insert into user_read_status (user_id, group_id, last_read_at)
  values (p_user_id, p_group_id, now())
  on conflict (user_id, group_id) 
  do update set 
    last_read_at = now(),
    updated_at = now();
end;
$$;

-- Function to analyze table statistics
create or replace function analyze_chat_tables()
returns void
language plpgsql
security definer
as $$
begin
  analyze profiles;
  analyze groups;
  analyze group_members;
  analyze messages;
  analyze reactions;
  analyze invitations;
  analyze activities;
end;
$$; 