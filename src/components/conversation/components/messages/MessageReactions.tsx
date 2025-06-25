import React from 'react';
import { Box, Chip } from '@mui/material';
import { useUser } from '@supabase/auth-helpers-react';

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

interface MessageReactionsProps {
  reactions: Reaction[];
  isOwnMessage: boolean;
  onReaction: (emoji: string) => void;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  isOwnMessage,
  onReaction,
}) => {
  const user = useUser();

  if (!reactions || reactions.length === 0) {
    return null;
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 0.5, 
      mt: 0.5, 
      flexWrap: 'wrap',
      justifyContent: isOwnMessage ? 'flex-end' : 'flex-start'
    }}>
      {reactions.map((reaction) => (
        <Chip
          key={reaction.emoji}
          label={`${reaction.emoji} ${reaction.count}`}
          size="small"
          variant={reaction.users.includes(user?.id || '') ? 'filled' : 'outlined'}
          onClick={() => onReaction(reaction.emoji)}
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
  );
}; 