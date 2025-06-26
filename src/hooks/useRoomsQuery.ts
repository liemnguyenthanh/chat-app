import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Room } from '@/components/rooms';

// Query keys for consistent caching
export const roomsQueryKeys = {
  all: ['rooms'] as const,
  user: (userId: string) => ['rooms', 'user', userId] as const,
};

export const useRoomsQuery = () => {
  const supabase = useSupabaseClient();
  const user = useUser();

  return useQuery({
    queryKey: roomsQueryKeys.user(user?.id || ''),
    queryFn: async (): Promise<Room[]> => {
      if (!user) {
        return [];
      }

      const { data: roomsData, error } = await supabase.rpc('fetch_user_rooms', {
        user_id: user.id
      });

      if (error) {
        throw new Error(error.message);
      }

      // Transform the data to match the Room interface
      const transformedRooms: Room[] = (roomsData || []).map((room: any) => ({
        id: room.group_id,
        name: room.group_name,
        lastMessage: room.last_message,
        unreadCount: room.unread_count || 0,
        isPrivate: room.is_private,
        memberCount: Number(room.member_count),
        lastActivity: room.last_activity,
      }));

      return transformedRooms;
    },
    enabled: !!user, // Only run query when user is available
    // Rooms don't change frequently, so we can cache longer
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateRoomMutation = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      isPrivate = false,
    }: {
      name: string;
      description?: string;
      isPrivate?: boolean;
    }): Promise<Room> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: room, error } = await supabase
        .from('groups')
        .insert({
          name,
          description,
          is_private: isPrivate,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: room.id,
          user_id: user.id,
          role: 'admin',
        });

      if (memberError) {
        throw new Error(memberError.message);
      }

      return {
        id: room.id,
        name: room.name,
        lastMessage: undefined,
        unreadCount: 0,
        isPrivate: room.is_private,
        memberCount: 1,
        lastActivity: room.created_at,
      };
    },
    onSuccess: () => {
      // Invalidate and refetch rooms query when a new room is created
      queryClient.invalidateQueries({ queryKey: roomsQueryKeys.all });
    },
  });
};

export const useUpdateRoomLastMessage = () => {
  const queryClient = useQueryClient();
  const user = useUser();

  return (roomId: string, lastMessage: string, timestamp: string) => {
    if (!user) return;

    // Optimistically update the cache
    queryClient.setQueryData(
      roomsQueryKeys.user(user.id),
      (oldRooms: Room[] | undefined) => {
        if (!oldRooms) return oldRooms;

        return oldRooms.map(room =>
          room.id === roomId
            ? { ...room, lastMessage, lastActivity: timestamp }
            : room
        );
      }
    );
  };
}; 