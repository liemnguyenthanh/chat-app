-- =====================================================================
-- DATABASE TRIGGERS
-- =====================================================================

-- Profile update trigger
drop trigger if exists trg_profile_updated on profiles;
create trigger trg_profile_updated
  before update on profiles
  for each row execute function handle_profile_updated();

-- User creation trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Group update trigger
drop trigger if exists trg_group_updated on groups;
create trigger trg_group_updated
  before update on groups
  for each row execute function handle_group_updated();

-- Group creation trigger
drop trigger if exists trg_new_group on groups;
create trigger trg_new_group
  after insert on groups
  for each row execute function handle_new_group();

-- Message last message update trigger
drop trigger if exists trg_update_group_last_message on messages;
create trigger trg_update_group_last_message
  after insert on messages
  for each row execute function update_group_last_message();

-- Message search vector trigger
drop trigger if exists messages_search_vector_update on messages;
create trigger messages_search_vector_update
  before insert or update of content on messages
  for each row execute function update_message_search_vector(); 