import React, { useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  IconButton,
  CircularProgress,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { Message } from '@/contexts/messages/MessagesContext';
import { format } from 'date-fns';

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
  onMessageMenu,
  onReaction,
  onRetryFailedMessage,
  onRemoveFailedMessage,
}) => {
  const user = useUser();
  const [showQuickReactions, setShowQuickReactions] = useState(false);
  const isOwnMessage = message.author_id === user?.id;

  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch {
      return '';
    }
  };

  const getMessageAlignment = (authorId: string) => {
    return authorId === user?.id ? 'flex-end' : 'flex-start';
  };

  const getMessageColor = (authorId: string) => {
    return authorId === user?.id ? 'primary.main' : 'grey.100';
  };

  const getTextColor = (authorId: string) => {
    return authorId === user?.id ? 'white' : 'text.primary';
  };

  const getBorderRadius = (authorId: string, showAvatar: boolean) => {
    const baseRadius = 18;
    const tightRadius = 4;
    
    if (authorId === user?.id) {
      // Own messages: rounded on left, tight on bottom-right when grouped
      return showAvatar 
        ? `${baseRadius}px ${baseRadius}px ${baseRadius}px ${baseRadius}px`
        : `${baseRadius}px ${baseRadius}px ${tightRadius}px ${baseRadius}px`;
    } else {
      // Other messages: rounded on right, tight on bottom-left when grouped  
      return showAvatar 
        ? `${baseRadius}px ${baseRadius}px ${baseRadius}px ${baseRadius}px`
        : `${baseRadius}px ${baseRadius}px ${baseRadius}px ${tightRadius}px`;
    }
  };

  const quickReactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: getMessageAlignment(message.author_id),
        alignItems: 'flex-end',
        gap: 1,
        mb: showAvatar ? 2 : 0.25, // Tighter spacing for grouped messages
        position: 'relative',
      }}
      onMouseEnter={() => setShowQuickReactions(true)}
      onMouseLeave={() => setShowQuickReactions(false)}
    >
      {!isOwnMessage && showAvatar && (
        <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>
          {message.author?.username?.charAt(0).toUpperCase() || '?'}
        </Avatar>
      )}
      {!isOwnMessage && !showAvatar && (
        <Box sx={{ width: 32 }} />
      )}

      <Box sx={{ maxWidth: '70%', minWidth: '100px', position: 'relative' }}>
        {!isOwnMessage && showAvatar && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, ml: 1 }}>
            <Typography variant="caption" fontWeight={600}>
              {message.author?.username || 'Unknown'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTime(message.created_at)}
            </Typography>
          </Box>
        )}

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
        >
          {isEditing ? (
            <Box>
              <input
                type="text"
                value={editingContent}
                onChange={(e) => onEditingContentChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    onEditMessage();
                  } else if (e.key === 'Escape') {
                    onCancelEdit();
                  }
                }}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: 'inherit',
                  fontSize: 'inherit',
                }}
                autoFocus
              />
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <button onClick={onEditMessage} style={{ fontSize: '0.8rem' }}>
                  Save
                </button>
                <button onClick={onCancelEdit} style={{ fontSize: '0.8rem' }}>
                  Cancel
                </button>
              </Box>
            </Box>
          ) : (
            <>
              <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                {message.content}
              </Typography>
              
              {/* Message Status Indicators */}
              {message.id.startsWith('temp-') && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  {failedMessages.has(message.id) ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" color="error.main" sx={{ fontSize: '0.7rem' }}>
                        Failed to send
                      </Typography>
                      <Tooltip title="Retry">
                        <IconButton 
                          size="small" 
                          onClick={() => onRetryFailedMessage(message.id)}
                          sx={{ p: 0.25 }}
                        >
                          <Typography sx={{ fontSize: '0.7rem', cursor: 'pointer', color: 'primary.main' }}>
                            ↻
                          </Typography>
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove">
                        <IconButton 
                          size="small" 
                          onClick={() => onRemoveFailedMessage(message.id)}
                          sx={{ p: 0.25 }}
                        >
                          <Typography sx={{ fontSize: '0.7rem', cursor: 'pointer', color: 'error.main' }}>
                            ×
                          </Typography>
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : sendingMessageId === message.id ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CircularProgress size={8} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Sending...
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Sending...
                    </Typography>
                  )}
                </Box>
              )}

              {isOwnMessage && (
                <IconButton
                  size="small"
                  sx={{ 
                    position: 'absolute', 
                    top: 4, 
                    right: 4,
                    opacity: 0.7,
                    '&:hover': { opacity: 1 }
                  }}
                  onClick={(e) => onMessageMenu(e, message.id)}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              )}
            </>
          )}
        </Paper>
        
        {/* Existing Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            gap: 0.5, 
            mt: 0.5, 
            flexWrap: 'wrap',
            justifyContent: isOwnMessage ? 'flex-end' : 'flex-start'
          }}>
            {message.reactions.map((reaction) => (
              <Chip
                key={reaction.emoji}
                label={`${reaction.emoji} ${reaction.count}`}
                size="small"
                variant={reaction.users.includes(user?.id || '') ? 'filled' : 'outlined'}
                onClick={() => onReaction(message.id, reaction.emoji)}
                sx={{ 
                  height: 22, 
                  fontSize: '0.7rem',
                  '& .MuiChip-label': { px: 1 },
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: (theme) => theme.shadows[2],
                  }
                }}
              />
            ))}
          </Box>
        )}

        {/* Show timestamp for own messages at bottom */}
        {isOwnMessage && showAvatar && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5, mr: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {formatTime(message.created_at)}
            </Typography>
          </Box>
        )}
        
        {/* Quick Reactions (show on hover) */}
        <Fade in={showQuickReactions && !isEditing}>
          <Box sx={{ 
            position: 'absolute',
            top: -16,
            [isOwnMessage ? 'right' : 'left']: 8,
            display: 'flex',
            gap: 0.25,
            bgcolor: 'background.paper',
            borderRadius: '20px',
            p: 0.5,
            boxShadow: (theme) => theme.shadows[8],
            border: '1px solid',
            borderColor: 'divider',
            zIndex: 10,
          }}>
            {quickReactionEmojis.map((emoji) => (
              <IconButton
                key={emoji}
                size="small"
                onClick={() => onReaction(message.id, emoji)}
                sx={{ 
                  fontSize: '0.9rem', 
                  p: 0.5,
                  width: 28,
                  height: 28,
                  transition: 'transform 0.1s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.3)',
                    bgcolor: 'action.hover',
                  }
                }}
              >
                {emoji}
              </IconButton>
            ))}
          </Box>
        </Fade>
      </Box>
      
      {isOwnMessage && !showAvatar && (
        <Box sx={{ width: 32 }} />
      )}
    </Box>
  );
}; 