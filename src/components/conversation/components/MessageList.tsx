import React, { useRef, useEffect } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Message } from "@/contexts/messages/MessagesContext";
import { MessageGroup } from "./MessageGroup";
import { MessageListSkeleton, LoadMoreMessagesSkeleton } from "@/components/skeletons";
import { useSkeletonLoading } from '@/hooks/useSkeletonLoading';

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
  onReplyToMessage: (message: Message) => void;
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
  onReplyToMessage,
}) => {
  const user = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const showSkeleton = useSkeletonLoading(loading && messages.length === 0, 800);

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

  // Show skeleton loading for initial load
  if (showSkeleton) {
    return <MessageListSkeleton />;
  }

  return (
    <Box
      ref={messagesContainerRef}
      sx={{
        flex: 1,
        overflowY: "auto",
        p: 1,
        display: "flex",
        flexDirection: "column",
      }}
      onScroll={handleScroll}
    >
      {/* Load more indicator */}
      {loading && hasMore && (
        <LoadMoreMessagesSkeleton />
      )}

      {/* Messages */}
      {messageGroups.length === 0 && !loading ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            color: "text.secondary",
          }}
        >
          <Typography variant="body2">
            No messages yet. Start the conversation!
          </Typography>
        </Box>
      ) : (
        messageGroups.map((group, groupIndex) => (
          <MessageGroup
              key={group[0].id}
              messages={group}
              isEditing={!!editingMessageId}
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
              onReplyToMessage={onReplyToMessage}
            />
        ))
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </Box>
  );
};
