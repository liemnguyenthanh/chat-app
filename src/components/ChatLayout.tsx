import RoomList, { Room } from "@/components/RoomList";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useUserContext } from "@/contexts/UserContext";
import { useRoomsContext } from "@/contexts/RoomsContext";
import {
  Box,
  Drawer,
  Toolbar,
  Button,
  AppBar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ListItemIcon,
  ListItemText,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Tooltip,
  List,
  ListItem,
  ListItemButton,
} from "@mui/material";
import {
  Add as AddIcon,
  AccountCircle,
  Chat as ChatIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
  PersonAdd as PersonAddIcon,
  Mail as MailIcon,
} from "@mui/icons-material";
import ProfileUpdateModal from "./ProfileUpdateModal";
import InviteUserModal from "./InviteUserModal";
import InvitationsPanel from "./InvitationsPanel";

const drawerWidth = 280;

interface ChatLayoutProps {
  children: React.ReactNode;
  openCreateRoom?: boolean;
  onCreateRoomClose?: () => void;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ children, openCreateRoom = false, onCreateRoomClose }) => {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const { user, profile, refreshProfile } = useUserContext();
  const { rooms, createRoom: createRoomFromContext } = useRoomsContext();
  
  // Get the current room from the URL
  const currentRoomId = router.query.id as string;
  const selectedRoom = rooms.find(room => room.id === currentRoomId);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [createRoomOpen, setCreateRoomOpen] = useState(openCreateRoom);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [invitationsPanelOpen, setInvitationsPanelOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [isPrivateRoom, setIsPrivateRoom] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [createRoomError, setCreateRoomError] = useState("");

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      setCreateRoomError('Room name is required');
      return;
    }

    if (newRoomName.trim().length < 3) {
      setCreateRoomError('Room name must be at least 3 characters long');
      return;
    }

    if (newRoomName.trim().length > 100) {
      setCreateRoomError('Room name must be less than 100 characters');
      return;
    }

    setIsCreatingRoom(true);
    setCreateRoomError('');

    try {
      // Create the room using the context
      const newRoom = await createRoomFromContext(
        newRoomName.trim(),
        newRoomDescription.trim() || undefined,
        isPrivateRoom
      );

      if (newRoom) {
        console.log('Room created successfully:', newRoom);
        
        // Reset form and close dialog
        resetCreateRoomForm();
        setCreateRoomOpen(false);
        
        // Optionally redirect to the new room
        // router.push(`/rooms/${newRoom.id}`);
      }
      
    } catch (error) {
      console.error('Error creating room:', error);
      setCreateRoomError('Failed to create room. Please try again.');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const resetCreateRoomForm = () => {
    setNewRoomName('');
    setNewRoomDescription('');
    setIsPrivateRoom(false);
    setCreateRoomError('');
    setIsCreatingRoom(false);
  };

  const handleCreateRoomClose = () => {
    if (!isCreatingRoom) {
      resetCreateRoomForm();
      setCreateRoomOpen(false);
      onCreateRoomClose?.();
    }
  };

  // Sync with prop changes
  useEffect(() => {
    setCreateRoomOpen(openCreateRoom);
  }, [openCreateRoom]);

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* App Bar */}
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
              onClick={() => setInvitationsPanelOpen(true)}
            >
              <MailIcon />
            </IconButton>
          </Tooltip>
          
          {/* Invite user button */}
          {selectedRoom && (
            <Tooltip title="Invite user to room">
              <IconButton
                size="large"
                color="inherit"
                onClick={() => setInviteModalOpen(true)}
              >
                <PersonAddIcon />
              </IconButton>
            </Tooltip>
          )}
          
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              {profile?.full_name ||
                profile?.username ||
                user?.email?.split("@")[0] ||
                "User"}
            </Typography>
            <IconButton
              size="small"
              edge="end"
              color="inherit"
              onClick={handleMenuOpen}
            >
              <Avatar
                src={profile?.avatar_url || undefined}
                sx={{ width: 32, height: 32, bgcolor: "rgba(255,255,255,0.2)" }}
              >
                {!profile?.avatar_url && <AccountCircle />}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          sx: {
            minWidth: 200,
          },
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
            <Avatar
              src={profile?.avatar_url || undefined}
              sx={{ width: 24, height: 24 }}
            >
              {!profile?.avatar_url && <AccountCircle />}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {profile?.full_name ||
                  profile?.username ||
                  user?.email?.split("@")[0] ||
                  "User"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setProfileModalOpen(true);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Profile</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            handleLogout();
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

      {/* Sidebar */}
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
            bgcolor: "#f8f9fa",
            borderRight: "1px solid #e0e0e0",
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
          <RoomList rooms={rooms} />
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        <Toolbar />
        <Box sx={{ flexGrow: 1, overflow: "auto" }}>{children}</Box>
      </Box>

      {/* Floating Action Button for Creating Rooms */}
      <Fab
        color="primary"
        aria-label="add room"
        sx={{
          position: "fixed",
          bottom: 24,
          left: drawerWidth - 64,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
        onClick={() => setCreateRoomOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* Create Room Dialog */}
      <Dialog
        open={createRoomOpen}
        onClose={handleCreateRoomClose}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={isCreatingRoom}
      >
        <DialogTitle>Create New Room</DialogTitle>
        <DialogContent>
          {createRoomError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createRoomError}
            </Alert>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            label="Room Name"
            fullWidth
            variant="outlined"
            value={newRoomName}
            onChange={(e) => {
              setNewRoomName(e.target.value);
              if (createRoomError) setCreateRoomError('');
            }}
            disabled={isCreatingRoom}
            error={!!createRoomError && createRoomError.includes('name')}
            helperText="3-100 characters"
            onKeyPress={(e) => {
              if (e.key === "Enter" && !isCreatingRoom) {
                handleCreateRoom();
              }
            }}
          />
          
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newRoomDescription}
            onChange={(e) => setNewRoomDescription(e.target.value)}
            disabled={isCreatingRoom}
            helperText="Brief description of the room's purpose"
            sx={{ mt: 2 }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={isPrivateRoom}
                onChange={(e) => setIsPrivateRoom(e.target.checked)}
                disabled={isCreatingRoom}
              />
            }
            label="Private Room"
            sx={{ mt: 2, display: 'block' }}
          />
          
          {isPrivateRoom && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Private rooms require an invitation to join
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCreateRoomClose}
            disabled={isCreatingRoom}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateRoom} 
            variant="contained"
            disabled={isCreatingRoom || !newRoomName.trim()}
            startIcon={isCreatingRoom ? <CircularProgress size={20} /> : null}
          >
            {isCreatingRoom ? 'Creating...' : 'Create Room'}
          </Button>
        </DialogActions>
      </Dialog>

      <ProfileUpdateModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onProfileUpdated={() => {
          refreshProfile();
          console.log("Profile updated successfully");
        }}
      />

      {/* Invite User Modal */}
      {selectedRoom && (
        <InviteUserModal
          open={inviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          groupId={selectedRoom.id}
          groupName={selectedRoom.name}
        />
      )}

      {/* Invitations Panel */}
      <Dialog
        open={invitationsPanelOpen}
        onClose={() => setInvitationsPanelOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Invitations</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <InvitationsPanel />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvitationsPanelOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatLayout;
