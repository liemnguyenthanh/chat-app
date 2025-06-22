-- =====================================================================
-- PERFORMANCE INDEXES
-- =====================================================================

-- Profiles indexes
create index if not exists idx_profiles_username on profiles(username) where username is not null;
create index if not exists idx_profiles_status on profiles(status);
create index if not exists idx_profiles_last_seen on profiles(last_seen_at desc);

-- Groups indexes
create index if not exists idx_groups_owner on groups(owner_id);
create index if not exists idx_groups_created_at on groups(created_at desc);
create index if not exists idx_groups_private on groups(is_private, created_at desc);
create index if not exists idx_groups_last_message on groups(last_message_id) where last_message_id is not null;

-- Group members indexes
create index if not exists idx_group_members_group_role on group_members(group_id, role);
create index if not exists idx_group_members_user on group_members(user_id);

-- Messages indexes
create index if not exists idx_messages_group_created on messages(group_id, created_at desc) where deleted = false;
create index if not exists idx_messages_author on messages(author_id);
create index if not exists idx_messages_thread on messages(thread_id, created_at) where thread_id is not null;
create index if not exists idx_messages_search_vector on messages using gin(search_vector);
create index if not exists idx_messages_pinned on messages(group_id, pinned_at desc) where pinned = true;
create index if not exists idx_messages_mention_users on messages using gin(mention_users);

-- Reactions indexes
create index if not exists idx_reactions_message on reactions(message_id);
create index if not exists idx_reactions_user on reactions(user_id);

-- Attachments indexes
create index if not exists idx_attachments_message on attachments(message_id);

-- Invitations indexes
create index if not exists idx_invitations_invitee_status on invitations(invitee_id, status);
create index if not exists idx_invitations_expires on invitations(expires_at) where expires_at is not null;

-- Activities indexes
create index if not exists idx_activities_group_created on activities(group_id, created_at desc);

-- Typing indicators indexes
create index if not exists idx_typing_expires on typing_indicators(expires_at);

-- Read status indexes
create index if not exists idx_user_read_status_user_group on user_read_status(user_id, group_id);
create index if not exists idx_message_read_status_message on message_read_status(message_id);
create index if not exists idx_message_read_status_user on message_read_status(user_id); 