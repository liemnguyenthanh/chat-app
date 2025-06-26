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
  const quickReactionEmojis = ['👍', '❤️', '😂', '😟', '😢', '😡'];

  const handleReaction = (emoji: string) => {
    onReaction(emoji);
  };

  return (
    <Fade in={show}>
      <Paper
        elevation={12}
        sx={{
          position: 'absolute',
          [position === 'bottom' ? 'top' : 'bottom']: position === 'bottom' ? 45 : -8,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          px: 1,
          py: 0.75,
          bgcolor: 'rgba(255, 255, 255, 0.98)',
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
          zIndex: 1001,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          minWidth: 'max-content',
          '&:before': {
            content: '""',
            position: 'absolute',
            [position === 'bottom' ? 'bottom' : 'top']: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            [position === 'bottom' ? 'borderTop' : 'borderBottom']: '6px solid rgba(255, 255, 255, 0.98)',
          }
        }}
      >
        {quickReactionEmojis.map((emoji) => (
          <IconButton
            key={emoji}
            size="small"
            onClick={() => handleReaction(emoji)}
            sx={{
              fontSize: '1.25rem',
              minWidth: 36,
              height: 36,
              borderRadius: 2.5,
              transition: 'all 0.15s ease-in-out',
              '&:hover': {
                transform: 'scale(1.25)',
                bgcolor: 'rgba(0, 0, 0, 0.04)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
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
              color: '#6b7280',
              minWidth: 36,
              height: 36,
              borderRadius: 2.5,
              transition: 'all 0.15s ease-in-out',
              '&:hover': {
                transform: 'scale(1.1)',
                bgcolor: 'rgba(0, 0, 0, 0.04)',
                color: '#374151',
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