import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '@supabase/auth-helpers-react';
import { Message } from '../types/messageTypes';

const MESSAGES_PER_PAGE = 50;

export class MessageService {
  constructor(private supabase: SupabaseClient, private user: User | null) {}

  async fetchMessages(groupId: string, offset = 0, limit = MESSAGES_PER_PAGE): Promise<Message[]> {
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

      // Add empty reactions array to each message (will be populated via RPC later)
      const messagesWithEmptyReactions = (data || []).map(message => ({
        ...message,
        reactions: []
      }));

      return messagesWithEmptyReactions.reverse(); // Reverse to show oldest first
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
    
    // TODO: Implement read receipts functionality
    console.log('Mark as read for group:', groupId);
  }
} 