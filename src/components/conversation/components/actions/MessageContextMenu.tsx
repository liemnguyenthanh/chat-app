import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Reply as ReplyIcon,
  ContentCopy as ContentCopyIcon,
  PushPin as PushPinIcon,
  Forward as ForwardIcon,
  CheckBox as SelectIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface MessageContextMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onMenuItemClick: (action: string) => void;
  isOwnMessage?: boolean;
}

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  anchorEl,
  open,
  onClose,
  onMenuItemClick,
  isOwnMessage = false,
}) => {
  const handleItemClick = (action: string) => {
    onMenuItemClick(action);
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          minWidth: 160,
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          '& .MuiMenuItem-root': {
            py: 1.5,
            px: 2,
            fontSize: '0.875rem',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            },
          },
          '& .MuiListItemIcon-root': {
            color: 'white',
            minWidth: 36,
          },
        },
      }}
      transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
    >
      <MenuItem onClick={() => handleItemClick('reply')}>
        <ListItemIcon>
          <ReplyIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Reply</ListItemText>
      </MenuItem>
      
      <MenuItem onClick={() => handleItemClick('copy')}>
        <ListItemIcon>
          <ContentCopyIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Copy Text</ListItemText>
      </MenuItem>
      
      <MenuItem onClick={() => handleItemClick('pin')}>
        <ListItemIcon>
          <PushPinIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Pin</ListItemText>
      </MenuItem>
      
      <MenuItem onClick={() => handleItemClick('forward')}>
        <ListItemIcon>
          <ForwardIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Forward</ListItemText>
      </MenuItem>
      
      <MenuItem onClick={() => handleItemClick('select')}>
        <ListItemIcon>
          <SelectIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Select</ListItemText>
      </MenuItem>
      
      {isOwnMessage && (
        <>
          <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
          <MenuItem onClick={() => handleItemClick('delete')}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </>
      )}
    </Menu>
  );
}; 