import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useUserContext } from "@/contexts/UserContext";
import {
  AvatarUploader,
  ProfileFormFields,
  ProfileStatusMessages,
  useAvatarUpload,
  useProfileForm,
  type ProfileUpdateModalProps,
} from "@/components/profile";

const ProfileUpdateModal: React.FC<ProfileUpdateModalProps> = ({
  open,
  onClose,
  onProfileUpdated,
}) => {
  const { user } = useUserContext();
  
  // Custom hooks for functionality
  const {
    localProfile,
    formState,
    handleInputChange,
    updateAvatarUrl,
    handleSave,
    setError,
  } = useProfileForm(open, onProfileUpdated, onClose);

  const {
    uploadState,
    uploadAvatar,
    deleteAvatar,
    clearError: clearUploadError,
  } = useAvatarUpload(user?.id);

  // Handle avatar file selection
  const handleFileSelect = async (file: File) => {
    clearUploadError();
    setError(null);
    
    const newAvatarUrl = await uploadAvatar(file, localProfile.avatar_url);
    if (newAvatarUrl) {
      updateAvatarUrl(newAvatarUrl);
    } else if (uploadState.error) {
      setError(uploadState.error);
    }
  };

  // Handle avatar deletion
  const handleDeleteAvatar = async () => {
    clearUploadError();
    setError(null);
    
    const success = await deleteAvatar(localProfile.avatar_url);
    if (success) {
      updateAvatarUrl('');
    } else if (uploadState.error) {
      setError(uploadState.error);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!formState.saving && !uploadState.uploading) {
      onClose();
    }
  };

  const isDisabled = formState.saving || uploadState.uploading;
  const currentError = formState.error || uploadState.error;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          Update Profile
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {formState.loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ pt: 1 }}>
            {/* Avatar Section */}
            <AvatarUploader
              profile={localProfile}
              uploadState={uploadState}
              disabled={isDisabled}
              onFileSelect={handleFileSelect}
              onDeleteAvatar={handleDeleteAvatar}
            />

            {/* Form Fields */}
            <ProfileFormFields
              profile={localProfile}
              disabled={isDisabled}
              onInputChange={handleInputChange}
            />

            {/* Status Messages */}
            <ProfileStatusMessages
              error={currentError}
              success={formState.success}
            />
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={isDisabled}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={formState.loading || isDisabled || !localProfile.username.trim()}
          startIcon={formState.saving ? <CircularProgress size={16} /> : null}
        >
          {formState.saving ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileUpdateModal;