import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

interface InvitationsContextType {
  invitations: Invitation[];
  sentInvitations: Invitation[];
  loading: boolean;
  error: string | null;
  sendInvitation: (groupId: string, inviteeId: string, message?: string) => Promise<boolean>;
  respondToInvitation: (invitationId: string, response: 'accepted' | 'declined') => Promise<boolean>;
  cancelInvitation: (invitationId: string) => Promise<boolean>;
  refreshInvitations: () => Promise<void>;
}

const InvitationsContext = createContext<InvitationsContextType | undefined>(undefined);

export const useInvitationsContext = () => {
  const context = useContext(InvitationsContext);
  if (context === undefined) {
    throw new Error('useInvitationsContext must be used within an InvitationsProvider');
  }
  return context;
};

interface InvitationsProviderProps {
  children: ReactNode;
}

export const InvitationsProvider: React.FC<InvitationsProviderProps> = ({ children }) => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = async () => {
    if (!user) {
      setInvitations([]);
      setSentInvitations([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Fetch received invitations
      const { data: receivedData, error: receivedError } = await supabase
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

      if (receivedError) throw receivedError;

      // Fetch sent invitations
      const { data: sentData, error: sentError } = await supabase
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

      if (sentError) throw sentError;

      setInvitations(receivedData || []);
      setSentInvitations(sentData || []);
    } catch (err) {
      console.error('Error fetching invitations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch invitations');
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async (groupId: string, inviteeId: string, message?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);
      
      const { error } = await supabase
        .from('invitations')
        .insert({
          group_id: groupId,
          inviter_id: user.id,
          invitee_id: inviteeId,
          message: message || null
        });

      if (error) throw error;

      await fetchInvitations();
      return true;
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
      return false;
    }
  };

  const respondToInvitation = async (invitationId: string, response: 'accepted' | 'declined'): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);
      
      // Update invitation status
      const { data: invitation, error: updateError } = await supabase
        .from('invitations')
        .update({
          status: response,
          responded_at: new Date().toISOString()
        })
        .eq('id', invitationId)
        .eq('invitee_id', user.id)
        .select('group_id')
        .single();

      if (updateError) throw updateError;

      // If accepted, add user to group
      if (response === 'accepted' && invitation) {
        const { error: memberError } = await supabase
          .from('group_members')
          .insert({
            group_id: invitation.group_id,
            user_id: user.id,
            role: 'member'
          });

        if (memberError) throw memberError;
      }

      await fetchInvitations();
      return true;
    } catch (err) {
      console.error('Error responding to invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to respond to invitation');
      return false;
    }
  };

  const cancelInvitation = async (invitationId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);
      
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId)
        .eq('inviter_id', user.id);

      if (error) throw error;

      await fetchInvitations();
      return true;
    } catch (err) {
      console.error('Error canceling invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel invitation');
      return false;
    }
  };

  const refreshInvitations = async () => {
    await fetchInvitations();
  };

  useEffect(() => {
    fetchInvitations();
  }, [user]);

  // Set up real-time subscription for invitations
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('invitations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invitations',
          filter: `invitee_id=eq.${user.id}`
        },
        () => {
          fetchInvitations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invitations',
          filter: `inviter_id=eq.${user.id}`
        },
        () => {
          fetchInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const value: InvitationsContextType = {
    invitations,
    sentInvitations,
    loading,
    error,
    sendInvitation,
    respondToInvitation,
    cancelInvitation,
    refreshInvitations
  };

  return (
    <InvitationsContext.Provider value={value}>
      {children}
    </InvitationsContext.Provider>
  );
};