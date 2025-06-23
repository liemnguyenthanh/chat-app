import { useState, useCallback, useMemo } from 'react';
import { User } from '@supabase/auth-helpers-react';
import { Message, ReplyState } from '../types/messageTypes';
import { MessageService } from '../services/messageService';

const MESSAGES_PER_PAGE = 50;

export const useMessages = (messageService: MessageService, user: User | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [sendingMessageId, setSendingMessageId] = useState<string | null>(null);
  const [failedMessages, setFailedMessages] = useState<Set<string>>(new Set());
  const [replyState, setReplyState] = useState<ReplyState>({
    isReplying: false,
    replyingTo: null,
  });

  const loadMessages = useCallback(async (groupId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      // Clear messages immediately when switching to a different room
      if (currentGroupId !== groupId) {
        setMessages([]);
      }
      
      setCurrentGroupId(groupId);
      
      const fetchedMessages = await messageService.fetchMessages(groupId);
      setMessages(fetchedMessages);
      setHasMoreMessages(fetchedMessages.length === MESSAGES_PER_PAGE);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [user, messageService]);

  const loadMoreMessages = useCallback(async () => {
    if (!currentGroupId || !hasMoreMessages || loading) return;

    try {
      setLoading(true);
      const fetchedMessages = await messageService.fetchMessages(currentGroupId, messages.length);
      
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
  }, [currentGroupId, hasMoreMessages, loading, messageService, messages.length]);

  const sendMessage = useCallback(async (groupId: string, content: string, replyTo?: string): Promise<boolean> => {
    if (!user || !content.trim()) return false;

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      group_id: groupId,
      author_id: user.id,
      content: content.trim(),
      reply_to: replyTo || undefined,
      message_type: 'text',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted: false,
      sending: true,
      author: {
        id: user.id,
        username: 'Sending...',  // Placeholder - will be replaced by real-time update
        full_name: undefined,
        avatar_url: undefined
      },
      reactions: []
    };

    // Optimistic update
    setMessages(prev => [...prev, tempMessage]);
    setSendingMessageId(tempId);

    try {
      await messageService.sendMessage(groupId, content, replyTo);
      // Message will be replaced via WebSocket subscription
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Mark as failed
      setFailedMessages(prev => new Set([...prev, tempId]));
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, sending: false, failed: true }
            : msg
        )
      );
      setSendingMessageId(null);
      return false;
    }
  }, [user, messageService]);

  const retryFailedMessage = useCallback(async (tempId: string): Promise<boolean> => {
    const failedMessage = messages.find(msg => msg.id === tempId);
    if (!failedMessage || !failedMessage.content) return false;

    // Remove from failed set and mark as sending
    setFailedMessages(prev => {
      const newSet = new Set(prev);
      newSet.delete(tempId);
      return newSet;
    });

    setMessages(prev => 
      prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, sending: true, failed: false }
          : msg
      )
    );

    setSendingMessageId(tempId);

    try {
      await messageService.sendMessage(failedMessage.group_id, failedMessage.content, failedMessage.reply_to);
      return true;
    } catch (err) {
      console.error('Error retrying message:', err);
      
      // Mark as failed again
      setFailedMessages(prev => new Set([...prev, tempId]));
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, sending: false, failed: true }
            : msg
        )
      );
      setSendingMessageId(null);
      return false;
    }
  }, [messages, messageService]);

  const removeFailedMessage = useCallback((tempId: string) => {
    setFailedMessages(prev => {
      const newSet = new Set(prev);
      newSet.delete(tempId);
      return newSet;
    });
    
    setMessages(prev => prev.filter(msg => msg.id !== tempId));
  }, []);

  const editMessage = useCallback(async (messageId: string, content: string): Promise<boolean> => {
    try {
      await messageService.editMessage(messageId, content);
      
      // Optimistic update
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content, updated_at: new Date().toISOString() }
            : msg
        )
      );
      
      return true;
    } catch (err) {
      console.error('Error editing message:', err);
      setError(err instanceof Error ? err.message : 'Failed to edit message');
      return false;
    }
  }, [messageService]);

  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      await messageService.deleteMessage(messageId);
      
      // Optimistic update
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, deleted: true, deleted_at: new Date().toISOString() }
            : msg
        )
      );
      
      return true;
    } catch (err) {
      console.error('Error deleting message:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete message');
      return false;
    }
  }, [messageService]);

  const addReaction = useCallback(async (messageId: string, emoji: string): Promise<boolean> => {
    try {
      await messageService.addReaction(messageId, emoji);
      // TODO: Update reactions in state or refetch
      return true;
    } catch (err) {
      console.error('Error adding reaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to add reaction');
      return false;
    }
  }, [messageService]);

  const removeReaction = useCallback(async (messageId: string, emoji: string): Promise<boolean> => {
    try {
      await messageService.removeReaction(messageId, emoji);
      // TODO: Update reactions in state or refetch
      return true;
    } catch (err) {
      console.error('Error removing reaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove reaction');
      return false;
    }
  }, [messageService]);

  const markAsRead = useCallback(async (groupId: string): Promise<void> => {
    try {
      await messageService.markAsRead(groupId);
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, [messageService]);

  const setReplyToMessage = useCallback((message: Message | null) => {
    setReplyState({
      isReplying: !!message,
      replyingTo: message,
    });
  }, []);

  const clearReply = useCallback(() => {
    setReplyState({
      isReplying: false,
      replyingTo: null,
    });
  }, []);

  return {
    // State
    messages,
    loading,
    error,
    currentGroupId,
    hasMoreMessages,
    sendingMessageId,
    failedMessages,
    replyState,
    
    // State setters (for realtime hooks)
    setMessages,
    setSendingMessageId,
    
    // Actions
    loadMessages,
    loadMoreMessages,
    sendMessage,
    retryFailedMessage,
    removeFailedMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    markAsRead,
    setReplyToMessage,
    clearReply
  };
};