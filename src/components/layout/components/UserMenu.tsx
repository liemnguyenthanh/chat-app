import React from 'react';
import {
  Menu,
  MenuItem,
  Box,
  Typography,
  Avatar,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  AccountCircle,
  Edit as EditIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';

interface UserMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  userDisplayName: string;
  userEmail?: string;
  userAvatarUrl?: string;
  onClose: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  anchorEl,
  open,
  userDisplayName,
  userEmail,
  userAvatarUrl,
  onClose,
  onEditProfile,
  onLogout,
}) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      PaperProps={{
        sx: {
          minWidth: 200,
        },
      }}
    >
      <MenuItem onClick={onClose}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
          <Avatar
            src={userAvatarUrl || undefined}
            sx={{ width: 24, height: 24 }}
          >
            {!userAvatarUrl && <AccountCircle />}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {userDisplayName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {userEmail}
            </Typography>
          </Box>
        </Box>
      </MenuItem>
      <Divider />
      <MenuItem onClick={onEditProfile}>
        <ListItemIcon>
          <EditIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Edit Profile</ListItemText>
      </MenuItem>
      <MenuItem onClick={onLogout}>
        <ListItemIcon>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Logout</ListItemText>
      </MenuItem>
    </Menu>
  );
}; 