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

    try {
      setError(null);

      // Fetch groups where user is a member
      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select(
          `
          id,
          name,
          description,
          is_private,
          created_at,
          updated_at,
          group_members!inner(
            user_id
          )
        `
        )
        .eq("group_members.user_id", user.id)
        .order("updated_at", { ascending: false });

      if (groupsError) {
        throw groupsError;
      }

      // Transform groups data to Room format
      const transformedRooms: Room[] = await Promise.all(
        (groupsData || []).map(async (group) => {
          // Get member count
          const { count: memberCount } = await supabase
            .from("group_members")
            .select("*", { count: "exact", head: true })
            .eq("group_id", group.id);

          // Get last message
          const { data: lastMessageData } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("group_id", group.id)
            .eq("deleted", false)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            id: group.id,
            name: group.name,
            lastMessage: lastMessageData?.content || "No messages yet",
            unreadCount: 0, // TODO: Implement unread count logic
            isPrivate: group.is_private,
            memberCount: memberCount || 0,
            lastActivity: lastMessageData?.created_at || group.updated_at,
          };
        })
      );

      setRooms(transformedRooms);
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
