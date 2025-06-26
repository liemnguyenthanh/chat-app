import React from 'react';
import {
  Drawer,
  Toolbar,
  Box,
  Typography,
} from '@mui/material';
import { RoomList, Room } from '@/components/rooms';

const drawerWidth = 280;

interface SidebarProps {
  rooms: Room[];
  loading?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ rooms, loading = false }) => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.paper",
          borderRight: "1px solid",
          borderColor: "divider",
        },
      }}
    >
      <Toolbar />
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, color: "text.secondary" }}>
          Rooms
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
        <RoomList rooms={rooms} loading={loading} />
      </Box>
    </Drawer>
  );
};

// Export the drawer width for use in other components
export { drawerWidth };