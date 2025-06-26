import { useState, useCallback } from 'react';
import { useRoomsContext } from '@/contexts/RoomsContext';
import { useUser } from '@supabase/auth-helpers-react';
import { validateUserAuth } from '@/lib/supabaseClient';

export const useCreateRoom = () => {
  const { createRoom: createRoomFromContext } = useRoomsContext();
  const user = useUser();
  
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

    // Enhanced authentication validation
    const authValidation = await validateUserAuth(user);
    if (!authValidation.isValid) {
      setCreateRoomError(authValidation.error || 'Authentication failed');
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
    } catch (error: any) {
      console.error('Error creating room:', error);
      
      // Provide more specific error messages based on common issues
      if (error.message?.includes('owner_id')) {
        setCreateRoomError('Authentication error - please refresh the page and try again');
      } else if (error.message?.includes('check constraint')) {
        setCreateRoomError('Invalid room data - please check your input');
      } else if (error.message?.includes('permission')) {
        setCreateRoomError('You do not have permission to create rooms');
      } else {
        setCreateRoomError(error.message || 'Failed to create room. Please try again.');
      }
      
      return false;
    } finally {
      setIsCreatingRoom(false);
    }
  }, [newRoomName, newRoomDescription, isPrivateRoom, createRoomFromContext, validateRoomName, user]);

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