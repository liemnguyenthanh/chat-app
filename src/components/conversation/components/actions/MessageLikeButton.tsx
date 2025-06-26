import React, { useState } from "react";
import { Box, Fade, Tooltip, Popover, IconButton } from "@mui/material";
import { ThumbUp, ThumbUpOutlined } from "@mui/icons-material";
import { Message } from "@/contexts/messages/MessagesContext";

interface MessageLikeButtonProps {
  message: Message;
  show: boolean;
  onReaction: (emoji: string) => void;
  isReacted?: boolean;
  isOwnMessage?: boolean;
}
const reactions = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export const MessageLikeButton: React.FC<MessageLikeButtonProps> = ({
  message,
  show,
  onReaction,
  isReacted = false,
  isOwnMessage = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [likeHover, setLikeHover] = useState(false);

  const handleLikeClick = () => {
    onReaction("👍");
  };

  const handleLikeHover = (event: React.MouseEvent<HTMLElement>) => {
    setLikeHover(true);
    setAnchorEl(event.currentTarget);
  };

  const handleLikeLeave = () => {
    setLikeHover(false);
    // Delay hiding the picker to allow interaction
    setTimeout(() => {
      if (!likeHover) {
        setAnchorEl(null);
      }
    }, 200);
  };

  const handleReactionSelect = (emoji: string) => {
    onReaction(emoji);
    setAnchorEl(null);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setLikeHover(false);
  };

  const open = Boolean(anchorEl);

  return (
    <Box sx={{ position: "relative" }}>
      <Fade in={show}>
        <Box>
          <Tooltip title={isReacted ? "Unlike" : "Like"} arrow>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                bgcolor: "rgba(0, 0, 0, 0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.8)",
                  transform: "scale(1.1)",
                },
              }}
              onClick={handleLikeClick}
              onMouseEnter={handleLikeHover}
              onMouseLeave={handleLikeLeave}
            >
              {isReacted ? (
                <ThumbUp sx={{ fontSize: 12, color: "#1976d2" }} />
              ) : (
                <ThumbUpOutlined sx={{ fontSize: 12, color: "white" }} />
              )}
            </Box>
          </Tooltip>

          {/* Reaction Picker Popover */}
          <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handlePopoverClose}
            anchorOrigin={{
              vertical: "top",
              horizontal: "center",
            }}
            transformOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
            onMouseEnter={() => setLikeHover(true)}
            onMouseLeave={handleLikeLeave}
            sx={{
              "& .MuiPopover-paper": {
                bgcolor: "rgba(255, 255, 255, 0.95)",
                borderRadius: 3,
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                p: 1,
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 0.5,
                alignItems: "center",
              }}
            >
              {reactions.map((emoji, index) => (
                <IconButton
                  key={index}
                  size="small"
                  onClick={() => handleReactionSelect(emoji)}
                  sx={{
                    fontSize: 20,
                    minWidth: 36,
                    minHeight: 36,
                    borderRadius: 2,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      bgcolor: "rgba(0, 0, 0, 0.04)",
                      transform: "scale(1.2)",
                    },
                  }}
                >
                  {emoji}
                </IconButton>
              ))}
            </Box>
          </Popover>
        </Box>
      </Fade>
    </Box>
  );
};
