import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from '@mui/material';
import {
  Reply as ReplyIcon,
  ContentCopy as CopyIcon,
  PushPin as PinIcon,
  Forward as ForwardIcon,
  CheckBoxOutlineBlank as SelectIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Report as ReportIcon,
  Bookmark as BookmarkIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { Message } from '@/contexts/messages/MessagesContext';

interface MessageMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  message: Message;
  isOwnMessage: boolean;
  onAction: (action: string) => void;
}

export const MessageMenu: React.FC<MessageMenuProps> = ({
  anchorEl,
  open,
  onClose,
  message,
  isOwnMessage,
  onAction,
}) => {
  const handleAction = (action: string) => {
    onAction(action);
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
          minWidth: 200,
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {/* Core Actions */}
      <MenuItem onClick={() => handleAction('reply')}>
        <ListItemIcon sx={{ color: 'white' }}>
          <ReplyIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Reply" />
      </MenuItem>

      <MenuItem onClick={() => handleAction('copy')}>
        <ListItemIcon sx={{ color: 'white' }}>
          <CopyIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Copy Text" />
      </MenuItem>

      <MenuItem onClick={() => handleAction('pin')}>
        <ListItemIcon sx={{ color: 'white' }}>
          <PinIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Pin Message" />
      </MenuItem>

      <MenuItem onClick={() => handleAction('forward')}>
        <ListItemIcon sx={{ color: 'white' }}>
          <ForwardIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Forward" />
      </MenuItem>

      <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />

      {/* Extended Actions */}
      <MenuItem onClick={() => handleAction('select')}>
        <ListItemIcon sx={{ color: 'white' }}>
          <SelectIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Select" />
      </MenuItem>

      <MenuItem onClick={() => handleAction('bookmark')}>
        <ListItemIcon sx={{ color: 'white' }}>
          <BookmarkIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Save Message" />
      </MenuItem>

      <MenuItem onClick={() => handleAction('share')}>
        <ListItemIcon sx={{ color: 'white' }}>
          <ShareIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Share" />
      </MenuItem>

      <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />

      {/* Own Message Actions */}
      {isOwnMessage && (
        <>
          <MenuItem onClick={() => handleAction('edit')}>
            <ListItemIcon sx={{ color: 'white' }}>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Edit" />
          </MenuItem>

          <MenuItem 
            onClick={() => handleAction('delete')}
            sx={{ 
              '&:hover': { 
                bgcolor: 'rgba(244, 67, 54, 0.2)' 
              } 
            }}
          >
            <ListItemIcon sx={{ color: '#f44336' }}>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Delete" 
              sx={{ color: '#f44336' }}
            />
          </MenuItem>
        </>
      )}

      {/* Other User's Message Actions */}
      {!isOwnMessage && (
        <MenuItem 
          onClick={() => handleAction('report')}
          sx={{ 
            '&:hover': { 
              bgcolor: 'rgba(255, 152, 0, 0.2)' 
            } 
          }}
        >
          <ListItemIcon sx={{ color: '#ff9800' }}>
            <ReportIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Report" 
            sx={{ color: '#ff9800' }}
          />
        </MenuItem>
      )}
    </Menu>
  );
}; 