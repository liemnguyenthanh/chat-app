import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  AlternateEmail as MentionIcon,
} from '@mui/icons-material';

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
}

interface MentionPickerProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onMentionSelect: (user: User) => void;
  searchTerm?: string;
  position?: { top: number; left: number };
}

export const MentionPicker: React.FC<MentionPickerProps> = ({
  anchorEl,
  open,
  onClose,
  onMentionSelect,
  searchTerm = '',
  position,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Mock users - replace with actual API call
  const mockUsers: User[] = useMemo(() => [
    {
      id: '1',
      username: 'john_doe',
      email: 'john@example.com',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    },
    {
      id: '2',
      username: 'jane_smith',
      email: 'jane@example.com',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
    },
    {
      id: '3',
      username: 'mike_wilson',
      email: 'mike@example.com',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    },
    {
      id: '4',
      username: 'sarah_connor',
      email: 'sarah@example.com',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    },
    {
      id: '5',
      username: 'alex_garcia',
      email: 'alex@example.com',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    },
  ], []);

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return mockUsers.slice(0, 5); // Show first 5 users when no search

    return mockUsers.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10); // Limit to 10 results
  }, [mockUsers, searchTerm]);

  useEffect(() => {
    setUsers(filteredUsers);
    setSelectedIndex(0);
  }, [filteredUsers]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => (prev + 1) % users.length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => (prev - 1 + users.length) % users.length);
          break;
        case 'Enter':
          event.preventDefault();
          if (users[selectedIndex]) {
            handleUserSelect(users[selectedIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, users, selectedIndex, onClose]);

  const handleUserSelect = useCallback((user: User) => {
    onMentionSelect(user);
    onClose();
  }, [onMentionSelect, onClose]);

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  if (!open || users.length === 0) {
    return null;
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      PaperProps={{
        sx: {
          width: 300,
          maxHeight: 250,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid',
          borderColor: 'divider',
        }
      }}
      style={position ? {
        position: 'fixed',
        top: position.top,
        left: position.left,
      } : undefined}
    >
      <Box>
        {/* Header */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}
          >
            <MentionIcon fontSize="small" />
            Mention someone
            {searchTerm && (
              <Chip
                size="small"
                label={`"${searchTerm}"`}
                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
              />
            )}
          </Typography>
        </Box>

        {/* User List */}
        <List sx={{ py: 0, maxHeight: 200, overflow: 'auto' }}>
                     {users.map((user, index) => (
             <ListItem
               key={user.id}
               onClick={() => handleUserSelect(user)}
               sx={{
                 py: 1,
                 px: 2,
                 cursor: 'pointer',
                 bgcolor: index === selectedIndex ? 'primary.light' : 'transparent',
                 color: index === selectedIndex ? 'primary.contrastText' : 'inherit',
                 '&:hover': {
                   bgcolor: index === selectedIndex ? 'primary.main' : 'action.hover',
                 }
               }}
             >
              <ListItemAvatar>
                <Avatar
                  src={user.avatar_url}
                  sx={{ width: 32, height: 32 }}
                >
                  {getInitials(user.username)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="subtitle2" fontWeight={600}>
                    @{user.username}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {user.email}
                  </Typography>
                }
                sx={{ ml: 1 }}
              />
            </ListItem>
          ))}
        </List>

        {/* Footer */}
        <Box sx={{ p: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Use ↑↓ to navigate, Enter to select, Esc to close
          </Typography>
        </Box>
      </Box>
    </Popover>
  );
}; 