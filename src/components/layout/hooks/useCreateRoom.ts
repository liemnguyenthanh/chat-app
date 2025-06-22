import { useState, useCallback } from 'react';
import { useRoomsContext } from '@/contexts/RoomsContext';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';

export const useCreateRoom = () => {
  const { createRoom: createRoomFromContext } = useRoomsContext();
  const user = useUser();
  const supabase = useSupabaseClient();
  
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

    // DEBUG: Check authentication state
    console.log('🔍 DEBUG: Authentication state before creating room:', {
      user: user ? { id: user.id, email: user.email } : null,
      hasUser: !!user,
      sessionExists: !!supabase.auth.getSession(),
    });

    if (!user) {
      console.error('🚨 DEBUG: No user found - authentication issue!');
      setCreateRoomError('You must be logged in to create a room');
      return false;
    }

    // DEBUG: Test auth state in database
    try {
      const { data: authDebug, error: debugError } = await supabase.rpc('debug_group_insert', {
        test_name: newRoomName.trim(),
        test_owner_id: user.id,
        test_is_private: isPrivateRoom
      });

      console.log('🔍 DEBUG: Database auth state:', authDebug);
      
      if (debugError) {
        console.error('🚨 DEBUG: Error checking auth state:', debugError);
      }

      // If auth.uid() is null in the database, there's an auth context issue
      if (authDebug && !authDebug.can_insert) {
        console.error('🚨 DEBUG: Authentication context not properly passed to database');
        setCreateRoomError('Authentication error - please refresh the page and try again');
        return false;
      }
    } catch (debugErr) {
      console.error('🚨 DEBUG: Error running auth debug:', debugErr);
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
  }, [newRoomName, newRoomDescription, isPrivateRoom, createRoomFromContext, validateRoomName, user, supabase]);

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