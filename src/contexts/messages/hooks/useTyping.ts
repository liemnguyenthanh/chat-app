import { useState, useRef, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '@supabase/auth-helpers-react';
import { TypingUser } from '../types/messageTypes';

export const useTyping = (supabase: SupabaseClient, user: User | null) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCurrentlyTypingRef = useRef<boolean>(false);
  const currentGroupRef = useRef<string | null>(null);

  const stopTyping = useCallback(async (groupId: string): Promise<void> => {
    if (!user) return;

    try {
      // Clear all timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }

      // Only make API call if we were actually typing
      if (isCurrentlyTypingRef.current && currentGroupRef.current === groupId) {
        // Remove typing indicator
        const { error } = await supabase
          .from('typing_indicators')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error stopping typing indicator:', error);
          throw error;
        }
      }

      isCurrentlyTypingRef.current = false;
      currentGroupRef.current = null;
    } catch (err) {
      console.error('Error stopping typing indicator:', err);
    }
  }, [user, supabase]);

  const startTyping = useCallback(async (groupId: string): Promise<void> => {
    if (!user) return;

    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // If we're already typing in the same group, just reset the timeout
    if (isCurrentlyTypingRef.current && currentGroupRef.current === groupId) {
      // Extend the typing indicator
      debounceTimeoutRef.current = setTimeout(() => {
        stopTyping(groupId);
      }, 2000); // Stop typing after 2 seconds of inactivity
      return;
    }

    // Debounce the actual API call
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        // Clear any existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Insert or update typing indicator
        const { error } = await supabase
          .from('typing_indicators')
          .upsert({
            group_id: groupId,
            user_id: user.id,
            expires_at: new Date(Date.now() + 10000).toISOString() // 10 seconds from now
          });

        if (error) {
          console.error('Supabase error creating typing indicator:', error);
          throw error;
        }
        
        isCurrentlyTypingRef.current = true;
        currentGroupRef.current = groupId;

        // Set timeout to automatically stop typing
        typingTimeoutRef.current = setTimeout(async () => {
          await stopTyping(groupId);
        }, 8000); // Stop after 8 seconds
      } catch (err) {
        console.error('Error starting typing indicator:', err);
      }
    }, 300); // Wait 300ms before making API call
  }, [user, supabase, stopTyping]);

  const updateTypingUsers = useCallback((users: TypingUser[]) => {
    setTypingUsers(users);
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    isCurrentlyTypingRef.current = false;
    currentGroupRef.current = null;
  }, []);

  return {
    typingUsers,
    startTyping,
    stopTyping,
    updateTypingUsers,
    cleanup
  };
}; 