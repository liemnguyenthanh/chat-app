import React from 'react';
import { Alert } from '@mui/material';

interface ProfileStatusMessagesProps {
  error: string | null;
  success: boolean;
}

export const ProfileStatusMessages: React.FC<ProfileStatusMessagesProps> = ({
  error,
  success,
}) => {
  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Profile updated successfully!
        </Alert>
      )}
    </>
  );
}; 