import { useUser } from '@supabase/auth-helpers-react';

export const useMessageStyling = () => {
  const user = useUser();

  const getMessageAlignment = (authorId: string) => {
    return authorId === user?.id ? 'flex-end' : 'flex-start';
  };

  const getMessageColor = (authorId: string) => {
    return authorId === user?.id ? 'primary.main' : 'grey.100';
  };

  const getTextColor = (authorId: string) => {
    return authorId === user?.id ? 'white' : 'text.primary';
  };

  const getBorderRadius = (authorId: string, showAvatar: boolean) => {
    const baseRadius = 18;
    const tightRadius = 4;
    
    if (authorId === user?.id) {
      // Own messages: rounded on left, tight on bottom-right when grouped
      return showAvatar 
        ? `${baseRadius}px ${baseRadius}px ${baseRadius}px ${baseRadius}px`
        : `${baseRadius}px ${baseRadius}px ${tightRadius}px ${baseRadius}px`;
    } else {
      // Other messages: rounded on right, tight on bottom-left when grouped  
      return showAvatar 
        ? `${baseRadius}px ${baseRadius}px ${baseRadius}px ${baseRadius}px`
        : `${baseRadius}px ${baseRadius}px ${baseRadius}px ${tightRadius}px`;
    }
  };

  const isOwnMessage = (authorId: string) => {
    return authorId === user?.id;
  };

  return {
    getMessageAlignment,
    getMessageColor,
    getTextColor,
    getBorderRadius,
    isOwnMessage,
  };
}; 