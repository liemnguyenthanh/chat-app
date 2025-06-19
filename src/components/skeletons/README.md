# Skeleton Loading Components

This directory contains reusable skeleton loading components and hooks for the Berally Chat application. These components provide smooth loading states that improve user experience by showing placeholder content while data is being fetched.

## Components

### Core Skeleton Components

- **`MessageBubbleSkeleton`** - Skeleton for individual message bubbles
- **`MessageGroupSkeleton`** - Skeleton for groups of messages
- **`MessageListSkeleton`** - Skeleton for the entire message list
- **`RoomListItemSkeleton`** - Skeleton for room list items
- **`ConversationHeaderSkeleton`** - Skeleton for conversation headers
- **`TypingIndicatorSkeleton`** - Skeleton for typing indicators
- **`InvitationItemSkeleton`** - Skeleton for invitation items
- **`ProfileCardSkeleton`** - Skeleton for profile cards
- **`SidebarSkeleton`** - Skeleton for the entire sidebar
- **`LoadMoreMessagesSkeleton`** - Skeleton for load more buttons

### Enhanced Features

- **Smooth Animations**: All skeletons use enhanced shimmer animations
- **Fade Transitions**: Components fade in/out smoothly
- **Responsive Design**: Skeletons adapt to different screen sizes
- **Consistent Styling**: Follows Material-UI design system

## Hooks

### `useSkeletonLoading(isLoading, minDisplayTime)`

Ensures skeletons are shown for a minimum duration to prevent flashing.

```typescript
const showSkeleton = useSkeletonLoading(loading, 800); // Show for at least 800ms
```

### `useStaggeredSkeleton(isLoading, itemCount, staggerDelay)`

Creates staggered loading animations for lists.

```typescript
const visibleItems = useStaggeredSkeleton(loading, 6, 150); // 6 items, 150ms delay
```

### `useSkeletonTransition(isLoading, transitionDuration)`

Provides smooth transitions between loading and content states.

```typescript
const { showSkeleton, showContent, isTransitioning } = useSkeletonTransition(loading, 300);
```

## Usage Examples

### Basic Usage

```tsx
import { MessageListSkeleton } from '@/components/skeletons';

function MessageContainer({ loading, messages }) {
  if (loading && messages.length === 0) {
    return <MessageListSkeleton />;
  }
  
  return <MessageList messages={messages} />;
}
```

### Enhanced Loading with Hooks

```tsx
import { useSkeletonLoading } from '@/hooks/useSkeletonLoading';
import { RoomListItemSkeleton } from '@/components/skeletons';

function RoomList({ rooms, loading }) {
  const showSkeleton = useSkeletonLoading(loading, 600);
  const visibleItems = useStaggeredSkeleton(showSkeleton, 6, 150);
  
  if (showSkeleton) {
    return (
      <Box>
        {Array.from({ length: visibleItems }).map((_, index) => (
          <RoomListItemSkeleton key={index} />
        ))}
      </Box>
    );
  }
  
  return <ActualRoomList rooms={rooms} />;
}
```

### Conditional Loading States

```tsx
function ConversationView({ roomId, loading }) {
  const showSkeleton = useSkeletonLoading(loading, 500);
  
  return (
    <Box>
      {showSkeleton ? (
        <>
          <ConversationHeaderSkeleton />
          <MessageListSkeleton />
        </>
      ) : (
        <>
          <ConversationHeader roomId={roomId} />
          <MessageList roomId={roomId} />
        </>
      )}
    </Box>
  );
}
```

## Best Practices

1. **Minimum Display Time**: Use `useSkeletonLoading` with 500-800ms minimum display time to prevent flashing

2. **Staggered Animations**: Use `useStaggeredSkeleton` for lists to create more natural loading experiences

3. **Consistent Patterns**: Match skeleton layouts closely to actual content

4. **Performance**: Skeletons are lightweight and don't impact performance

5. **Accessibility**: Skeletons include proper ARIA labels and respect user motion preferences

## Customization

All skeleton components accept standard Material-UI `sx` props for customization:

```tsx
<MessageBubbleSkeleton 
  align="right" 
  sx={{ 
    opacity: 0.7,
    '& .MuiSkeleton-root': {
      bgcolor: 'custom.skeleton'
    }
  }} 
/>
```

## Integration Points

Skeletons are integrated in:

- **Message Loading**: `MessageList.tsx`
- **Room Loading**: `RoomList.tsx`, `Sidebar.tsx`
- **Page Loading**: `rooms/[id].tsx`
- **Invitation Loading**: `InvitationsPanel.tsx`

For new components, follow the established patterns and use the provided hooks for consistent behavior.