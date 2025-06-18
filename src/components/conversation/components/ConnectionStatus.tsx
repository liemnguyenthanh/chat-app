import React from 'react';
import {
  Box,
  Typography,
  Chip,
} from '@mui/material';

interface ConnectionStatusProps {
  isConnected: boolean;
  lastMessageTime?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  lastMessageTime,
}) => {
  return (
    <Box sx={{ 
      position: 'absolute', 
      top: 16, 
      right: 16, 
      zIndex: 1000 
    }}>
      <Chip
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: isConnected ? 'success.main' : 'error.main',
                animation: isConnected ? 'none' : 'pulse 2s infinite',
              }}
            />
            <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Typography>
            {lastMessageTime && (
              <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.7 }}>
                • {lastMessageTime}
              </Typography>
            )}
          </Box>
        }
        size="small"
        variant="outlined"
        sx={{
          bgcolor: 'background.paper',
          borderColor: isConnected ? 'success.main' : 'error.main',
          '& .MuiChip-label': {
            px: 1,
            py: 0.25,
          },
        }}
      />
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Box>
  );
}; 