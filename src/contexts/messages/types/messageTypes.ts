export interface Message {
  id: string;
  group_id: string;
  author_id: string;
  content?: string;
  data?: any;
  reply_to?: string;
  thread_id?: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  created_at: string;
  updated_at: string;
  deleted: boolean;
  deleted_at?: string;
  // Client-side states
  failed?: boolean;
  sending?: boolean;
  // Joined data
  author?: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  attachments?: {
    id: string;
    filename: string;
    file_size: number;
    mime_type: string;
    bucket_path: string;
  }[];
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
}

export interface TypingUser {
  user_id: string;
  username: string;
}

export interface MessagesContextType {
  messages: Message[];
  loading: boolean;
  error: string | null;
  currentGroupId: string | null;
  hasMore: boolean;
  typingUsers: TypingUser[];
  sendingMessageId: string | null;
  failedMessages: Set<string>;
  sendMessage: (groupId: string, content: string, replyTo?: string) => Promise<boolean>;
  retryFailedMessage: (tempId: string) => Promise<boolean>;
  removeFailedMessage: (tempId: string) => void;
  editMessage: (messageId: string, content: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  addReaction: (messageId: string, emoji: string) => Promise<boolean>;
  removeReaction: (messageId: string, emoji: string) => Promise<boolean>;
  loadMessages: (groupId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  markAsRead: (groupId: string) => Promise<void>;
  startTyping: (groupId: string) => Promise<void>;
  stopTyping: (groupId: string) => Promise<void>;
} 