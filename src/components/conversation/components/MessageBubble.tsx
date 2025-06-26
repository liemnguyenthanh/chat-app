import React, { useState } from "react";
import { Box, Paper } from "@mui/material";
import { Message } from "@/contexts/messages/MessagesContext";

// Import our extracted components
import { MessageContent } from "./messages/MessageContent";
import { MessageReactions } from "./messages/MessageReactions";
import { MessageReplyPreview } from "./messages/MessageReplyPreview";
import { MessageContextMenu } from "./actions/MessageContextMenu";
import { MessageHoverActions } from "./actions/MessageHoverActions";
import { MessageLikeButton } from "./actions/MessageLikeButton";

// Import our extracted hooks
import { useMessageActions } from "../hooks/useMessageActions";
import { useMessageStyling } from "../hooks/useMessageStyling";

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
  onMessageMenu: (
    event: React.MouseEvent<HTMLElement>,
    messageId: string
  ) => void;
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

  const { getMessageColor, getTextColor, getHoverColor, isOwnMessage } =
    useMessageStyling();

  const isOwn = isOwnMessage(message.author_id);

  const handleMenuItemClick = (action: string) => {
    switch (action) {
      case "reply":
        onReplyToMessage(message);
        break;
      case "copy":
        handleCopyMessage(message);
        onCopyMessage?.(message);
        break;
      case "pin":
        handlePinMessage(message);
        onPinMessage?.(message);
        break;
      case "forward":
        handleForwardMessage(message);
        onForwardMessage?.(message);
        break;
      case "select":
        handleSelectMessage(message);
        onSelectMessage?.(message);
        break;
      case "delete":
        onDeleteMessage?.(message);
        break;
    }
  };

  const handleReactionClick = (emoji: string) => {
    onReaction(message.id, emoji);
  };

  const handleMoreActions = (event: React.MouseEvent<HTMLElement>) => {
    handleContextMenu(event);
  };

  // Check if message is liked by current user
  const isLiked =
    message.reactions?.some(
      (reaction) => reaction.emoji === "👍" && reaction.users?.length > 0
    ) || false;

  // Get custom border radius for grouped messages
  const getCustomBorderRadius = () => {
    const baseRadius = 18;
    const tightRadius = 4;

    if (isOwn) {
      return `${baseRadius}px ${baseRadius}px ${
        isLast ? baseRadius : tightRadius
      }px ${baseRadius}px`;
    } else {
      return `${baseRadius}px ${baseRadius}px ${baseRadius}px ${
        isLast ? baseRadius : tightRadius
      }px`;
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        mb: 0.5,
      }}
    >
      {/* Reply Preview */}
      {message.reply_data && (
        <Box sx={{ mb: -1 }}>
          <MessageReplyPreview replyData={message.reply_data} />
        </Box>
      )}

      {/* Message Container with Bubble and Actions */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          justifyContent: isOwn ? "flex-end" : "flex-start",
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Action Icons for own messages - positioned on the LEFT side */}
        {isOwn && (
          <MessageHoverActions
            message={message}
            show={isHovering}
            onReply={onReplyToMessage}
            onForward={onForwardMessage || (() => {})}
            onMoreActions={handleMoreActions}
            isOwnMessage={isOwn}
          />
        )}

        {/* Message Bubble */}
        <Box sx={{ position: "relative", maxWidth: "70%" }}>
          <Paper
            sx={{
              p: 1.5,
              background: getMessageColor(message.author_id),
              color: getTextColor(message.author_id),
              borderRadius: getCustomBorderRadius(),
              position: "relative",
              border: message.failed ? "2px solid" : "none",
              borderColor: message.failed ? "error.main" : "transparent",
              opacity: message.sending ? 0.7 : 1,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              backdropFilter: "blur(10px)",
              ...(message.sending && {
                animation: "pulse 2s infinite",
              }),
              "&:hover": {
                background: getHoverColor(message.author_id),
                transform: "translateY(-2px) scale(1.02)",
                boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
              },
            }}
          >
            {/* Message Content */}
            <MessageContent
              content={message.content || ""}
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

            {/* Like Button - positioned inside bubble at bottom-right */}
            <MessageLikeButton
              message={message}
              show={isHovering}
              onReaction={handleReactionClick}
              isLiked={isLiked}
              isOwnMessage={isOwn}
            />
          </Paper>

          {/* Message Reactions - positioned below bubble */}
          <MessageReactions
            reactions={message.reactions || []}
            isOwnMessage={isOwn}
            onReaction={handleReactionClick}
          />
        </Box>

        {/* Action Icons for other messages - positioned on the RIGHT side */}
        {!isOwn && (
          <MessageHoverActions
            message={message}
            show={isHovering}
            onReply={onReplyToMessage}
            onForward={onForwardMessage || (() => {})}
            onMoreActions={handleMoreActions}
            isOwnMessage={isOwn}
          />
        )}
      </Box>

      {/* Context Menu for More Actions */}
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
