import React, { useRef, useState, useCallback } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Box,
  Typography,
  LinearProgress,
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  InsertDriveFile as FileIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface AttachmentUploadProps {
  onFileSelect: (files: File[]) => void;
  disabled?: boolean;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export const AttachmentUpload: React.FC<AttachmentUploadProps> = ({
  onFileSelect,
  disabled = false,
  maxFileSize = 10, // 10MB default
  acceptedTypes = ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx', '.txt'],
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }
    return null;
  };

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles: File[] = [];
    const newUploads: UploadProgress[] = [];

    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        newUploads.push({
          file,
          progress: 0,
          status: 'error',
          error,
        });
      } else {
        validFiles.push(file);
        newUploads.push({
          file,
          progress: 0,
          status: 'uploading',
        });
      }
    });

    setUploads(prev => [...prev, ...newUploads]);
    
    if (validFiles.length > 0) {
      onFileSelect(validFiles);
      
      // Simulate upload progress
      validFiles.forEach((file, index) => {
        const uploadIndex = uploads.length + index;
        simulateUpload(uploadIndex);
      });
    }

    // Reset input
    event.target.value = '';
    handleClose();
  }, [uploads.length, onFileSelect, maxFileSize]);

  const simulateUpload = (uploadIndex: number) => {
    const interval = setInterval(() => {
      setUploads(prev => {
        const newUploads = [...prev];
        if (newUploads[uploadIndex]) {
          newUploads[uploadIndex].progress += 10;
          if (newUploads[uploadIndex].progress >= 100) {
            newUploads[uploadIndex].progress = 100;
            newUploads[uploadIndex].status = 'completed';
            clearInterval(interval);
          }
        }
        return newUploads;
      });
    }, 200);
  };

  const removeUpload = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = (inputRef: React.RefObject<HTMLInputElement>) => {
    inputRef.current?.click();
  };

  return (
    <Box>
      {/* Attachment Button */}
      <IconButton
        onClick={handleClick}
        disabled={disabled}
        size="small"
        sx={{
          color: 'text.secondary',
          '&:hover': {
            color: 'primary.main',
            bgcolor: 'action.hover',
          }
        }}
      >
        <AttachFileIcon />
      </IconButton>

      {/* Attachment Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            minWidth: 180,
          }
        }}
      >
        <MenuItem onClick={() => triggerFileInput(imageInputRef)}>
          <ListItemIcon>
            <ImageIcon color="primary" />
          </ListItemIcon>
          <ListItemText primary="Images" />
        </MenuItem>

        <MenuItem onClick={() => triggerFileInput(videoInputRef)}>
          <ListItemIcon>
            <VideoIcon color="secondary" />
          </ListItemIcon>
          <ListItemText primary="Videos" />
        </MenuItem>

        <MenuItem onClick={() => triggerFileInput(audioInputRef)}>
          <ListItemIcon>
            <AudioIcon color="info" />
          </ListItemIcon>
          <ListItemText primary="Audio" />
        </MenuItem>

        <MenuItem onClick={() => triggerFileInput(fileInputRef)}>
          <ListItemIcon>
            <FileIcon color="action" />
          </ListItemIcon>
          <ListItemText primary="Documents" />
        </MenuItem>
      </Menu>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <input
        type="file"
        ref={videoInputRef}
        accept="video/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <input
        type="file"
        ref={audioInputRef}
        accept="audio/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,.doc,.docx,.txt,.zip,.rar"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <Box sx={{ mt: 2, maxWidth: 300 }}>
          {uploads.map((upload, index) => (
            <Box
              key={`${upload.file.name}-${index}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 1,
                p: 1,
                bgcolor: 'background.default',
                borderRadius: 1,
                border: upload.status === 'error' ? '1px solid red' : '1px solid transparent',
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap>
                  {upload.file.name}
                </Typography>
                {upload.status === 'uploading' && (
                  <LinearProgress
                    variant="determinate"
                    value={upload.progress}
                    sx={{ mt: 0.5 }}
                  />
                )}
                {upload.status === 'error' && (
                  <Typography variant="caption" color="error">
                    {upload.error}
                  </Typography>
                )}
                {upload.status === 'completed' && (
                  <Typography variant="caption" color="success.main">
                    Upload complete
                  </Typography>
                )}
              </Box>
              
              <IconButton
                size="small"
                onClick={() => removeUpload(index)}
                sx={{ color: 'text.secondary' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}; 