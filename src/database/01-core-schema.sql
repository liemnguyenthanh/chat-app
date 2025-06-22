-- =====================================================================
-- CORE SCHEMA - Tables and Types Only
-- =====================================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- Custom Types
create type if not exists activity_action as enum (
  'user_joined', 'user_left', 'user_banned', 'user_unbanned',
  'message_deleted', 'chat_locked', 'chat_unlocked',
  'group_created', 'group_updated'
);

-- =====================================================================
-- CORE TABLES
-- =====================================================================

-- Profiles
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique check (username is null or (length(trim(username)) >= 3 and length(trim(username)) <= 30)),
  full_name  text check (full_name is null or length(trim(full_name)) <= 100),
  avatar_url text,
  bio        text check (bio is null or length(bio) <= 500),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  status     text default 'offline',
  last_seen_at timestamp with time zone default now()
);

-- Groups
create table if not exists groups (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null check (length(trim(name)) > 0 and length(trim(name)) <= 100),
  description text check (description is null or length(description) <= 500),
  avatar_url  text,
  owner_id    uuid not null references profiles(id) on delete cascade,
  is_private  boolean default false,
  max_members integer default 100 check (max_members > 0 and max_members <= 1000),
  created_at  timestamp with time zone default now(),
  updated_at  timestamp with time zone default now(),
  last_message_id uuid references messages(id) on delete set null
);

-- Group members
create table if not exists group_members (
  group_id   uuid references groups(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  role       text default 'member' check (role in ('member', 'admin')),
  joined_at  timestamp with time zone default now(),
  primary key(group_id, user_id)
);

-- Messages
create table if not exists messages (
  id         uuid primary key default uuid_generate_v4(),
  group_id   uuid not null references groups(id) on delete cascade,
  author_id  uuid not null references profiles(id) on delete cascade,
  content    text check (content is null or length(content) <= 4000),
  data       jsonb check (data is null or octet_length(data::text) <= 65536),
  reply_to   uuid references messages(id) on delete set null,
  thread_id  uuid references messages(id) on delete set null,
  message_type text default 'text' check (message_type in ('text', 'image', 'file', 'system')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  deleted    boolean default false,
  deleted_at timestamp with time zone,
  edited_at  timestamp with time zone,
  metadata   jsonb default '{}',
  priority   integer default 0,
  pinned     boolean default false,
  pinned_at  timestamp with time zone,
  pinned_by  uuid references auth.users(id) on delete set null,
  forwarded_from uuid references messages(id) on delete set null,
  mention_users uuid[],
  has_attachments boolean default false,
  search_vector tsvector,
  constraint messages_content_or_data check (
    content is not null or data is not null or message_type = 'system'
  ),
  constraint messages_no_self_reply check (id != reply_to)
);

-- Reactions
create table if not exists reactions (
  message_id uuid not null references messages(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  emoji      text not null check (length(trim(emoji)) > 0 and length(trim(emoji)) <= 10),
  created_at timestamp with time zone default now(),
  primary key(message_id, user_id, emoji)
);

-- Attachments
create table if not exists attachments (
  id          uuid primary key default uuid_generate_v4(),
  message_id  uuid not null references messages(id) on delete cascade,
  filename    text not null check (length(trim(filename)) > 0 and length(trim(filename)) <= 255),
  file_size   bigint check (file_size > 0 and file_size <= 104857600),
  mime_type   text not null check (length(trim(mime_type)) > 0),
  bucket_path text not null check (length(trim(bucket_path)) > 0),
  created_at  timestamp with time zone default now(),
  url         text,
  thumbnail_url text,
  duration    integer,
  width       integer,
  height      integer,
  metadata    jsonb default '{}'
);

-- Group bans
create table if not exists group_bans (
  group_id   uuid not null references groups(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  banned_by  uuid not null references profiles(id) on delete set null,
  reason     text check (reason is null or length(reason) <= 500),
  banned_at  timestamp with time zone default now(),
  expires_at timestamp with time zone,
  primary key(group_id, user_id),
  constraint group_bans_no_self_ban check (user_id != banned_by),
  constraint group_bans_valid_expiry check (expires_at is null or expires_at > banned_at)
);

-- Activities
create table if not exists activities (
  id         uuid primary key default uuid_generate_v4(),
  group_id   uuid references groups(id) on delete cascade,
  actor_id   uuid not null references profiles(id) on delete set null,
  target_id  uuid references profiles(id) on delete set null,
  action     activity_action not null,
  metadata   jsonb default '{}',
  created_at timestamp with time zone default now(),
  constraint activities_actor_not_target check (actor_id != target_id or target_id is null)
);

-- Typing indicators
create table if not exists typing_indicators (
  group_id   uuid references groups(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  expires_at timestamp with time zone default (now() + interval '10 seconds'),
  primary key(group_id, user_id)
);

-- Group settings
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

-- Invitations
create table if not exists invitations (
  id         uuid primary key default uuid_generate_v4(),
  group_id   uuid not null references groups(id) on delete cascade,
  inviter_id uuid not null references profiles(id) on delete cascade,
  invitee_id uuid not null references profiles(id) on delete cascade,
  status     text default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  message    text check (message is null or length(message) <= 500),
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + interval '7 days'),
  responded_at timestamp with time zone,
  unique(group_id, invitee_id),
  constraint invitations_no_self_invite check (inviter_id != invitee_id),
  constraint invitations_valid_expiry check (expires_at > created_at)
);

-- User read status
create table if not exists user_read_status (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade,
  group_id     uuid references groups(id) on delete cascade,
  last_read_at timestamp with time zone default now(),
  created_at   timestamp with time zone default now(),
  updated_at   timestamp with time zone default now()
);

-- Message read status
create table if not exists message_read_status (
  id         uuid primary key default gen_random_uuid(),
  message_id uuid references messages(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  read_at    timestamp with time zone default now(),
  created_at timestamp with time zone default now()
); 