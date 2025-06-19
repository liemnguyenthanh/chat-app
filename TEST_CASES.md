# 🧪 Comprehensive Chat Database Test Cases

## Test Categories Overview
**Total: 100 comprehensive test cases covering all database functionality**

---

## Authentication & Authorization Tests (4 tests)

### TEST001: User Profile Auto-Creation
**Description:** Verify that when a new user signs up via Supabase Auth, a profile is automatically created with a unique username.
**Category:** Authentication  
**Priority:** High
**Expected Result:** Profile record exists with valid username, no duplicates allowed.

### TEST002: Username Uniqueness Enforcement  
**Description:** Test username collision handling when multiple users have similar email prefixes.
**Category:** Authentication
**Priority:** High
**Expected Result:** Unique usernames generated (user1, user1_1, user1_2, etc.)

### TEST003: Profile Update Authorization
**Description:** Verify users can only update their own profiles, not others.
**Category:** Authorization
**Priority:** High  
**Expected Result:** Own profile updates succeed, others fail with RLS violation.

### TEST004: Profile Read Permissions
**Description:** Test that users can read all profiles (for mentions, user search, etc.)
**Category:** Authorization
**Priority:** Medium
**Expected Result:** All profiles visible to authenticated users.

---

## Group/Room Management Tests (14 tests)

### TEST005: Group Creation Basic
**Description:** Verify authenticated user can create a new group with valid data.
**Category:** Group Management
**Priority:** High
**Expected Result:** Group created, owner automatically added as admin member, settings table populated.

### TEST006: Group Creation Validation
**Description:** Test group creation with invalid data (empty name, too long description, etc.)
**Category:** Group Management
**Priority:** Medium
**Expected Result:** Appropriate constraint violations thrown.

### TEST007: Group Ownership Transfer
**Description:** Test transferring group ownership to another admin member.
**Category:** Group Management
**Priority:** Medium
**Expected Result:** Owner changed, previous owner becomes admin, new owner becomes admin.

### TEST008: Private vs Public Group Access
**Description:** Verify RLS policies for private groups vs public groups.
**Category:** Group Management
**Priority:** High
**Expected Result:** Private groups only visible to members, public groups visible to all.

### TEST009: Group Member Addition by Owner
**Description:** Test owner adding new members to group.
**Category:** Group Management
**Priority:** High
**Expected Result:** Members added successfully with 'member' role.

### TEST010: Group Member Addition by Admin
**Description:** Test admin (non-owner) adding new members to group.
**Category:** Group Management
**Priority:** High
**Expected Result:** Members added successfully by admin.

### TEST011: Group Member Addition by Regular Member
**Description:** Test regular member attempting to add other members.
**Category:** Group Management
**Priority:** High
**Expected Result:** Operation fails with insufficient permissions.

### TEST012: Group Member Role Changes
**Description:** Test promoting member to admin and demoting admin to member.
**Category:** Group Management
**Priority:** Medium
**Expected Result:** Role changes succeed when performed by owner/admin.

### TEST013: Group Member Self-Removal
**Description:** Test member leaving a group voluntarily.
**Category:** Group Management
**Priority:** High
**Expected Result:** Member removed from group, loses access to group data.

### TEST014: Group Member Removal by Moderator
**Description:** Test admin/owner removing other members.
**Category:** Group Management
**Priority:** High
**Expected Result:** Member removed successfully, appropriate activity logged.

### TEST015: Owner Self-Removal Prevention
**Description:** Test preventing group owner from removing themselves.
**Category:** Group Management
**Priority:** Medium
**Expected Result:** Operation fails, owner cannot be removed while still owner.

### TEST016: Group Deletion by Owner
**Description:** Test group deletion and cascade effects.
**Category:** Group Management
**Priority:** High
**Expected Result:** Group and all associated data (messages, members, settings) deleted.

### TEST017: Group Deletion by Non-Owner
**Description:** Test unauthorized group deletion attempt.
**Category:** Group Management
**Priority:** High
**Expected Result:** Operation fails with insufficient permissions.

### TEST018: Maximum Group Members Limit
**Description:** Test adding members beyond max_members limit.
**Category:** Group Management
**Priority:** Low
**Expected Result:** Addition fails when limit reached.

---

## Core Messaging Tests (9 tests)

### TEST019: Send Text Message Basic
**Description:** Test sending a basic text message to a group.
**Category:** Messaging
**Priority:** High
**Expected Result:** Message created, visible to all group members.

### TEST020: Send Message Non-Member
**Description:** Test non-member attempting to send message to group.
**Category:** Messaging
**Priority:** High
**Expected Result:** Operation fails with RLS violation.

### TEST021: Message Content Sanitization
**Description:** Test message content with potentially harmful HTML/JS.
**Category:** Messaging
**Priority:** High
**Expected Result:** Content sanitized, dangerous scripts removed.

### TEST022: Message Content Length Validation
**Description:** Test message with content exceeding 4000 character limit.
**Category:** Messaging
**Priority:** Medium
**Expected Result:** Content truncated or validation error thrown.

### TEST023: Empty Message Validation
**Description:** Test sending message with only whitespace or empty content.
**Category:** Messaging
**Priority:** Medium
**Expected Result:** Message rejected or content set to null.

### TEST024: System Message Creation
**Description:** Test creating system messages for events (user joined, etc.)
**Category:** Messaging
**Priority:** Medium
**Expected Result:** System message created with appropriate data structure.

### TEST025: Message Visibility to Members
**Description:** Verify all group members can see messages in the group.
**Category:** Messaging
**Priority:** High
**Expected Result:** Messages visible to all current members.

### TEST026: Message Invisibility to Non-Members
**Description:** Verify non-members cannot see group messages.
**Category:** Messaging
**Priority:** High
**Expected Result:** Messages not visible to users outside group.

### TEST027: Message Real-time Updates
**Description:** Test real-time message delivery to multiple connected clients.
**Category:** Messaging
**Priority:** High
**Expected Result:** New messages appear immediately for all connected group members.

---

## Message Features Tests (9 tests)

### TEST028: Message Soft Delete by Author
**Description:** Test message author deleting their own message.
**Category:** Message Features
**Priority:** High
**Expected Result:** Message marked as deleted, content hidden, timestamp recorded.

### TEST029: Message Delete by Moderator
**Description:** Test admin/owner deleting any message in their group.
**Category:** Message Features
**Priority:** High
**Expected Result:** Message deleted, activity logged with moderator info.

### TEST030: Message Delete by Regular Member
**Description:** Test regular member attempting to delete others' messages.
**Category:** Message Features
**Priority:** High
**Expected Result:** Operation fails with insufficient permissions.

### TEST031: Reply to Message Basic
**Description:** Test replying to an existing message (threading).
**Category:** Message Features
**Priority:** Medium
**Expected Result:** Reply created with proper reply_to reference.

### TEST032: Reply to Deleted Message
**Description:** Test replying to a message that has been deleted.
**Category:** Message Features
**Priority:** Low
**Expected Result:** Reply prevented or warning shown.

### TEST033: Thread Depth Limitation
**Description:** Test creating deeply nested reply chains.
**Category:** Message Features
**Priority:** Low
**Expected Result:** System handles deep threads gracefully.

### TEST034: Message Edit by Author
**Description:** Test author editing their own message content.
**Category:** Message Features
**Priority:** Medium
**Expected Result:** Message updated, updated_at timestamp changed.

### TEST035: Message Edit by Non-Author
**Description:** Test non-author attempting to edit message.
**Category:** Message Features
**Priority:** High
**Expected Result:** Operation fails with insufficient permissions.

### TEST036: Message Type Validation
**Description:** Test creating messages with different types (text, image, file, system).
**Category:** Message Features
**Priority:** Medium
**Expected Result:** Type-specific validation enforced, appropriate data required.

---

## Reactions Tests (7 tests)

### TEST037: Add Reaction to Message
**Description:** Test adding emoji reaction to a message.
**Category:** Reactions
**Priority:** Medium
**Expected Result:** Reaction created, visible to all group members.

### TEST038: Remove Own Reaction
**Description:** Test user removing their own reaction from a message.
**Category:** Reactions
**Priority:** Medium
**Expected Result:** Reaction deleted successfully.

### TEST039: Remove Others' Reactions
**Description:** Test user attempting to remove another user's reaction.
**Category:** Reactions
**Priority:** Medium
**Expected Result:** Operation fails with insufficient permissions.

### TEST040: Multiple Reactions Same User
**Description:** Test user adding multiple different reactions to same message.
**Category:** Reactions
**Priority:** Low
**Expected Result:** Multiple reactions allowed per user per message.

### TEST041: Duplicate Reaction Prevention
**Description:** Test user adding same reaction twice to same message.
**Category:** Reactions
**Priority:** Low
**Expected Result:** Duplicate prevented, only one reaction of each type per user.

### TEST042: Reaction to Deleted Message
**Description:** Test adding reaction to a deleted message.
**Category:** Reactions
**Priority:** Low
**Expected Result:** Reaction prevented or existing reactions hidden.

### TEST043: Reaction Real-time Updates
**Description:** Test real-time reaction updates across clients.
**Category:** Reactions
**Priority:** Medium
**Expected Result:** Reactions appear/disappear immediately for all users.

---

## Attachments Tests (5 tests)

### TEST044: File Attachment Upload
**Description:** Test uploading file attachment with message.
**Category:** Attachments
**Priority:** Medium
**Expected Result:** Attachment record created with proper metadata.

### TEST045: File Size Validation
**Description:** Test uploading file exceeding size limit (100MB).
**Category:** Attachments
**Priority:** Medium
**Expected Result:** Upload rejected with size validation error.

### TEST046: File Type Validation
**Description:** Test uploading various file types and MIME validation.
**Category:** Attachments
**Priority:** Medium
**Expected Result:** Appropriate file types accepted, dangerous types rejected.

### TEST047: Attachment Deletion with Message
**Description:** Test attachment cleanup when message is deleted.
**Category:** Attachments
**Priority:** Medium
**Expected Result:** Attachment records deleted via cascade.

### TEST048: Attachment Access Control
**Description:** Test non-group members accessing attachment files.
**Category:** Attachments
**Priority:** High
**Expected Result:** Access denied to non-members.

---

## Invitations Tests (8 tests)

### TEST049: Send Group Invitation
**Description:** Test group member inviting another user to join.
**Category:** Invitations
**Priority:** High
**Expected Result:** Invitation created, recipient can see pending invitation.

### TEST050: Accept Group Invitation
**Description:** Test user accepting a pending group invitation.
**Category:** Invitations
**Priority:** High
**Expected Result:** User added to group, invitation status updated to 'accepted'.

### TEST051: Decline Group Invitation
**Description:** Test user declining a group invitation.
**Category:** Invitations
**Priority:** High
**Expected Result:** Invitation status updated to 'declined'.

### TEST052: Invitation Expiration
**Description:** Test automatic expiration of old invitations.
**Category:** Invitations
**Priority:** Medium
**Expected Result:** Expired invitations marked as 'expired' automatically.

### TEST053: Duplicate Invitation Prevention
**Description:** Test preventing multiple invitations to same user for same group.
**Category:** Invitations
**Priority:** Medium
**Expected Result:** Duplicate invitation rejected, unique constraint enforced.

### TEST054: Self-Invitation Prevention
**Description:** Test user attempting to invite themselves.
**Category:** Invitations
**Priority:** Low
**Expected Result:** Self-invitation prevented by constraint.

### TEST055: Non-Member Invitation Attempt
**Description:** Test non-group member attempting to send invitations.
**Category:** Invitations
**Priority:** High
**Expected Result:** Operation fails with insufficient permissions.

### TEST056: Invitation to Existing Member
**Description:** Test inviting a user who is already a group member.
**Category:** Invitations
**Priority:** Low
**Expected Result:** Invitation prevented or handled gracefully.

---

## Moderation Tests (9 tests)

### TEST057: Ban User from Group
**Description:** Test admin/owner banning a member from group.
**Category:** Moderation
**Priority:** High
**Expected Result:** User banned, removed from group, ban record created.

### TEST058: Ban User with Expiration
**Description:** Test creating temporary ban with expiration date.
**Category:** Moderation
**Priority:** Medium
**Expected Result:** Ban created with expiry, user unbanned automatically after expiration.

### TEST059: Unban User
**Description:** Test admin/owner manually unbanning a user.
**Category:** Moderation
**Priority:** Medium
**Expected Result:** Ban record removed, user can rejoin group.

### TEST060: Ban Self-Prevention
**Description:** Test preventing users from banning themselves.
**Category:** Moderation
**Priority:** Low
**Expected Result:** Self-ban prevented by constraint.

### TEST061: Ban Owner Prevention
**Description:** Test preventing banning of group owner.
**Category:** Moderation
**Priority:** Medium
**Expected Result:** Owner ban prevented by constraint.

### TEST062: Banned User Message Attempt
**Description:** Test banned user attempting to send messages.
**Category:** Moderation
**Priority:** High
**Expected Result:** Message sending prevented.

### TEST063: Chat Lock by Moderator
**Description:** Test admin/owner locking chat to prevent new messages.
**Category:** Moderation
**Priority:** Medium
**Expected Result:** Chat locked, only moderators can send messages.

### TEST064: Message in Locked Chat
**Description:** Test regular member attempting to message in locked chat.
**Category:** Moderation
**Priority:** Medium
**Expected Result:** Message prevented due to lock status.

### TEST065: Chat Unlock by Moderator
**Description:** Test admin/owner unlocking previously locked chat.
**Category:** Moderation
**Priority:** Medium
**Expected Result:** Chat unlocked, all members can send messages again.

---

## Typing Indicators Tests (5 tests)

### TEST066: Typing Indicator Creation
**Description:** Test user starting to type, creating typing indicator.
**Category:** Typing Indicators
**Priority:** Low
**Expected Result:** Typing indicator created with future expiration.

### TEST067: Typing Indicator Expiration
**Description:** Test automatic cleanup of expired typing indicators.
**Category:** Typing Indicators
**Priority:** Low
**Expected Result:** Expired indicators removed automatically.

### TEST068: Typing Indicator Real-time
**Description:** Test real-time typing indicator updates across clients.
**Category:** Typing Indicators
**Priority:** Low
**Expected Result:** Typing status appears/disappears for other users in real-time.

### TEST069: Multiple Users Typing
**Description:** Test multiple users typing simultaneously in same group.
**Category:** Typing Indicators
**Priority:** Low
**Expected Result:** All typing indicators tracked independently.

### TEST070: Typing Indicator Cleanup on Leave
**Description:** Test typing indicator cleanup when user leaves group.
**Category:** Typing Indicators
**Priority:** Low
**Expected Result:** Typing indicators removed when user loses group access.

---

## Activities & Audit Tests (4 tests)

### TEST071: Activity Logging Group Events
**Description:** Test automatic logging of group activities (creation, member changes).
**Category:** Activities
**Priority:** Medium
**Expected Result:** Activities logged with proper actor, action, and metadata.

### TEST072: Activity Logging Message Events
**Description:** Test logging of message-related activities (deletion by moderator).
**Category:** Activities
**Priority:** Medium
**Expected Result:** Message activities logged with appropriate context.

### TEST073: Activity History Access
**Description:** Test group members accessing activity history.
**Category:** Activities
**Priority:** Low
**Expected Result:** Members can view group activity log.

### TEST074: Activity Privacy for Non-Members
**Description:** Test non-members attempting to access group activities.
**Category:** Activities
**Priority:** Medium
**Expected Result:** Access denied to non-group members.

---

## Performance & Scale Tests (5 tests)

### TEST075: Large Message Volume
**Description:** Test sending many messages rapidly to same group.
**Category:** Performance
**Priority:** Medium
**Expected Result:** System handles high message volume without degradation.

### TEST076: Large Group Membership
**Description:** Test group with maximum allowed members (1000).
**Category:** Performance
**Priority:** Low
**Expected Result:** Large groups function properly, reasonable performance.

### TEST077: Concurrent Message Sending
**Description:** Test multiple users sending messages simultaneously.
**Category:** Performance
**Priority:** High
**Expected Result:** No race conditions, all messages properly ordered.

### TEST078: Concurrent Group Operations
**Description:** Test simultaneous group member additions/removals.
**Category:** Performance
**Priority:** Medium
**Expected Result:** Operations complete correctly without conflicts.

### TEST079: Database Query Performance
**Description:** Test query performance with large datasets.
**Category:** Performance
**Priority:** Medium
**Expected Result:** Queries complete within acceptable time limits.

---

## Data Integrity Tests (4 tests)

### TEST080: Foreign Key Constraint Enforcement
**Description:** Test creating records with invalid foreign key references.
**Category:** Data Integrity
**Priority:** High
**Expected Result:** Constraint violations properly enforced.

### TEST081: Cascade Delete Verification
**Description:** Test cascade deletes work correctly (group deletion removes all data).
**Category:** Data Integrity
**Priority:** High
**Expected Result:** Related records properly deleted via cascade.

### TEST082: Data Validation Constraints
**Description:** Test all check constraints on tables (length limits, format validation).
**Category:** Data Integrity
**Priority:** Medium
**Expected Result:** Invalid data rejected, valid data accepted.

### TEST083: Unique Constraint Enforcement
**Description:** Test unique constraints (usernames, invitation uniqueness).
**Category:** Data Integrity
**Priority:** High
**Expected Result:** Duplicates prevented, unique data allowed.

---

## Edge Cases & Error Handling Tests (7 tests)

### TEST084: Null Data Handling
**Description:** Test operations with null values where allowed/disallowed.
**Category:** Edge Cases
**Priority:** Medium
**Expected Result:** Nulls handled correctly according to schema design.

### TEST085: Invalid JSON Data
**Description:** Test inserting malformed JSON in JSONB columns.
**Category:** Edge Cases
**Priority:** Medium
**Expected Result:** Invalid JSON rejected, valid JSON accepted.

### TEST086: Unicode Content Handling
**Description:** Test messages with emojis, various languages, special characters.
**Category:** Edge Cases
**Priority:** Medium
**Expected Result:** Unicode content properly stored and retrieved.

### TEST087: Timezone Handling
**Description:** Test timestamp operations across different timezones.
**Category:** Edge Cases
**Priority:** Low
**Expected Result:** Timestamps correctly stored in UTC, properly converted.

### TEST088: Transaction Rollback Scenarios
**Description:** Test operations that should rollback on errors.
**Category:** Edge Cases
**Priority:** Medium
**Expected Result:** Failed operations don't leave partial/corrupt data.

### TEST089: Connection Limit Stress Test
**Description:** Test system behavior under high connection load.
**Category:** Edge Cases
**Priority:** Low
**Expected Result:** System gracefully handles connection limits.

### TEST090: Memory Usage with Large JSONB
**Description:** Test storing large JSON data in message/activity metadata.
**Category:** Edge Cases
**Priority:** Medium
**Expected Result:** Large JSON handled within memory constraints.

---

## Security Tests (5 tests)

### TEST091: SQL Injection Prevention
**Description:** Test SQL injection attempts in user inputs.
**Category:** Security
**Priority:** High
**Expected Result:** Injection attempts safely handled, no unauthorized access.

### TEST092: XSS Prevention in Content
**Description:** Test script injection in message content and user profiles.
**Category:** Security
**Priority:** High
**Expected Result:** Malicious scripts sanitized or rejected.

### TEST093: Unauthorized API Access
**Description:** Test accessing database directly without proper authentication.
**Category:** Security
**Priority:** High
**Expected Result:** Unauthenticated access denied by RLS.

### TEST094: Cross-Group Data Access
**Description:** Test accessing data from groups user doesn't belong to.
**Category:** Security
**Priority:** High
**Expected Result:** Cross-group access denied by RLS policies.

### TEST095: Privilege Escalation Attempts
**Description:** Test attempts to gain unauthorized admin/owner privileges.
**Category:** Security
**Priority:** High
**Expected Result:** Privilege escalation attempts fail.

---

## Cleanup & Maintenance Tests (5 tests)

### TEST096: Expired Data Cleanup
**Description:** Test cleanup functions for expired typing indicators and invitations.
**Category:** Maintenance
**Priority:** Medium
**Expected Result:** Expired data properly cleaned up automatically.

### TEST097: Message Archival Process
**Description:** Test archiving old deleted messages to separate table.
**Category:** Maintenance
**Priority:** Low
**Expected Result:** Old messages moved to archive, main table cleaned.

### TEST098: Statistics and Monitoring
**Description:** Test system status and health check functions.
**Category:** Maintenance
**Priority:** Medium
**Expected Result:** Accurate system statistics and health status reported.

### TEST099: Database Maintenance Operations
**Description:** Test ANALYZE and other maintenance functions.
**Category:** Maintenance
**Priority:** Low
**Expected Result:** Maintenance operations complete successfully.

### TEST100: Full System Integration
**Description:** Test complete user journey: signup → create group → invite users → chat → moderation.
**Category:** Integration
**Priority:** High
**Expected Result:** End-to-end functionality works seamlessly.

---

## Summary by Priority:
- **High Priority:** 28 tests (critical functionality)
- **Medium Priority:** 35 tests (important features)  
- **Low Priority:** 37 tests (edge cases & nice-to-haves)

## Summary by Category:
- **Authentication/Authorization:** 4 tests
- **Group Management:** 14 tests  
- **Core Messaging:** 9 tests
- **Message Features:** 9 tests
- **Reactions:** 7 tests
- **Attachments:** 5 tests
- **Invitations:** 8 tests
- **Moderation:** 9 tests
- **Typing Indicators:** 5 tests
- **Activities/Audit:** 4 tests
- **Performance/Scale:** 5 tests
- **Data Integrity:** 4 tests
- **Edge Cases:** 7 tests
- **Security:** 5 tests
- **Maintenance:** 5 tests

---

## Usage Instructions:
To run any specific test case, simply ask: **"Run TEST042"** or **"Execute TEST075"** and I'll provide the detailed SQL commands and verification steps for that specific test. 

# Supabase Project Details
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_SERVICE_KEY="your-service-role-key"  # NOT the anon key

# OR Database Connection (if using direct PostgreSQL)
DB_HOST="your-db-host"
DB_PORT="5432"
DB_NAME="postgres" 
DB_USER="postgres"
DB_PASSWORD="your-password" 