import React from "react";
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Tooltip,
} from "@mui/material";

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
  const isFailed = failedMessages.has(messageId);
  const isSending = sendingMessageId === messageId;

  if (isEditing) {
    return (
      <Box sx={{ width: "100%" }}>
        <textarea
          value={editingContent}
          onChange={(e) => onEditingContentChange(e.target.value)}
          style={{
            width: "100%",
            minHeight: "60px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "8px",
            fontFamily: "inherit",
            fontSize: "inherit",
            resize: "vertical",
          }}
          autoFocus
        />
        <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
          <button onClick={onEditMessage} style={{ padding: "4px 8px" }}>
            Save
          </button>
          <button onClick={onCancelEdit} style={{ padding: "4px 8px" }}>
            Cancel
          </button>
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Typography
        variant="body2"
        sx={{
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
          position: "relative",
          color: "text.primary",
          ...(isFailed && {
            color: "error.main",
            fontStyle: "italic",
          }),
        }}
      >
        {content}
        {isSending && (
          <CircularProgress
            size={16}
            sx={{
              ml: 1,
              verticalAlign: "middle",
              color: "text.secondary",
            }}
          />
        )}
      </Typography>

      {/* Failed message actions */}
      {isFailed && (
        <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
          <Tooltip title="Retry sending">
            <IconButton
              size="small"
              onClick={() => onRetryFailedMessage(messageId)}
              sx={{ color: "warning.main" }}
            >
              🔄
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove message">
            <IconButton
              size="small"
              onClick={() => onRemoveFailedMessage(messageId)}
              sx={{ color: "error.main" }}
            >
              ❌
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </>
  );
};
