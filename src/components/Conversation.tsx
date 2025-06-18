import React, { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import {
  Box,
  Typography,
  Stack,
  Paper,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Divider,
  InputAdornment,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem,
  Alert,
  Badge,
} from "@mui/material";
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SignalWifi4Bar as ConnectedIcon,
  SignalWifiOff as DisconnectedIcon,
} from "@mui/icons-material";
import { useMessagesContext, Message } from '@/contexts/MessagesContext';

interface ConversationProps {
  roomId: string;
  roomName: string;
}

const Conversation: React.FC<ConversationProps> = ({ roomId, roomName }) => {
  const user = useUser();
  const { 
    messages, 
    loading, 
    error, 
    typingUsers,
    sendingMessageId,
    failedMessages,
    sendMessage, 
    retryFailedMessage,
    removeFailedMessage,
    editMessage, 
    deleteMessage, 
    addReaction, 
    removeReaction, 
    loadMessages,
    startTyping,
    stopTyping
  } = useMessagesContext();
  
  const [newMessage, setNewMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [sending, setSending] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Monitor connection status
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(navigator.onLine);
    };

    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    checkConnection();

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  // Debug: Log realtime events
  useEffect(() => {
    console.log(`🏠 Room "${roomName}" (${roomId}) - Messages loaded:`, messages.length);
    if (messages.length > 0) {
      console.log('📝 Latest message:', messages[messages.length - 1]);
    }
  }, [messages, roomName, roomId]);

  useEffect(() => {
    if (typingUsers.length > 0) {
      console.log('⌨️ Users typing:', typingUsers.map(u => u.username));
    }
  }, [typingUsers]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (roomId) {
      loadMessages(roomId);
    }
  }, [roomId, loadMessages]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (roomId) {
        stopTyping(roomId);
      }
    };
  }, [roomId, stopTyping]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      // Stop typing indicator when sending message
      stopTyping(roomId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      const success = await sendMessage(roomId, newMessage);
      if (success) {
        setNewMessage("");
        scrollToBottom();
      }
    } finally {
      setSending(false);
    }
  };

  const handleTyping = useCallback(() => {
    if (!roomId) return;

    // Start typing indicator
    startTyping(roomId);
  }, [roomId, startTyping]);

  const handleEditMessage = async () => {
    if (editingMessageId && editingContent.trim()) {
      const success = await editMessage(editingMessageId, editingContent);
      if (success) {
        setEditingMessageId(null);
        setEditingContent("");
      }
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    await deleteMessage(messageId);
    setMenuAnchor(null);
    setSelectedMessageId(null);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    const message = messages.find(m => m.id === messageId);
    const userReacted = message?.reactions?.some(r => 
      r.emoji === emoji && r.users.includes(user?.id || '')
    );
    
    if (userReacted) {
      await removeReaction(messageId, emoji);
    } else {
      await addReaction(messageId, emoji);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getMessageAlignment = (authorId: string) => {
    return authorId === user?.id ? "flex-end" : "flex-start";
  };

  const getMessageColor = (authorId: string) => {
    return authorId === user?.id ? "primary.main" : "grey.100";
  };

  const getTextColor = (authorId: string) => {
    return authorId === user?.id ? "white" : "text.primary";
  };

  const handleMessageMenu = (event: React.MouseEvent<HTMLElement>, messageId: string) => {
    setMenuAnchor(event.currentTarget);
    setSelectedMessageId(messageId);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setSelectedMessageId(null);
  };

  const startEditing = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
    handleCloseMenu();
  };

  return (
    <>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes typingBounce {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
      `}</style>
      
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                #{roomName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {messages.length} messages
              </Typography>
            </Box>
            
            {/* Connection Status */}
            <Tooltip title={isConnected ? 'Connected' : 'Disconnected'}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isConnected ? (
                  <ConnectedIcon sx={{ color: 'success.main', fontSize: 20 }} />
                ) : (
                  <DisconnectedIcon sx={{ color: 'error.main', fontSize: 20 }} />
                )}
                <Typography variant="caption" color={isConnected ? 'success.main' : 'error.main'}>
                  {isConnected ? 'Online' : 'Offline'}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        </Box>

        {/* Messages */}
        <Box sx={{ flexGrow: 1, overflow: "auto", p: 2 }}>
          {loading && messages.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : messages.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Welcome to #{roomName}!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This is the beginning of your conversation.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {messages.map((msg, index) => {
                const isOwnMessage = msg.author_id === user?.id;
                const showAvatar = index === 0 || messages[index - 1].author?.username !== msg.author?.username;
                
                return (
                  <Box
                    key={msg.id}
                    sx={{
                      display: "flex",
                      justifyContent: getMessageAlignment(msg.author_id),
                      alignItems: "flex-end",
                      gap: 1,
                    }}
                  >
                    {!isOwnMessage && showAvatar && (
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.light" }}>
                        {msg.author?.username?.charAt(0).toUpperCase() || '?'}
                      </Avatar>
                    )}
                    {!isOwnMessage && !showAvatar && (
                      <Box sx={{ width: 32 }} />
                    )}
                    
                    <Box sx={{ maxWidth: "70%" }}>
                      {showAvatar && (
                        <Box sx={{ mb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {msg.author?.username || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(msg.created_at)}
                          </Typography>
                        </Box>
                      )}
                      
                      <Paper
                        sx={{
                          p: 1.5,
                          bgcolor: failedMessages.has(msg.id) ? 'error.light' : getMessageColor(msg.author_id),
                          color: failedMessages.has(msg.id) ? 'error.contrastText' : getTextColor(msg.author_id),
                          borderRadius: 2,
                          borderTopLeftRadius: isOwnMessage ? 2 : showAvatar ? 2 : 0.5,
                          borderTopRightRadius: isOwnMessage ? (showAvatar ? 2 : 0.5) : 2,
                          boxShadow: "none",
                          border: failedMessages.has(msg.id) ? "2px solid" : (isOwnMessage ? "none" : "1px solid"),
                          borderColor: failedMessages.has(msg.id) ? 'error.main' : "divider",
                          position: 'relative',
                          opacity: msg.id.startsWith('temp-') && !failedMessages.has(msg.id) ? 0.7 : 1,
                          transition: 'all 0.2s ease-in-out',
                        }}
                      >
                        {editingMessageId === msg.id ? (
                          <Box>
                            <TextField
                              fullWidth
                              multiline
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              variant="outlined"
                              size="small"
                              sx={{ mb: 1 }}
                            />
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton size="small" onClick={handleEditMessage}>
                                <SendIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => {
                                  setEditingMessageId(null);
                                  setEditingContent('');
                                }}
                              >
                                ×
                              </IconButton>
                            </Box>
                          </Box>
                        ) : (
                          <>
                            <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                              {msg.content}
                            </Typography>
                            
                            {/* Message Status Indicators */}
                            {msg.id.startsWith('temp-') && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                {failedMessages.has(msg.id) ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography variant="caption" color="error.main" sx={{ fontSize: '0.7rem' }}>
                                      Failed to send
                                    </Typography>
                                    <Tooltip title="Retry">
                                      <IconButton 
                                        size="small" 
                                        onClick={() => retryFailedMessage(msg.id)}
                                        sx={{ p: 0.25 }}
                                      >
                                        <Typography sx={{ fontSize: '0.7rem', cursor: 'pointer', color: 'primary.main' }}>
                                          ↻
                                        </Typography>
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Remove">
                                      <IconButton 
                                        size="small" 
                                        onClick={() => removeFailedMessage(msg.id)}
                                        sx={{ p: 0.25 }}
                                      >
                                        <Typography sx={{ fontSize: '0.7rem', cursor: 'pointer', color: 'error.main' }}>
                                          ×
                                        </Typography>
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                ) : sendingMessageId === msg.id ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <CircularProgress size={8} />
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                      Sending...
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    Sending...
                                  </Typography>
                                )}
                              </Box>
                            )}

                            {isOwnMessage && (
                              <IconButton
                                size="small"
                                sx={{ 
                                  position: 'absolute', 
                                  top: 4, 
                                  right: 4,
                                  opacity: 0.7,
                                  '&:hover': { opacity: 1 }
                                }}
                                onClick={(e) => handleMessageMenu(e, msg.id)}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            )}
                          </>
                        )}
                        
                        {/* Reactions */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                            {msg.reactions.map((reaction) => (
                              <Chip
                                key={reaction.emoji}
                                label={`${reaction.emoji} ${reaction.count}`}
                                size="small"
                                variant={reaction.users.includes(user?.id || '') ? 'filled' : 'outlined'}
                                onClick={() => handleReaction(msg.id, reaction.emoji)}
                                sx={{ height: 24, fontSize: '0.75rem' }}
                              />
                            ))}
                          </Box>
                        )}
                        
                        {/* Quick reactions */}
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 0.5, 
                          mt: 1, 
                          opacity: 0.7,
                          '&:hover': { opacity: 1 }
                        }}>
                          {['👍', '❤️', '😂', '😮', '😢', '😡'].map((emoji) => (
                            <IconButton
                              key={emoji}
                              size="small"
                              onClick={() => handleReaction(msg.id, emoji)}
                              sx={{ fontSize: '0.8rem', p: 0.25 }}
                            >
                              {emoji}
                            </IconButton>
                          ))}
                        </Box>
                      </Paper>
                    </Box>
                    
                    {isOwnMessage && showAvatar && (
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                        {msg.author?.username?.charAt(0).toUpperCase() || '?'}
                      </Avatar>
                    )}
                    {isOwnMessage && !showAvatar && (
                      <Box sx={{ width: 32 }} />
                    )}
                  </Box>
                );
              })}
              
              {/* Enhanced Typing Indicators */}
              {typingUsers.length > 0 && (
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "flex-end", 
                  gap: 1, 
                  pl: 1, 
                  py: 2,
                  mb: 1 
                }}>
                  {/* Avatars for typing users */}
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {typingUsers.slice(0, 3).map((user, index) => (
                      <Avatar 
                        key={user.user_id}
                        sx={{ 
                          width: 28, 
                          height: 28, 
                          bgcolor: `hsl(${index * 60}, 60%, 60%)`,
                          fontSize: '0.8rem',
                          ml: index > 0 ? -0.5 : 0,
                          border: '2px solid white',
                          zIndex: typingUsers.length - index,
                          animation: 'pulse 2s infinite'
                        }}
                      >
                        {user.username?.charAt(0).toUpperCase() || '?'}
                      </Avatar>
                    ))}
                    {typingUsers.length > 3 && (
                      <Avatar sx={{ 
                        width: 28, 
                        height: 28, 
                        bgcolor: "grey.400",
                        fontSize: '0.7rem',
                        ml: -0.5,
                        border: '2px solid white',
                        zIndex: 0
                      }}>
                        +{typingUsers.length - 3}
                      </Avatar>
                    )}
                  </Box>
                  
                  {/* Typing bubble */}
                  <Paper sx={{ 
                    px: 2, 
                    py: 1.5, 
                    bgcolor: "grey.100",
                    borderRadius: 4,
                    maxWidth: 280,
                    position: 'relative',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    animation: 'pulse 2s infinite',
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      left: -6,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 0,
                      height: 0,
                      borderTop: '6px solid transparent',
                      borderBottom: '6px solid transparent',
                      borderRight: '6px solid',
                      borderRightColor: 'grey.100'
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      {/* Animated typing dots */}
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 0.5,
                        alignItems: 'center'
                      }}>
                        {[0, 1, 2].map((i) => (
                          <Box
                            key={i}
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'grey.600',
                              animation: 'typingBounce 1.4s infinite ease-in-out both',
                              animationDelay: `${i * 0.16}s`
                            }}
                          />
                        ))}
                      </Box>
                      
                      {/* Username and typing text */}
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}
                      >
                        {typingUsers.length === 1 
                          ? `${typingUsers[0].username} is typing...` 
                          : typingUsers.length === 2 
                          ? `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`
                          : `${typingUsers[0].username} and ${typingUsers.length - 1} others are typing...`
                        }
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              )}
              
              <div ref={messagesEndRef} />
            </Stack>
          )}
          
          {error && (
            <Box sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1, mt: 2 }}>
              <Typography variant="body2">{error}</Typography>
            </Box>
          )}
        </Box>

        {/* Message Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleCloseMenu}
        >
          <MenuItem onClick={() => {
            const message = messages.find(m => m.id === selectedMessageId);
            if (message && message.content) {
              startEditing(message.id, message.content);
            }
          }}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
          </MenuItem>
          <MenuItem onClick={() => selectedMessageId && handleDeleteMessage(selectedMessageId)}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>

        {/* Message Input */}
        <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
          {!isConnected && (
            <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8rem' }}>
              You're offline. Messages will be sent when connection is restored.
            </Alert>
          )}
          
          <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder={isConnected ? "Type a message..." : "Offline - type to queue message"}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                
                // Clear any existing timeout
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }

                // Only trigger typing if there's actual content and user isn't just deleting
                if (e.target.value.trim() && isConnected) {
                  // Debounced typing indicator
                  typingTimeoutRef.current = setTimeout(() => {
                    handleTyping();
                  }, 300);
                } else {
                  // Stop typing immediately if field is empty
                  stopTyping(roomId);
                }
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              variant="outlined"
              size="small"
              disabled={sending}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  borderColor: !isConnected ? 'warning.main' : undefined,
                },
              }}
              InputProps={{
                endAdornment: sendingMessageId && (
                  <InputAdornment position="end">
                    <CircularProgress size={16} />
                  </InputAdornment>
                ),
              }}
            />
            <Tooltip title={!isConnected ? "Offline - message will be queued" : "Send message"}>
              <span>
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  sx={{
                    bgcolor: isConnected ? "primary.main" : "warning.main",
                    color: "white",
                    "&:hover": {
                      bgcolor: isConnected ? "primary.dark" : "warning.dark",
                    },
                    "&:disabled": {
                      bgcolor: "grey.300",
                      color: "grey.500",
                    },
                  }}
                >
                  {sending ? <CircularProgress size={20} /> : <SendIcon />}
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          {/* Show pending failed messages count */}
          {failedMessages.size > 0 && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Badge badgeContent={failedMessages.size} color="error">
                <Typography variant="caption" color="error.main">
                  Failed messages
                </Typography>
              </Badge>
              <Typography variant="caption" color="text.secondary">
                Tap retry on failed messages to resend
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
};

export default Conversation;