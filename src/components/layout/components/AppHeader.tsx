import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Box,
  Tooltip,
} from '@mui/material';
import {
  Chat as ChatIcon,
  AccountCircle,
  PersonAdd as PersonAddIcon,
  Mail as MailIcon,
} from '@mui/icons-material';

interface AppHeaderProps {
  userDisplayName: string;
  userEmail?: string;
  userAvatarUrl?: string;
  hasSelectedRoom: boolean;
  onUserMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  onInvitationsPanelOpen: () => void;
  onInviteModalOpen: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  userDisplayName,
  userEmail,
  userAvatarUrl,
  hasSelectedRoom,
  onUserMenuOpen,
  onInvitationsPanelOpen,
  onInviteModalOpen,
}) => {
  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Toolbar>
        <ChatIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Berally Chat
        </Typography>
        
        {/* Invitations button */}
        <Tooltip title="View invitations">
          <IconButton
            size="large"
            color="inherit"
            onClick={onInvitationsPanelOpen}
          >
            <MailIcon />
          </IconButton>
        </Tooltip>
        
        {/* Invite user button */}
        {hasSelectedRoom && (
          <Tooltip title="Invite user to room">
            <IconButton
              size="large"
              color="inherit"
              onClick={onInviteModalOpen}
            >
              <PersonAddIcon />
            </IconButton>
          </Tooltip>
        )}
        
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            {userDisplayName}
          </Typography>
          <IconButton
            size="small"
            edge="end"
            color="inherit"
            onClick={onUserMenuOpen}
          >
            <Avatar
              src={userAvatarUrl || undefined}
              sx={{ width: 32, height: 32, bgcolor: "rgba(255,255,255,0.2)" }}
            >
              {!userAvatarUrl && <AccountCircle />}
            </Avatar>
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}; 