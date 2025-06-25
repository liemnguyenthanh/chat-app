import React, { useState } from "react";
import { Typography, Box, Paper, Button, Stack } from "@mui/material";
import { Chat as ChatIcon, Add as AddIcon, People as PeopleIcon } from "@mui/icons-material";
import { ChatLayout } from "@/components/layout";
import { RequireAuth } from "@/components/auth";
import Link from "next/link";

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
          }}
        >
          <Paper
            sx={{
              p: 6,
              textAlign: "center",
              maxWidth: 500,
              background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <ChatIcon
              sx={{
                fontSize: 80,
                color: "primary.main",
                mb: 3,
              }}
            />
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
              Welcome to Berally Chat! 👋
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
              Connect with your team in real-time. Select a room from the sidebar to start chatting,
              or create a new room to begin a conversation.
            </Typography>
            
            <Stack spacing={2} direction={{ xs: "column", sm: "row" }} justifyContent="center">
              <Link href="/rooms/general" passHref legacyBehavior>
                <Button
                  component="a"
                  variant="contained"
                  startIcon={<PeopleIcon />}
                  size="large"
                  sx={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                    },
                  }}
                >
                  Join General Room
                </Button>
              </Link>
              
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                size="large"
                onClick={handleCreateRoomOpen}
              >
                Create New Room
              </Button>
            </Stack>
            
            <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid", borderColor: "divider" }}>
              <Typography variant="caption" color="text.secondary">
                💡 Tip: Use the + button in the sidebar to quickly create new rooms
              </Typography>
            </Box>
          </Paper>
        </Box>
      </ChatLayout>
    </RequireAuth>
  );
}
