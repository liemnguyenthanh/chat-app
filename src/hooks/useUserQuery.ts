import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

// Query keys for consistent caching
export const userQueryKeys = {
  all: ['users'] as const,
  profile: (userId: string) => ['users', 'profile', userId] as const,
};

export const useUserProfileQuery = () => {
  const supabase = useSupabaseClient();
  const user = useUser();

  return useQuery({
    queryKey: userQueryKeys.profile(user?.id || ''),
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.id) {
        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create one
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: user.email?.split('@')[0] || null,
              full_name: null,
              avatar_url: null,
              bio: null,
            })
            .select()
            .single();

          if (createError) {
            throw new Error(createError.message);
          }
          return newProfile;
        } else {
          throw new Error(error.message);
        }
      }

      return data;
    },
    enabled: !!user?.id,
    // Profile data doesn't change often, cache for longer
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useUpdateProfileMutation = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<UserProfile>): Promise<UserProfile> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (updatedProfile) => {
      // Update the cache with new profile data
      queryClient.setQueryData(
        userQueryKeys.profile(user?.id || ''),
        updatedProfile
      );
    },
  });
}; 