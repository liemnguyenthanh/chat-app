import React, { useState, useEffect, useCallback } from 'react';
import {
  IconButton,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Chip,
} from '@mui/material';
import {
  Drafts as DraftsIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

interface MessageDraft {
  id: string;
  content: string;
  roomId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MessageDraftsProps {
  roomId: string;
  onDraftSelect: (content: string) => void;
  disabled?: boolean;
}

export const MessageDrafts: React.FC<MessageDraftsProps> = ({
  roomId,
  onDraftSelect,
  disabled = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [drafts, setDrafts] = useState<MessageDraft[]>([]);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Load drafts from localStorage on component mount
  useEffect(() => {
    loadDrafts();
  }, [roomId]);

  const loadDrafts = useCallback(() => {
    try {
      const storedDrafts = localStorage.getItem(`message_drafts_${roomId}`);
      if (storedDrafts) {
        const parsedDrafts = JSON.parse(storedDrafts).map((draft: any) => ({
          ...draft,
          createdAt: new Date(draft.createdAt),
          updatedAt: new Date(draft.updatedAt),
        }));
        setDrafts(parsedDrafts);
      }
    } catch (error) {
      console.error('Error loading drafts:', error);
    }
  }, [roomId]);

  const saveDraft = useCallback((content: string) => {
    if (!content.trim()) return;

    const newDraft: MessageDraft = {
      id: Date.now().toString(),
      content: content.trim(),
      roomId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedDrafts = [newDraft, ...drafts].slice(0, 10); // Keep only 10 most recent drafts
    setDrafts(updatedDrafts);

    try {
      localStorage.setItem(`message_drafts_${roomId}`, JSON.stringify(updatedDrafts));
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, [drafts, roomId]);

  const deleteDraft = useCallback((draftId: string) => {
    const updatedDrafts = drafts.filter(draft => draft.id !== draftId);
    setDrafts(updatedDrafts);

    try {
      localStorage.setItem(`message_drafts_${roomId}`, JSON.stringify(updatedDrafts));
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  }, [drafts, roomId]);

  const handleDraftSelect = useCallback((draft: MessageDraft) => {
    onDraftSelect(draft.content);
    handleClose();
  }, [onDraftSelect]);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const truncateContent = (content: string, maxLength: number = 50) => {
    return content.length > maxLength ? `${content.slice(0, maxLength)}...` : content;
  };

  // Expose saveDraft function to parent components
  React.useImperativeHandle(React.createRef(), () => ({
    saveDraft,
  }), [saveDraft]);

  return (
    <>
      <IconButton
        onClick={handleClick}
        disabled={disabled || drafts.length === 0}
        size="small"
        sx={{
          color: drafts.length > 0 ? 'primary.main' : 'text.secondary',
          '&:hover': {
            color: 'primary.main',
            bgcolor: 'action.hover',
          }
        }}
      >
        <DraftsIcon />
        {drafts.length > 0 && (
          <Chip
            size="small"
            label={drafts.length}
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              minWidth: 16,
              height: 16,
              fontSize: '0.7rem',
              bgcolor: 'primary.main',
              color: 'white',
            }}
          />
        )}
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
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
            width: 350,
            maxHeight: 400,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <DraftsIcon />
            Message Drafts
          </Typography>

          {drafts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No drafts saved yet
              </Typography>
            </Box>
          ) : (
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {drafts.map((draft, index) => (
                <React.Fragment key={draft.id}>
                                   <ListItem
                   onClick={() => handleDraftSelect(draft)}
                   sx={{
                     borderRadius: 1,
                     mb: 1,
                     cursor: 'pointer',
                     '&:hover': {
                       bgcolor: 'action.hover',
                     }
                   }}
                 >
                    <ListItemText
                      primary={truncateContent(draft.content)}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <ScheduleIcon sx={{ fontSize: '0.8rem' }} />
                          <Typography variant="caption">
                            {formatTimestamp(draft.updatedAt)}
                          </Typography>
                        </Box>
                      }
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontSize: '0.875rem',
                          fontWeight: 500,
                        }
                      }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDraft(draft.id);
                        }}
                        sx={{
                          color: 'text.secondary',
                          '&:hover': {
                            color: 'error.main',
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < drafts.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
}; 