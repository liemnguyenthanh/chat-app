import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
} from '@mui/material';
import { TypingUser } from '@/contexts/messages/MessagesContext';

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;

  return (
    <>
      <style jsx>{`
        @keyframes typingBounce {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      
      <Box sx={{ 
        display: "flex", 
        alignItems: "flex-end", 
        gap: 1, 
        pl: 1, 
        py: 2,
        mb: 1 
      }}>
        {/* Avatars for typing users */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {typingUsers.slice(0, 3).map((user, index) => (
            <Avatar 
              key={user.user_id}
              sx={{ 
                width: 28, 
                height: 28, 
                bgcolor: `hsl(${index * 60}, 60%, 60%)`,
                fontSize: '0.8rem',
                ml: index > 0 ? -0.5 : 0,
                border: '2px solid white',
                zIndex: typingUsers.length - index,
                animation: 'pulse 2s infinite'
              }}
            >
              {user.username?.charAt(0).toUpperCase() || '?'}
            </Avatar>
          ))}
          {typingUsers.length > 3 && (
            <Avatar sx={{ 
              width: 28, 
              height: 28, 
              bgcolor: "grey.400",
              fontSize: '0.7rem',
              ml: -0.5,
              border: '2px solid white',
              zIndex: 0
            }}>
              +{typingUsers.length - 3}
            </Avatar>
          )}
        </Box>
        
        {/* Typing bubble */}
        <Paper sx={{ 
          px: 2, 
          py: 1.5, 
          bgcolor: "grey.100",
          borderRadius: 4,
          maxWidth: 280,
          position: 'relative',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          animation: 'pulse 2s infinite',
          '&:before': {
            content: '""',
            position: 'absolute',
            left: -6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 0,
            height: 0,
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderRight: '6px solid',
            borderRightColor: 'grey.100'
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Animated typing dots */}
            <Box sx={{ 
              display: 'flex', 
              gap: 0.5,
              alignItems: 'center'
            }}>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'grey.600',
                    animation: 'typingBounce 1.4s infinite ease-in-out both',
                    animationDelay: `${i * 0.16}s`
                  }}
                />
              ))}
            </Box>
            
            {/* Username and typing text */}
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                fontSize: '0.75rem',
                fontWeight: 500
              }}
            >
              {typingUsers.length === 1 
                ? `${typingUsers[0].username} is typing...` 
                : typingUsers.length === 2 
                ? `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`
                : `${typingUsers[0].username} and ${typingUsers.length - 1} others are typing...`
              }
            </Typography>
          </Box>
        </Paper>
      </Box>
    </>
  );
}; 