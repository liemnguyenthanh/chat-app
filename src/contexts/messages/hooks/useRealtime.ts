import { User } from "@supabase/auth-helpers-react";
import { SupabaseClient } from "@supabase/supabase-js";
import { Message, TypingUser } from "../types/messageTypes";
import { useActiveConversationRealtime } from "./useActiveConversationRealtime";
import { useGlobalRealtime } from "./useGlobalRealtime";

interface UseRealtimeProps {
  supabase: SupabaseClient;
  user: User | null;
  currentGroupId: string | null;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setSendingMessageId: React.Dispatch<React.SetStateAction<string | null>>;
  updateTypingUsers: (users: TypingUser[]) => void;
  // Global update callbacks
  onGlobalMessageUpdate?: (message: Message) => void;
  onGlobalReactionUpdate?: (messageId: string, reactions: any[]) => void;
  onRoomListUpdate?: () => void;
}

/**
 * Main coordinator hook for real-time functionality
 * 
 * This hook combines:
 * - Active conversation realtime (current group messages, typing, reactions)
 * - Global realtime (cross-room notifications, room list updates)
 * 
 * Benefits of this architecture:
 * - Clear separation of concerns
 * - Easy to test individual parts
 * - Reusable global hook for other components
 * - Better performance through targeted subscriptions
 */
export const useRealtime = ({
  supabase,
  user,
  currentGroupId,
  setMessages,
  setSendingMessageId,
  updateTypingUsers,
  onGlobalMessageUpdate,
  onGlobalReactionUpdate,
  onRoomListUpdate,
}: UseRealtimeProps) => {
  // Set up active conversation realtime
  // Handles: current group messages, typing indicators, reactions
  useActiveConversationRealtime({
    supabase,
    user,
    currentGroupId,
    setMessages,
    setSendingMessageId,
    updateTypingUsers,
  });

  // Set up global realtime
  // Handles: cross-room notifications, room list updates, global events
  const globalRealtime = useGlobalRealtime({
    supabase,
    user,
    currentGroupId,
    onGlobalMessageUpdate,
    onGlobalReactionUpdate,
    onRoomListUpdate,
  });

  // Return status information
  return {
    isGlobalConnected: globalRealtime.isConnected,
  };
};
