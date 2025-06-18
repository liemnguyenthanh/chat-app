import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import { useInvitationsContext } from '@/contexts/InvitationsContext';
import { supabase } from '@/lib/supabaseClient';

interface InviteUserModalProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
}

interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({
  open,
  onClose,
  groupId,
  groupName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  
  const { sendInvitation, loading: inviting } = useInvitationsContext();

  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setUsers([]);
      return;
    }

    setSearching(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      // Filter out users who are already members of the group
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);

      const memberIds = members?.map(m => m.user_id) || [];
      const filteredUsers = data?.filter(user => !memberIds.includes(user.id)) || [];

      setUsers(filteredUsers);
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = async () => {
    if (!selectedUser) {
      setError('Please select a user to invite');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendInvitation(
        groupId,
        selectedUser.id,
        message.trim() || `You've been invited to join ${groupName}`
      );

      // Reset form and close modal
      setSelectedUser(null);
      setMessage('');
      setSearchQuery('');
      setUsers([]);
      onClose();
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading && !inviting) {
      setSelectedUser(null);
      setMessage('');
      setSearchQuery('');
      setUsers([]);
      setError('');
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={loading || inviting}
    >
      <DialogTitle>Invite User to {groupName}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Search for users by username or name
          </Typography>
          <Autocomplete
            options={users}
            getOptionLabel={(option) => 
              option.full_name ? `${option.full_name} (@${option.username})` : `@${option.username}`
            }
            value={selectedUser}
            onChange={(_, newValue) => setSelectedUser(newValue)}
            inputValue={searchQuery}
            onInputChange={(_, newInputValue) => {
              setSearchQuery(newInputValue);
              searchUsers(newInputValue);
            }}
            loading={searching}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search users"
                variant="outlined"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {searching ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {option.username.charAt(0).toUpperCase()}
                  </Box>
                  <Box>
                    <Typography variant="body2">
                      {option.full_name || option.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      @{option.username}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
            noOptionsText={searchQuery.length < 2 ? "Type to search users" : "No users found"}
          />
        </Box>

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Invitation message (optional)"
          placeholder={`You've been invited to join ${groupName}`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          variant="outlined"
          disabled={loading || inviting}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading || inviting}>
          Cancel
        </Button>
        <Button
          onClick={handleInvite}
          variant="contained"
          disabled={!selectedUser || loading || inviting}
          startIcon={loading || inviting ? <CircularProgress size={16} /> : null}
        >
          {loading || inviting ? 'Sending...' : 'Send Invitation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteUserModal;