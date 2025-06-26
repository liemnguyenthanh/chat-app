import { Message } from "@/contexts/messages/MessagesContext";
import {
  IosShare as ForwardIcon,
  MoreHoriz as MoreIcon,
  Reply as ReplyIcon,
} from "@mui/icons-material";
import { Box, Fade, IconButton, Tooltip } from "@mui/material";
import React, { useCallback } from "react";

// Constants for better maintainability
const BUTTON_SIZE = 24;
const ICON_SIZE = 12;
const ANIMATION_DURATION = 200;

// Common styles extracted for reusability
const buttonBaseStyles = {
  width: BUTTON_SIZE,
  height: BUTTON_SIZE,
  borderRadius: "50%",
  bgcolor: "rgba(148, 148, 148, 0.2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: `all ${ANIMATION_DURATION}ms ease-in-out`,
  "&:hover": {
    bgcolor: "rgba(0, 0, 0, 0.8)",
    transform: "scale(1.1)",
  },
  "&:focus": {
    outline: "2px solid #fff",
    outlineOffset: "2px",
  },
} as const;

const iconStyles = {
  fontSize: ICON_SIZE,
  color: "white",
} as const;

// Types
interface ActionItem {
  icon: React.ReactElement;
  tooltip: string;
  onClick: (event?: React.MouseEvent<HTMLElement>) => void;
  testId: string;
}

interface MessageHoverActionsProps {
  message: Message;
  show: boolean;
  onReply: (message: Message) => void;
  onForward: (message: Message) => void;
  onMoreActions: (event: React.MouseEvent<HTMLElement>) => void;
  isOwnMessage?: boolean;
}

// Reusable ActionButton component
interface ActionButtonProps {
  icon: React.ReactElement;
  tooltip: string;
  onClick: (event?: React.MouseEvent<HTMLElement>) => void;
  testId: string;
}

const ActionButton: React.FC<ActionButtonProps> = React.memo(({
  icon,
  tooltip,
  onClick,
  testId,
}) => {
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    onClick(event);
  };

  return (
    <Tooltip title={tooltip} arrow>
      <IconButton
        size="small"
        onClick={handleClick}
        data-testid={testId}
        sx={buttonBaseStyles}
        aria-label={tooltip}
      >
        {React.cloneElement(icon, { sx: iconStyles })}
      </IconButton>
    </Tooltip>
  );
});

ActionButton.displayName = "ActionButton";

// Main component
export const MessageHoverActions: React.FC<MessageHoverActionsProps> = React.memo(({
  message,
  show,
  onReply,
  onForward,
  onMoreActions,
  isOwnMessage = false,
}) => {
  // Memoized event handlers to prevent unnecessary re-renders
  const handleReply = useCallback(() => {
    onReply(message);
  }, [onReply, message]);

  const handleForward = useCallback(() => {
    onForward(message);
  }, [onForward, message]);

  const handleMoreActions = useCallback((event?: React.MouseEvent<HTMLElement>) => {
    if (event) {
      onMoreActions(event);
    }
  }, [onMoreActions]);

  // Actions configuration for better maintainability
  const actions: ActionItem[] = [
    {
      icon: <ReplyIcon />,
      tooltip: "Reply",
      onClick: handleReply,
      testId: "reply-button",
    },
    {
      icon: <ForwardIcon />,
      tooltip: "Forward",
      onClick: handleForward,
      testId: "forward-button",
    },
    {
      icon: <MoreIcon />,
      tooltip: "More actions",
      onClick: handleMoreActions,
      testId: "more-actions-button",
    },
  ];

  return (
    <Fade in={show} timeout={ANIMATION_DURATION}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          flexShrink: 0,
          padding: 0.5,
          borderRadius: 1,
          backgroundColor: "transparent",
        }}
        role="toolbar"
        aria-label="Message actions"
      >
        {actions.map((action) => (
          <ActionButton
            key={action.testId}
            icon={action.icon}
            tooltip={action.tooltip}
            onClick={action.onClick}
            testId={action.testId}
          />
        ))}
      </Box>
    </Fade>
  );
});

MessageHoverActions.displayName = "MessageHoverActions";
