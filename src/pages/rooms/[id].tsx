import { useRouter } from "next/router";
import Conversation from "@/components/Conversation";
import ChatLayout from "@/components/ChatLayout";
import RequireAuth from "@/components/RequireAuth";

// Mock data removed - now using real-time data from Supabase

export default function RoomPage() {
  const router = useRouter();
  const { id } = router.query;
  const roomId = Array.isArray(id) ? id[0] : id;

  if (!roomId) return null;

  // Messages are now handled by MessagesContext

  return (
    <RequireAuth>
      <ChatLayout>
        <Conversation roomId={roomId as string} roomName={roomId as string} />
      </ChatLayout>
    </RequireAuth>
  );
}