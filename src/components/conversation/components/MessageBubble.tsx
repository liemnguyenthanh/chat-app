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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Reply as ReplyIcon,
  ContentCopy as ContentCopyIcon,
  PushPin as PushPinIcon,
  Forward as ForwardIcon,
  CheckBox as SelectIcon,
  Delete as DeleteIcon,
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
  onCopyMessage?: (message: Message) => void;
  onPinMessage?: (message: Message) => void;
  onForwardMessage?: (message: Message) => void;
  onSelectMessage?: (message: Message) => void;
  onDeleteMessage?: (message: Message) => void;
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
  onCopyMessage,
  onPinMessage,
  onForwardMessage,
  onSelectMessage,
  onDeleteMessage,
}) => {
  const user = useUser();
  const [isHovering, setIsHovering] = useState(false);
  const [contextMenuAnchor, setContextMenuAnchor] = useState<null | HTMLElement>(null);
  const isOwnMessage = message.author_id === user?.id;

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
      return `${baseRadius}px ${baseRadius}px ${isLast ? baseRadius : tightRadius}px ${baseRadius}px`;
    } else {
      return `${baseRadius}px ${baseRadius}px ${baseRadius}px ${isLast ? baseRadius : tightRadius}px`;
    }
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setContextMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setContextMenuAnchor(null);
  };

  const handleMenuItemClick = (action: string) => {
    switch (action) {
      case 'reply':
        onReplyToMessage(message);
        break;
      case 'copy':
        onCopyMessage?.(message);
        break;
      case 'pin':
        onPinMessage?.(message);
        break;
      case 'forward':
        onForwardMessage?.(message);
        break;
      case 'select':
        onSelectMessage?.(message);
        break;
      case 'delete':
        onDeleteMessage?.(message);
        break;
    }
    handleMenuClose();
  };

  const quickReactionEmojis = ['👍', '❤️', '😂'];

  return (
    <Box sx={{ position: 'relative' }}>
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
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onContextMenu={handleContextMenu}
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

            {/* More options button */}
            <IconButton
              size="small"
              sx={{ 
                position: 'absolute', 
                top: 4, 
                right: 4,
                opacity: isHovering ? 1 : 0,
                transition: 'opacity 0.2s ease-in-out',
              }}
              onClick={handleContextMenu}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </Paper>
      
      {/* Existing Reactions */}
      {message.reactions && message.reactions.length > 0 && (
        <Box sx={{ 
          display: 'flex', 
          gap: 0.5, 
          mt: 0.5, 
          flexWrap: 'wrap'
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

      {/* Context Menu */}
      <Menu
        anchorEl={contextMenuAnchor}
        open={Boolean(contextMenuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            minWidth: 160,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            '& .MuiMenuItem-root': {
              py: 1.5,
              px: 2,
              fontSize: '0.875rem',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
            },
            '& .MuiListItemIcon-root': {
              color: 'white',
              minWidth: 36,
            },
          },
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleMenuItemClick('reply')}>
          <ListItemIcon>
            <ReplyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reply</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuItemClick('copy')}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy Text</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuItemClick('pin')}>
          <ListItemIcon>
            <PushPinIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Pin</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuItemClick('forward')}>
          <ListItemIcon>
            <ForwardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Forward</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuItemClick('select')}>
          <ListItemIcon>
            <SelectIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Select</ListItemText>
        </MenuItem>
        
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
        
        <MenuItem 
          onClick={() => handleMenuItemClick('delete')}
          sx={{ color: '#ff6b6b !important' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: '#ff6b6b !important' }} />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}; 