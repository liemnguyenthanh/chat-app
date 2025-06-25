// Main layout component
export { default as ChatLayout } from './ChatLayout';

// Export all layout sub-components
export { AppHeader } from './components/AppHeader';
export { UserMenu } from './components/UserMenu';
export { Sidebar, drawerWidth } from './components/Sidebar';
export { CreateRoomDialog } from './components/CreateRoomDialog';
export { CreateRoomFab } from './components/CreateRoomFab';
export { ModalsManager } from './components/ModalsManager';

// Export custom hook
export { useCreateRoom } from './hooks/useCreateRoom'; 