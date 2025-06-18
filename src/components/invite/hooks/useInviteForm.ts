import { useState, useCallback } from 'react';
import { InviteFormState, UserProfile } from '../types/inviteTypes';
import { useInvitationsContext } from '@/contexts/InvitationsContext';

export const useInviteForm = (
  groupId: string,
  groupName: string,
  onSuccess: () => void
) => {
  const { sendInvitation, loading: inviting } = useInvitationsContext();
  
  const [formState, setFormState] = useState<InviteFormState>({
    selectedUser: null,
    message: '',
    loading: false,
    error: null,
  });

  const setSelectedUser = useCallback((user: UserProfile | null) => {
    setFormState(prev => ({ ...prev, selectedUser: user, error: null }));
  }, []);

  const setMessage = useCallback((message: string) => {
    setFormState(prev => ({ ...prev, message, error: null }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setFormState(prev => ({ ...prev, error }));
  }, []);

  const validateForm = (): string | null => {
    if (!formState.selectedUser) {
      return 'Please select a user to invite';
    }
    return null;
  };

  const sendInvite = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!formState.selectedUser) return;

    setFormState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const inviteMessage = formState.message.trim() || 
        `You've been invited to join ${groupName}`;
      
      await sendInvitation(
        groupId,
        formState.selectedUser.id,
        inviteMessage
      );

      // Reset form and trigger success callback
      setFormState({
        selectedUser: null,
        message: '',
        loading: false,
        error: null,
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error sending invitation:', error);
      setFormState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to send invitation',
      }));
    }
  }, [
    formState.selectedUser,
    formState.message,
    groupId,
    groupName,
    sendInvitation,
    onSuccess,
  ]);

  const resetForm = useCallback(() => {
    setFormState({
      selectedUser: null,
      message: '',
      loading: false,
      error: null,
    });
  }, []);

  const isLoading = formState.loading || inviting;

  return {
    formState,
    setSelectedUser,
    setMessage,
    setError,
    sendInvite,
    resetForm,
    isLoading,
  };
}; 