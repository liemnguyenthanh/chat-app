import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Room } from "@/components/rooms";

interface RoomsContextType {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  refreshRooms: () => Promise<void>;
  createRoom: (
    name: string,
    description?: string,
    isPrivate?: boolean
  ) => Promise<Room | null>;
  updateRoomLastMessage: (
    roomId: string,
    lastMessage: string,
    timestamp: string
  ) => void;
  silentRefreshRooms: () => Promise<void>;
}

const RoomsContext = createContext<RoomsContextType | undefined>(undefined);

export const useRoomsContext = () => {
  const context = useContext(RoomsContext);
  if (context === undefined) {
    throw new Error("useRoomsContext must be used within a RoomsProvider");
  }
  return context;
};

interface RoomsProviderProps {
  children: ReactNode;
}

export const RoomsProvider: React.FC<RoomsProviderProps> = ({ children }) => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    if (!user) {
      setRooms([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      setError(null);

      // Use optimized RPC function for instant room fetching
      const { data: roomsData, error: roomsError } = await supabase.rpc('fetch_user_rooms', {
        user_id: user.id
      });

      if (roomsError) {
        throw roomsError;
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

      setRooms(transformedRooms);
    } catch (error: any) {
      console.error('Error fetching rooms:', error);
      setError(error.message || 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshRooms = useCallback(async () => {
    await fetchRooms();
  }, [fetchRooms]);

  // Silent refresh for realtime updates - doesn't trigger loading state
  const silentRefreshRooms = useCallback(async () => {
    if (!user) return;

    try {
      // Use optimized RPC function for instant room fetching
      const { data: roomsData, error: roomsError } = await supabase.rpc('fetch_user_rooms', {
        user_id: user.id
      });

      if (roomsError) {
        console.error('Error in silent refresh:', roomsError);
        return;
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

      setRooms(transformedRooms);
    } catch (error: any) {
      console.error('Error in silent refresh:', error);
    }
    // Note: No setLoading(false) here since we never set it to true
  }, [user, supabase]);

  const createRoom = useCallback(
    async (
      name: string,
      description?: string,
      isPrivate: boolean = false
    ): Promise<Room | null> => {
      if (!user) {
        throw new Error("User must be authenticated to create a room");
      }

      try {
        // Create the group in the database
        const { data: group, error } = await supabase
          .from("groups")
          .insert({
            name: name.trim(),
            owner_id: user.id,
            is_private: isPrivate,
            description: description?.trim() || null,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Note: The owner is automatically added as a member by the database trigger

        // Use silent refresh to avoid loading state that might block UI
        await silentRefreshRooms();

        // Return the new room in the expected format
        return {
          id: group.id,
          name: group.name,
          lastMessage: "No messages yet",
          unreadCount: 0,
          isPrivate: group.is_private,
          memberCount: 1,
          lastActivity: group.created_at,
        };
      } catch (err) {
        console.error("Error creating room:", err);
        throw err;
      }
    },
    [user, supabase, silentRefreshRooms]
  );

  // Function to update room's last message in real-time
  const updateRoomLastMessage = useCallback(
    (roomId: string, lastMessage: string, timestamp: string) => {
      setRooms((prev) =>
        prev
          .map((room) =>
            room.id === roomId
              ? {
                  ...room,
                  lastMessage:
                    lastMessage.length > 50
                      ? lastMessage.substring(0, 50) + "..."
                      : lastMessage,
                  lastActivity: timestamp,
                }
              : room
          )
          .sort(
            (a, b) =>
              new Date(b.lastActivity || 0).getTime() -
              new Date(a.lastActivity || 0).getTime()
          )
      );
    },
    []
  );

  // Set up real-time subscription for new messages to update room list
  useEffect(() => {
    if (!user) {
      return;
    }

    // NOTE: Commenting out this subscription as it's now handled by global realtime hook
    // to avoid duplicate subscriptions and loading states
    
    // const channel = supabase
    //   .channel("room-updates")
    //   .on(
    //     "postgres_changes",
    //     {
    //       event: "INSERT",
    //       schema: "public",
    //       table: "groups",
    //     },
    //     (payload) => {
    //       // Use silent refresh to avoid loading state
    //       console.log('🏠 New group created, silent refresh');
    //       silentRefreshRooms();
    //     }
    //   )
    //   .subscribe((status) => {
    //     if (status === "SUBSCRIBED") {
    //       console.log("✅ Room updates subscription successful");
    //     } else if (status === "CHANNEL_ERROR") {
    //       console.error("❌ Room updates subscription error");
    //     } else if (status === "TIMED_OUT") {
    //       console.error("⏰ Room updates subscription timed out");
    //     } else if (status === "CLOSED") {
    //       console.log("🔒 Room updates subscription closed");
    //     }
    //   });

    // return () => {
    //   supabase.removeChannel(channel);
    // };
  }, [user, supabase, silentRefreshRooms]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const value: RoomsContextType = {
    rooms,
    loading,
    error,
    refreshRooms,
    createRoom,
    updateRoomLastMessage,
    silentRefreshRooms,
  };

  return (
    <RoomsContext.Provider value={value}>{children}</RoomsContext.Provider>
  );
};
