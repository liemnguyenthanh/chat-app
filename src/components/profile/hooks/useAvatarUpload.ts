import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { AvatarUploadState } from '../types/profileTypes';

export const useAvatarUpload = (userId: string | undefined) => {
  const supabase = useSupabaseClient();
  const [uploadState, setUploadState] = useState<AvatarUploadState>({
    uploading: false,
    uploadProgress: 0,
    error: null,
  });

  const uploadAvatar = async (file: File, currentAvatarUrl?: string): Promise<string | null> => {
    if (!userId) return null;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadState(prev => ({ ...prev, error: 'Please select an image file' }));
      return null;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadState(prev => ({ ...prev, error: 'Image size must be less than 5MB' }));
      return null;
    }

    setUploadState({
      uploading: true,
      uploadProgress: 0,
      error: null,
    });

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      // Delete existing avatar if it exists
      if (currentAvatarUrl) {
        const existingPath = currentAvatarUrl.split('/').pop();
        if (existingPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${userId}/${existingPath}`]);
        }
      }

      // Upload new avatar
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setUploadState(prev => ({ ...prev, uploadProgress: 100 }));
      
      // Reset state after a delay
      setTimeout(() => {
        setUploadState({
          uploading: false,
          uploadProgress: 0,
          error: null,
        });
      }, 1000);

      return publicUrl;
    } catch (err: any) {
      setUploadState({
        uploading: false,
        uploadProgress: 0,
        error: err.message || 'Failed to upload avatar',
      });
      return null;
    }
  };

  const deleteAvatar = async (currentAvatarUrl: string): Promise<boolean> => {
    if (!userId || !currentAvatarUrl) return false;

    setUploadState({
      uploading: true,
      uploadProgress: 0,
      error: null,
    });

    try {
      // Extract filename from URL
      const urlParts = currentAvatarUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${userId}/${fileName}`;

      // Delete from storage
      const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (error) throw error;

      setUploadState({
        uploading: false,
        uploadProgress: 0,
        error: null,
      });

      return true;
    } catch (err: any) {
      setUploadState({
        uploading: false,
        uploadProgress: 0,
        error: err.message || 'Failed to delete avatar',
      });
      return false;
    }
  };

  const clearError = () => {
    setUploadState(prev => ({ ...prev, error: null }));
  };

  return {
    uploadState,
    uploadAvatar,
    deleteAvatar,
    clearError,
  };
}; 