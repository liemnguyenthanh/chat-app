import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Room } from "@/components/RoomList";

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

      // Get the current session to include auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid session');
      }

      // Call the Edge Function instead of multiple database queries
      const { data, error: functionError } = await supabase.functions.invoke('fetch-rooms', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (functionError) {
        throw functionError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Set the rooms data directly from the Edge Function response
      setRooms(data?.rooms || []);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setError("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  const refreshRooms = useCallback(async () => {
    await fetchRooms();
  }, [fetchRooms]);

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

        // Refresh rooms to include the new one
        await refreshRooms();

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
    [user, supabase, refreshRooms]
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

    const channel = supabase
      .channel("room-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          try {
            // Check if this message belongs to a room the user is in
            const { data: membership, error } = await supabase
              .from("group_members")
              .select("group_id")
              .eq("group_id", payload.new.group_id)
              .eq("user_id", user.id)
              .single();

            if (error) {
              return;
            }

            if (membership && payload.new.content) {
              updateRoomLastMessage(
                payload.new.group_id,
                payload.new.content,
                payload.new.created_at
              );
            }
          } catch (err) {
            console.error("Error processing room message update:", err);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "groups",
        },
        (payload) => {
          // Refresh rooms when new groups are created
          refreshRooms();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Room updates subscription successful");
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Room updates subscription error");
        } else if (status === "TIMED_OUT") {
          console.error("⏰ Room updates subscription timed out");
        } else if (status === "CLOSED") {
          console.log("🔒 Room updates subscription closed");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, updateRoomLastMessage, refreshRooms]);

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
  };

  return (
    <RoomsContext.Provider value={value}>{children}</RoomsContext.Provider>
  );
};
