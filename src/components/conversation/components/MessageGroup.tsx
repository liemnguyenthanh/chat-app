import React from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { Box, Typography, Avatar } from "@mui/material";
import { Message } from "@/contexts/messages/MessagesContext";
import { MessageBubble } from "./MessageBubble";
import { format } from "date-fns";

interface MessageGroupProps {
  messages: Message[];
  isEditing: boolean;
  editingMessageId: string | null;
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
}

export const MessageGroup: React.FC<MessageGroupProps> = ({
  messages,
  isEditing,
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
}) => {
  const user = useUser();

  if (messages.length === 0) return null;

  const firstMessage = messages[0];
  const lastMessage = messages[messages.length - 1];
  const isOwnMessage = firstMessage.author_id === user?.id;

  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "HH:mm");
    } catch {
      return "";
    }
  };

  const getMessageAlignment = () => {
    return isOwnMessage ? "flex-end" : "flex-start";
  };

  const getUserAvatar = () => {
    const author = firstMessage.author;
    if (author?.avatar_url) {
      return (
        <Avatar src={author.avatar_url} sx={{ width: 32, height: 32 }}>
          {author.username?.charAt(0).toUpperCase() || "?"}
        </Avatar>
      );
    }

    return (
      <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>
        {author?.username?.charAt(0).toUpperCase() || "?"}
      </Avatar>
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: getMessageAlignment(),
        alignItems: "flex-end",
        gap: 1,
        mb: 2,
      }}
    >
      {/* Avatar for other users only (left side) */}
      {!isOwnMessage && getUserAvatar()}

      {/* Message group container */}
      <Box sx={{ maxWidth: "70%", minWidth: "100px" }}>
        {/* Header with username and time for other users */}
        {!isOwnMessage && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 0.5,
              ml: 1,
            }}
          >
            <Typography variant="caption" fontWeight={600}>
              {firstMessage.author?.username || "Unknown"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTime(lastMessage.created_at)}
            </Typography>
          </Box>
        )}

        {/* Messages in the group */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isFirst={index === 0}
              isLast={index === messages.length - 1}
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
        </Box>

        {/* Time for own messages (bottom right) */}
        {isOwnMessage && (
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5, mr: 1 }}
          >
            <Typography variant="caption" color="text.secondary">
              {formatTime(lastMessage.created_at)}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};
