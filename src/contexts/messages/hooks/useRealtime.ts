import { User } from "@supabase/auth-helpers-react";
import { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useRef, useCallback } from "react";
import { Message, TypingUser } from "../types/messageTypes";

interface UseRealtimeProps {
  supabase: SupabaseClient;
  user: User | null;
  currentGroupId: string | null;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setSendingMessageId: React.Dispatch<React.SetStateAction<string | null>>;
  updateTypingUsers: (users: TypingUser[]) => void;
}

export const useRealtime = ({
  supabase,
  user,
  currentGroupId,
  setMessages,
  setSendingMessageId,
  updateTypingUsers,
}: UseRealtimeProps) => {
  const channelRef = useRef<any>(null);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stable callback references to prevent unnecessary re-subscriptions
  const stableSetMessages = useCallback(setMessages, []);
  const stableSetSendingMessageId = useCallback(setSendingMessageId, []);
  const stableUpdateTypingUsers = useCallback(updateTypingUsers, []);

  // Enhanced cleanup function
  const cleanupChannel = useCallback(async () => {
    if (channelRef.current) {
      try {
        console.log('🧹 Cleaning up realtime channel...');
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        console.log('✅ Channel cleanup completed');
      } catch (error) {
        console.error('❌ Error during channel cleanup:', error);
      }
    }
  }, [supabase]);

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!user || !currentGroupId) {
      cleanupChannel();
      return;
    }

    console.log(`🔄 Setting up realtime for room: ${currentGroupId}`);

    // Clear any pending cleanup
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    // Cleanup existing channel first with a small delay to prevent race conditions
    const setupNewChannel = async () => {
      await cleanupChannel();
      
      // Small delay to ensure WebSocket cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const channelName = `group:${currentGroupId}`;
      console.log(`📡 Creating new channel: ${channelName}`);

      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `group_id=eq.${currentGroupId}`,
          },
          async (payload) => {
            console.log('📨 New message received:', payload.new.id);
            
            // For messages from current user, try to replace optimistic message first
            if (payload.new.author_id === user.id) {
              let optimisticMessageReplaced = false;

              stableSetMessages((prev) => {
                const updated = prev.map((msg) => {
                  // Match by content and sending state for optimistic updates
                  if (
                    msg.sending &&
                    msg.content === payload.new.content &&
                    msg.author_id === user.id
                  ) {
                    optimisticMessageReplaced = true;
                    return {
                      ...msg,
                      id: payload.new.id,
                      created_at: payload.new.created_at,
                      updated_at: payload.new.updated_at,
                      sending: false,
                      failed: false,
                    };
                  }
                  return msg;
                });
                return updated;
              });

              // Clear sending state if we replaced an optimistic message
              if (optimisticMessageReplaced) {
                stableSetSendingMessageId(null);
                return; // Exit early, no need to fetch
              }
            }

            // For all other cases, check for duplicates and fetch complete data
            let shouldFetch = true;
            stableSetMessages((prev) => {
              const exists = prev.some((msg) => msg.id === payload.new.id);
              if (exists) {
                shouldFetch = false;
                return prev;
              }
              return prev;
            });

            if (shouldFetch) {
              try {
                // Fetch complete message with author info
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
                    ),
                    attachments(
                      id,
                      filename,
                      file_size,
                      mime_type,
                      bucket_path
                    )
                  `
                  )
                  .eq("id", payload.new.id)
                  .single();

                if (error) {
                  console.error("Error fetching complete message:", error);
                  return;
                }

                if (messageData) {
                  const newMessage: Message = {
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

                  stableSetMessages((prev) => {
                    // Final duplicate check before adding
                    if (prev.some((m) => m.id === newMessage.id)) {
                      return prev;
                    }
                    return [...prev, newMessage];
                  });

                  // Clear sending state for own messages (backup)
                  if (payload.new.author_id === user.id) {
                    stableSetSendingMessageId(null);
                  }
                }
              } catch (error) {
                console.error("Error processing new message:", error);
              }
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "messages",
            filter: `group_id=eq.${currentGroupId}`,
          },
          (payload) => {
            console.log('📝 Message updated:', payload.new.id);
            stableSetMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
              )
            );
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "reactions",
          },
          async (payload) => {
            console.log('👍 Reaction event:', payload.eventType);
            // Refetch reactions for the affected message
            if (
              (payload.new as any)?.message_id ||
              (payload.old as any)?.message_id
            ) {
              const messageId =
                (payload.new as any)?.message_id ||
                (payload.old as any)?.message_id;

              try {
                const { data: reactions, error } = await supabase
                  .from("reactions")
                  .select("emoji, user_id, profiles!user_id(username)")
                  .eq("message_id", messageId);

                if (!error && reactions) {
                  // Group reactions by emoji
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

                  // Update message reactions
                  stableSetMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === messageId
                        ? { ...msg, reactions: Object.values(groupedReactions) }
                        : msg
                    )
                  );
                }
              } catch (error) {
                console.error("Error fetching reactions:", error);
              }
            }
          }
        )
        .subscribe((status) => {
          console.log(`🔌 Channel status: ${status}`);
          
          switch (status) {
            case 'SUBSCRIBED':
              console.log('✅ Successfully subscribed to realtime updates');
              break;
            case 'CHANNEL_ERROR':
              console.error('❌ Channel subscription error');
              break;
            case 'TIMED_OUT':
              console.error('⏰ Channel subscription timed out');
              // Retry after a delay
              cleanupTimeoutRef.current = setTimeout(() => {
                setupNewChannel();
              }, 2000);
              break;
            case 'CLOSED':
              console.log('🔒 Channel subscription closed');
              break;
            default:
              console.log(`📡 Channel status: ${status}`);
          }
        });

      channelRef.current = channel;
    };

    setupNewChannel().catch(error => {
      console.error('❌ Error setting up realtime channel:', error);
    });

    return () => {
      console.log('🧹 useRealtime cleanup triggered');
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      cleanupChannel();
    };
  }, [user, currentGroupId, supabase, cleanupChannel, stableSetMessages, stableSetSendingMessageId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      cleanupChannel();
    };
  }, [cleanupChannel]);

  // Set up real-time subscription for typing indicators
  useEffect(() => {
    if (!user || !currentGroupId) return;

    const fetchTypingUsers = async () => {
      try {
        const { data: typingData, error } = await supabase
          .from("typing_indicators")
          .select(
            `
            user_id,
            profiles!user_id(
              username
            )
          `
          )
          .eq("group_id", currentGroupId)
          .neq("user_id", user.id) // Exclude current user
          .gt("expires_at", new Date().toISOString());

        if (error) return;

        if (typingData) {
          const users: TypingUser[] = typingData
            .filter((item) => item.profiles)
            .map((item) => ({
              user_id: item.user_id,
              username: (item.profiles as any).username,
            }));

          stableUpdateTypingUsers(users);
        }
      } catch (error) {
        // Silent fail for typing indicators
      }
    };

    const channel = supabase
      .channel(`typing-${currentGroupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_indicators",
          filter: `group_id=eq.${currentGroupId}`,
        },
        (payload) => {
          // Only fetch if it's not the current user's change
          if (
            (payload.eventType === "INSERT" &&
              payload.new.user_id !== user.id) ||
            (payload.eventType === "DELETE" &&
              payload.old.user_id !== user.id) ||
            payload.eventType === "UPDATE"
          ) {
            fetchTypingUsers();
          }
        }
      )
      .subscribe();

    // Initial fetch
    fetchTypingUsers();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentGroupId, supabase, stableUpdateTypingUsers]);
};
