import React from "react";
import { useRouter } from "next/router";
import Conversation from "@/components/conversation";
import { ChatLayout } from "@/components/layout";
import { RequireAuth } from "@/components/auth";
import { useRoomsContext } from "@/contexts/RoomsContext";
import {
  ConversationHeaderSkeleton,
  MessageListSkeleton,
} from "@/components/skeletons";
import { Box } from "@mui/material";

export default function RoomPage() {
  const router = useRouter();
  const { id } = router.query;
  const { rooms, loading: roomsLoading } = useRoomsContext();

  const roomId = Array.isArray(id) ? id[0] : id;
  const room = rooms.find((r) => r.id === roomId);

  if (!roomId) return null;

  return (
    <RequireAuth>
      <ChatLayout>
        {roomsLoading || !room ? (
          <Box
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            <ConversationHeaderSkeleton />
            <MessageListSkeleton />
          </Box>
        ) : (
          <Conversation roomId={roomId as string} roomName={room.name} />
        )}
      </ChatLayout>
    </RequireAuth>
  );
}
