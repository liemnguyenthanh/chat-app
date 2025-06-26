import React, {
  createContext,
  useContext,
  ReactNode,
} from "react";
import { Room } from "@/components/rooms";
import { useRoomsQuery, useCreateRoomMutation, useUpdateRoomLastMessage } from "@/hooks/useRoomsQuery";

interface RoomsContextType {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
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
  silentRefreshRooms: () => void;
}

const RoomsContext = createContext<RoomsContextType | undefined>(undefined);

export const useRoomsContext = () => {
  const context = useContext(RoomsContext);
  if (!context) {
    throw new Error("useRoomsContext must be used within a RoomsProvider");
  }
  return context;
};

interface RoomsProviderProps {
  children: ReactNode;
}

export const RoomsProvider: React.FC<RoomsProviderProps> = ({ children }) => {
  // Use React Query for rooms data - this prevents unnecessary refetches!
  const {
    data: rooms = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useRoomsQuery();

  // Use React Query for creating rooms
  const createRoomMutation = useCreateRoomMutation();
  
  // Use React Query for updating room last message
  const updateRoomLastMessage = useUpdateRoomLastMessage();

  const createRoom = async (
    name: string,
    description?: string,
    isPrivate: boolean = false
  ): Promise<Room | null> => {
    try {
      const newRoom = await createRoomMutation.mutateAsync({
        name,
        description,
        isPrivate,
      });
      return newRoom;
    } catch (error) {
      console.error("Error creating room:", error);
      return null;
    }
  };

  const silentRefreshRooms = () => {
    // React Query handles this more intelligently with invalidation
    refetch();
  };

  const value: RoomsContextType = {
    rooms,
    loading,
    error: queryError?.message || null,
    refetch,
    createRoom,
    updateRoomLastMessage,
    silentRefreshRooms,
  };

  return (
    <RoomsContext.Provider value={value}>{children}</RoomsContext.Provider>
  );
};
