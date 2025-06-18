import React, { useRef, useEffect } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Message } from "@/contexts/messages/MessagesContext";
import { MessageGroup } from "./MessageGroup";

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
  onMessageMenu: (
    event: React.MouseEvent<HTMLElement>,
    messageId: string
  ) => void;
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

  // Group consecutive messages by user
  const groupMessages = (messages: Message[]): Message[][] => {
    if (messages.length === 0) return [];

    const groups: Message[][] = [];
    let currentGroup: Message[] = [messages[0]];

    for (let i = 1; i < messages.length; i++) {
      const currentMessage = messages[i];
      const previousMessage = messages[i - 1];

      // Check if messages should be grouped together
      const shouldGroup =
        currentMessage.author_id === previousMessage.author_id &&
        new Date(currentMessage.created_at).getTime() -
          new Date(previousMessage.created_at).getTime() <
          5 * 60 * 1000; // 5 minutes

      if (shouldGroup) {
        currentGroup.push(currentMessage);
      } else {
        groups.push(currentGroup);
        currentGroup = [currentMessage];
      }
    }

    // Don't forget the last group
    groups.push(currentGroup);

    return groups;
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop } = messagesContainerRef.current;
      if (scrollTop === 0 && hasMore && !loading) {
        onLoadMore();
      }
    }
  };

  const messageGroups = groupMessages(messages);

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
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ cursor: "pointer" }}
              onClick={onLoadMore}
            >
              Load more messages
            </Typography>
          )}
        </Box>
      )}

      {/* Message Groups */}
      {messageGroups.map((group, groupIndex) => (
        <MessageGroup
          key={`group-${groupIndex}-${group[0].id}`}
          messages={group}
          isEditing={group.some((msg) => editingMessageId === msg.id)}
          editingMessageId={editingMessageId}
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
