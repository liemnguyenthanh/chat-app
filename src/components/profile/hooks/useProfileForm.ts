import { useState, useEffect, useCallback } from 'react';
import { ProfileData, ProfileFormState } from '../types/profileTypes';
import { useUserContext } from '@/contexts/UserContext';

export const useProfileForm = (open: boolean, onProfileUpdated?: () => void, onClose?: () => void) => {
  const { profile, updateProfile, user } = useUserContext();
  const [localProfile, setLocalProfile] = useState<ProfileData>({
    username: "",
    full_name: "",
    avatar_url: "",
    bio: "",
  });

  const [formState, setFormState] = useState<ProfileFormState>({
    loading: false,
    saving: false,
    error: null,
    success: false,
  });

  // Load current profile data when modal opens
  useEffect(() => {
    if (open && profile) {
      setLocalProfile({
        username: profile.username || "",
        full_name: profile.full_name || "",
        avatar_url: profile.avatar_url || "",
        bio: profile.bio || "",
      });
      setFormState({
        loading: false,
        saving: false,
        error: null,
        success: false,
      });
    }
  }, [open, profile]);

  const handleInputChange = useCallback((field: keyof ProfileData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalProfile(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    setFormState(prev => ({ ...prev, error: null, success: false }));
  }, []);

  const updateAvatarUrl = useCallback((avatarUrl: string) => {
    setLocalProfile(prev => ({
      ...prev,
      avatar_url: avatarUrl
    }));
  }, []);

  const validateProfile = (): string | null => {
    if (!localProfile.username.trim()) {
      return "Username is required";
    }
    
    if (localProfile.username.trim().length < 3) {
      return "Username must be at least 3 characters long";
    }
    
    if (localProfile.bio.length > 500) {
      return "Bio must be 500 characters or less";
    }

    return null;
  };

  const handleSave = async () => {
    if (!user?.id) return;

    const validationError = validateProfile();
    if (validationError) {
      setFormState(prev => ({ ...prev, error: validationError }));
      return;
    }

    setFormState(prev => ({ ...prev, saving: true, error: null }));
    
    try {
      await updateProfile({
        username: localProfile.username.trim(),
        full_name: localProfile.full_name.trim() || null,
        avatar_url: localProfile.avatar_url.trim() || null,
        bio: localProfile.bio.trim() || null,
      });

      setFormState(prev => ({ ...prev, success: true, saving: false }));
      onProfileUpdated?.();
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose?.();
        setFormState(prev => ({ ...prev, success: false }));
      }, 1500);
    } catch (err: any) {
      let errorMessage = "Failed to update profile";
      
      if (err.code === "23505") {
        errorMessage = "Username is already taken. Please choose a different one.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setFormState(prev => ({ 
        ...prev, 
        saving: false, 
        error: errorMessage 
      }));
    }
  };

  const setError = useCallback((error: string | null) => {
    setFormState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setFormState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    localProfile,
    formState,
    handleInputChange,
    updateAvatarUrl,
    handleSave,
    setError,
    clearError,
  };
};