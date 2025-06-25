import React from 'react';
import { Box, IconButton, Fade, Paper } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface MessageReactionPickerProps {
  show: boolean;
  onReaction: (emoji: string) => void;
  onMoreEmojis?: () => void;
  position?: 'top' | 'bottom';
}

export const MessageReactionPicker: React.FC<MessageReactionPickerProps> = ({
  show,
  onReaction,
  onMoreEmojis,
  position = 'top'
}) => {
  const quickReactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  const handleReaction = (emoji: string) => {
    onReaction(emoji);
  };

  return (
    <Fade in={show}>
      <Paper
        sx={{
          position: 'absolute',
          [position]: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          p: 0.5,
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
          backdropFilter: 'blur(10px)',
        }}
      >
        {quickReactionEmojis.map((emoji) => (
          <IconButton
            key={emoji}
            size="small"
            onClick={() => handleReaction(emoji)}
            sx={{
              fontSize: '1.2rem',
              minWidth: 32,
              height: 32,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.3)',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            {emoji}
          </IconButton>
        ))}
        
        {onMoreEmojis && (
          <IconButton
            size="small"
            onClick={onMoreEmojis}
            sx={{
              color: 'white',
              minWidth: 32,
              height: 32,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.1)',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        )}
      </Paper>
    </Fade>
  );
}; 