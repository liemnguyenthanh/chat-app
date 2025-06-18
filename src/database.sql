-- =====================================================================
-- SUPABASE CHAT DATABASE SCHEMA - FIXED & OPTIMIZED
-- =====================================================================

-- 1. Extensions
create extension if not exists "uuid-ossp";

-- 2. Custom Types
create type activity_action as enum (
  'user_joined', 'user_left', 'user_banned', 'user_unbanned',
  'message_deleted', 'chat_locked', 'chat_unlocked',
  'group_created', 'group_updated'
);

-- =====================================================================
-- TABLES
-- =====================================================================

-- 3. Profiles table (user information)
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique not null check (length(trim(username)) >= 3),
  full_name  text,
  avatar_url text,
  bio        text check (length(bio) <= 500),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. Groups table
create table if not exists groups (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null check (length(trim(name)) > 0 and length(trim(name)) <= 100),
  description text check (length(description) <= 500),
  avatar_url  text,
  owner_id    uuid not null references profiles(id) on delete cascade,
  is_private  boolean default false,
  max_members integer default 100 check (max_members > 0 and max_members <= 1000),
  created_at  timestamp with time zone default now(),
  updated_at  timestamp with time zone default now()
);

-- 5. Group members table
create table if not exists group_members (
  group_id   uuid references groups(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  role       text default 'member' check (role in ('member', 'admin')),
  joined_at  timestamp with time zone default now(),
  primary key(group_id, user_id)
);

-- 6. Messages table
create table if not exists messages (
  id         uuid primary key default uuid_generate_v4(),
  group_id   uuid not null references groups(id) on delete cascade,
  author_id  uuid not null references profiles(id) on delete cascade,
  content    text,
  data       jsonb,
  reply_to   uuid references messages(id),
  thread_id  uuid references messages(id),
  message_type text default 'text' check (message_type in ('text', 'image', 'file', 'system')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  deleted    boolean default false,
  deleted_at timestamp with time zone,
  constraint messages_content_or_data check (
    content is not null or data is not null or message_type = 'system'
  )
);

-- 7. Reactions table
create table if not exists reactions (
  message_id uuid not null references messages(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  emoji      text not null check (length(trim(emoji)) > 0),
  created_at timestamp with time zone default now(),
  primary key(message_id, user_id, emoji)
);

-- 8. Attachments table  
create table if not exists attachments (
  id          uuid primary key default uuid_generate_v4(),
  message_id  uuid not null references messages(id) on delete cascade,
  filename    text not null,
  file_size   bigint check (file_size > 0),
  mime_type   text not null,
  bucket_path text not null,
  created_at  timestamp with time zone default now()
);

-- 9. Group bans table
create table if not exists group_bans (
  group_id   uuid not null references groups(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  banned_by  uuid not null references profiles(id),
  reason     text,
  banned_at  timestamp with time zone default now(),
  expires_at timestamp with time zone,
  primary key(group_id, user_id)
);

-- 10. Invitations table
create table if not exists invitations (
  id         uuid primary key default uuid_generate_v4(),
  group_id   uuid not null references groups(id) on delete cascade,
  inviter_id uuid not null references profiles(id) on delete cascade,
  invitee_id uuid not null references profiles(id) on delete cascade,
  status     text default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  message    text,
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + interval '7 days'),
  responded_at timestamp with time zone,
  unique(group_id, invitee_id)
);

-- 11. Activities table (audit log)
create table if not exists activities (
  id         uuid primary key default uuid_generate_v4(),
  group_id   uuid references groups(id) on delete cascade,
  actor_id   uuid not null references profiles(id),
  target_id  uuid references profiles(id),
  action     activity_action not null,
  metadata   jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- 12. Typing indicators table
create table if not exists typing_indicators (
  group_id   uuid references groups(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  expires_at timestamp with time zone default (now() + interval '10 seconds'),
  primary key(group_id, user_id)
);

-- 13. Group settings table
create table if not exists group_settings (
  group_id          uuid primary key references groups(id) on delete cascade,
  slow_mode_seconds integer default 0 check (slow_mode_seconds >= 0 and slow_mode_seconds <= 300),
  is_chat_locked    boolean default false,
  allow_reactions   boolean default true,
  allow_file_upload boolean default true,
  max_file_size_mb  integer default 10 check (max_file_size_mb > 0 and max_file_size_mb <= 100),
  created_at        timestamp with time zone default now(),
  updated_at        timestamp with time zone default now()
);

-- =====================================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================================

-- Function to handle profile updates
create or replace function handle_profile_updated()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Function to handle group updates  
create or replace function handle_group_updated()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Function to auto-create profile for new users
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql;

-- Function to auto-create group settings
create or replace function handle_new_group()
returns trigger as $$
begin
  -- Insert group settings
  insert into group_settings (group_id)
  values (new.id);
  
  -- Add owner as member
  insert into group_members (group_id, user_id, role)
  values (new.id, new.owner_id, 'admin');
  
  -- Log activity
  insert into activities (group_id, actor_id, action)
  values (new.id, new.owner_id, 'group_created');
  
  return new;
end;
$$ language plpgsql;

-- Function to clean up expired typing indicators
create or replace function cleanup_expired_typing()
returns void as $$
begin
  delete from typing_indicators where expires_at < now();
end;
$$ language plpgsql;

-- Function to handle message soft delete
create or replace function handle_message_delete()
returns trigger as $$
begin
  if new.deleted = true and old.deleted = false then
    new.deleted_at = now();
    
    -- Log activity
    insert into activities (group_id, actor_id, action, metadata)
    values (
      new.group_id, 
      auth.uid(), 
      'message_deleted',
      jsonb_build_object('message_id', new.id, 'original_author', new.author_id)
    );
  end if;
  
  return new;
end;
$$ language plpgsql;

-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- Profile triggers
drop trigger if exists trg_profile_updated on profiles;
create trigger trg_profile_updated
  before update on profiles
  for each row execute function handle_profile_updated();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Group triggers
drop trigger if exists trg_group_updated on groups;
create trigger trg_group_updated
  before update on groups
  for each row execute function handle_group_updated();

drop trigger if exists trg_new_group on groups;
create trigger trg_new_group
  after insert on groups
  for each row execute function handle_new_group();

-- Message triggers
drop trigger if exists trg_message_delete on messages;
create trigger trg_message_delete
  before update on messages
  for each row execute function handle_message_delete();

-- =====================================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================================

-- Profiles indexes
create index if not exists idx_profiles_username on profiles(username);

-- Groups indexes
create index if not exists idx_groups_owner on groups(owner_id);
create index if not exists idx_groups_created_at on groups(created_at desc);

-- Group members indexes
create index if not exists idx_group_members_group on group_members(group_id);
create index if not exists idx_group_members_user on group_members(user_id);
create index if not exists idx_group_members_role on group_members(group_id, role);

-- Messages indexes
create index if not exists idx_messages_group on messages(group_id);
create index if not exists idx_messages_author on messages(author_id);
create index if not exists idx_messages_created_at on messages(group_id, created_at desc) where deleted = false;
create index if not exists idx_messages_thread on messages(thread_id) where thread_id is not null;
create index if not exists idx_messages_reply on messages(reply_to) where reply_to is not null;

-- Reactions indexes
create index if not exists idx_reactions_message on reactions(message_id);
create index if not exists idx_reactions_user on reactions(user_id);

-- Attachments indexes
create index if not exists idx_attachments_message on attachments(message_id);

-- Group bans indexes
create index if not exists idx_group_bans_group on group_bans(group_id);
create index if not exists idx_group_bans_user on group_bans(user_id);
create index if not exists idx_group_bans_expires on group_bans(expires_at) where expires_at is not null;

-- Invitations indexes
create index if not exists idx_invitations_group on invitations(group_id);
create index if not exists idx_invitations_inviter on invitations(inviter_id);
create index if not exists idx_invitations_invitee on invitations(invitee_id);
create index if not exists idx_invitations_status on invitations(status);
create index if not exists idx_invitations_expires on invitations(expires_at) where expires_at is not null;

-- Activities indexes
create index if not exists idx_activities_group_created on activities(group_id, created_at desc);
create index if not exists idx_activities_actor on activities(actor_id);

-- Typing indicators indexes
create index if not exists idx_typing_expires on typing_indicators(expires_at);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table messages enable row level security;
alter table reactions enable row level security;
alter table attachments enable row level security;
alter table group_bans enable row level security;
alter table invitations enable row level security;
alter table activities enable row level security;
alter table typing_indicators enable row level security;
alter table group_settings enable row level security;

-- =====================================================================
-- RLS POLICIES (FIXED VERSION)
-- =====================================================================

-- Profiles policies
drop policy if exists "Public read profiles" on profiles;
drop policy if exists "Profile owner can insert" on profiles;
drop policy if exists "Profile owner can update" on profiles;

create policy "Public read profiles"
  on profiles for select
  using (true);

create policy "Profile owner can insert"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Profile owner can update"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Groups policies  
drop policy if exists "Select groups by member" on groups;
drop policy if exists "Insert groups" on groups;
drop policy if exists "Update groups by owner" on groups;
drop policy if exists "Delete groups by owner" on groups;

create policy "Select groups by member"
  on groups for select
  using (
    exists (
      select 1 from group_members 
      where group_members.group_id = groups.id 
        and group_members.user_id = auth.uid()
    )
  );

create policy "Insert groups"
  on groups for insert
  with check (owner_id = auth.uid());

create policy "Update groups by owner"
  on groups for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Delete groups by owner"
  on groups for delete
  using (owner_id = auth.uid());

-- Group members policies
drop policy if exists "Select members for member" on group_members;
drop policy if exists "Insert members by owner" on group_members;
drop policy if exists "Delete members by owner" on group_members;

create policy "Select members for member"
  on group_members for select
  using (
    user_id = auth.uid() 
    or exists (
      select 1 from groups 
      where groups.id = group_members.group_id 
        and groups.owner_id = auth.uid()
    )
    or exists (
      select 1 from group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.user_id != group_members.user_id
    )
  );

create policy "Insert members by owner or admin"
  on group_members for insert
  with check (
    (
      -- Owner or admin adding others
      (
        user_id <> auth.uid()
        and (
          auth.uid() = (select owner_id from groups where id = group_id)
          or exists (
            select 1 from group_members gm
            where gm.group_id = group_members.group_id 
              and gm.user_id = auth.uid() 
              and gm.role = 'admin'
          )
        )
      )
      or
      -- Owner adding themselves during group creation
      (
        user_id = auth.uid()
        and auth.uid() = (select owner_id from groups where id = group_id)
      )
      or
      -- User accepting invitation (adding themselves)
      (
        user_id = auth.uid()
        and exists (
          select 1 from invitations 
          where group_id = group_members.group_id 
            and invitee_id = auth.uid() 
            and status = 'accepted'
        )
      )
    )
    and not exists (
      select 1 from group_bans 
      where group_bans.group_id = group_members.group_id 
        and group_bans.user_id = group_members.user_id
        and (expires_at is null or expires_at > now())
    )
  );

create policy "Delete members by owner or admin"
  on group_members for delete
  using (
    user_id = auth.uid() -- Can leave themselves
    or auth.uid() = (select owner_id from groups where id = group_id)
    or (
      exists (
        select 1 from group_members gm
        where gm.group_id = group_members.group_id 
          and gm.user_id = auth.uid() 
          and gm.role = 'admin'
      )
      and user_id <> (select owner_id from groups where id = group_id) -- Can't remove owner
    )
  );

-- Messages policies (FIXED)
drop policy if exists "Select messages for members" on messages;
drop policy if exists "Insert messages for members" on messages;
drop policy if exists "Soft delete by author or owner" on messages;

create policy "Select messages for members"
  on messages for select
  using (
    exists (
      select 1 from group_members 
      where group_members.group_id = messages.group_id 
        and group_members.user_id = auth.uid()
    )
    and messages.deleted = false
  );

-- FIXED: Simplified the slow mode check to avoid subquery issues
create policy "Insert messages for members"
  on messages for insert
  with check (
    exists (
      select 1 from group_members 
      where group_members.group_id = messages.group_id 
        and group_members.user_id = auth.uid()
    )
    and not exists (
      select 1 from group_bans 
      where group_bans.group_id = messages.group_id 
        and group_bans.user_id = auth.uid()
        and (expires_at is null or expires_at > now())
    )
    and author_id = auth.uid()
    and (
      -- Check if chat is locked
      not exists (
        select 1 from group_settings 
        where group_id = messages.group_id 
          and is_chat_locked = true
      )
      or auth.uid() = (select owner_id from groups where id = messages.group_id)
      or exists (
        select 1 from group_members 
        where group_id = messages.group_id 
          and user_id = auth.uid() 
          and role = 'admin'
      )
    )
    -- Slow mode check moved to application logic or trigger
    -- RLS policies should be kept simple to avoid subquery correlation issues
  );

create policy "Soft delete by author or moderator"
  on messages for update
  using (
    author_id = auth.uid()
    or auth.uid() = (select owner_id from groups where id = messages.group_id)
    or exists (
      select 1 from group_members 
      where group_id = messages.group_id 
        and user_id = auth.uid() 
        and role = 'admin'
    )
  )
  with check (deleted = true);

-- Reactions policies
drop policy if exists "Select reactions for members" on reactions;
drop policy if exists "Insert reactions for members" on reactions;
drop policy if exists "Delete own reactions" on reactions;

create policy "Select reactions for members"
  on reactions for select
  using (
    exists (
      select 1 from group_members gm
      join messages m on m.group_id = gm.group_id
      where m.id = reactions.message_id
        and gm.user_id = auth.uid()
    )
  );

create policy "Insert reactions for members"
  on reactions for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from group_members gm
      join messages m on m.group_id = gm.group_id
      where m.id = reactions.message_id
        and gm.user_id = auth.uid()
    )
    and not exists (
      select 1 from group_bans gb
      join messages m on m.group_id = gb.group_id
      where m.id = reactions.message_id
        and gb.user_id = auth.uid()
        and (gb.expires_at is null or gb.expires_at > now())
    )
    and exists (
      select 1 from group_settings gs
      join messages m on m.group_id = gs.group_id
      where m.id = reactions.message_id
        and gs.allow_reactions = true
    )
  );

create policy "Delete own reactions"
  on reactions for delete
  using (user_id = auth.uid());

-- Attachments policies
drop policy if exists "Select attachments for members" on attachments;
drop policy if exists "Insert attachments for members" on attachments;

create policy "Select attachments for members"
  on attachments for select
  using (
    exists (
      select 1 from group_members gm
      join messages m on m.group_id = gm.group_id
      where m.id = attachments.message_id
        and gm.user_id = auth.uid()
    )
  );

create policy "Insert attachments for members"
  on attachments for insert
  with check (
    exists (
      select 1 from group_members gm
      join messages m on m.group_id = gm.group_id
      where m.id = attachments.message_id
        and gm.user_id = auth.uid()
    )
    and exists (
      select 1 from messages
      where id = attachments.message_id
        and author_id = auth.uid()
    )
    and exists (
      select 1 from group_settings gs
      join messages m on m.group_id = gs.group_id
      where m.id = attachments.message_id
        and gs.allow_file_upload = true
        and (file_size / 1024 / 1024) <= gs.max_file_size_mb
    )
  );

-- Group bans policies
drop policy if exists "Select bans for moderator" on group_bans;
drop policy if exists "Ban by moderator" on group_bans;
drop policy if exists "Unban by moderator" on group_bans;

create policy "Select bans for moderator"
  on group_bans for select
  using (
    auth.uid() = (select owner_id from groups where id = group_bans.group_id)
    or exists (
      select 1 from group_members 
      where group_id = group_bans.group_id 
        and user_id = auth.uid() 
        and role = 'admin'
    )
  );

create policy "Ban by moderator"
  on group_bans for insert
  with check (
    user_id <> auth.uid()
    and banned_by = auth.uid()
    and (
      auth.uid() = (select owner_id from groups where id = group_id)
      or exists (
        select 1 from group_members 
        where group_id = group_bans.group_id 
          and user_id = auth.uid() 
          and role = 'admin'
      )
    )
    and user_id <> (select owner_id from groups where id = group_id) -- Can't ban owner
  );

create policy "Unban by moderator"
  on group_bans for delete
  using (
    auth.uid() = (select owner_id from groups where id = group_id)
    or exists (
      select 1 from group_members 
      where group_id = group_bans.group_id 
        and user_id = auth.uid() 
        and role = 'admin'
    )
  );

-- Invitations policies
drop policy if exists "Select own invitations" on invitations;
drop policy if exists "Send invitations to group members" on invitations;
drop policy if exists "Respond to own invitations" on invitations;
drop policy if exists "Cancel own sent invitations" on invitations;

create policy "Select own invitations"
  on invitations for select
  using (
    invitee_id = auth.uid() or inviter_id = auth.uid()
  );

create policy "Send invitations to group members"
  on invitations for insert
  with check (
    inviter_id = auth.uid()
    and exists (
      select 1 from group_members 
      where group_id = invitations.group_id 
        and user_id = auth.uid()
    )
    and not exists (
      select 1 from group_members 
      where group_id = invitations.group_id 
        and user_id = invitations.invitee_id
    )
    and not exists (
      select 1 from group_bans 
      where group_id = invitations.group_id 
        and user_id = invitations.invitee_id
        and (expires_at is null or expires_at > now())
    )
  );

create policy "Respond to own invitations"
  on invitations for update
  using (invitee_id = auth.uid())
  with check (invitee_id = auth.uid());

create policy "Cancel own sent invitations"
  on invitations for delete
  using (inviter_id = auth.uid() and status = 'pending');

-- Activities policies
drop policy if exists "Select activities for members" on activities;
drop policy if exists "Insert activity by member" on activities;

create policy "Select activities for members"
  on activities for select
  using (
    exists (
      select 1 from group_members 
      where group_members.group_id = activities.group_id 
        and group_members.user_id = auth.uid()
    )
  );

create policy "Insert activity by system"
  on activities for insert
  with check (
    actor_id = auth.uid()
    and (
      group_id is null
      or exists (
        select 1 from group_members 
        where group_members.group_id = activities.group_id 
          and group_members.user_id = auth.uid()
      )
    )
  );

-- Typing indicators policies
drop policy if exists "Select typing indicators for members" on typing_indicators;
drop policy if exists "Insert own typing indicators" on typing_indicators;
drop policy if exists "Update own typing indicators" on typing_indicators;
drop policy if exists "Delete own typing indicators" on typing_indicators;

create policy "Select typing indicators for members"
  on typing_indicators for select
  using (
    exists (
      select 1 from group_members 
      where group_members.group_id = typing_indicators.group_id 
        and group_members.user_id = auth.uid()
    )
  );

create policy "Insert own typing indicators"
  on typing_indicators for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from group_members 
      where group_members.group_id = typing_indicators.group_id 
        and group_members.user_id = auth.uid()
    )
  );

create policy "Update own typing indicators"
  on typing_indicators for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Delete own typing indicators"
  on typing_indicators for delete
  using (user_id = auth.uid());

-- Group settings policies
drop policy if exists "Select settings for members" on group_settings;
drop policy if exists "Insert settings by system" on group_settings;
drop policy if exists "Update settings by moderator" on group_settings;

create policy "Select settings for members"
  on group_settings for select
  using (
    exists (
      select 1 from group_members 
      where group_members.group_id = group_settings.group_id 
        and group_members.user_id = auth.uid()
    )
  );

create policy "Insert settings by system"
  on group_settings for insert
  with check (true); -- This will be handled by trigger

create policy "Update settings by moderator"
  on group_settings for update
  using (
    auth.uid() = (select owner_id from groups where id = group_id)
    or exists (
      select 1 from group_members 
      where group_id = group_settings.group_id 
        and user_id = auth.uid() 
        and role = 'admin'
    )
  )
  with check (
    auth.uid() = (select owner_id from groups where id = group_id)
    or exists (
      select 1 from group_members 
      where group_id = group_settings.group_id 
        and user_id = auth.uid() 
        and role = 'admin'
    )
  );

-- =====================================================================
-- SLOW MODE CHECK FUNCTION (Alternative approach)
-- =====================================================================

-- Create a function to handle slow mode checking
create or replace function check_slow_mode(p_group_id uuid, p_user_id uuid)
returns boolean as $$
declare
  v_slow_mode_seconds integer;
  v_last_message_time timestamp with time zone;
  v_is_moderator boolean;
begin
  -- Check if user is owner or admin (exempt from slow mode)
  select exists (
    select 1 from groups where id = p_group_id and owner_id = p_user_id
  ) or exists (
    select 1 from group_members 
    where group_id = p_group_id and user_id = p_user_id and role = 'admin'
  ) into v_is_moderator;
  
  if v_is_moderator then
    return true;
  end if;
  
  -- Get slow mode setting
  select slow_mode_seconds into v_slow_mode_seconds
  from group_settings 
  where group_id = p_group_id;
  
  if v_slow_mode_seconds is null or v_slow_mode_seconds = 0 then
    return true;
  end if;
  
  -- Get last message time
  select max(created_at) into v_last_message_time
  from messages 
  where group_id = p_group_id 
    and author_id = p_user_id 
    and created_at > now() - interval '1 hour';
  
  if v_last_message_time is null then
    return true;
  end if;
  
  -- Check if enough time has passed
  return now() > (v_last_message_time + (v_slow_mode_seconds * interval '1 second'));
end;
$$ language plpgsql security definer;

-- =====================================================================
-- REALTIME SUBSCRIPTIONS
-- =====================================================================

-- Enable realtime for tables that need live updates
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table reactions;
alter publication supabase_realtime add table group_members;
alter publication supabase_realtime add table invitations;
alter publication supabase_realtime add table typing_indicators;
alter publication supabase_realtime add table activities;

-- =====================================================================
-- UTILITY FUNCTIONS FOR FRONTEND
-- =====================================================================

-- Function to get group stats
create or replace function get_group_stats(group_uuid uuid)
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'member_count', (
      select count(*) from group_members where group_id = group_uuid
    ),
    'message_count', (
      select count(*) from messages 
      where group_id = group_uuid and deleted = false
    ),
    'last_activity', (
      select max(created_at) from messages 
      where group_id = group_uuid and deleted = false
    )
  ) into result;
  
  return result;
end;
$$ language plpgsql security definer;

-- Function to check if user can send message (updated)
create or replace function can_send_message(group_uuid uuid, user_uuid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from group_members 
    where group_id = group_uuid and user_id = user_uuid
  )
  and not exists (
    select 1 from group_bans 
    where group_id = group_uuid 
      and user_id = user_uuid
      and (expires_at is null or expires_at > now())
  )
  and (
    not exists (
      select 1 from group_settings 
      where group_id = group_uuid and is_chat_locked = true
    )
    or user_uuid = (select owner_id from groups where id = group_uuid)
    or exists (
      select 1 from group_members 
      where group_id = group_uuid 
        and user_id = user_uuid 
        and role = 'admin'
    )
  )
  and check_slow_mode(group_uuid, user_uuid);
end;
$$ language plpgsql security definer;

-- =====================================================================
-- CLEANUP & MAINTENANCE
-- =====================================================================

-- Schedule cleanup of expired typing indicators (run via cron or manually)
-- select cron.schedule('cleanup-typing', '* * * * *', 'select cleanup_expired_typing();');

-- Initial data cleanup
-- select cleanup_expired_typing();