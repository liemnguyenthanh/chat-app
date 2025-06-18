import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Avatar,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import {
  PhotoCamera,
  Person as PersonIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useUserContext } from "@/contexts/UserContext";

interface ProfileData {
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
}

interface ProfileUpdateModalProps {
  open: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

const ProfileUpdateModal: React.FC<ProfileUpdateModalProps> = ({
  open,
  onClose,
  onProfileUpdated,
}) => {
  const supabase = useSupabaseClient();
  const { user, profile, updateProfile } = useUserContext();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [localProfile, setLocalProfile] = useState<ProfileData>({
    username: "",
    full_name: "",
    avatar_url: "",
    bio: "",
  });

  // Load current profile data when modal opens
  useEffect(() => {
    if (open && profile) {
      setLocalProfile({
        username: profile.username || "",
        full_name: profile.full_name || "",
        avatar_url: profile.avatar_url || "",
        bio: profile.bio || "",
      });
    }
  }, [open, profile]);



  const handleInputChange = (field: keyof ProfileData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalProfile(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    setError(null);
    setSuccess(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete existing avatar if it exists
      if (localProfile.avatar_url) {
        const existingPath = localProfile.avatar_url.split('/').pop();
        if (existingPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${existingPath}`]);
        }
      }

      // Upload new avatar
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update local profile with new avatar URL
      setLocalProfile(prev => ({
        ...prev,
        avatar_url: publicUrl
      }));

      setUploadProgress(100);
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user?.id || !localProfile.avatar_url) return;

    setUploading(true);
    setError(null);

    try {
      // Extract filename from URL
      const urlParts = localProfile.avatar_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user.id}/${fileName}`;

      // Delete from storage
      const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (error) throw error;

      // Update local profile to remove avatar URL
      setLocalProfile(prev => ({
        ...prev,
        avatar_url: ''
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to delete avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    // Validate required fields
    if (!localProfile.username.trim()) {
      setError("Username is required");
      return;
    }
    
    if (localProfile.username.trim().length < 3) {
      setError("Username must be at least 3 characters long");
      return;
    }
    
    if (localProfile.bio.length > 500) {
      setError("Bio must be 500 characters or less");
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      await updateProfile({
        username: localProfile.username.trim(),
        full_name: localProfile.full_name.trim() || null,
        avatar_url: localProfile.avatar_url.trim() || null,
        bio: localProfile.bio.trim() || null,
      });

      setSuccess(true);
      onProfileUpdated?.();
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      if (err.code === "23505") {
        setError("Username is already taken. Please choose a different one.");
      } else {
        setError(err.message || "Failed to update profile");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving && !uploading) {
      onClose();
      setError(null);
      setSuccess(false);
    }
  };

  const getAvatarDisplay = () => {
    if (localProfile.avatar_url) {
      return (
        <Avatar
          src={localProfile.avatar_url}
          sx={{ width: 80, height: 80 }}
        >
          {localProfile.full_name?.[0] || localProfile.username?.[0] || <PersonIcon />}
        </Avatar>
      );
    }
    
    return (
      <Avatar
        sx={{ 
          width: 80, 
          height: 80, 
          bgcolor: "primary.main",
          fontSize: "2rem"
        }}
      >
        {localProfile.full_name?.[0] || localProfile.username?.[0] || <PersonIcon />}
      </Avatar>
    );
  };

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
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ pt: 1 }}>
            {/* Avatar Section */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
              <Box sx={{ position: "relative", mb: 2 }}>
                {getAvatarDisplay()}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || saving}
                  sx={{
                    position: "absolute",
                    bottom: -8,
                    right: -8,
                    bgcolor: "primary.main",
                    color: "white",
                    width: 32,
                    height: 32,
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                    "&:disabled": {
                      bgcolor: "grey.400",
                    },
                  }}
                  size="small"
                >
                  {uploading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <PhotoCamera fontSize="small" />
                  )}
                </IconButton>
                {localProfile.avatar_url && (
                  <IconButton
                    onClick={handleDeleteAvatar}
                    disabled={uploading || saving}
                    sx={{
                      position: "absolute",
                      bottom: -8,
                      left: -8,
                      bgcolor: "error.main",
                      color: "white",
                      width: 32,
                      height: 32,
                      "&:hover": {
                        bgcolor: "error.dark",
                      },
                      "&:disabled": {
                        bgcolor: "grey.400",
                      },
                    }}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              {uploading && (
                <Box sx={{ width: '100%', mb: 2 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={1}>
                    Uploading avatar... {uploadProgress}%
                  </Typography>
                </Box>
              )}
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Click the camera icon to upload a new avatar (max 5MB)
                {localProfile.avatar_url && <><br />Click the delete icon to remove current avatar</>}
              </Typography>
            </Box>

            {/* Form Fields */}
            <TextField
              autoFocus
              margin="dense"
              label="Username"
              fullWidth
              variant="outlined"
              value={localProfile.username}
              onChange={handleInputChange("username")}
              required
              helperText="Must be at least 3 characters long and unique"
              disabled={saving || uploading}
            />
            
            <TextField
              margin="dense"
              label="Full Name"
              fullWidth
              variant="outlined"
              value={localProfile.full_name}
              onChange={handleInputChange("full_name")}
              disabled={saving || uploading}
            />
            

            
            <TextField
              margin="dense"
              label="Bio"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={localProfile.bio}
              onChange={handleInputChange("bio")}
              placeholder="Tell us about yourself..."
              helperText={`${localProfile.bio.length}/500 characters`}
              disabled={saving || uploading}
            />

            {/* Error/Success Messages */}
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
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={saving || uploading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={loading || saving || uploading || !localProfile.username.trim()}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileUpdateModal;