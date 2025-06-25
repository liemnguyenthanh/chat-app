import React, { useState, useRef, useEffect } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { Box } from "@mui/material";
import {
  useMessagesContext,
  Message,
} from "@/contexts/messages/MessagesContext";
import { format } from "date-fns";

// Import sub-components
import { MessageList } from "./components/MessageList";
import { TypingIndicator } from "./components/TypingIndicator";
import { MessageInput } from "./components/MessageInput";

interface ConversationProps {
  roomId: string;
  roomName: string;
}

const Conversation: React.FC<ConversationProps> = ({ roomId, roomName }) => {
  const {
    messages,
    loading,
    hasMore,
    typingUsers,
    failedMessages,
    sendingMessageId,
    replyState,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    retryFailedMessage,
    removeFailedMessage,
    loadMessages,
    loadMoreMessages,
    startTyping,
    stopTyping,
    setReplyToMessage,
    clearReply,
  } = useMessagesContext();

  // State for UI interactions
  const [newMessage, setNewMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [lastMessageTime, setLastMessageTime] = useState<string>("");
  const [isConnected, setIsConnected] = useState(true);

  // Monitor connection status
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(navigator.onLine);
    };

    window.addEventListener("online", checkConnection);
    window.addEventListener("offline", checkConnection);
    checkConnection();

    return () => {
      window.removeEventListener("online", checkConnection);
      window.removeEventListener("offline", checkConnection);
    };
  }, []);

  // Load messages when room changes
  useEffect(() => {
    if (roomId) {
      loadMessages(roomId);
    }
  }, [roomId, loadMessages]);

  // Update last message time
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      try {
        const timeString = format(new Date(lastMessage.created_at), "HH:mm");
        setLastMessageTime(timeString);
      } catch {
        setLastMessageTime("");
      }
    }
  }, [messages]);

  // Handlers
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !roomId) return;

    // Stop typing indicator immediately when sending message
    stopTyping(roomId);

    const replyToId = replyState.isReplying ? replyState.replyingTo?.id : undefined;
    await sendMessage(roomId, newMessage.trim(), replyToId);
    setNewMessage("");
    
    // Clear reply state after sending
    if (replyState.isReplying) {
      clearReply();
    }
  };

  const handleEditMessage = async () => {
    if (!editingMessageId || !editingContent.trim()) return;

    await editMessage(editingMessageId, editingContent.trim());
    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleMessageMenu = (
    event: React.MouseEvent<HTMLElement>,
    messageId: string
  ) => {
    // This is now handled by the MessageItem component's context menu
    // Keep this for backward compatibility but it's no longer used
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    await addReaction(messageId, emoji);
  };

  const handleTyping = () => {
    if (roomId) {
      startTyping(roomId);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMoreMessages();
    }
  };

  // New message action handlers
  const handleCopyMessage = async (message: Message) => {
    if (message.content) {
      try {
        await navigator.clipboard.writeText(message.content);
        // Could add a toast notification here
        console.log('Message copied to clipboard');
      } catch (err) {
        console.error('Failed to copy message:', err);
      }
    }
  };

  const handlePinMessage = async (message: Message) => {
    // TODO: Implement pin functionality
    console.log('Pin message:', message.id);
  };

  const handleForwardMessage = async (message: Message) => {
    // TODO: Implement forward functionality
    console.log('Forward message:', message.id);
  };

  const handleSelectMessage = async (message: Message) => {
    // TODO: Implement select functionality
    console.log('Select message:', message.id);
  };

  const handleDeleteMessage = async (message: Message) => {
    await deleteMessage(message.id);
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Messages List */}
      <MessageList
        messages={messages}
        loading={loading}
        hasMore={hasMore}
        editingMessageId={editingMessageId}
        editingContent={editingContent}
        failedMessages={failedMessages}
        sendingMessageId={sendingMessageId}
        onEditingContentChange={setEditingContent}
        onEditMessage={handleEditMessage}
        onCancelEdit={handleCancelEdit}
        onMessageMenu={handleMessageMenu}
        onReaction={handleReaction}
        onRetryFailedMessage={retryFailedMessage}
        onRemoveFailedMessage={removeFailedMessage}
        onLoadMore={handleLoadMore}
        onReplyToMessage={setReplyToMessage}
        onCopyMessage={handleCopyMessage}
        onPinMessage={handlePinMessage}
        onForwardMessage={handleForwardMessage}
        onSelectMessage={handleSelectMessage}
        onDeleteMessage={handleDeleteMessage}
      />

      {/* Typing Indicator */}
      <TypingIndicator typingUsers={typingUsers} />

      {/* Message Input */}
      <MessageInput
        newMessage={newMessage}
        onMessageChange={setNewMessage}
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        isConnected={isConnected}
        replyingTo={replyState.replyingTo}
        onClearReply={clearReply}
      />
    </Box>
  );
};

export default Conversation;
