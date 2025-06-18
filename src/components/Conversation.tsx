import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import {
  Box,
  Menu,
  MenuItem,
} from '@mui/material';
import { useMessagesContext, Message } from '@/contexts/messages/MessagesContext';
import { format } from 'date-fns';

// Import sub-components
import { MessageList } from './conversation/components/MessageList';
import { TypingIndicator } from './conversation/components/TypingIndicator';
import { MessageInput } from './conversation/components/MessageInput';
import { ConnectionStatus } from './conversation/components/ConnectionStatus';

interface ConversationProps {
  roomId: string;
  roomName: string;
}

const Conversation: React.FC<ConversationProps> = ({ roomId, roomName }) => {
  const user = useUser();
  const {
    messages,
    loading,
    hasMore,
    typingUsers,
    failedMessages,
    sendingMessageId,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    retryFailedMessage,
    removeFailedMessage,
    loadMessages,
    loadMoreMessages,
    startTyping,
  } = useMessagesContext();

  // State for UI interactions
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [lastMessageTime, setLastMessageTime] = useState<string>('');
  const [isConnected, setIsConnected] = useState(true);

  // Monitor connection status
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(navigator.onLine);
    };

    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    checkConnection();

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
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
        const timeString = format(new Date(lastMessage.created_at), 'HH:mm');
        setLastMessageTime(timeString);
      } catch {
        setLastMessageTime('');
      }
    }
  }, [messages]);





  // Handlers
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !roomId) return;
    
    await sendMessage(roomId, newMessage.trim());
    setNewMessage('');
  };

  const handleEditMessage = async () => {
    if (!editingMessageId || !editingContent.trim()) return;
    
    await editMessage(editingMessageId, editingContent.trim());
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleMessageMenu = (event: React.MouseEvent<HTMLElement>, messageId: string) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedMessageId(messageId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedMessageId(null);
  };

  const handleStartEdit = () => {
    if (!selectedMessageId) return;
    
    const message = messages.find((m: Message) => m.id === selectedMessageId);
    if (message && message.content) {
      setEditingMessageId(selectedMessageId);
      setEditingContent(message.content);
    }
    handleMenuClose();
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessageId) return;
    
    await deleteMessage(selectedMessageId);
    handleMenuClose();
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    await addReaction(messageId, emoji);
  };

  const handleTyping = () => {
    startTyping(roomId);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMoreMessages();
    }
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Connection Status */}
      <ConnectionStatus 
        isConnected={isConnected}
        lastMessageTime={lastMessageTime}
      />

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
      />

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleStartEdit}>Edit</MenuItem>
        <MenuItem onClick={handleDeleteMessage} sx={{ color: 'error.main' }}>
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Conversation;