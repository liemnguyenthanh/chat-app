export interface ProfileData {
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
}

export interface ProfileUpdateModalProps {
  open: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}

export interface AvatarUploadState {
  uploading: boolean;
  uploadProgress: number;
  error: string | null;
}

export interface ProfileFormState {
  loading: boolean;
  saving: boolean;
  error: string | null;
  success: boolean;
} 