-- =====================================================================
-- ROW LEVEL SECURITY POLICIES
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
alter table user_read_status enable row level security;
alter table message_read_status enable row level security;

-- =====================================================================
-- PROFILES POLICIES
-- =====================================================================

create policy "Users can read profiles" 
  on profiles for select 
  using (true);

create policy "Users can insert own profile" 
  on profiles for insert 
  with check (auth.uid() = id);

create policy "Users can update own profile" 
  on profiles for update 
  using (auth.uid() = id);

-- =====================================================================
-- GROUPS POLICIES
-- =====================================================================

create policy "Members can view groups" 
  on groups for select 
  using (not is_private or is_group_member(id, auth.uid()));

create policy "Users can create groups" 
  on groups for insert 
  with check (auth.uid() = owner_id);

create policy "Owners can update groups" 
  on groups for update 
  using (auth.uid() = owner_id);

create policy "Owners can delete groups" 
  on groups for delete 
  using (auth.uid() = owner_id);

-- =====================================================================
-- GROUP MEMBERS POLICIES
-- =====================================================================

create policy "Users can view group members" 
  on group_members for select 
  using (user_id = auth.uid() or is_group_member(group_id, auth.uid()));

create policy "Users can join via invitation" 
  on group_members for insert 
  with check (
    user_id = auth.uid() and
    exists (
      select 1 from invitations 
      where group_id = group_members.group_id 
        and invitee_id = auth.uid()
        and status = 'accepted'
    )
  );

create policy "Users can leave groups" 
  on group_members for delete 
  using (user_id = auth.uid());

create policy "Moderators can manage members" 
  on group_members for all 
  using (is_group_moderator(group_id, auth.uid())) 
  with check (
    is_group_moderator(group_id, auth.uid()) and
    user_id != (select owner_id from groups where id = group_id)
  );

-- =====================================================================
-- MESSAGES POLICIES
-- =====================================================================

create policy "Members can view messages" 
  on messages for select 
  using (not deleted and is_group_member(group_id, auth.uid()));

create policy "Members can send messages" 
  on messages for insert 
  with check (
    author_id = auth.uid() and
    is_group_member(group_id, auth.uid())
  );

create policy "Authors and moderators can update messages" 
  on messages for update 
  using (
    author_id = auth.uid() or
    is_group_moderator(group_id, auth.uid())
  );

-- =====================================================================
-- REACTIONS POLICIES
-- =====================================================================

create policy "Members can manage reactions" 
  on reactions for all 
  using (
    exists (
      select 1 from messages m
      where m.id = reactions.message_id
        and not m.deleted
        and is_group_member(m.group_id, auth.uid())
    )
  ) 
  with check (
    user_id = auth.uid() and
    exists (
      select 1 from messages m
      where m.id = reactions.message_id
        and not m.deleted
        and is_group_member(m.group_id, auth.uid())
    )
  );

-- =====================================================================
-- ATTACHMENTS POLICIES
-- =====================================================================

create policy "Members can view attachments" 
  on attachments for select 
  using (
    exists (
      select 1 from messages m
      where m.id = attachments.message_id
        and not m.deleted
        and is_group_member(m.group_id, auth.uid())
    )
  );

create policy "Message authors can add attachments" 
  on attachments for insert 
  with check (
    exists (
      select 1 from messages m
      where m.id = attachments.message_id
        and m.author_id = auth.uid()
        and is_group_member(m.group_id, auth.uid())
    )
  );

-- =====================================================================
-- GROUP BANS POLICIES
-- =====================================================================

create policy "Moderators can manage bans" 
  on group_bans for all 
  using (is_group_moderator(group_id, auth.uid())) 
  with check (
    banned_by = auth.uid() and
    is_group_moderator(group_id, auth.uid())
  );

-- =====================================================================
-- INVITATIONS POLICIES
-- =====================================================================

create policy "Users can view own invitations" 
  on invitations for select 
  using (invitee_id = auth.uid() or inviter_id = auth.uid());

create policy "Members can send invitations" 
  on invitations for insert 
  with check (
    inviter_id = auth.uid() and
    is_group_member(group_id, auth.uid())
  );

create policy "Users can respond to invitations" 
  on invitations for update 
  using (invitee_id = auth.uid());

create policy "Users can cancel sent invitations" 
  on invitations for delete 
  using (inviter_id = auth.uid() and status = 'pending');

-- =====================================================================
-- ACTIVITIES POLICIES
-- =====================================================================

create policy "Members can view activities" 
  on activities for select 
  using (
    group_id is null or
    is_group_member(group_id, auth.uid())
  );

create policy "System can log activities" 
  on activities for insert 
  with check (actor_id = auth.uid());

-- =====================================================================
-- TYPING INDICATORS POLICIES
-- =====================================================================

create policy "Members can view typing indicators" 
  on typing_indicators for select 
  using (is_group_member(group_id, auth.uid()));

create policy "Users can manage own typing" 
  on typing_indicators for all 
  using (user_id = auth.uid()) 
  with check (
    user_id = auth.uid() and
    is_group_member(group_id, auth.uid())
  );

-- =====================================================================
-- GROUP SETTINGS POLICIES
-- =====================================================================

create policy "Members can view settings" 
  on group_settings for select 
  using (is_group_member(group_id, auth.uid()));

create policy "System can create settings" 
  on group_settings for insert 
  with check (true);

create policy "Moderators can update settings" 
  on group_settings for update 
  using (is_group_moderator(group_id, auth.uid()));

-- =====================================================================
-- READ STATUS POLICIES
-- =====================================================================

create policy "Users can manage own read status" 
  on user_read_status for all 
  using (user_id = auth.uid()) 
  with check (user_id = auth.uid());

create policy "Users can manage own message read status" 
  on message_read_status for all 
  using (user_id = auth.uid()) 
  with check (user_id = auth.uid()); 