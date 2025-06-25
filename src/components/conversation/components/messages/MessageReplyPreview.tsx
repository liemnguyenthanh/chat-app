import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Reply as ReplyIcon } from '@mui/icons-material';
import { format } from 'date-fns';

interface ReplyData {
  author: {
    username?: string;
  };
  content: string;
  created_at: string;
}

interface MessageReplyPreviewProps {
  replyData: ReplyData;
}

export const MessageReplyPreview: React.FC<MessageReplyPreviewProps> = ({
  replyData,
}) => {
  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch {
      return '';
    }
  };

  return (
    <Box sx={{ ml: 1, mr: 1, mb: 1 }}>
      <Paper
        sx={{
          p: 1,
          bgcolor: 'action.hover',
          borderLeft: 3,
          borderColor: 'primary.main',
          borderRadius: 1,
          opacity: 0.8,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <ReplyIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
          <Typography variant="caption" fontWeight={600} color="text.secondary">
            {replyData.author.username}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatTime(replyData.created_at)}
          </Typography>
        </Box>
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block',
            color: 'text.secondary',
            fontStyle: 'italic',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%'
          }}
        >
          {replyData.content || '[No content]'}
        </Typography>
      </Paper>
    </Box>
  );
}; 