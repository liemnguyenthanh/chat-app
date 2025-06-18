import { useState, useCallback } from 'react';
import { UserSearchState, UserProfile } from '../types/inviteTypes';
import { UserSearchService } from '../services/userSearchService';

export const useUserSearch = (groupId: string) => {
  const [searchState, setSearchState] = useState<UserSearchState>({
    searching: false,
    users: [],
    query: '',
    error: null,
  });

  const searchUsers = useCallback(async (query: string) => {
    // Update query immediately for UI responsiveness
    setSearchState(prev => ({ ...prev, query, error: null }));

    if (!query.trim() || query.length < 2) {
      setSearchState(prev => ({ ...prev, users: [], searching: false }));
      return;
    }

    setSearchState(prev => ({ ...prev, searching: true }));

    try {
      const users = await UserSearchService.searchUsers(query, groupId);
      setSearchState(prev => ({
        ...prev,
        users,
        searching: false,
        error: null,
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchState(prev => ({
        ...prev,
        users: [],
        searching: false,
        error: 'Failed to search users',
      }));
    }
  }, [groupId]);

  const clearSearch = useCallback(() => {
    setSearchState({
      searching: false,
      users: [],
      query: '',
      error: null,
    });
  }, []);

  const setError = useCallback((error: string | null) => {
    setSearchState(prev => ({ ...prev, error }));
  }, []);

  return {
    searchState,
    searchUsers,
    clearSearch,
    setError,
  };
}; 