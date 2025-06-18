import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

export interface Message {
  id: string;
  group_id: string;
  author_id: string;
  content?: string;
  data?: any;
  reply_to?: string;
  thread_id?: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  created_at: string;
  updated_at: string;
  deleted: boolean;
  deleted_at?: string;
  // Client-side states
  failed?: boolean;
  sending?: boolean;
  // Joined data
  author?: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  attachments?: {
    id: string;
    filename: string;
    file_size: number;
    mime_type: string;
    bucket_path: string;
  }[];
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
}

interface TypingUser {
  user_id: string;
  username: string;
}

interface MessagesContextType {
  messages: Message[];
  loading: boolean;
  error: string | null;
  currentGroupId: string | null;
  typingUsers: TypingUser[];
  sendingMessageId: string | null;
  failedMessages: Set<string>;
  sendMessage: (groupId: string, content: string, replyTo?: string) => Promise<boolean>;
  retryFailedMessage: (tempId: string) => Promise<boolean>;
  removeFailedMessage: (tempId: string) => void;
  editMessage: (messageId: string, content: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  addReaction: (messageId: string, emoji: string) => Promise<boolean>;
  removeReaction: (messageId: string, emoji: string) => Promise<boolean>;
  loadMessages: (groupId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  markAsRead: (groupId: string) => Promise<void>;
  startTyping: (groupId: string) => Promise<void>;
  stopTyping: (groupId: string) => Promise<void>;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export const useMessagesContext = () => {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error('useMessagesContext must be used within a MessagesProvider');
  }
  return context;
};

interface MessagesProviderProps {
  children: ReactNode;
}

const MESSAGES_PER_PAGE = 50;

export const MessagesProvider: React.FC<MessagesProviderProps> = ({ children }) => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [sendingMessageId, setSendingMessageId] = useState<string | null>(null);
  const [failedMessages, setFailedMessages] = useState<Set<string>>(new Set());

  const fetchMessages = useCallback(async (groupId: string, offset = 0, limit = MESSAGES_PER_PAGE) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
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
  }, [supabase, user]);

  const loadMessages = useCallback(async (groupId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      setCurrentGroupId(groupId);
      
      const fetchedMessages = await fetchMessages(groupId);
      setMessages(fetchedMessages);
      setHasMoreMessages(fetchedMessages.length === MESSAGES_PER_PAGE);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [user, fetchMessages]);

  const loadMoreMessages = useCallback(async () => {
    if (!currentGroupId || !hasMoreMessages || loading) return;

    try {
      setLoading(true);
      const fetchedMessages = await fetchMessages(currentGroupId, messages.length);
      
      if (fetchedMessages.length === 0) {
        setHasMoreMessages(false);
      } else {
        setMessages(prev => [...fetchedMessages, ...prev]);
        setHasMoreMessages(fetchedMessages.length === MESSAGES_PER_PAGE);
      }
    } catch (err) {
      console.error('Error loading more messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load more messages');
    } finally {
      setLoading(false);
    }
  }, [currentGroupId, hasMoreMessages, loading, fetchMessages, messages.length]);

  const sendMessage = useCallback(async (groupId: string, content: string, replyTo?: string): Promise<boolean> => {
    if (!user || !content.trim()) return false;

    // Generate temporary ID for optimistic update
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticMessage: Message = {
      id: tempId,
      group_id: groupId,
      author_id: user.id,
      content: content.trim(),
      reply_to: replyTo,
      message_type: 'text',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted: false,
      author: {
        id: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'Unknown',
        full_name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url,
      },
      reactions: [],
    };

    try {
      setError(null);
      setSendingMessageId(tempId);
      
      // Optimistic update - add message immediately
      setMessages(prev => [...prev, optimisticMessage]);
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          group_id: groupId,
          author_id: user.id,
          content: content.trim(),
          reply_to: replyTo,
          message_type: 'text'
        })
        .select(`
          *,
          author:profiles!author_id(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? { ...data, reactions: [] }
            : msg
        )
      );

      // Clear failed message if it was previously failed
      setFailedMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });

      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Mark message as failed
      setFailedMessages(prev => new Set(prev).add(tempId));
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, failed: true }
            : msg
        )
      );
      
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return false;
    } finally {
      setSendingMessageId(null);
    }
  }, [user, supabase]);

  // Function to retry failed messages
  const retryFailedMessage = useCallback(async (tempId: string): Promise<boolean> => {
    const failedMessage = messages.find(m => m.id === tempId);
    if (!failedMessage || !user) return false;

    try {
      setSendingMessageId(tempId);
      
      // Remove failed status temporarily
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, failed: false }
            : msg
        )
      );

      const { data, error } = await supabase
        .from('messages')
        .insert({
          group_id: failedMessage.group_id,
          author_id: user.id,
          content: failedMessage.content!,
          reply_to: failedMessage.reply_to,
          message_type: failedMessage.message_type
        })
        .select(`
          *,
          author:profiles!author_id(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Replace failed message with successful one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? { ...data, reactions: [] }
            : msg
        )
      );

      // Remove from failed messages
      setFailedMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });

      return true;
    } catch (err) {
      console.error('Error retrying message:', err);
      
      // Mark as failed again
      setFailedMessages(prev => new Set(prev).add(tempId));
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, failed: true }
            : msg
        )
      );
      
      return false;
    } finally {
      setSendingMessageId(null);
    }
  }, [messages, user, supabase]);

  // Function to remove failed message
  const removeFailedMessage = useCallback((tempId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== tempId));
    setFailedMessages(prev => {
      const newSet = new Set(prev);
      newSet.delete(tempId);
      return newSet;
    });
  }, []);

  const editMessage = useCallback(async (messageId: string, content: string): Promise<boolean> => {
    if (!user || !content.trim()) return false;

    try {
      setError(null);
      
      const { error } = await supabase
        .from('messages')
        .update({ 
          content: content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('author_id', user.id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error editing message:', err);
      setError(err instanceof Error ? err.message : 'Failed to edit message');
      return false;
    }
  }, [user, supabase]);

  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);
      
      const { error } = await supabase
        .from('messages')
        .update({ 
          deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('author_id', user.id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting message:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete message');
      return false;
    }
  }, [user, supabase]);

  const addReaction = useCallback(async (messageId: string, emoji: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);
      
      const { error } = await supabase
        .from('reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          emoji
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error adding reaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to add reaction');
      return false;
    }
  }, [user, supabase]);

  const removeReaction = useCallback(async (messageId: string, emoji: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);
      
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error removing reaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove reaction');
      return false;
    }
  }, [user, supabase]);

  const markAsRead = useCallback(async (groupId: string): Promise<void> => {
    // TODO: Implement read receipts if needed
    console.log('Marking messages as read for group:', groupId);
  }, []);

  // Fix: Add circular dependency issue with startTyping/stopTyping
  const startTypingStable = useCallback(async (groupId: string): Promise<void> => {
    if (!user) return;

    try {
      // Only start typing if not already active
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        // Set new timeout without making another API call
        typingTimeoutRef.current = setTimeout(async () => {
          await supabase
            .from('typing_indicators')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', user.id);
          typingTimeoutRef.current = null;
        }, 8000);
        return;
      }

      // Insert or update typing indicator
      const { error } = await supabase
        .from('typing_indicators')
        .upsert({
          group_id: groupId,
          user_id: user.id,
          expires_at: new Date(Date.now() + 10000).toISOString() // 10 seconds from now
        });

      if (error) throw error;

      // Set timeout to automatically stop typing
      typingTimeoutRef.current = setTimeout(async () => {
        await supabase
          .from('typing_indicators')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', user.id);
        typingTimeoutRef.current = null;
      }, 8000); // Stop after 8 seconds
    } catch (err) {
      console.error('Error starting typing indicator:', err);
    }
  }, [user, supabase]);

  const stopTypingStable = useCallback(async (groupId: string): Promise<void> => {
    if (!user) return;

    try {
      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Remove typing indicator
      const { error } = await supabase
        .from('typing_indicators')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error stopping typing indicator:', err);
    }
  }, [user, supabase]);

  // Note: Reactions refresh removed for performance - use RPC function instead
  const refreshMessagesForReactions = useCallback(async () => {
    // This function is kept for compatibility but does nothing
    // Use dedicated RPC function for reactions instead
    console.log('Reactions refresh skipped - use RPC function for better performance');
  }, []);

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
  }, [user, currentGroupId, supabase, refreshMessagesForReactions]);

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
            setTypingUsers(users);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentGroupId, supabase]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const value: MessagesContextType = {
    messages,
    loading,
    error,
    currentGroupId,
    typingUsers,
    sendingMessageId,
    failedMessages,
    sendMessage,
    retryFailedMessage,
    removeFailedMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    loadMessages,
    loadMoreMessages,
    markAsRead,
    startTyping: startTypingStable,
    stopTyping: stopTypingStable
  };

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
};