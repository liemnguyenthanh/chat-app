import { User } from "@supabase/auth-helpers-react";
import { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useRef, useCallback, useState } from "react";
import { Message } from "../types/messageTypes";
import { useRoomsContext } from "../../RoomsContext";

interface UseGlobalRealtimeProps {
  supabase: SupabaseClient;
  user: User | null;
  currentGroupId: string | null;
  onGlobalMessageUpdate?: (message: Message) => void;
  onGlobalReactionUpdate?: (messageId: string, reactions: any[]) => void;
  onRoomListUpdate?: () => void;
}

export const useGlobalRealtime = ({
  supabase,
  user,
  currentGroupId,
  onGlobalMessageUpdate,
  onGlobalReactionUpdate,
  onRoomListUpdate,
}: UseGlobalRealtimeProps) => {
  const globalChannelRef = useRef<any>(null);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { updateRoomLastMessage } = useRoomsContext();

  // Stable callback references
  const stableOnGlobalMessageUpdate = useRef(onGlobalMessageUpdate);
  const stableOnGlobalReactionUpdate = useRef(onGlobalReactionUpdate);
  const stableOnRoomListUpdate = useRef(onRoomListUpdate);

  // Update refs when props change
  useEffect(() => {
    stableOnGlobalMessageUpdate.current = onGlobalMessageUpdate;
    stableOnGlobalReactionUpdate.current = onGlobalReactionUpdate;
    stableOnRoomListUpdate.current = onRoomListUpdate;
  }, [onGlobalMessageUpdate, onGlobalReactionUpdate, onRoomListUpdate]);

  // Cleanup function
  const cleanupGlobalChannel = useCallback(async () => {
    try {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
        cleanupTimeoutRef.current = null;
      }

      if (globalChannelRef.current) {
        console.log('🧹 Cleaning up global channel...');
        await supabase.removeChannel(globalChannelRef.current);
        globalChannelRef.current = null;
      }
    } catch (error) {
      if (error instanceof Error && error.message !== 'Channel does not exist') {
        console.error('❌ Error during global channel cleanup:', error);
      }
    }
  }, [supabase]);

  // Helper function to fetch complete message data
  const fetchMessageData = useCallback(async (messageId: string): Promise<Message | null> => {
    try {
      const { data: messageData, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          author:profiles!author_id(
            id,
            username,
            full_name,
            avatar_url
          )
        `
        )
        .eq("id", messageId)
        .single();

      if (error || !messageData) {
        return null;
      }

      return {
        id: messageData.id,
        group_id: messageData.group_id,
        author_id: messageData.author_id,
        content: messageData.content,
        data: messageData.data,
        reply_to: messageData.reply_to,
        thread_id: messageData.thread_id,
        message_type: messageData.message_type,
        created_at: messageData.created_at,
        updated_at: messageData.updated_at,
        deleted: messageData.deleted,
        deleted_at: messageData.deleted_at,
        author: {
          id: messageData.author.id,
          username: messageData.author.username,
          full_name: messageData.author.full_name,
          avatar_url: messageData.author.avatar_url,
        },
        reactions: [],
      };
    } catch (error) {
      console.error("Error fetching message data:", error);
      return null;
    }
  }, [supabase]);

  // Helper function to handle global message events
  const handleGlobalMessage = useCallback(async (payload: any) => {
    console.log('🌍📨 Global message received:', payload.new.id, 'in group:', payload.new.group_id);
    
    // Skip if this is for the current active group (handled by active conversation hook)
    if (payload.new.group_id === currentGroupId) {
      console.log('⏭️ Skipping message for current group - handled by active conversation');
      return;
    }

    // Fetch complete message data for global update
    const globalMessage = await fetchMessageData(payload.new.id);
    if (globalMessage && globalMessage.content) {
      // Update global message state for notifications
      stableOnGlobalMessageUpdate.current?.(globalMessage);
      
      // Update room last message efficiently without full refresh
      updateRoomLastMessage(
        globalMessage.group_id,
        globalMessage.content,
        globalMessage.created_at
      );
    }
  }, [currentGroupId, fetchMessageData, updateRoomLastMessage]);

  // Helper function to handle global reaction events
  const handleGlobalReaction = useCallback(async (payload: any) => {
    console.log('🌍👍 Global reaction event:', payload.eventType);
    const messageId = (payload.new as any)?.message_id || (payload.old as any)?.message_id;
    
    if (!messageId) return;

    try {
      const { data: reactions, error } = await supabase
        .from("reactions")
        .select("emoji, user_id, profiles!user_id(username)")
        .eq("message_id", messageId);

      if (!error && reactions) {
        const groupedReactions = reactions.reduce(
          (acc: any, reaction: any) => {
            const emoji = reaction.emoji;
            if (!acc[emoji]) {
              acc[emoji] = { emoji, count: 0, users: [] };
            }
            acc[emoji].count++;
            acc[emoji].users.push(reaction.user_id);
            return acc;
          },
          {}
        );

        const reactionArray = Object.values(groupedReactions) as { emoji: string; count: number; users: string[]; }[];
        stableOnGlobalReactionUpdate.current?.(messageId, reactionArray);
      }
    } catch (error) {
      console.error("Error fetching global reactions:", error);
    }
  }, [supabase]);

  // Set up GLOBAL real-time subscription
  useEffect(() => {
    if (!user) {
      cleanupGlobalChannel();
      return;
    }

    console.log(`🌍 Setting up GLOBAL realtime for user: ${user.id}`);

    const setupGlobalChannel = async () => {
      await cleanupGlobalChannel();
      
      // Small delay to ensure WebSocket cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const channelName = `global-user:${user.id}`;
      console.log(`📡 Creating global channel: ${channelName}`);

      const channel = supabase
        .channel(channelName)
        // Listen to ALL messages (RLS will filter by user's groups)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            // No filter - RLS policies will handle security
          },
          handleGlobalMessage
        )
        // Listen to ALL message updates for potential room list updates
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "messages",
          },
          (payload) => {
            console.log('🌍📝 Global message updated:', payload.new.id);
            // Skip message updates - room last message is handled by updateRoomLastMessage
            // No need to trigger full room list refresh for message updates
          }
        )
        // Listen to ALL reactions (RLS will filter)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "reactions",
          },
          handleGlobalReaction
        )
        // Listen to group membership changes (for room list updates)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "group_members",
          },
          (payload) => {
            console.log('🌍👥 Global group membership change:', payload.eventType);
            // Only trigger room list update when user joins/leaves groups
            // This is necessary as it affects which rooms the user can see
            if (payload.eventType === "INSERT" || payload.eventType === "DELETE") {
              stableOnRoomListUpdate.current?.();
            }
          }
        )
        // Listen to group changes (name updates, etc.)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "groups",
          },
          (payload) => {
            console.log('🌍🏠 Global group updated:', payload.new.id);
            // Only trigger for significant changes like name updates
            // Room list needs to refresh to show updated group names
            stableOnRoomListUpdate.current?.();
          }
        )
        // Listen to group creation (moved from RoomsContext)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "groups",
          },
          (payload) => {
            console.log('🌍🏠 New group created:', payload.new.id);
            // Trigger room list update for new groups
            stableOnRoomListUpdate.current?.();
          }
        )
        // Listen to invitation changes (for notifications)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "invitations",
          },
          (payload) => {
            console.log('🌍✉️ Global invitation event:', payload.eventType);
            // Could trigger invitation notifications here
            if (payload.eventType === "INSERT" && payload.new.invitee_id === user.id) {
              console.log('📬 New invitation received!');
              // TODO: Trigger notification system
            }
          }
        )
        .subscribe((status) => {
          console.log(`🌍🔌 Global channel status: ${status}`);
          
          switch (status) {
            case 'SUBSCRIBED':
              console.log('✅ Successfully subscribed to GLOBAL realtime updates');
              break;
            case 'CHANNEL_ERROR':
              console.error('❌ Global channel subscription error');
              break;
            case 'TIMED_OUT':
              console.error('⏰ Global channel subscription timed out');
              // Retry after a delay
              cleanupTimeoutRef.current = setTimeout(() => {
                setupGlobalChannel();
              }, 2000);
              break;
            case 'CLOSED':
              console.log('🔒 Global channel subscription closed');
              break;
          }
        });

      globalChannelRef.current = channel;
    };

    setupGlobalChannel().catch(error => {
      console.error('❌ Error setting up global realtime channel:', error);
    });

    return () => {
      console.log('🧹 Global realtime cleanup triggered');
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      cleanupGlobalChannel();
    };
  }, [
    user, 
    supabase, 
    currentGroupId,
    cleanupGlobalChannel, 
    handleGlobalMessage, 
    handleGlobalReaction,
    stableOnRoomListUpdate
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      cleanupGlobalChannel();
    };
  }, [cleanupGlobalChannel]);

  // Return any useful data or functions that consumers might need
  return {
    isConnected: !!globalChannelRef.current,
  };
}; 