import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';

interface CreateRoomDialogProps {
  open: boolean;
  isCreating: boolean;
  error: string;
  roomName: string;
  roomDescription: string;
  isPrivate: boolean;
  onClose: () => void;
  onCreate: () => void;
  onRoomNameChange: (name: string) => void;
  onRoomDescriptionChange: (description: string) => void;
  onPrivateChange: (isPrivate: boolean) => void;
  onErrorClear: () => void;
}

export const CreateRoomDialog: React.FC<CreateRoomDialogProps> = ({
  open,
  isCreating,
  error,
  roomName,
  roomDescription,
  isPrivate,
  onClose,
  onCreate,
  onRoomNameChange,
  onRoomDescriptionChange,
  onPrivateChange,
  onErrorClear,
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isCreating && roomName.trim()) {
      onCreate();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isCreating}
    >
      <DialogTitle>Create New Room</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <TextField
          autoFocus
          margin="dense"
          label="Room Name"
          fullWidth
          variant="outlined"
          value={roomName}
          onChange={(e) => {
            onRoomNameChange(e.target.value);
            if (error) onErrorClear();
          }}
          disabled={isCreating}
          error={!!error && error.includes('name')}
          helperText="3-100 characters"
          onKeyPress={handleKeyPress}
        />
        
        <TextField
          margin="dense"
          label="Description (Optional)"
          fullWidth
          variant="outlined"
          multiline
          rows={3}
          value={roomDescription}
          onChange={(e) => onRoomDescriptionChange(e.target.value)}
          disabled={isCreating}
          helperText="Brief description of the room's purpose"
          sx={{ mt: 2 }}
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={isPrivate}
              onChange={(e) => onPrivateChange(e.target.checked)}
              disabled={isCreating}
            />
          }
          label="Private Room"
          sx={{ mt: 2, display: 'block' }}
        />
        
        {isPrivate && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Private rooms require an invitation to join
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose}
          disabled={isCreating}
        >
          Cancel
        </Button>
        <Button 
          onClick={onCreate} 
          variant="contained"
          disabled={isCreating || !roomName.trim()}
          startIcon={isCreating ? <CircularProgress size={20} /> : null}
        >
          {isCreating ? 'Creating...' : 'Create Room'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 