import React from 'react';
import { Box, IconButton, Paper, Typography, Fade } from '@mui/material';
import { Close as CloseIcon, Reply as ReplyIcon } from '@mui/icons-material';
import { Message } from '@/contexts/messages/MessagesContext';

interface ReplyActionsProps {
  replyingTo: Message | null;
  onCancelReply: () => void;
  show?: boolean;
}

export const ReplyActions: React.FC<ReplyActionsProps> = ({
  replyingTo,
  onCancelReply,
  show = true,
}) => {
  if (!replyingTo || !show) {
    return null;
  }

  return (
    <Fade in={show}>
      <Paper
        sx={{
          p: 1.5,
          mb: 1,
          bgcolor: 'action.hover',
          borderLeft: 3,
          borderColor: 'primary.main',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <ReplyIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
        
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" fontWeight={600} color="text.secondary">
            Replying to {replyingTo.author?.username || 'Unknown'}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
              fontSize: '0.875rem',
            }}
          >
            {replyingTo.content || '[No content]'}
          </Typography>
        </Box>

        <IconButton
          size="small"
          onClick={onCancelReply}
                     sx={{
             color: 'text.secondary',
             '&:hover': {
               color: 'error.main',
               bgcolor: 'rgba(244, 67, 54, 0.1)',
             }
           }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Paper>
    </Fade>
  );
}; 