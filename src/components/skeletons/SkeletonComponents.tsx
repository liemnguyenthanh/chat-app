import React from 'react';
import {
  Box,
  Skeleton,
  Avatar,
  Paper,
  Divider,
  Stack,
  Fade,
  keyframes,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Enhanced skeleton animation
const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const AnimatedSkeleton = styled(Skeleton)(({ theme }) => ({
  '&::after': {
    animationDuration: '1.6s',
  },
}));

const PulseSkeleton = styled(Box)(({ theme }) => ({
  animation: `${shimmer} 1.6s ease-in-out infinite`,
  background: `linear-gradient(
    90deg,
    ${theme.palette.grey[300]} 25%,
    ${theme.palette.grey[200]} 37%,
    ${theme.palette.grey[300]} 63%
  )`,
  backgroundSize: '200px 100%',
  borderRadius: theme.shape.borderRadius,
}));

// Base skeleton for message bubbles
export const MessageBubbleSkeleton: React.FC<{ align?: 'left' | 'right' }> = ({ 
  align = 'left' 
}) => {
  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
          mb: 1,
          px: 2,
        }}
      >
        {align === 'left' && (
          <AnimatedSkeleton variant="circular" width={32} height={32} sx={{ mr: 1 }} />
        )}
        <Box sx={{ maxWidth: '70%' }}>
          <AnimatedSkeleton
            variant="rectangular"
            width={Math.random() * 200 + 100}
            height={40}
            sx={{
              borderRadius: 2,
              mb: 0.5,
            }}
          />
          <AnimatedSkeleton variant="text" width={60} height={16} />
        </Box>
        {align === 'right' && (
          <AnimatedSkeleton variant="circular" width={32} height={32} sx={{ ml: 1 }} />
        )}
      </Box>
    </Fade>
  );
};



// Skeleton for message groups
export const MessageGroupSkeleton: React.FC = () => {
  const messageCount = Math.floor(Math.random() * 3) + 1;
  
  return (
    <Box sx={{ mb: 2 }}>
      {Array.from({ length: messageCount }).map((_, index) => (
        <MessageBubbleSkeleton 
          key={index} 
          align={Math.random() > 0.5 ? 'right' : 'left'} 
        />
      ))}
    </Box>
  );
};

// Skeleton for room list items
export const RoomListItemSkeleton: React.FC = () => {
  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <AnimatedSkeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
        <Box sx={{ flex: 1 }}>
          <AnimatedSkeleton variant="text" width="60%" height={20} sx={{ mb: 0.5 }} />
          <AnimatedSkeleton variant="text" width="80%" height={16} />
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <AnimatedSkeleton variant="text" width={40} height={16} sx={{ mb: 0.5 }} />
          <AnimatedSkeleton variant="circular" width={20} height={20} />
        </Box>
      </Box>
    </Fade>
  );
};

// Skeleton for typing indicator
export const TypingIndicatorSkeleton: React.FC = () => {
  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          px: 2,
          py: 1,
        }}
      >
        <Avatar sx={{ width: 32, height: 32 }}>
          <AnimatedSkeleton variant="circular" width={32} height={32} />
        </Avatar>
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            bgcolor: 'grey.100',
            borderRadius: 2,
            minWidth: 60,
          }}
        >
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <AnimatedSkeleton variant="circular" width={8} height={8} animation="pulse" />
            <AnimatedSkeleton variant="circular" width={8} height={8} animation="pulse" />
            <AnimatedSkeleton variant="circular" width={8} height={8} animation="pulse" />
          </Box>
        </Paper>
      </Box>
    </Fade>
  );
};

// Skeleton for conversation header
export const ConversationHeaderSkeleton: React.FC = () => {
  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <AnimatedSkeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
        <Box sx={{ flex: 1 }}>
          <AnimatedSkeleton variant="text" width="40%" height={24} sx={{ mb: 0.5 }} />
          <AnimatedSkeleton variant="text" width="60%" height={16} />
        </Box>
        <AnimatedSkeleton variant="rectangular" width={32} height={32} sx={{ borderRadius: 1 }} />
      </Box>
    </Fade>
  );
};

// Skeleton for profile card
export const ProfileCardSkeleton: React.FC = () => {
  return (
    <Fade in timeout={300}>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <AnimatedSkeleton variant="circular" width={80} height={80} sx={{ mx: 'auto', mb: 2 }} />
        <AnimatedSkeleton variant="text" width="60%" height={24} sx={{ mx: 'auto', mb: 1 }} />
        <AnimatedSkeleton variant="text" width="80%" height={16} sx={{ mx: 'auto', mb: 2 }} />
        <AnimatedSkeleton variant="rectangular" width="100%" height={36} sx={{ borderRadius: 1 }} />
      </Paper>
    </Fade>
  );
};

// Skeleton for invitation items
export const InvitationItemSkeleton: React.FC = () => {
  return (
    <Fade in timeout={300}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AnimatedSkeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Box sx={{ flex: 1 }}>
            <AnimatedSkeleton variant="text" width="60%" height={20} sx={{ mb: 0.5 }} />
            <AnimatedSkeleton variant="text" width="40%" height={16} />
          </Box>
          <AnimatedSkeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
        </Box>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <AnimatedSkeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
          <AnimatedSkeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
        </Box>
      </Paper>
    </Fade>
  );
};

// Skeleton for sidebar
export const SidebarSkeleton: React.FC = () => {
  return (
    <Fade in timeout={300}>
      <Box sx={{ width: 280, height: '100vh', bgcolor: 'background.paper' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <AnimatedSkeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
          <AnimatedSkeleton variant="rectangular" width="100%" height={36} sx={{ borderRadius: 1 }} />
        </Box>
        <Box sx={{ p: 1 }}>
          {Array.from({ length: 8 }).map((_, index) => (
            <RoomListItemSkeleton key={index} />
          ))}
        </Box>
      </Box>
    </Fade>
  );
};

// Skeleton for message list
export const MessageListSkeleton: React.FC = () => {
  return (
    <Fade in timeout={300}>
      <Box sx={{ flex: 1, overflow: 'hidden', p: 1 }}>
        {Array.from({ length: 6 }).map((_, index) => (
          <MessageGroupSkeleton key={index} />
        ))}
      </Box>
    </Fade>
  );
};

// Skeleton for loading more messages
export const LoadMoreMessagesSkeleton: React.FC = () => {
  return (
    <Fade in timeout={300}>
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <AnimatedSkeleton variant="rectangular" width={120} height={32} sx={{ borderRadius: 1 }} />
      </Box>
    </Fade>
  );
};