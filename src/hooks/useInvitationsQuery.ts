import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

export interface Invitation {
  id: string;
  group_id: string;
  inviter_id: string;
  invitee_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  created_at: string;
  expires_at: string;
  responded_at?: string;
  // Joined data
  group?: {
    id: string;
    name: string;
    description?: string;
    avatar_url?: string;
  };
  inviter?: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  invitee?: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
}

// Query keys for consistent caching
export const invitationsQueryKeys = {
  all: ['invitations'] as const,
  received: (userId: string) => ['invitations', 'received', userId] as const,
  sent: (userId: string) => ['invitations', 'sent', userId] as const,
};

export const useInvitationsQuery = () => {
  const supabase = useSupabaseClient();
  const user = useUser();

  const receivedQuery = useQuery({
    queryKey: invitationsQueryKeys.received(user?.id || ''),
    queryFn: async (): Promise<Invitation[]> => {
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          group:groups(
            id,
            name,
            description,
            avatar_url
          ),
          inviter:profiles!inviter_id(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('invitee_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes - invitations change more frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const sentQuery = useQuery({
    queryKey: invitationsQueryKeys.sent(user?.id || ''),
    queryFn: async (): Promise<Invitation[]> => {
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          group:groups(
            id,
            name,
            description,
            avatar_url
          ),
          invitee:profiles!invitee_id(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('inviter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    received: {
      data: receivedQuery.data || [],
      isLoading: receivedQuery.isLoading,
      error: receivedQuery.error,
      refetch: receivedQuery.refetch,
    },
    sent: {
      data: sentQuery.data || [],
      isLoading: sentQuery.isLoading,
      error: sentQuery.error,
      refetch: sentQuery.refetch,
    },
    isLoading: receivedQuery.isLoading || sentQuery.isLoading,
    error: receivedQuery.error || sentQuery.error,
    refetch: async () => {
      await Promise.all([receivedQuery.refetch(), sentQuery.refetch()]);
    },
  };
};

export const useSendInvitationMutation = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      inviteeId,
      message,
    }: {
      groupId: string;
      inviteeId: string;
      message?: string;
    }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('invitations')
        .insert({
          group_id: groupId,
          inviter_id: user.id,
          invitee_id: inviteeId,
          message: message || null,
        });

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      // Invalidate both sent and received invitations
      queryClient.invalidateQueries({ queryKey: invitationsQueryKeys.sent(user?.id || '') });
      queryClient.invalidateQueries({ queryKey: invitationsQueryKeys.received(user?.id || '') });
    },
  });
};

export const useRespondToInvitationMutation = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invitationId,
      response,
    }: {
      invitationId: string;
      response: 'accepted' | 'declined';
    }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Update invitation status
      const { data: invitation, error: updateError } = await supabase
        .from('invitations')
        .update({
          status: response,
          responded_at: new Date().toISOString(),
        })
        .eq('id', invitationId)
        .eq('invitee_id', user.id)
        .select('group_id')
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      // If accepted, add user to group
      if (response === 'accepted' && invitation) {
        const { error: memberError } = await supabase
          .from('group_members')
          .insert({
            group_id: invitation.group_id,
            user_id: user.id,
            role: 'member',
          });

        if (memberError) {
          throw new Error(memberError.message);
        }
      }

      return { invitation, response };
    },
    onSuccess: () => {
      // Invalidate both sent and received invitations
      queryClient.invalidateQueries({ queryKey: invitationsQueryKeys.sent(user?.id || '') });
      queryClient.invalidateQueries({ queryKey: invitationsQueryKeys.received(user?.id || '') });
      // Also invalidate rooms since accepting an invitation adds the user to a new room
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

export const useCancelInvitationMutation = () => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId)
        .eq('inviter_id', user.id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      // Invalidate sent invitations
      queryClient.invalidateQueries({ queryKey: invitationsQueryKeys.sent(user?.id || '') });
    },
  });
}; 