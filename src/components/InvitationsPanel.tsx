import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useInvitationsContext } from '@/contexts/InvitationsContext';
import { formatDistanceToNow } from 'date-fns';
import { InvitationItemSkeleton } from '@/components/skeletons';

interface InvitationsPanelProps {
  groupId?: string;
}

const InvitationsPanel: React.FC<InvitationsPanelProps> = ({ groupId }) => {
  const {
    invitations,
    loading,
    error,
    respondToInvitation,
    cancelInvitation,
  } = useInvitationsContext();
  
  const [tabValue, setTabValue] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedInvitation, setSelectedInvitation] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter invitations based on current tab and group
  const filteredInvitations = invitations.filter(invitation => {
    if (groupId && invitation.group_id !== groupId) return false;
    
    switch (tabValue) {
      case 0: // Received
        return invitation.status === 'pending' && invitation.invitee_id;
      case 1: // Sent
        return invitation.inviter_id;
      case 2: // All
      default:
        return true;
    }
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, invitationId: string) => {
    setMenuAnchor(event.currentTarget);
    setSelectedInvitation(invitationId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedInvitation(null);
  };

  const handleAccept = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      await respondToInvitation(invitationId, 'accepted');
    } catch (err) {
      console.error('Error accepting invitation:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      await respondToInvitation(invitationId, 'declined');
    } catch (err) {
      console.error('Error declining invitation:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      await cancelInvitation(invitationId);
      handleMenuClose();
    } catch (err) {
      console.error('Error canceling invitation:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'success';
      case 'declined':
        return 'error';
      case 'expired':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckIcon fontSize="small" />;
      case 'declined':
        return <CloseIcon fontSize="small" />;
      case 'expired':
        return <ScheduleIcon fontSize="small" />;
      default:
        return <SendIcon fontSize="small" />;
    }
  };

  if (loading && invitations.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {groupId ? 'Group Invitations' : 'Invitations'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!groupId && (
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ mb: 2 }}
        >
          <Tab label="Received" />
          <Tab label="Sent" />
          <Tab label="All" />
        </Tabs>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <InvitationItemSkeleton key={index} />
          ))}
        </Box>
      ) : filteredInvitations.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            {tabValue === 0 ? 'No pending invitations' : 
             tabValue === 1 ? 'No sent invitations' : 
             'No invitations found'}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredInvitations.map((invitation) => (
            <Card key={invitation.id} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar
                    src={invitation.inviter?.avatar_url}
                    sx={{ width: 40, height: 40 }}
                  >
                    {invitation.inviter?.username?.charAt(0).toUpperCase()}
                  </Avatar>
                  
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle2">
                        {invitation.inviter?.full_name || invitation.inviter?.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        invited you to
                      </Typography>
                      <Typography variant="subtitle2" color="primary">
                        {invitation.group?.name}
                      </Typography>
                    </Box>
                    
                    {invitation.message && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        "{invitation.message}"
                      </Typography>
                    )}
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        icon={getStatusIcon(invitation.status)}
                        label={invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                        size="small"
                        color={getStatusColor(invitation.status) as any}
                        variant={invitation.status === 'pending' ? 'filled' : 'outlined'}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, invitation.id)}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
              
              {invitation.status === 'pending' && tabValue === 0 && (
                <>
                  <Divider />
                  <CardActions>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={actionLoading === invitation.id ? <CircularProgress size={16} /> : <CheckIcon />}
                      onClick={() => handleAccept(invitation.id)}
                      disabled={actionLoading === invitation.id}
                    >
                      Accept
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={actionLoading === invitation.id ? <CircularProgress size={16} /> : <CloseIcon />}
                      onClick={() => handleDecline(invitation.id)}
                      disabled={actionLoading === invitation.id}
                    >
                      Decline
                    </Button>
                  </CardActions>
                </>
              )}
            </Card>
          ))}
        </Box>
      )}

      {/* Menu for invitation actions */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {selectedInvitation && (
          <MenuItem
            onClick={() => selectedInvitation && handleCancel(selectedInvitation)}
            disabled={actionLoading === selectedInvitation}
          >
            {actionLoading === selectedInvitation ? (
              <CircularProgress size={16} sx={{ mr: 1 }} />
            ) : (
              <CloseIcon fontSize="small" sx={{ mr: 1 }} />
            )}
            Cancel Invitation
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default InvitationsPanel;