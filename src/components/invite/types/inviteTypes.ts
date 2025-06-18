export interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface InviteUserModalProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
}

export interface UserSearchState {
  searching: boolean;
  users: UserProfile[];
  query: string;
  error: string | null;
}

export interface InviteFormState {
  selectedUser: UserProfile | null;
  message: string;
  loading: boolean;
  error: string | null;
} 