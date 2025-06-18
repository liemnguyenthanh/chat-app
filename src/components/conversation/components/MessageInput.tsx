import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  useTheme,
} from '@mui/material';
import {
  Send as SendIcon,
  EmojiEmotions as EmojiEmotionsIcon,
} from '@mui/icons-material';

interface MessageInputProps {
  newMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onTyping: () => void;
  isConnected: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  onMessageChange,
  onSendMessage,
  onTyping,
  isConnected,
}) => {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (newMessage.trim() && isConnected) {
      onSendMessage();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMessageChange(e.target.value);
    onTyping();
  };

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 0,
        borderTop: 1,
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        {/* Emoji Button */}
        <IconButton
          size="small"
          sx={{ mb: 1 }}
          disabled={!isConnected}
        >
          <EmojiEmotionsIcon />
        </IconButton>

        {/* Message Input */}
        <TextField
          ref={inputRef}
          multiline
          maxRows={4}
          fullWidth
          variant="outlined"
          placeholder={isConnected ? "Type a message..." : "Connecting..."}
          value={newMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={!isConnected}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: 'background.default',
              '& fieldset': {
                borderColor: 'transparent',
              },
              '&:hover fieldset': {
                borderColor: 'primary.main',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
              },
            },
            '& .MuiInputBase-input': {
              py: 1.5,
              px: 2,
            },
          }}
        />

        {/* Send Button */}
        <IconButton
          onClick={handleSend}
          disabled={!newMessage.trim() || !isConnected}
          sx={{
            mb: 1,
            bgcolor: newMessage.trim() && isConnected ? 'primary.main' : 'grey.300',
            color: newMessage.trim() && isConnected ? 'white' : 'grey.500',
            '&:hover': {
              bgcolor: newMessage.trim() && isConnected ? 'primary.dark' : 'grey.400',
            },
            '&.Mui-disabled': {
              bgcolor: 'grey.300',
              color: 'grey.500',
            },
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>

      {/* Connection Status */}
      {!isConnected && (
        <Box sx={{ mt: 1, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              bgcolor: 'warning.light',
              color: 'warning.contrastText',
              fontSize: '0.75rem',
            }}
          >
            🔄 Reconnecting...
          </Box>
        </Box>
      )}
    </Paper>
  );
}; 