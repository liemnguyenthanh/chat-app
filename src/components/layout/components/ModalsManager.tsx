import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { InvitationsPanel, InviteUserModal } from '@/components/invite';
import { ProfileUpdateModal } from '@/components/profile';

interface ModalsManagerProps {
  // Profile Modal
  profileModalOpen: boolean;
  onProfileModalClose: () => void;
  onProfileUpdated: () => void;
  
  // Invite Modal
  inviteModalOpen: boolean;
  onInviteModalClose: () => void;
  selectedRoomId?: string;
  selectedRoomName?: string;
  
  // Invitations Panel
  invitationsPanelOpen: boolean;
  onInvitationsPanelClose: () => void;
}

export const ModalsManager: React.FC<ModalsManagerProps> = ({
  profileModalOpen,
  onProfileModalClose,
  onProfileUpdated,
  inviteModalOpen,
  onInviteModalClose,
  selectedRoomId,
  selectedRoomName,
  invitationsPanelOpen,
  onInvitationsPanelClose,
}) => {
  return (
    <>
      {/* Profile Update Modal */}
      <ProfileUpdateModal
        open={profileModalOpen}
        onClose={onProfileModalClose}
        onProfileUpdated={onProfileUpdated}
      />

      {/* Invite User Modal */}
      {selectedRoomId && selectedRoomName && (
        <InviteUserModal
          open={inviteModalOpen}
          onClose={onInviteModalClose}
          groupId={selectedRoomId}
          groupName={selectedRoomName}
        />
      )}

      {/* Invitations Panel */}
      <Dialog
        open={invitationsPanelOpen}
        onClose={onInvitationsPanelClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Invitations</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <InvitationsPanel />
        </DialogContent>
        <DialogActions>
          <Button onClick={onInvitationsPanelClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}; 