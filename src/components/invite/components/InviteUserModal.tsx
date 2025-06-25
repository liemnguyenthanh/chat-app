import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  UserSearchField,
  InviteMessageField,
  useUserSearch,
  useInviteForm,
  type InviteUserModalProps,
} from '@/components/invite';

const InviteUserModal: React.FC<InviteUserModalProps> = ({
  open,
  onClose,
  groupId,
  groupName,
}) => {
  // Custom hooks for functionality
  const { searchState, searchUsers, clearSearch } = useUserSearch(groupId);
  
  const {
    formState,
    setSelectedUser,
    setMessage,
    sendInvite,
    resetForm,
    isLoading,
  } = useInviteForm(groupId, groupName, handleSuccess);

  function handleSuccess() {
    // Reset both search and form states
    clearSearch();
    resetForm();
    onClose();
  }

  const handleClose = () => {
    if (!isLoading) {
      clearSearch();
      resetForm();
      onClose();
    }
  };

  const currentError = formState.error || searchState.error;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isLoading}
    >
      <DialogTitle>Invite User to {groupName}</DialogTitle>
      
      <DialogContent>
        {currentError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {currentError}
          </Alert>
        )}

        {/* User Search */}
        <UserSearchField
          searchState={searchState}
          selectedUser={formState.selectedUser}
          onUserSelect={setSelectedUser}
          onSearchChange={searchUsers}
          disabled={isLoading}
        />

        {/* Invitation Message */}
        <InviteMessageField
          message={formState.message}
          onMessageChange={setMessage}
          groupName={groupName}
          disabled={isLoading}
        />
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={handleClose} 
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={sendInvite}
          variant="contained"
          disabled={isLoading || !formState.selectedUser}
          startIcon={isLoading ? <CircularProgress size={16} /> : null}
        >
          {isLoading ? 'Sending...' : 'Send Invitation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteUserModal; 