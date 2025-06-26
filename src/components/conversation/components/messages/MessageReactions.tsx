import React from "react";
import { Box, Chip, Typography } from "@mui/material";
import { useUser } from "@supabase/auth-helpers-react";

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

interface MessageReactionsProps {
  reactions: Reaction[];
  isOwnMessage: boolean;
  onReaction: (emoji: string) => void;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  isOwnMessage,
  onReaction,
}) => {
  const user = useUser();

  if (!reactions || reactions.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.5,
        border: 1,
        borderColor: "divider",
        alignItems: "center",
        borderRadius: 1,
        p: 0.5,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        justifyContent: isOwnMessage ? "flex-end" : "flex-start",
        width: "fit-content",
      }}
    >
      {reactions.slice(0, 3).map((reaction) => (
        <Box
          key={reaction.emoji}
          sx={{
            borderRadius: "50%",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          {reaction.emoji}
        </Box>
      ))}
      <Typography fontSize={12} color="text.primary">
        {reactions.reduce((sum, reaction) => sum + reaction.count, 0)}
      </Typography>
    </Box>
  );
};
