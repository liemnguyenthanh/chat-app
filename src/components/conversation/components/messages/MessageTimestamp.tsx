import React from 'react';
import { Box, Typography } from '@mui/material';
import { format } from 'date-fns';

interface MessageTimestampProps {
  timestamp: string;
  isOwnMessage: boolean;
  showAvatar: boolean;
}

export const MessageTimestamp: React.FC<MessageTimestampProps> = ({
  timestamp,
  isOwnMessage,
  showAvatar,
}) => {
  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch {
      return '';
    }
  };

  // Only show timestamp for own messages at the bottom
  if (!isOwnMessage || !showAvatar) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5, mr: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {formatTime(timestamp)}
      </Typography>
    </Box>
  );
}; 