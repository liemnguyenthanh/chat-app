import { useState, useRef, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '@supabase/auth-helpers-react';
import { TypingUser } from '../types/messageTypes';

export const useTyping = (supabase: SupabaseClient, user: User | null) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startTyping = useCallback(async (groupId: string): Promise<void> => {
    if (!user) return;

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

      if (error) throw error;

      // Set timeout to automatically stop typing
      typingTimeoutRef.current = setTimeout(async () => {
        await supabase
          .from('typing_indicators')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', user.id);
        typingTimeoutRef.current = null;
      }, 8000); // Stop after 8 seconds
    } catch (err) {
      console.error('Error starting typing indicator:', err);
    }
  }, [user, supabase]);

  const stopTyping = useCallback(async (groupId: string): Promise<void> => {
    if (!user) return;

    try {
      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Remove typing indicator
      const { error } = await supabase
        .from('typing_indicators')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error stopping typing indicator:', err);
    }
  }, [user, supabase]);

  const updateTypingUsers = useCallback((users: TypingUser[]) => {
    setTypingUsers(users);
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  return {
    typingUsers,
    startTyping,
    stopTyping,
    updateTypingUsers,
    cleanup
  };
}; 