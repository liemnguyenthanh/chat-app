import React, { useState } from 'react';
import { Box, Paper } from '@mui/material';
import { Message } from '@/contexts/messages/MessagesContext';

// Import our extracted components
import { MessageContent } from './messages/MessageContent';
import { MessageReactions } from './messages/MessageReactions';
import { MessageReplyPreview } from './messages/MessageReplyPreview';
import { MessageContextMenu } from './actions/MessageContextMenu';

// Import our extracted hooks
import { useMessageActions } from '../hooks/useMessageActions';
import { useMessageStyling } from '../hooks/useMessageStyling';

interface MessageBubbleProps {
  message: Message;
  isFirst: boolean;
  isLast: boolean;
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

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isLast,
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
  const [isHovering, setIsHovering] = useState(false);

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
    getMessageColor,
    getTextColor,
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

  // Get custom border radius for grouped messages
  const getCustomBorderRadius = () => {
    const baseRadius = 18;
    const tightRadius = 4;
    
    if (isOwn) {
      return `${baseRadius}px ${baseRadius}px ${isLast ? baseRadius : tightRadius}px ${baseRadius}px`;
    } else {
      return `${baseRadius}px ${baseRadius}px ${baseRadius}px ${isLast ? baseRadius : tightRadius}px`;
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Reply Preview */}
      {message.reply_data && (
        <Box sx={{ mb: 1 }}>
          <MessageReplyPreview replyData={message.reply_data} />
        </Box>
      )}

      {/* Main Message Bubble */}
      <Paper
        sx={{
          p: 1.5,
          bgcolor: getMessageColor(message.author_id),
          color: getTextColor(message.author_id),
          borderRadius: getCustomBorderRadius(),
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
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
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