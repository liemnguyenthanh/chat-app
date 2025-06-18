import { useEffect, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '@supabase/auth-helpers-react';
import { Message, TypingUser } from '../types/messageTypes';

interface UseRealtimeProps {
  supabase: SupabaseClient;
  user: User | null;
  currentGroupId: string | null;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setSendingMessageId: React.Dispatch<React.SetStateAction<string | null>>;
  updateTypingUsers: (users: TypingUser[]) => void;
}

export const useRealtime = ({
  supabase,
  user,
  currentGroupId,
  setMessages,
  setSendingMessageId,
  updateTypingUsers
}: UseRealtimeProps) => {

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!user || !currentGroupId) {
      console.log('👤 No user or group ID, skipping realtime subscription');
      return;
    }

    console.log(`🔄 Setting up realtime subscription for room: ${currentGroupId}`);
    
    // Create unique channel with timestamp to avoid conflicts
    const timestamp = Date.now();
    const channelName = `messages-${currentGroupId}-${timestamp}`;
    console.log(`📡 Creating channel: ${channelName}`);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${currentGroupId}`
        },
        async (payload) => {
          console.log('🔔 NEW MESSAGE via WebSocket:', payload);
          console.log('📊 WebSocket payload details:', {
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
            table: payload.table,
            schema: payload.schema
          });

          // Handle optimistic updates for current user's messages
          if (payload.new.author_id === user.id) {
            console.log('👨‍💻 Message from current user (optimistic update)');
            
            // Replace temporary message with real one
            setMessages(prev => {
              const updated = prev.map(msg => {
                if (msg.sending && msg.content === payload.new.content) {
                  console.log('✅ Replacing optimistic message with real message');
                  return {
                    ...msg,
                    id: payload.new.id,
                    created_at: payload.new.created_at,
                    updated_at: payload.new.updated_at,
                    sending: false,
                    failed: false
                  };
                }
                return msg;
              });
              
              // If no optimistic message found, add normally
              if (updated.every(msg => msg.id !== payload.new.id)) {
                console.log('⚠️ No optimistic message found, adding normally');
                const newMessage: Message = {
                  id: payload.new.id,
                  group_id: payload.new.group_id,
                  author_id: payload.new.author_id,
                  content: payload.new.content,
                  data: payload.new.data,
                  reply_to: payload.new.reply_to,
                  thread_id: payload.new.thread_id,
                  message_type: payload.new.message_type,
                  created_at: payload.new.created_at,
                  updated_at: payload.new.updated_at,
                  deleted: payload.new.deleted,
                  deleted_at: payload.new.deleted_at,
                  author: { 
                    id: user.id, 
                    username: user.user_metadata?.username || user.email || 'Unknown',
                    full_name: user.user_metadata?.full_name,
                    avatar_url: user.user_metadata?.avatar_url
                  },
                  reactions: []
                };
                return [...updated, newMessage];
              }
              
              return updated;
            });
            
            // Clear sending state
            setSendingMessageId(null);
            return;
          }

          // For messages from other users, always fetch and add
          if (payload.new.author_id !== user.id) {
            console.log('👥 Message from another user via WebSocket, fetching complete data');
            
            // Check if we already have this message
            let shouldFetch = true;
            setMessages(prev => {
              if (prev.some(m => m.id === payload.new.id)) {
                console.log('⚠️ Message from other user already exists, skipping');
                shouldFetch = false;
              }
              return prev;
            });

            if (!shouldFetch) return;

            try {
              console.log('📡 Fetching complete message data...');
              // Fetch complete message with author info
              const { data: newMessage, error } = await supabase
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
                .eq('id', payload.new.id)
                .single();

              if (error) {
                console.error('❌ Error fetching complete message:', error);
                return;
              }

              if (newMessage) {
                console.log('📝 Fetched complete message from other user:', newMessage);

                // Add empty reactions array (will be populated via RPC later)
                const messageWithEmptyReactions = {
                  ...newMessage,
                  reactions: []
                };

                // Add the message from other user
                setMessages(prev => {
                  // Final duplicate check
                  if (prev.some(m => m.id === messageWithEmptyReactions.id)) {
                    console.log('⚠️ Final check: message already exists');
                    return prev;
                  }
                  console.log('✅ Adding message from other user to UI via WebSocket');
                  return [...prev, messageWithEmptyReactions];
                });
              }
            } catch (error) {
              console.error('❌ Error processing WebSocket message from other user:', error);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${currentGroupId}`
        },
        (payload) => {
          console.log('✏️ Message updated via WebSocket:', payload.new);
          setMessages(prev => 
            prev.map(msg => 
              msg.id === payload.new.id 
                ? { ...msg, ...payload.new }
                : msg
            )
          );
        }
      )
      // Note: Reactions subscription removed for performance
      // .on(
      //   'postgres_changes',
      //   {
      //     event: '*',
      //     schema: 'public',
      //     table: 'reactions'
      //   },
      //   () => {
      //     console.log('😀 Reactions changed via WebSocket - use dedicated RPC for reactions');
      //   }
      // )
      .subscribe((status) => {
        console.log('📡 WebSocket Subscription status changed:', status);
        if (status === 'SUBSCRIBED') {
          console.log(`✅ WebSocket connected! Successfully subscribed to realtime updates for room: ${currentGroupId}`);
          console.log('🔍 You should now see WebSocket activity in Network tab when messages are sent/received');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ WebSocket subscription error for room:', currentGroupId);
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ WebSocket subscription timed out for room:', currentGroupId);
        } else if (status === 'CLOSED') {
          console.log('🔒 WebSocket subscription closed for room:', currentGroupId);
        }
      });

    return () => {
      console.log(`🧹 Cleaning up WebSocket subscription for room: ${currentGroupId}`);
      supabase.removeChannel(channel);
    };
  }, [user, currentGroupId, supabase, setMessages, setSendingMessageId]);

  // Set up real-time subscription for typing indicators
  useEffect(() => {
    if (!user || !currentGroupId) return;

    const channel = supabase
      .channel(`typing-${currentGroupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `group_id=eq.${currentGroupId}`
        },
        async () => {
          // Fetch current typing users
          const { data: typingData } = await supabase
            .from('typing_indicators')
            .select(`
              user_id,
              profiles!user_id(
                username
              )
            `)
            .eq('group_id', currentGroupId)
            .neq('user_id', user.id) // Exclude current user
            .gt('expires_at', new Date().toISOString());

          if (typingData) {
            const users: TypingUser[] = typingData
              .filter(item => item.profiles)
              .map(item => ({
                user_id: item.user_id,
                username: (item.profiles as any).username
              }));
            updateTypingUsers(users);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentGroupId, supabase, updateTypingUsers]);
}; 