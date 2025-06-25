// Main component
export { default as ProfileUpdateModal } from './ProfileUpdateModal';

// Components
export { AvatarUploader } from './components/AvatarUploader';
export { ProfileFormFields } from './components/ProfileFormFields';
export { ProfileStatusMessages } from './components/ProfileStatusMessages';

// Hooks
export { useAvatarUpload } from './hooks/useAvatarUpload';
export { useProfileForm } from './hooks/useProfileForm';

// Types
export type {
  ProfileData,
  ProfileUpdateModalProps,
  AvatarUploadState,
  ProfileFormState,
} from './types/profileTypes';