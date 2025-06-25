import React from 'react';
import { Box, Typography, IconButton, CircularProgress, Tooltip } from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';

interface MessageContentProps {
  content: string;
  isEditing: boolean;
  editingContent: string;
  messageId: string;
  failedMessages: Set<string>;
  sendingMessageId: string | null;
  onEditingContentChange: (content: string) => void;
  onEditMessage: () => void;
  onCancelEdit: () => void;
  onContextMenu: (event: React.MouseEvent<HTMLElement>) => void;
  onRetryFailedMessage: (tempId: string) => void;
  onRemoveFailedMessage: (tempId: string) => void;
}

export const MessageContent: React.FC<MessageContentProps> = ({
  content,
  isEditing,
  editingContent,
  messageId,
  failedMessages,
  sendingMessageId,
  onEditingContentChange,
  onEditMessage,
  onCancelEdit,
  onContextMenu,
  onRetryFailedMessage,
  onRemoveFailedMessage,
}) => {
  if (isEditing) {
    return (
      <Box>
        <input
          type="text"
          value={editingContent}
          onChange={(e) => onEditingContentChange(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              onEditMessage();
            } else if (e.key === 'Escape') {
              onCancelEdit();
            }
          }}
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'inherit',
            fontSize: 'inherit',
          }}
          autoFocus
        />
        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
          <button onClick={onEditMessage} style={{ fontSize: '0.8rem' }}>
            Save
          </button>
          <button onClick={onCancelEdit} style={{ fontSize: '0.8rem' }}>
            Cancel
          </button>
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
        {content}
      </Typography>
      
      {/* Message Status Indicators */}
      {messageId.startsWith('temp-') && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          {failedMessages.has(messageId) ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" color="error.main" sx={{ fontSize: '0.7rem' }}>
                Failed to send
              </Typography>
              <Tooltip title="Retry">
                <IconButton 
                  size="small" 
                  onClick={() => onRetryFailedMessage(messageId)}
                  sx={{ p: 0.25 }}
                >
                  <Typography sx={{ fontSize: '0.7rem', cursor: 'pointer', color: 'primary.main' }}>
                    ↻
                  </Typography>
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove">
                <IconButton 
                  size="small" 
                  onClick={() => onRemoveFailedMessage(messageId)}
                  sx={{ p: 0.25 }}
                >
                  <Typography sx={{ fontSize: '0.7rem', cursor: 'pointer', color: 'error.main' }}>
                    ×
                  </Typography>
                </IconButton>
              </Tooltip>
            </Box>
          ) : sendingMessageId === messageId ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CircularProgress size={8} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                Sending...
              </Typography>
            </Box>
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Sending...
            </Typography>
          )}
        </Box>
      )}

      {/* More options button */}
      <IconButton
        size="small"
        sx={{ 
          position: 'absolute', 
          top: 4, 
          right: 4,
          opacity: 0.7,
          '&:hover': { opacity: 1 }
        }}
        onClick={onContextMenu}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
    </>
  );
}; 