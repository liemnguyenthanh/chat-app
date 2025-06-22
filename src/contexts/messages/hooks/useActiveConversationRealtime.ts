import { User } from "@supabase/auth-helpers-react";
import { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useRef, useCallback } from "react";
import { Message, TypingUser } from "../types/messageTypes";
import { useRoomsContext } from "../../RoomsContext";

interface UseActiveConversationRealtimeProps {
  supabase: SupabaseClient;
  user: User | null;
  currentGroupId: string | null;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setSendingMessageId: React.Dispatch<React.SetStateAction<string | null>>;
  updateTypingUsers: (users: TypingUser[]) => void;
}

export const useActiveConversationRealtime = ({
  supabase,
  user,
  currentGroupId,
  setMessages,
  setSendingMessageId,
  updateTypingUsers,
}: UseActiveConversationRealtimeProps) => {
  const channelRef = useRef<any>(null);
  const typingChannelRef = useRef<any>(null);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { updateRoomLastMessage } = useRoomsContext();

  // Stable references to avoid re-creating subscriptions
  const stableSetMessages = useRef(setMessages);
  const stableSetSendingMessageId = useRef(setSendingMessageId);
  const stableUpdateTypingUsers = useRef(updateTypingUsers);

  // Update refs when props change
  useEffect(() => {
    stableSetMessages.current = setMessages;
    stableSetSendingMessageId.current = setSendingMessageId;
    stableUpdateTypingUsers.current = updateTypingUsers;
  }, [setMessages, setSendingMessageId, updateTypingUsers]);

  // Cleanup functions
  const cleanupChannel = useCallback(async () => {
    try {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
        cleanupTimeoutRef.current = null;
      }

      if (channelRef.current) {
        console.log('🧹 Cleaning up conversation channel...');
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    } catch (error) {
      if (error instanceof Error && error.message !== 'Channel does not exist') {
        console.error('❌ Error during conversation channel cleanup:', error);
      }
    }
  }, [supabase]);

  const cleanupTypingChannel = useCallback(async () => {
    if (typingChannelRef.current) {
      try {
        console.log('🧹 Cleaning up typing channel...');
        await supabase.removeChannel(typingChannelRef.current);
        typingChannelRef.current = null;
        console.log('✅ Typing channel cleanup completed');
      } catch (error) {
        console.error('❌ Error during typing channel cleanup:', error);
      }
    }
  }, [supabase]);

  // Helper function to handle current group messages
  const handleCurrentGroupMessage = useCallback(async (payload: any) => {
    if (!user) return;
    
    console.log('📨 Current group message received:', payload.new.id);
    
    // For messages from current user, try to replace optimistic message first
    if (payload.new.author_id === user.id) {
      let optimisticMessageReplaced = false;

      stableSetMessages.current((prev) => {
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
        stableSetSendingMessageId.current(null);
        return; // Exit early, no need to fetch
      }
    }

    // For all other cases, check for duplicates and fetch complete data
    let shouldFetch = true;
    stableSetMessages.current((prev) => {
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

          stableSetMessages.current((prev) => {
            // Final duplicate check before adding
            if (prev.some((m) => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });

          // Clear sending state for own messages (backup)
          if (payload.new.author_id === user.id) {
            stableSetSendingMessageId.current(null);
          }

          // Update room last message for current group
          if (currentGroupId && newMessage.content) {
            updateRoomLastMessage(
              currentGroupId,
              newMessage.content,
              newMessage.created_at
            );
          }
        }
      } catch (error) {
        console.error("Error processing current group message:", error);
      }
    }
  }, [user, supabase, currentGroupId, updateRoomLastMessage]);

  // Set up real-time subscription for current conversation
  useEffect(() => {
    if (!user || !currentGroupId) {
      cleanupChannel();
      return;
    }

    console.log(`📱 Setting up active conversation realtime for group: ${currentGroupId}`);

    const setupChannel = async () => {
      await cleanupChannel();
      
      // Small delay to ensure WebSocket cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const channelName = `conversation:${currentGroupId}`;
      console.log(`📡 Creating conversation channel: ${channelName}`);

      const channel = supabase
        .channel(channelName)
        // Listen to messages for current group only
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `group_id=eq.${currentGroupId}`,
          },
          handleCurrentGroupMessage
        )
        // Listen to message updates for current group
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "messages",
            filter: `group_id=eq.${currentGroupId}`,
          },
          (payload) => {
            console.log('📝 Message updated in current group:', payload.new.id);
            stableSetMessages.current((prev) =>
              prev.map((msg) =>
                msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
              )
            );
          }
        )
        // Listen to reactions for messages in current group
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "reactions",
          },
          async (payload) => {
            console.log('👍 Reaction event in current group:', payload.eventType);
            const messageId = (payload.new as any)?.message_id || (payload.old as any)?.message_id;
            
            if (messageId) {
              try {
                // Check if this reaction belongs to a message in current group
                const { data: messageCheck, error: messageError } = await supabase
                  .from("messages")
                  .select("group_id")
                  .eq("id", messageId)
                  .eq("group_id", currentGroupId)
                  .single();

                if (messageError || !messageCheck) return;

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

                  stableSetMessages.current((prev) =>
                    prev.map((msg) =>
                      msg.id === messageId
                        ? { ...msg, reactions: reactionArray }
                        : msg
                    )
                  );
                }
              } catch (error) {
                console.error("Error fetching reactions for current group:", error);
              }
            }
          }
        )
        .subscribe((status) => {
          console.log(`📱🔌 Conversation channel status: ${status}`);
          
          switch (status) {
            case 'SUBSCRIBED':
              console.log('✅ Successfully subscribed to conversation realtime updates');
              break;
            case 'CHANNEL_ERROR':
              console.error('❌ Conversation channel subscription error');
              break;
            case 'TIMED_OUT':
              console.error('⏰ Conversation channel subscription timed out');
              // Retry after a delay
              cleanupTimeoutRef.current = setTimeout(() => {
                setupChannel();
              }, 2000);
              break;
            case 'CLOSED':
              console.log('🔒 Conversation channel subscription closed');
              break;
          }
        });

      channelRef.current = channel;
    };

    setupChannel().catch(error => {
      console.error('❌ Error setting up conversation realtime channel:', error);
    });

    return () => {
      console.log('🧹 Active conversation realtime cleanup triggered');
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      cleanupChannel();
    };
  }, [user, currentGroupId, supabase, cleanupChannel, handleCurrentGroupMessage, stableSetMessages]);

  // Set up real-time subscription for typing indicators
  useEffect(() => {
    if (!user || !currentGroupId) {
      cleanupTypingChannel();
      return;
    }

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

          stableUpdateTypingUsers.current(users);
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

    typingChannelRef.current = channel;

    // Initial fetch
    fetchTypingUsers();

    return () => {
      cleanupTypingChannel();
    };
  }, [user, currentGroupId, supabase, stableUpdateTypingUsers, cleanupTypingChannel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      cleanupChannel();
      cleanupTypingChannel();
    };
  }, [cleanupChannel, cleanupTypingChannel]);
}; 