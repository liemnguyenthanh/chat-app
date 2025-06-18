import { useState, useCallback } from 'react';
import { useRoomsContext } from '@/contexts/RoomsContext';

export const useCreateRoom = () => {
  const { createRoom: createRoomFromContext } = useRoomsContext();
  
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [isPrivateRoom, setIsPrivateRoom] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [createRoomError, setCreateRoomError] = useState("");

  const validateRoomName = useCallback((name: string): string | null => {
    if (!name.trim()) {
      return 'Room name is required';
    }
    if (name.trim().length < 3) {
      return 'Room name must be at least 3 characters long';
    }
    if (name.trim().length > 100) {
      return 'Room name must be less than 100 characters';
    }
    return null;
  }, []);

  const handleCreateRoom = useCallback(async (): Promise<boolean> => {
    const validationError = validateRoomName(newRoomName);
    if (validationError) {
      setCreateRoomError(validationError);
      return false;
    }

    setIsCreatingRoom(true);
    setCreateRoomError('');

    try {
      const newRoom = await createRoomFromContext(
        newRoomName.trim(),
        newRoomDescription.trim() || undefined,
        isPrivateRoom
      );

      if (newRoom) {
        console.log('Room created successfully:', newRoom);
        resetForm();
        return true;
      }
      
      setCreateRoomError('Failed to create room. Please try again.');
      return false;
    } catch (error) {
      console.error('Error creating room:', error);
      setCreateRoomError('Failed to create room. Please try again.');
      return false;
    } finally {
      setIsCreatingRoom(false);
    }
  }, [newRoomName, newRoomDescription, isPrivateRoom, createRoomFromContext, validateRoomName]);

  const resetForm = useCallback(() => {
    setNewRoomName('');
    setNewRoomDescription('');
    setIsPrivateRoom(false);
    setCreateRoomError('');
    setIsCreatingRoom(false);
  }, []);

  const clearError = useCallback(() => {
    setCreateRoomError('');
  }, []);

  return {
    // State
    newRoomName,
    newRoomDescription,
    isPrivateRoom,
    isCreatingRoom,
    createRoomError,
    
    // Actions
    setNewRoomName,
    setNewRoomDescription,
    setIsPrivateRoom,
    handleCreateRoom,
    resetForm,
    clearError,
  };
}; 