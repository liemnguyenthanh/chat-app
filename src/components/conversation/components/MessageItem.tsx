import React from 'react';
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

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: getMessageAlignment(message.author_id),
        alignItems: 'flex-end',
        gap: 1,
        mb: showAvatar ? 2 : 0.5,
      }}
    >
      {!isOwnMessage && showAvatar && (
        <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>
          {message.author?.username?.charAt(0).toUpperCase() || '?'}
        </Avatar>
      )}
      {!isOwnMessage && !showAvatar && (
        <Box sx={{ width: 32 }} />
      )}

      <Box sx={{ maxWidth: '70%', minWidth: '100px' }}>
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
            p: 2,
            bgcolor: getMessageColor(message.author_id),
            color: getTextColor(message.author_id),
            borderRadius: isOwnMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            position: 'relative',
            border: message.failed ? '2px solid' : 'none',
            borderColor: message.failed ? 'error.main' : 'transparent',
            opacity: message.sending ? 0.7 : 1,
            ...(message.sending && {
              animation: 'pulse 2s infinite'
            })
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
          
          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
              {message.reactions.map((reaction) => (
                <Chip
                  key={reaction.emoji}
                  label={`${reaction.emoji} ${reaction.count}`}
                  size="small"
                  variant={reaction.users.includes(user?.id || '') ? 'filled' : 'outlined'}
                  onClick={() => onReaction(message.id, reaction.emoji)}
                  sx={{ height: 24, fontSize: '0.75rem' }}
                />
              ))}
            </Box>
          )}
          
          {/* Quick reactions */}
          <Box sx={{ 
            display: 'flex', 
            gap: 0.5, 
            mt: 1, 
            opacity: 0.7,
            '&:hover': { opacity: 1 }
          }}>
            {['👍', '❤️', '😂', '😮', '😢', '😡'].map((emoji) => (
              <IconButton
                key={emoji}
                size="small"
                onClick={() => onReaction(message.id, emoji)}
                sx={{ fontSize: '0.8rem', p: 0.25 }}
              >
                {emoji}
              </IconButton>
            ))}
          </Box>
        </Paper>
      </Box>
      
      {isOwnMessage && showAvatar && (
        <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
          {message.author?.username?.charAt(0).toUpperCase() || '?'}
        </Avatar>
      )}
      {isOwnMessage && !showAvatar && (
        <Box sx={{ width: 32 }} />
      )}
    </Box>
  );
}; 