import { useState, useCallback } from 'react';
import { Message } from '@/contexts/messages/MessagesContext';

export const useMessageActions = () => {
  const [contextMenuAnchor, setContextMenuAnchor] = useState<null | HTMLElement>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const handleContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setContextMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setContextMenuAnchor(null);
  };

  // Enhanced Message Actions
  const handleCopyMessage = useCallback(async (message: Message) => {
    if (message.content) {
      try {
        await navigator.clipboard.writeText(message.content);
        console.log('Message copied to clipboard');
      } catch (err) {
        console.error('Failed to copy message:', err);
      }
    }
  }, []);

  const handlePinMessage = useCallback(async (message: Message) => {
    console.log('Pin message:', message.id);
    // TODO: Implement pin functionality
  }, []);

  const handleForwardMessage = useCallback(async (message: Message) => {
    console.log('Forward message:', message.id);
    // TODO: Implement forward functionality
  }, []);

  const handleSelectMessage = useCallback(async (message: Message) => {
    console.log('Select message:', message.id);
    // TODO: Implement select functionality
  }, []);

  const handleDeleteMessage = useCallback(async (message: Message) => {
    console.log('Delete message:', message.id);
    // TODO: Implement delete functionality
  }, []);

  const handleReplyMessage = useCallback((message: Message) => {
    console.log('Reply to message:', message.id);
    setReplyingTo(message);
  }, []);

  const handleEditMessage = useCallback((message: Message) => {
    console.log('Edit message:', message.id);
    // TODO: Implement edit functionality
  }, []);

  const handleBookmarkMessage = useCallback((message: Message) => {
    console.log('Bookmark message:', message.id);
    // TODO: Implement bookmark functionality
  }, []);

  const handleShareMessage = useCallback((message: Message) => {
    console.log('Share message:', message.id);
    // TODO: Implement share functionality
  }, []);

  const handleReportMessage = useCallback((message: Message) => {
    console.log('Report message:', message.id);
    // TODO: Implement report functionality
  }, []);

  const handleReaction = useCallback((message: Message, emoji: string) => {
    console.log('Add reaction:', emoji, 'to message:', message.id);
    // TODO: Implement reaction functionality
  }, []);

  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // Generic action handler for menu items  
  const handleAction = useCallback((action: string, message: Message) => {
    switch (action) {
      case 'copy':
        handleCopyMessage(message);
        break;
      case 'pin':
        handlePinMessage(message);
        break;
      case 'forward':
        handleForwardMessage(message);
        break;
      case 'select':
        handleSelectMessage(message);
        break;
      case 'delete':
        handleDeleteMessage(message);
        break;
      case 'reply':
        handleReplyMessage(message);
        break;
      case 'edit':
        handleEditMessage(message);
        break;
      case 'bookmark':
        handleBookmarkMessage(message);
        break;
      case 'share':
        handleShareMessage(message);
        break;
      case 'report':
        handleReportMessage(message);
        break;
      default:
        console.log('Unknown action:', action);
    }
  }, [
    handleCopyMessage,
    handlePinMessage,
    handleForwardMessage,
    handleSelectMessage,
    handleDeleteMessage,
    handleReplyMessage,
    handleEditMessage,
    handleBookmarkMessage,
    handleShareMessage,
    handleReportMessage,
  ]);

  return {
    // Context menu state
    contextMenuAnchor,
    handleContextMenu,
    handleMenuClose,
    
    // Individual actions (legacy support)
    handleCopyMessage,
    handlePinMessage,
    handleForwardMessage,
    handleSelectMessage,
    handleDeleteMessage,
    handleReplyMessage,
    handleEditMessage,
    handleBookmarkMessage,
    handleShareMessage,
    handleReportMessage,
    handleReaction,
    
    // Generic action handler
    handleAction,
    
    // Reply state
    replyingTo,
    cancelReply,
  };
}; 