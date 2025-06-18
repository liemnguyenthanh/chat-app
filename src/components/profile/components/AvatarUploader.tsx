import React, { useRef } from 'react';
import {
  Avatar,
  Box,
  IconButton,
  Typography,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  PhotoCamera,
  Person as PersonIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { ProfileData, AvatarUploadState } from '../types/profileTypes';

interface AvatarUploaderProps {
  profile: ProfileData;
  uploadState: AvatarUploadState;
  disabled: boolean;
  onFileSelect: (file: File) => void;
  onDeleteAvatar: () => void;
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  profile,
  uploadState,
  disabled,
  onFileSelect,
  onDeleteAvatar,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getAvatarDisplay = () => {
    if (profile.avatar_url) {
      return (
        <Avatar
          src={profile.avatar_url}
          sx={{ width: 80, height: 80 }}
        >
          {profile.full_name?.[0] || profile.username?.[0] || <PersonIcon />}
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
        {profile.full_name?.[0] || profile.username?.[0] || <PersonIcon />}
      </Avatar>
    );
  };

  return (
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
          disabled={disabled}
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
          {uploadState.uploading ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <PhotoCamera fontSize="small" />
          )}
        </IconButton>
        
        {profile.avatar_url && (
          <IconButton
            onClick={onDeleteAvatar}
            disabled={disabled}
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
      
      {uploadState.uploading && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress variant="determinate" value={uploadState.uploadProgress} />
          <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={1}>
            Uploading avatar... {uploadState.uploadProgress}%
          </Typography>
        </Box>
      )}
      
      <Typography variant="body2" color="text.secondary" textAlign="center">
        Click the camera icon to upload a new avatar (max 5MB)
        {profile.avatar_url && <><br />Click the delete icon to remove current avatar</>}
      </Typography>
    </Box>
  );
}; 