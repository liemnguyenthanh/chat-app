import React from 'react';
import { TextField, Typography, Box } from '@mui/material';

interface InviteMessageFieldProps {
  message: string;
  onMessageChange: (message: string) => void;
  groupName: string;
  disabled?: boolean;
}

export const InviteMessageField: React.FC<InviteMessageFieldProps> = ({
  message,
  onMessageChange,
  groupName,
  disabled = false,
}) => {
  const defaultMessage = `You've been invited to join ${groupName}`;
  
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Invitation Message (Optional)
      </Typography>
      
      <TextField
        fullWidth
        multiline
        rows={3}
        variant="outlined"
        placeholder={defaultMessage}
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        disabled={disabled}
        helperText={
          message.trim() 
            ? `${message.length} characters`
            : `Default message will be used: "${defaultMessage}"`
        }
      />
    </Box>
  );
}; 