import { Room } from "@/components/rooms";

export const mockRooms: Room[] = [
  {
    id: "general",
    name: "General",
    lastMessage: "Hello everyone! Welcome to the chat.",
    unreadCount: 3,
    memberCount: 12,
    lastActivity: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
  },
  {
    id: "random",
    name: "Random",
    lastMessage: "Check this out! 🚀",
    unreadCount: 0,
    memberCount: 8,
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: "support",
    name: "Support",
    lastMessage: "Need help with authentication?",
    unreadCount: 1,
    isPrivate: true,
    memberCount: 4,
    lastActivity: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
  },
  {
    id: "announcements",
    name: "Announcements",
    lastMessage: "New features coming soon!",
    unreadCount: 0,
    memberCount: 25,
    lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
];