import React, { createContext, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { MessagesContextType } from './types/messageTypes';
import { MessageService } from './services/messageService';
import { useMessages } from './hooks/useMessages';
import { useTyping } from './hooks/useTyping';
import { useRealtime } from './hooks/useRealtime';
import { useRoomsContext } from '../RoomsContext';

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

export const MessagesProvider: React.FC<MessagesProviderProps> = ({ children }) => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const { silentRefreshRooms } = useRoomsContext();

  // Create message service instance
  const messageService = useMemo(() => new MessageService(supabase, user), [supabase, user]);

  // Use custom hooks for different concerns
  const messagesHook = useMessages(messageService, user);
  const typingHook = useTyping(supabase, user);

  // Global update handlers for cross-room notifications
  const handleGlobalMessageUpdate = useCallback((message: any) => {
    console.log('🌍 Global message update received for group:', message.group_id);
    // TODO: Show toast notification for new messages from other rooms
    // Example: toast.info(`New message in ${groupName}: ${message.content}`);
  }, []);

  const handleGlobalReactionUpdate = useCallback((messageId: string, reactions: any[]) => {
    console.log('🌍 Global reaction update received for message:', messageId);
    // TODO: Handle global reaction updates if needed (e.g., badges, counts)
  }, []);

  const handleRoomListUpdate = useCallback(() => {
    console.log('🌍 Room list update triggered - silent refresh');
    silentRefreshRooms();
  }, [silentRefreshRooms]);

  // Set up realtime subscriptions (both active conversation and global)
  const realtimeStatus = useRealtime({
    supabase,
    user,
    currentGroupId: messagesHook.currentGroupId,
    setMessages: messagesHook.setMessages,
    setSendingMessageId: messagesHook.setSendingMessageId,
    updateTypingUsers: typingHook.updateTypingUsers,
    onGlobalMessageUpdate: handleGlobalMessageUpdate,
    onGlobalReactionUpdate: handleGlobalReactionUpdate,
    onRoomListUpdate: handleRoomListUpdate,
  });

  // Cleanup typing on unmount
  useEffect(() => {
    return () => {
      typingHook.cleanup();
    };
  }, [typingHook]);

  const value: MessagesContextType = {
    // Messages state and actions
    messages: messagesHook.messages,
    loading: messagesHook.loading,
    error: messagesHook.error,
    currentGroupId: messagesHook.currentGroupId,
    hasMore: messagesHook.hasMoreMessages,
    sendingMessageId: messagesHook.sendingMessageId,
    failedMessages: messagesHook.failedMessages,
    sendMessage: messagesHook.sendMessage,
    retryFailedMessage: messagesHook.retryFailedMessage,
    removeFailedMessage: messagesHook.removeFailedMessage,
    editMessage: messagesHook.editMessage,
    deleteMessage: messagesHook.deleteMessage,
    addReaction: messagesHook.addReaction,
    removeReaction: messagesHook.removeReaction,
    loadMessages: messagesHook.loadMessages,
    loadMoreMessages: messagesHook.loadMoreMessages,
    markAsRead: messagesHook.markAsRead,
    
    // Typing state and actions
    typingUsers: typingHook.typingUsers,
    startTyping: typingHook.startTyping,
    stopTyping: typingHook.stopTyping,
  };

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
};

// Re-export types for easier imports
export * from './types/messageTypes'; 