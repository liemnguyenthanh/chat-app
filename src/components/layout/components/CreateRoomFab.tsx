import React from 'react';
import { Fab } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { drawerWidth } from './Sidebar';

interface CreateRoomFabProps {
  onClick: () => void;
}

export const CreateRoomFab: React.FC<CreateRoomFabProps> = ({ onClick }) => {
  return (
    <Fab
      color="primary"
      aria-label="add room"
      sx={{
        position: "fixed",
        bottom: 24,
        left: drawerWidth - 64,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        '&:hover': {
          background: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
        },
      }}
      onClick={onClick}
    >
      <AddIcon />
    </Fab>
  );
}; 