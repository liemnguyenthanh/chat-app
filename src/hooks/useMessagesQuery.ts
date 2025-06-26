import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Message } from '@/contexts/messages/types/messageTypes';

const MESSAGES_PER_PAGE = 50;

// Query keys for consistent caching
export const messagesQueryKeys = {
  all: ['messages'] as const,
  room: (roomId: string) => ['messages', 'room', roomId] as const,
};

export const useMessagesQuery = (roomId: string | null) => {
  const supabase = useSupabaseClient();
  const user = useUser();

  return useInfiniteQuery({
    queryKey: messagesQueryKeys.room(roomId || ''),
    queryFn: async ({ pageParam }: { pageParam: number }): Promise<Message[]> => {
      if (!user || !roomId) {
        return [];
      }

      const { data: messagesData, error } = await supabase
        .from("messages")
        .select(`
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
        `)
        .eq("group_id", roomId)
        .eq("deleted", false)
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + MESSAGES_PER_PAGE - 1);

      if (error) {
        throw new Error(error.message);
      }

      const messages: Message[] = await Promise.all(
        (messagesData || []).map(async (msg: any) => {
          // Handle reply data if exists
          let reply_data = undefined;
          if (msg.reply_to) {
            const { data: replyMessage } = await supabase
              .from("messages")
              .select(`
                id,
                content,
                author_id,
                created_at,
                author:profiles!author_id(
                  id,
                  username,
                  full_name,
                  avatar_url
                )
              `)
              .eq("id", msg.reply_to)
              .single();

            if (replyMessage) {
              const authorData = Array.isArray(replyMessage.author) 
                ? replyMessage.author[0] 
                : replyMessage.author;
              reply_data = {
                id: replyMessage.id,
                content: replyMessage.content,
                author_id: replyMessage.author_id,
                author: {
                  id: authorData.id,
                  username: authorData.username,
                  full_name: authorData.full_name,
                  avatar_url: authorData.avatar_url,
                },
                created_at: replyMessage.created_at,
              };
            }
          }

          return {
            id: msg.id,
            group_id: msg.group_id,
            author_id: msg.author_id,
            content: msg.content,
            data: msg.data,
            reply_to: msg.reply_to,
            reply_data,
            thread_id: msg.thread_id,
            message_type: msg.message_type,
            created_at: msg.created_at,
            updated_at: msg.updated_at,
            deleted: msg.deleted,
            deleted_at: msg.deleted_at,
            author: {
              id: msg.author.id,
              username: msg.author.username,
              full_name: msg.author.full_name,
              avatar_url: msg.author.avatar_url,
            },
            reactions: [],
            attachments: msg.attachments || [],
          };
        })
      );

      // Reverse to get chronological order (oldest first)
      return messages.reverse();
    },
    enabled: !!user && !!roomId,
    initialPageParam: 0,
    getNextPageParam: (lastPage: Message[], allPages: Message[][]) => {
      if (lastPage.length < MESSAGES_PER_PAGE) {
        return undefined; // No more pages
      }
      return allPages.length * MESSAGES_PER_PAGE;
    },
    // Messages change frequently in active chats
    staleTime: 30 * 1000, // 30 seconds
    // Keep messages in cache longer for better UX when switching between rooms
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSendMessageMutation = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
      content,
      replyToId,
    }: {
      roomId: string;
      content: string;
      replyToId?: string;
    }): Promise<Message> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          group_id: roomId,
          content,
          reply_to: replyToId,
          author_id: user.id,
          message_type: 'text',
        })
        .select(`
          *,
          author:profiles!author_id(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        id: message.id,
        group_id: message.group_id,
        author_id: message.author_id,
        content: message.content,
        data: message.data,
        reply_to: message.reply_to,
        reply_data: undefined,
        thread_id: message.thread_id,
        message_type: message.message_type,
        created_at: message.created_at,
        updated_at: message.updated_at,
        deleted: message.deleted,
        deleted_at: message.deleted_at,
        author: {
          id: message.author.id,
          username: message.author.username,
          full_name: message.author.full_name,
          avatar_url: message.author.avatar_url,
        },
        reactions: [],
        attachments: [],
      };
    },
    onMutate: async ({ roomId, content }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: messagesQueryKeys.room(roomId) });

      // Snapshot previous value for rollback
      const previousMessages = queryClient.getQueryData(messagesQueryKeys.room(roomId));

      // Optimistically update cache with temporary message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        group_id: roomId,
        author_id: user?.id || '',
        content,
                 data: undefined,
         reply_to: undefined,
         reply_data: undefined,
         thread_id: undefined,
         message_type: 'text',
         created_at: new Date().toISOString(),
         updated_at: new Date().toISOString(),
         deleted: false,
         deleted_at: undefined,
                 author: {
           id: user?.id || '',
           username: user?.email?.split('@')[0] || 'You',
           full_name: 'You',
           avatar_url: undefined,
         },
        reactions: [],
        attachments: [],
        sending: true, // Mark as sending
      };

      queryClient.setQueryData(
        messagesQueryKeys.room(roomId),
        (old: any) => {
          if (!old || !old.pages) return old;
          
          const newPages = [...old.pages];
          if (newPages.length > 0) {
            newPages[newPages.length - 1] = [
              ...newPages[newPages.length - 1],
              optimisticMessage
            ];
          }
          
          return {
            ...old,
            pages: newPages,
          };
        }
      );

      return { previousMessages, optimisticMessage };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          messagesQueryKeys.room(variables.roomId),
          context.previousMessages
        );
      }
    },
    onSuccess: (newMessage, variables) => {
      // Update the optimistic message with real data
      queryClient.setQueryData(
        messagesQueryKeys.room(variables.roomId),
        (old: any) => {
          if (!old || !old.pages) return old;
          
          const newPages = old.pages.map((page: Message[]) =>
            page.map((msg: Message) =>
              msg.id.startsWith('temp-') && msg.content === newMessage.content
                ? { ...newMessage, sending: false }
                : msg
            )
          );
          
          return {
            ...old,
            pages: newPages,
          };
        }
      );
    },
  });
};

export const useAddReactionMutation = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
    }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if reaction already exists
      const { data: existingReaction } = await supabase
        .from('reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .single();

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (error) throw new Error(error.message);
        return { action: 'removed' as const };
      } else {
        // Add reaction
        const { error } = await supabase
          .from('reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji,
          });

        if (error) throw new Error(error.message);
        return { action: 'added' as const };
      }
    },
    onSuccess: (result, { messageId }) => {
      // We could optimistically update the cache here
      // For now, let's rely on realtime updates
      console.log(`Reaction ${result.action} for message ${messageId}`);
    },
  });
}; 