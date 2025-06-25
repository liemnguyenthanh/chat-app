import React from 'react';
import { Box, Paper, Avatar } from '@mui/material';
import { Message } from '@/contexts/messages/MessagesContext';

// Import our extracted components
import { MessageHeader } from './messages/MessageHeader';
import { MessageContent } from './messages/MessageContent';
import { MessageReactions } from './messages/MessageReactions';
import { MessageReplyPreview } from './messages/MessageReplyPreview';
import { MessageTimestamp } from './messages/MessageTimestamp';
import { MessageContextMenu } from './actions/MessageContextMenu';

// Import our extracted hooks
import { useMessageActions } from '../hooks/useMessageActions';
import { useMessageStyling } from '../hooks/useMessageStyling';

interface MessageItemProps {
  message: Message;
  showAvatar: boolean;
  isEditing: boolean;
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
  onReplyToMessage: (message: Message) => void;
  onCopyMessage?: (message: Message) => void;
  onPinMessage?: (message: Message) => void;
  onForwardMessage?: (message: Message) => void;
  onSelectMessage?: (message: Message) => void;
  onDeleteMessage?: (message: Message) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  showAvatar,
  isEditing,
  editingContent,
  failedMessages,
  sendingMessageId,
  onEditingContentChange,
  onEditMessage,
  onCancelEdit,
  onReaction,
  onRetryFailedMessage,
  onRemoveFailedMessage,
  onReplyToMessage,
  onCopyMessage,
  onPinMessage,
  onForwardMessage,
  onSelectMessage,
  onDeleteMessage,
}) => {
  // Use our extracted hooks
  const {
    contextMenuAnchor,
    handleContextMenu,
    handleMenuClose,
    handleCopyMessage,
    handlePinMessage,
    handleForwardMessage,
    handleSelectMessage,
  } = useMessageActions();

  const {
    getMessageAlignment,
    getMessageColor,
    getTextColor,
    getBorderRadius,
    isOwnMessage,
  } = useMessageStyling();

  const isOwn = isOwnMessage(message.author_id);

  const handleMenuItemClick = (action: string) => {
    switch (action) {
      case 'reply':
        onReplyToMessage(message);
        break;
      case 'copy':
        handleCopyMessage(message);
        onCopyMessage?.(message);
        break;
      case 'pin':
        handlePinMessage(message);
        onPinMessage?.(message);
        break;
      case 'forward':
        handleForwardMessage(message);
        onForwardMessage?.(message);
        break;
      case 'select':
        handleSelectMessage(message);
        onSelectMessage?.(message);
        break;
      case 'delete':
        onDeleteMessage?.(message);
        break;
    }
  };

  const handleReactionClick = (emoji: string) => {
    onReaction(message.id, emoji);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: getMessageAlignment(message.author_id),
        alignItems: 'flex-end',
        gap: 1,
        mb: showAvatar ? 2 : 0.25,
        position: 'relative',
      }}
    >
      {/* Avatar for other users */}
      {!isOwn && showAvatar && (
        <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>
          {message.author?.username?.charAt(0).toUpperCase() || '?'}
        </Avatar>
      )}
      {!isOwn && !showAvatar && (
        <Box sx={{ width: 32 }} />
      )}

      <Box sx={{ maxWidth: '70%', minWidth: '100px', position: 'relative' }}>
        {/* Message Header (username + timestamp for others) */}
        <MessageHeader
          author={message.author || null}
          timestamp={message.created_at}
          showAvatar={showAvatar}
          isOwnMessage={isOwn}
        />

        {/* Reply Preview */}
        {message.reply_data && (
          <MessageReplyPreview replyData={message.reply_data} />
        )}

        {/* Main Message Bubble */}
        <Paper
          sx={{
            p: 1.5,
            bgcolor: getMessageColor(message.author_id),
            color: getTextColor(message.author_id),
            borderRadius: getBorderRadius(message.author_id, showAvatar),
            position: 'relative',
            border: message.failed ? '2px solid' : 'none',
            borderColor: message.failed ? 'error.main' : 'transparent',
            opacity: message.sending ? 0.7 : 1,
            transition: 'all 0.2s ease-in-out',
            ...(message.sending && {
              animation: 'pulse 2s infinite'
            }),
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: (theme) => theme.shadows[2],
            }
          }}
          onContextMenu={handleContextMenu}
        >
          {/* Message Content */}
          <MessageContent
            content={message.content || ''}
            isEditing={isEditing}
            editingContent={editingContent}
            messageId={message.id}
            failedMessages={failedMessages}
            sendingMessageId={sendingMessageId}
            onEditingContentChange={onEditingContentChange}
            onEditMessage={onEditMessage}
            onCancelEdit={onCancelEdit}
            onContextMenu={handleContextMenu}
            onRetryFailedMessage={onRetryFailedMessage}
            onRemoveFailedMessage={onRemoveFailedMessage}
          />
        </Paper>
        
        {/* Message Reactions */}
        <MessageReactions
          reactions={message.reactions || []}
          isOwnMessage={isOwn}
          onReaction={handleReactionClick}
        />

        {/* Timestamp for own messages */}
        <MessageTimestamp
          timestamp={message.created_at}
          isOwnMessage={isOwn}
          showAvatar={showAvatar}
        />
      </Box>
      
      {/* Spacer for own messages */}
      {isOwn && !showAvatar && (
        <Box sx={{ width: 32 }} />
      )}

      {/* Context Menu */}
      <MessageContextMenu
        anchorEl={contextMenuAnchor}
        open={Boolean(contextMenuAnchor)}
        onClose={handleMenuClose}
        onMenuItemClick={handleMenuItemClick}
        isOwnMessage={isOwn}
      />
    </Box>
  );
}; 