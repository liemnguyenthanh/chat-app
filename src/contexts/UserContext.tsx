import React, { createContext, useContext, ReactNode } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { useUserProfileQuery, useUpdateProfileMutation } from '@/hooks/useUserQuery';

interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

interface UserContextType {
  user: ReturnType<typeof useUser>;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const user = useUser();
  
  // Use React Query hooks instead of manual state management
  const { 
    data: profile, 
    isLoading: loading, 
    error: queryError,
    refetch: refreshProfile
  } = useUserProfileQuery();
  
  const updateProfileMutation = useUpdateProfileMutation();

  // Convert error to string for compatibility
  const error = queryError ? (queryError as Error).message : null;

  const updateProfile = async (updates: Partial<UserProfile>) => {
    await updateProfileMutation.mutateAsync(updates);
  };

  const value: UserContextType = {
    user,
    profile: profile || null,
    loading: loading || updateProfileMutation.isPending,
    error,
    refreshProfile: async () => {
      await refreshProfile();
    },
    updateProfile,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;