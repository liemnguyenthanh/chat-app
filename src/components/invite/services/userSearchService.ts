import { supabase } from '@/lib/supabaseClient';
import { UserProfile } from '../types/inviteTypes';

export class UserSearchService {
  static async searchUsers(query: string, groupId: string): Promise<UserProfile[]> {
    if (!query.trim() || query.length < 2) {
      return [];
    }

    // Search for users by username or full name
    const { data: users, error: searchError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(10);

    if (searchError) throw searchError;

    // Get existing group members to filter them out
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    if (membersError) throw membersError;

    const memberIds = members?.map(m => m.user_id) || [];
    
    // Filter out users who are already members
    return users?.filter(user => !memberIds.includes(user.id)) || [];
  }

  static formatUserDisplayName(user: UserProfile): string {
    return user.full_name 
      ? `${user.full_name} (@${user.username})` 
      : `@${user.username}`;
  }

  static getUserInitials(user: UserProfile): string {
    return user.username.charAt(0).toUpperCase();
  }
} 