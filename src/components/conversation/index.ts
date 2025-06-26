// Main components
export { default as Conversation } from './Conversation';

// Sub-components  
export { MessageList } from './components/MessageList';
export { MessageBubble } from './components/MessageBubble';
export { MessageGroup } from './components/MessageGroup';
export { MessageInput } from './components/MessageInput';
export { TypingIndicator } from './components/TypingIndicator';

// Hooks
export { useMessageActions } from './hooks/useMessageActions';
export { useMessageStyling } from './hooks/useMessageStyling';

// Types
export type { Message } from '@/contexts/messages/MessagesContext'; 