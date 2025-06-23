import React, { useState, useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Reply as ReplyIcon,
} from '@mui/icons-material';
import { Message } from '@/contexts/messages/MessagesContext';

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
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isFirst,
  isLast,
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
  onReplyToMessage,
}) => {
  const user = useUser();
  const [isHovering, setIsHovering] = useState(false);
  const [showQuickReactions, setShowQuickReactions] = useState(false);
  const isOwnMessage = message.author_id === user?.id;

  // Show reactions only after hovering for longer
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isHovering && !isEditing) {
      timeout = setTimeout(() => {
        setShowQuickReactions(true);
      }, 1000); // Show after 1 second hover to avoid conflicts
    } else {
      setShowQuickReactions(false);
    }
    return () => clearTimeout(timeout);
  }, [isHovering, isEditing]);

  const getMessageColor = () => {
    return isOwnMessage ? 'primary.main' : 'grey.100';
  };

  const getTextColor = () => {
    return isOwnMessage ? 'white' : 'text.primary';
  };

  const getBorderRadius = () => {
    const baseRadius = 18;
    const tightRadius = 4;
    
    if (isOwnMessage) {
      // Own messages: rounded on left, tight on bottom-right when not last
      return `${baseRadius}px ${baseRadius}px ${isLast ? baseRadius : tightRadius}px ${baseRadius}px`;
    } else {
      // Other messages: rounded on right, tight on bottom-left when not last  
      return `${baseRadius}px ${baseRadius}px ${baseRadius}px ${isLast ? baseRadius : tightRadius}px`;
    }
  };

  const quickReactionEmojis = ['👍', '❤️', '😂'];

  return (
    <Box
      sx={{ position: 'relative' }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Paper
        sx={{
          p: 1.5,
          bgcolor: getMessageColor(),
          color: getTextColor(),
          borderRadius: getBorderRadius(),
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
            {/* Reply Preview */}
            {message.reply_data && (
              <Box sx={{ mb: 1 }}>
                <Paper
                  sx={{
                    p: 1,
                    bgcolor: isOwnMessage ? 'rgba(255,255,255,0.1)' : 'action.hover',
                    borderLeft: 3,
                    borderColor: 'primary.main',
                    borderRadius: 1,
                    opacity: 0.8,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <ReplyIcon sx={{ fontSize: '0.7rem', color: isOwnMessage ? 'rgba(255,255,255,0.7)' : 'text.secondary' }} />
                    <Typography 
                      variant="caption" 
                      fontWeight={600} 
                      sx={{ color: isOwnMessage ? 'rgba(255,255,255,0.8)' : 'text.secondary' }}
                    >
                      {message.reply_data.author.username}
                    </Typography>
                  </Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block',
                      color: isOwnMessage ? 'rgba(255,255,255,0.6)' : 'text.secondary',
                      fontStyle: 'italic',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%'
                    }}
                  >
                    {message.reply_data.content || '[No content]'}
                  </Typography>
                </Paper>
              </Box>
            )}

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

            {/* Menu button for own messages */}
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
                height: 20, 
                fontSize: '0.7rem',
                '& .MuiChip-label': { px: 0.75, py: 0 },
                borderRadius: '10px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: (theme) => theme.shadows[1],
                }
              }}
            />
          ))}
        </Box>
      )}
      
      {/* Primary Quick Actions (immediate on hover) */}
      {isHovering && !isEditing && !showQuickReactions && (
        <Fade in={true}>
          <Box sx={{ 
            position: 'absolute',
            top: -12,
            [isOwnMessage ? 'left' : 'right']: -4,
            display: 'flex',
            gap: 0.5,
            bgcolor: 'background.paper',
            borderRadius: '16px',
            p: 0.5,
            boxShadow: (theme) => theme.shadows[4],
            border: '1px solid',
            borderColor: 'divider',
            zIndex: 15,
          }}>
            {/* Reply Button - Always first/primary action */}
            <Tooltip title="Reply">
              <IconButton
                size="small"
                onClick={() => onReplyToMessage(message)}
                sx={{ 
                  width: 28,
                  height: 28,
                  '&:hover': {
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    transform: 'scale(1.1)',
                  }
                }}
              >
                <ReplyIcon sx={{ fontSize: '0.85rem' }} />
              </IconButton>
            </Tooltip>
            
            {/* Add Reaction Button */}
            <Tooltip title="Add reaction">
              <IconButton
                size="small"
                onClick={() => onReaction(message.id, '👍')}
                sx={{ 
                  width: 28,
                  height: 28,
                  '&:hover': {
                    bgcolor: 'secondary.light',
                    transform: 'scale(1.1)',
                  }
                }}
              >
                <AddIcon sx={{ fontSize: '0.85rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Fade>
      )}
      
      {/* Extended Reactions (long hover) */}
      {showQuickReactions && (
        <Fade in={true}>
          <Box sx={{ 
            position: 'absolute',
            top: -12,
            [isOwnMessage ? 'left' : 'right']: -4,
            display: 'flex',
            gap: 0.25,
            bgcolor: 'background.paper',
            borderRadius: '20px',
            p: 0.5,
            boxShadow: (theme) => theme.shadows[8],
            border: '1px solid',
            borderColor: 'divider',
            zIndex: 25,
          }}>
            {/* Reply Button - Still accessible */}
            <Tooltip title="Reply">
              <IconButton
                size="small"
                onClick={() => onReplyToMessage(message)}
                sx={{ 
                  width: 28,
                  height: 28,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'scale(1.1)',
                  }
                }}
              >
                <ReplyIcon sx={{ fontSize: '0.8rem' }} />
              </IconButton>
            </Tooltip>
            
            {/* Emoji Reactions */}
            {quickReactionEmojis.map((emoji) => (
              <IconButton
                key={emoji}
                size="small"
                onClick={() => onReaction(message.id, emoji)}
                sx={{ 
                  fontSize: '0.9rem', 
                  width: 28,
                  height: 28,
                  '&:hover': {
                    transform: 'scale(1.2)',
                    bgcolor: 'action.hover',
                  }
                }}
              >
                {emoji}
              </IconButton>
            ))}
            
            {/* Add More Reaction Button */}
            <Tooltip title="More reactions">
              <IconButton
                size="small"
                onClick={() => onReaction(message.id, '👍')}
                sx={{ 
                  width: 28,
                  height: 28,
                  '&:hover': {
                    bgcolor: 'action.hover',
                    transform: 'scale(1.1)',
                  }
                }}
              >
                <AddIcon sx={{ fontSize: '0.8rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Fade>
      )}
    </Box>
  );
}; 