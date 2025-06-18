import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useUserContext } from "@/contexts/UserContext";
import { useRoomsContext } from "@/contexts/RoomsContext";
import { Box, Toolbar } from "@mui/material";

// Import extracted components
import { AppHeader } from "./layout/components/AppHeader";
import { UserMenu } from "./layout/components/UserMenu";
import { Sidebar } from "./layout/components/Sidebar";
import { CreateRoomDialog } from "./layout/components/CreateRoomDialog";
import { CreateRoomFab } from "./layout/components/CreateRoomFab";
import { ModalsManager } from "./layout/components/ModalsManager";

// Import custom hook
import { useCreateRoom } from "./layout/hooks/useCreateRoom";

interface ChatLayoutProps {
  children: React.ReactNode;
  openCreateRoom?: boolean;
  onCreateRoomClose?: () => void;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ 
  children, 
  openCreateRoom = false, 
  onCreateRoomClose 
}) => {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const { user, profile, refreshProfile } = useUserContext();
  const { rooms } = useRoomsContext();
  
  // Get the current room from the URL
  const currentRoomId = router.query.id as string;
  const selectedRoom = rooms.find(room => room.id === currentRoomId);

  // UI state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [createRoomOpen, setCreateRoomOpen] = useState(openCreateRoom);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [invitationsPanelOpen, setInvitationsPanelOpen] = useState(false);

  // Room creation logic from custom hook
  const {
    newRoomName,
    newRoomDescription,
    isPrivateRoom,
    isCreatingRoom,
    createRoomError,
    setNewRoomName,
    setNewRoomDescription,
    setIsPrivateRoom,
    handleCreateRoom,
    resetForm,
    clearError,
  } = useCreateRoom();

  // Sync with prop changes
  useEffect(() => {
    setCreateRoomOpen(openCreateRoom);
  }, [openCreateRoom]);

  // Computed user display name
  const userDisplayName = profile?.full_name ||
    profile?.username ||
    user?.email?.split("@")[0] ||
    "User";

  // Event handlers
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCreateRoomSuccess = async () => {
    const success = await handleCreateRoom();
    if (success) {
      setCreateRoomOpen(false);
      onCreateRoomClose?.();
    }
  };

  const handleCreateRoomClose = () => {
    if (!isCreatingRoom) {
      resetForm();
      setCreateRoomOpen(false);
      onCreateRoomClose?.();
    }
  };

  const handleProfileModalClose = () => {
    setProfileModalOpen(false);
    handleMenuClose();
  };

  const handleEditProfile = () => {
    setProfileModalOpen(true);
    handleMenuClose();
  };

  const handleLogoutClick = () => {
    handleMenuClose();
    handleLogout();
  };

  const handleProfileUpdated = () => {
    refreshProfile();
    console.log("Profile updated successfully");
  };

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* App Header */}
      <AppHeader
        userDisplayName={userDisplayName}
        userEmail={user?.email || undefined}
        userAvatarUrl={profile?.avatar_url || undefined}
        hasSelectedRoom={!!selectedRoom}
        onUserMenuOpen={handleMenuOpen}
        onInvitationsPanelOpen={() => setInvitationsPanelOpen(true)}
        onInviteModalOpen={() => setInviteModalOpen(true)}
      />

      {/* User Menu */}
      <UserMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        userDisplayName={userDisplayName}
        userEmail={user?.email || undefined}
        userAvatarUrl={profile?.avatar_url || undefined}
        onClose={handleMenuClose}
        onEditProfile={handleEditProfile}
        onLogout={handleLogoutClick}
      />

      {/* Sidebar */}
      <Sidebar rooms={rooms} />

      {/* Main Content */}
      <Box
        component="main"
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        <Toolbar />
        <Box sx={{ flexGrow: 1, overflow: "auto" }}>{children}</Box>
      </Box>

      {/* Floating Action Button */}
      <CreateRoomFab onClick={() => setCreateRoomOpen(true)} />

      {/* Create Room Dialog */}
      <CreateRoomDialog
        open={createRoomOpen}
        isCreating={isCreatingRoom}
        error={createRoomError}
        roomName={newRoomName}
        roomDescription={newRoomDescription}
        isPrivate={isPrivateRoom}
        onClose={handleCreateRoomClose}
        onCreate={handleCreateRoomSuccess}
        onRoomNameChange={setNewRoomName}
        onRoomDescriptionChange={setNewRoomDescription}
        onPrivateChange={setIsPrivateRoom}
        onErrorClear={clearError}
      />

      {/* Modals Manager */}
      <ModalsManager
        profileModalOpen={profileModalOpen}
        onProfileModalClose={handleProfileModalClose}
        onProfileUpdated={handleProfileUpdated}
        inviteModalOpen={inviteModalOpen}
        onInviteModalClose={() => setInviteModalOpen(false)}
        selectedRoomId={selectedRoom?.id}
        selectedRoomName={selectedRoom?.name}
        invitationsPanelOpen={invitationsPanelOpen}
        onInvitationsPanelClose={() => setInvitationsPanelOpen(false)}
      />
    </Box>
  );
};

export default ChatLayout;
