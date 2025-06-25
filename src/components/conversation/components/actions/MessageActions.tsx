import React, { useState } from 'react';
import { Box, IconButton, Fade, Paper, Tooltip } from '@mui/material';
import {
  Reply as ReplyIcon,
  MoreVert as MoreVertIcon,
  EmojiEmotions as EmojiIcon,
} from '@mui/icons-material';
import { Message } from '@/contexts/messages/MessagesContext';
import { MessageReactionPicker } from './MessageReactionPicker';

interface MessageActionsProps {
  message: Message;
  show: boolean;
  onReply: (message: Message) => void;
  onReaction: (emoji: string) => void;
  onMoreActions: (event: React.MouseEvent<HTMLElement>) => void;
  isOwnMessage?: boolean;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  show,
  onReply,
  onReaction,
  onMoreActions,
  isOwnMessage = false,
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const handleReply = () => {
    onReply(message);
  };

  const handleEmojiClick = () => {
    setShowReactionPicker(!showReactionPicker);
  };

  const handleReaction = (emoji: string) => {
    onReaction(emoji);
    setShowReactionPicker(false);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Fade in={show}>
        <Paper
          sx={{
            position: 'absolute',
            top: -8,
            [isOwnMessage ? 'left' : 'right']: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            p: 0.5,
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 2,
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 100,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Reply Button */}
          <Tooltip title="Reply">
            <IconButton
              size="small"
              onClick={handleReply}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: 'action.hover',
                }
              }}
            >
              <ReplyIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Emoji Reaction Button */}
          <Tooltip title="Add reaction">
            <IconButton
              size="small"
              onClick={handleEmojiClick}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: 'action.hover',
                }
              }}
            >
              <EmojiIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* More Actions Button */}
          <Tooltip title="More actions">
            <IconButton
              size="small"
              onClick={onMoreActions}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: 'action.hover',
                }
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Paper>
      </Fade>

      {/* Reaction Picker */}
      <MessageReactionPicker
        show={showReactionPicker}
        onReaction={handleReaction}
        position="bottom"
      />
    </Box>
  );
}; 