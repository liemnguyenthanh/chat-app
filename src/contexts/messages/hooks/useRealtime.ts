import { User } from "@supabase/auth-helpers-react";
import { SupabaseClient } from "@supabase/supabase-js";
import { useEffect } from "react";
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
  // Set up real-time subscription for messages
  useEffect(() => {
    if (!user || !currentGroupId) return;

    const channelName = `group:${currentGroupId}`;
    
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
          // For messages from current user, try to replace optimistic message first
          if (payload.new.author_id === user.id) {
            let optimisticMessageReplaced = false;
            
            setMessages((prev) => {
              const updated = prev.map((msg) => {
                // Match by content and sending state for optimistic updates
                if (msg.sending && msg.content === payload.new.content && msg.author_id === user.id) {
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
              setSendingMessageId(null);
              return; // Exit early, no need to fetch
            }
          }

          // For all other cases, check for duplicates and fetch complete data
          let shouldFetch = true;
          setMessages((prev) => {
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

                setMessages((prev) => {
                  // Final duplicate check before adding
                  if (prev.some((m) => m.id === newMessage.id)) {
                    return prev;
                  }
                  return [...prev, newMessage];
                });

                // Clear sending state for own messages (backup)
                if (payload.new.author_id === user.id) {
                  setSendingMessageId(null);
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
          setMessages((prev) =>
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
          // Refetch reactions for the affected message
          if ((payload.new as any)?.message_id || (payload.old as any)?.message_id) {
            const messageId = (payload.new as any)?.message_id || (payload.old as any)?.message_id;
            
            try {
              const { data: reactions, error } = await supabase
                .from('reactions')
                .select('emoji, user_id, profiles!user_id(username)')
                .eq('message_id', messageId);
                
              if (!error && reactions) {
                // Group reactions by emoji
                const groupedReactions = reactions.reduce((acc: any, reaction: any) => {
                  const emoji = reaction.emoji;
                  if (!acc[emoji]) {
                    acc[emoji] = { emoji, count: 0, users: [] };
                  }
                  acc[emoji].count++;
                  acc[emoji].users.push(reaction.user_id);
                  return acc;
                }, {});
                
                // Update message reactions
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === messageId 
                      ? { ...msg, reactions: Object.values(groupedReactions) }
                      : msg
                  )
                );
              }
            } catch (error) {
              console.error('Error fetching reactions:', error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentGroupId, supabase, setMessages, setSendingMessageId]);

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
          
          updateTypingUsers(users);
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
            (payload.eventType === 'INSERT' && payload.new.user_id !== user.id) ||
            (payload.eventType === 'DELETE' && payload.old.user_id !== user.id) ||
            (payload.eventType === 'UPDATE')
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
  }, [user, currentGroupId, supabase, updateTypingUsers]);
};
