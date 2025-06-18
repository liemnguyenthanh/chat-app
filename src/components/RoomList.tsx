import Link from "next/link";
import React from "react";
import { useRouter } from "next/router";
import {
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
  Box,
  Badge,
  Avatar,
  ListItemAvatar,
} from "@mui/material";
import {
  Tag as TagIcon,
  People as PeopleIcon,
  Lock as LockIcon,
} from "@mui/icons-material";

export interface Room {
  id: string;
  name: string;
  lastMessage?: string;
  unreadCount?: number;
  isPrivate?: boolean;
  memberCount?: number;
  lastActivity?: string;
}

interface RoomListProps {
  rooms: Room[];
}

const RoomList: React.FC<RoomListProps> = ({ rooms }) => {
  const router = useRouter();
  const currentRoomId = router.query.id;

  if (rooms.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          No rooms available
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          Create your first room to get started!
        </Typography>
      </Box>
    );
  }

  const formatLastActivity = (lastActivity?: string) => {
    if (!lastActivity) return "";
    const date = new Date(lastActivity);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return "now";
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h`;
    return `${Math.floor(diffInHours / 24)}d`;
  };

  return (
    <List sx={{ px: 1 }}>
      {rooms.map((room) => {
        const isActive = currentRoomId === room.id;
        
        return (
          <Link key={room.id} href={`/rooms/${room.id}`} passHref legacyBehavior>
            <ListItemButton
              component="a"
              sx={{
                borderRadius: 2,
                mb: 0.5,
                bgcolor: isActive ? "primary.main" : "transparent",
                color: isActive ? "primary.contrastText" : "inherit",
                "&:hover": {
                  bgcolor: isActive ? "primary.dark" : "action.hover",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              <ListItemAvatar>
                <Badge
                  badgeContent={room.unreadCount || 0}
                  color="error"
                  invisible={!room.unreadCount}
                >
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: isActive ? "rgba(255,255,255,0.2)" : "primary.light",
                      color: isActive ? "inherit" : "primary.main",
                    }}
                  >
                    {room.isPrivate ? <LockIcon /> : <TagIcon />}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: room.unreadCount ? 600 : 400,
                        color: isActive ? "inherit" : "text.primary",
                      }}
                    >
                      {room.name}
                    </Typography>
                    {room.memberCount && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <PeopleIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption">
                          {room.memberCount}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                }
                secondary={
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: isActive ? "rgba(255,255,255,0.7)" : "text.secondary",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "120px",
                      }}
                    >
                      {room.lastMessage ?? "No messages yet"}
                    </Typography>
                    {room.lastActivity && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: isActive ? "rgba(255,255,255,0.5)" : "text.disabled",
                          fontSize: "0.7rem",
                        }}
                      >
                        {formatLastActivity(room.lastActivity)}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItemButton>
          </Link>
        );
      })}
    </List>
  );
};

export default RoomList;