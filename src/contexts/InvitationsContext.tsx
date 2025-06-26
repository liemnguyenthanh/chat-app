import React, { createContext, useContext, ReactNode } from 'react';
import { 
  useInvitationsQuery, 
  useSendInvitationMutation, 
  useRespondToInvitationMutation,
  useCancelInvitationMutation,
  Invitation as InvitationType
} from '@/hooks/useInvitationsQuery';

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
  // Use React Query hooks instead of manual state management
  const invitationsQuery = useInvitationsQuery();
  const sendInvitationMutation = useSendInvitationMutation();
  const respondToInvitationMutation = useRespondToInvitationMutation();
  const cancelInvitationMutation = useCancelInvitationMutation();

  // Convert error to string for compatibility
  const error = invitationsQuery.error 
    ? (invitationsQuery.error as Error).message 
    : null;

  const sendInvitation = async (groupId: string, inviteeId: string, message?: string): Promise<boolean> => {
    try {
      await sendInvitationMutation.mutateAsync({ groupId, inviteeId, message });
      return true;
    } catch (err) {
      console.error('Error sending invitation:', err);
      return false;
    }
  };

  const respondToInvitation = async (invitationId: string, response: 'accepted' | 'declined'): Promise<boolean> => {
    try {
      await respondToInvitationMutation.mutateAsync({ invitationId, response });
      return true;
    } catch (err) {
      console.error('Error responding to invitation:', err);
      return false;
    }
  };

  const cancelInvitation = async (invitationId: string): Promise<boolean> => {
    try {
      await cancelInvitationMutation.mutateAsync(invitationId);
      return true;
    } catch (err) {
      console.error('Error canceling invitation:', err);
      return false;
    }
  };

  const refreshInvitations = async () => {
    await invitationsQuery.refetch();
  };

  const value: InvitationsContextType = {
    invitations: invitationsQuery.received.data,
    sentInvitations: invitationsQuery.sent.data,
    loading: invitationsQuery.isLoading || 
             sendInvitationMutation.isPending || 
             respondToInvitationMutation.isPending || 
             cancelInvitationMutation.isPending,
    error,
    sendInvitation,
    respondToInvitation,
    cancelInvitation,
    refreshInvitations,
  };

  return (
    <InvitationsContext.Provider value={value}>
      {children}
    </InvitationsContext.Provider>
  );
};