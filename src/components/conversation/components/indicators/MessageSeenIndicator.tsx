import React from 'react';
import {
  Box,
  Avatar,
  AvatarGroup,
  Typography,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  Done as CheckIcon,
  DoneAll as DoubleCheckIcon,
  Schedule as PendingIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

type MessageSeenStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error';

interface SeenByUser {
  id: string;
  username: string;
  avatar_url?: string;
  seenAt: Date;
}

interface MessageSeenIndicatorProps {
  status: MessageSeenStatus;
  seenBy?: SeenByUser[];
  showAvatars?: boolean;
  maxAvatars?: number;
  size?: 'small' | 'medium';
  showTooltip?: boolean;
}

export const MessageSeenIndicator: React.FC<MessageSeenIndicatorProps> = ({
  status,
  seenBy = [],
  showAvatars = true,
  maxAvatars = 3,
  size = 'small',
  showTooltip = true,
}) => {
  const getStatusIcon = () => {
    const iconSize = size === 'small' ? 'small' as const : 'medium' as const;
    
    switch (status) {
      case 'sending':
        return (
          <PendingIcon 
            fontSize={iconSize}
            sx={{ 
              color: 'text.secondary',
              animation: 'pulse 1.5s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 0.5 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.5 },
              },
            }} 
          />
        );
      case 'sent':
        return <CheckIcon fontSize={iconSize} sx={{ color: 'text.secondary' }} />;
      case 'delivered':
        return <DoubleCheckIcon fontSize={iconSize} sx={{ color: 'text.secondary' }} />;
      case 'read':
        return <DoubleCheckIcon fontSize={iconSize} sx={{ color: 'primary.main' }} />;
      case 'error':
        return <ErrorIcon fontSize={iconSize} sx={{ color: 'error.main' }} />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'sending':
        return 'Sending...';
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'read':
        return seenBy.length > 0 ? `Read by ${seenBy.length}` : 'Read';
      case 'error':
        return 'Failed to send';
      default:
        return '';
    }
  };

  const formatSeenTooltip = () => {
    if (seenBy.length === 0) return getStatusText();
    
    const names = seenBy.map(user => user.username).join(', ');
    const latestSeen = seenBy.reduce((latest, user) => 
      user.seenAt > latest ? user.seenAt : latest, seenBy[0].seenAt
    );
    
    const timeAgo = formatTimeAgo(latestSeen);
    
    return `Read by ${names} ${timeAgo}`;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const content = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        opacity: status === 'error' ? 1 : 0.7,
      }}
    >
      {/* Status Icon */}
      <Fade in timeout={300}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {getStatusIcon()}
        </Box>
      </Fade>

      {/* Seen By Avatars */}
      {showAvatars && seenBy.length > 0 && status === 'read' && (
        <Fade in timeout={500}>
          <AvatarGroup
            max={maxAvatars}
            sx={{
              '& .MuiAvatar-root': {
                width: size === 'small' ? 16 : 20,
                height: size === 'small' ? 16 : 20,
                fontSize: size === 'small' ? '0.6rem' : '0.7rem',
                border: '1px solid',
                borderColor: 'background.paper',
              },
              '& .MuiAvatarGroup-avatar': {
                fontSize: size === 'small' ? '0.5rem' : '0.6rem',
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
              },
            }}
          >
            {seenBy.map((user) => (
              <Avatar
                key={user.id}
                src={user.avatar_url}
                alt={user.username}
              >
                {getInitials(user.username)}
              </Avatar>
            ))}
          </AvatarGroup>
        </Fade>
      )}

      {/* Status Text (for error state or when avatars are disabled) */}
      {(status === 'error' || (!showAvatars && seenBy.length > 0)) && (
        <Typography
          variant="caption"
          sx={{
            color: status === 'error' ? 'error.main' : 'text.secondary',
            fontWeight: status === 'error' ? 600 : 400,
            fontSize: size === 'small' ? '0.7rem' : '0.75rem',
          }}
        >
          {status === 'error' ? 'Failed' : `${seenBy.length} read`}
        </Typography>
      )}
    </Box>
  );

  if (showTooltip) {
    return (
      <Tooltip title={formatSeenTooltip()} arrow placement="top">
        {content}
      </Tooltip>
    );
  }

  return content;
}; 