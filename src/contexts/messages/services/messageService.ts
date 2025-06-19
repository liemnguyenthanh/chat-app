import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '@supabase/auth-helpers-react';
import { Message } from '../types/messageTypes';

const MESSAGES_PER_PAGE = 50;

export class MessageService {
  constructor(private supabase: SupabaseClient, private user: User | null) {}

  async fetchMessages(groupId: string, offset = 0, limit = MESSAGES_PER_PAGE): Promise<Message[]> {
    if (!this.user) return [];

    try {
      // Get the current session for auth token
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid session');
      }

      // Try to use the Edge Function first
      try {
        const { data, error: functionError } = await this.supabase.functions.invoke('fetch-messages', {
          body: {
            groupId,
            offset,
            limit,
            includeReactions: true,
            includeThreads: true,
            includeReadStatus: true
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (functionError) {
          throw functionError;
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        return data?.messages || [];
      } catch (edgeFunctionError) {
        console.log('Edge Function not available, using fallback queries');
        
        // Fallback to original implementation
        const { data, error } = await this.supabase
          .from('messages')
          .select(`
            *,
            author:profiles!author_id(
              id,
              username,
              full_name,
              avatar_url
            ),
            attachments(
              id,
              filename,
              file_size,
              mime_type,
              bucket_path
            )
          `)
          .eq('group_id', groupId)
          .eq('deleted', false)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        if (!data || data.length === 0) return [];

        // Fetch reactions for all messages in this batch
        const messageIds = data.map(msg => msg.id);
        const { data: reactionsData, error: reactionsError } = await this.supabase
          .from('reactions')
          .select('message_id, emoji, user_id, profiles!user_id(username)')
          .in('message_id', messageIds);

        if (reactionsError) {
          console.error('Error fetching reactions:', reactionsError);
        }

        // Group reactions by message and emoji
        const reactionsByMessage = (reactionsData || []).reduce((acc: any, reaction: any) => {
          const messageId = reaction.message_id;
          const emoji = reaction.emoji;
          
          if (!acc[messageId]) acc[messageId] = {};
          if (!acc[messageId][emoji]) {
            acc[messageId][emoji] = { emoji, count: 0, users: [] };
          }
          
          acc[messageId][emoji].count++;
          acc[messageId][emoji].users.push(reaction.user_id);
          return acc;
        }, {});

        // Add reactions to each message
        const messagesWithReactions = data.map(message => ({
          ...message,
          reactions: Object.values(reactionsByMessage[message.id] || {})
        }));

        return messagesWithReactions.reverse(); // Reverse to show oldest first
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      throw err;
    }
  }

  async sendMessage(groupId: string, content: string, replyTo?: string): Promise<string> {
    if (!this.user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .from('messages')
      .insert({
        group_id: groupId,
        author_id: this.user.id,
        content: content.trim(),
        reply_to: replyTo || null,
        message_type: 'text'
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  async editMessage(messageId: string, content: string): Promise<void> {
    if (!this.user) throw new Error('User not authenticated');

    const { error } = await this.supabase
      .from('messages')
      .update({ 
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('author_id', this.user.id);

    if (error) throw error;
  }

  async deleteMessage(messageId: string): Promise<void> {
    if (!this.user) throw new Error('User not authenticated');

    const { error } = await this.supabase
      .from('messages')
      .update({ 
        deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('author_id', this.user.id);

    if (error) throw error;
  }

  async addReaction(messageId: string, emoji: string): Promise<void> {
    if (!this.user) throw new Error('User not authenticated');

    const { error } = await this.supabase
      .from('reactions')
      .upsert({
        message_id: messageId,
        user_id: this.user.id,
        emoji: emoji
      });

    if (error) throw error;
  }

  async removeReaction(messageId: string, emoji: string): Promise<void> {
    if (!this.user) throw new Error('User not authenticated');

    const { error } = await this.supabase
      .from('reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', this.user.id)
      .eq('emoji', emoji);

    if (error) throw error;
  }

  async markAsRead(groupId: string): Promise<void> {
    if (!this.user) return;
    
    try {
      // Get all unread messages in this group
      const { data: unreadMessages, error } = await this.supabase
        .from('messages')
        .select('id')
        .eq('group_id', groupId)
        .eq('deleted', false)
        .not('author_id', 'eq', this.user.id); // Don't mark own messages as read

      if (error) {
        console.error('Error fetching unread messages:', error);
        return;
      }

      if (!unreadMessages || unreadMessages.length === 0) return;

      // Mark all messages as read
      const readStatusEntries = unreadMessages.map(msg => ({
        message_id: msg.id,
        user_id: this.user!.id,
        read_at: new Date().toISOString()
      }));

      const { error: insertError } = await this.supabase
        .from('message_read_status')
        .upsert(readStatusEntries);

      if (insertError) {
        console.error('Error marking messages as read:', insertError);
      }
    } catch (err) {
      console.error('Error in markAsRead:', err);
    }
  }

  async pinMessage(messageId: string): Promise<void> {
    if (!this.user) throw new Error('User not authenticated');

    const { error } = await this.supabase
      .from('messages')
      .update({ 
        pinned: true,
        pinned_at: new Date().toISOString(),
        pinned_by: this.user.id
      })
      .eq('id', messageId);

    if (error) throw error;
  }

  async unpinMessage(messageId: string): Promise<void> {
    if (!this.user) throw new Error('User not authenticated');

    const { error } = await this.supabase
      .from('messages')
      .update({ 
        pinned: false,
        pinned_at: null,
        pinned_by: null
      })
      .eq('id', messageId);

    if (error) throw error;
  }

  async forwardMessage(messageId: string, targetGroupId: string): Promise<string> {
    if (!this.user) throw new Error('User not authenticated');

    // Get the original message
    const { data: originalMessage, error: fetchError } = await this.supabase
      .from('messages')
      .select('content, message_type, metadata, attachments(*)')
      .eq('id', messageId)
      .single();

    if (fetchError) throw fetchError;

    // Create forwarded message
    const { data, error } = await this.supabase
      .from('messages')
      .insert({
        group_id: targetGroupId,
        author_id: this.user.id,
        content: originalMessage.content,
        message_type: originalMessage.message_type,
        metadata: originalMessage.metadata,
        forwarded_from: messageId
      })
      .select()
      .single();

    if (error) throw error;

    // Copy attachments if any
    if (originalMessage.attachments && originalMessage.attachments.length > 0) {
      const attachmentCopies = originalMessage.attachments.map((att: any) => ({
        message_id: data.id,
        filename: att.filename,
        file_size: att.file_size,
        mime_type: att.mime_type,
        bucket_path: att.bucket_path,
        url: att.url,
        thumbnail_url: att.thumbnail_url,
        duration: att.duration,
        width: att.width,
        height: att.height,
        metadata: att.metadata
      }));

      await this.supabase
        .from('attachments')
        .insert(attachmentCopies);
    }

    return data.id;
  }

  async searchMessages(groupId: string, query: string, limit = 20): Promise<Message[]> {
    if (!this.user || !query.trim()) return [];

    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select(`
          *,
          author:profiles!author_id(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('group_id', groupId)
        .eq('deleted', false)
        .textSearch('search_vector', query)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error searching messages:', err);
      return [];
    }
  }

  async getMentions(groupId: string): Promise<Message[]> {
    if (!this.user) return [];

    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select(`
          *,
          author:profiles!author_id(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('group_id', groupId)
        .eq('deleted', false)
        .contains('mention_users', [this.user.id])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching mentions:', err);
      return [];
    }
  }

  async getPinnedMessages(groupId: string): Promise<Message[]> {
    if (!this.user) return [];

    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select(`
          *,
          author:profiles!author_id(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('group_id', groupId)
        .eq('deleted', false)
        .eq('pinned', true)
        .order('pinned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching pinned messages:', err);
      return [];
    }
  }
} 