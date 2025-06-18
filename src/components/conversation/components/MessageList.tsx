import React, { useRef, useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Message } from '@/contexts/messages/MessagesContext';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  hasMore: boolean;
  editingMessageId: string | null;
  editingContent: string;
  failedMessages: Set<string>;
  sendingMessageId: string | null;
  onEditingContentChange: (content: string) => void;
  onEditMessage: () => void;
  onCancelEdit: () => void;
  onMessageMenu: (event: React.MouseEvent<HTMLElement>, messageId: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onRetryFailedMessage: (tempId: string) => void;
  onRemoveFailedMessage: (tempId: string) => void;
  onLoadMore: () => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading,
  hasMore,
  editingMessageId,
  editingContent,
  failedMessages,
  sendingMessageId,
  onEditingContentChange,
  onEditMessage,
  onCancelEdit,
  onMessageMenu,
  onReaction,
  onRetryFailedMessage,
  onRemoveFailedMessage,
  onLoadMore,
}) => {
  const user = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const shouldShowAvatar = (currentMessage: Message, index: number) => {
    if (index === 0) return true;
    const previousMessage = messages[index - 1];
    return (
      previousMessage.author_id !== currentMessage.author_id ||
      new Date(currentMessage.created_at).getTime() - new Date(previousMessage.created_at).getTime() > 5 * 60 * 1000
    );
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop } = messagesContainerRef.current;
      if (scrollTop === 0 && hasMore && !loading) {
        onLoadMore();
      }
    }
  };

  return (
    <Box
      ref={messagesContainerRef}
      sx={{
        flexGrow: 1,
        overflowY: "auto",
        padding: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
      onScroll={handleScroll}
    >
      {/* Load more indicator */}
      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ cursor: 'pointer' }}
              onClick={onLoadMore}
            >
              Load more messages
            </Typography>
          )}
        </Box>
      )}

      {/* Messages */}
      {messages.map((message, index) => (
        <MessageItem
          key={message.id}
          message={message}
          showAvatar={shouldShowAvatar(message, index)}
          isEditing={editingMessageId === message.id}
          editingContent={editingContent}
          failedMessages={failedMessages}
          sendingMessageId={sendingMessageId}
          onEditingContentChange={onEditingContentChange}
          onEditMessage={onEditMessage}
          onCancelEdit={onCancelEdit}
          onMessageMenu={onMessageMenu}
          onReaction={onReaction}
          onRetryFailedMessage={onRetryFailedMessage}
          onRemoveFailedMessage={onRemoveFailedMessage}
        />
      ))}

      {/* Auto-scroll anchor */}
      <div ref={messagesEndRef} />
    </Box>
  );
}; 