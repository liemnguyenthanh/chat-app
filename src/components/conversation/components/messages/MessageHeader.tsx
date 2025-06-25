import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { format } from 'date-fns';

interface MessageHeaderProps {
  author: {
    username?: string;
  } | null;
  timestamp: string;
  showAvatar: boolean;
  isOwnMessage: boolean;
}

export const MessageHeader: React.FC<MessageHeaderProps> = ({
  author,
  timestamp,
  showAvatar,
  isOwnMessage,
}) => {
  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch {
      return '';
    }
  };

  if (isOwnMessage || !showAvatar) {
    return null;
  }

  return (
    <>
      <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>
        {author?.username?.charAt(0).toUpperCase() || '?'}
      </Avatar>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, ml: 1 }}>
        <Typography variant="caption" fontWeight={600}>
          {author?.username || 'Unknown'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatTime(timestamp)}
        </Typography>
      </Box>
    </>
  );
}; 