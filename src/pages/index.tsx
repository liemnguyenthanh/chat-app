import React, { useState } from "react";
import { Typography, Box, Paper, Button } from "@mui/material";
import { Chat as ChatIcon, Add as AddIcon } from "@mui/icons-material";
import { ChatLayout } from "@/components/layout";
import { RequireAuth } from "@/components/auth";

export default function Home() {
  const [createRoomOpen, setCreateRoomOpen] = useState(false);

  const handleCreateRoomOpen = () => {
    setCreateRoomOpen(true);
  };

  const handleCreateRoomClose = () => {
    setCreateRoomOpen(false);
  };

  return (
    <RequireAuth>
      <ChatLayout openCreateRoom={createRoomOpen} onCreateRoomClose={handleCreateRoomClose}>
        <Box
          sx={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 4,
            background: "linear-gradient(135deg, #0f0f23 0%, #1a1a3a 100%)",
          }}
        >
          <Paper
            sx={{
              p: 6,
              textAlign: "center",
              maxWidth: 500,
              backgroundColor: "#1a1a3a",
              backgroundImage: "none",
              border: "1px solid #2d3748",
              borderRadius: 3,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
            }}
          >
            <ChatIcon
              sx={{
                fontSize: 80,
                color: "primary.main",
                mb: 3,
                filter: "drop-shadow(0 4px 12px rgba(102, 126, 234, 0.3))",
              }}
            />
            <Typography 
              variant="h4" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                color: "text.primary",
                mb: 2,
              }}
            >
              Welcome to Berally Chat! 👋
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 4, 
                lineHeight: 1.6,
                color: "text.secondary",
                maxWidth: 400,
                margin: "0 auto 2rem auto",
              }}
            >
              Connect with your team in real-time. Select a room from the sidebar to start chatting,
              or create a new room to begin a conversation.
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              size="large"
              onClick={handleCreateRoomOpen}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                borderRadius: 2,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  background: "linear-gradient(135deg, #8fa4f3 0%, #9575cd 100%)",
                  boxShadow: "0 6px 16px rgba(102, 126, 234, 0.4)",
                  transform: "translateY(-2px)",
                },
                "&:active": {
                  transform: "translateY(0)",
                },
              }}
            >
              Create New Room
            </Button>
            
            <Box 
              sx={{ 
                mt: 4, 
                pt: 3, 
                borderTop: "1px solid #2d3748",
              }}
            >
              <Typography 
                variant="caption" 
                sx={{
                  color: "text.secondary",
                  fontSize: "0.875rem",
                  opacity: 0.8,
                }}
              >
                💡 Tip: Use the + button in the sidebar to quickly create new rooms
              </Typography>
            </Box>
          </Paper>
        </Box>
      </ChatLayout>
    </RequireAuth>
  );
}
