import React, { createContext, useContext, ReactNode, useMemo, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { MessagesContextType } from './types/messageTypes';
import { MessageService } from './services/messageService';
import { useMessages } from './hooks/useMessages';
import { useTyping } from './hooks/useTyping';
import { useRealtime } from './hooks/useRealtime';

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

  // Create message service instance
  const messageService = useMemo(() => new MessageService(supabase, user), [supabase, user]);

  // Use custom hooks for different concerns
  const messagesHook = useMessages(messageService, user);
  const typingHook = useTyping(supabase, user);

  // Set up realtime subscriptions
  useRealtime({
    supabase,
    user,
    currentGroupId: messagesHook.currentGroupId,
    setMessages: messagesHook.setMessages,
    setSendingMessageId: messagesHook.setSendingMessageId,
    updateTypingUsers: typingHook.updateTypingUsers
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