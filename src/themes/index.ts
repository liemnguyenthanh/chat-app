import theme from "./theme";

// Chat-specific theme utilities
export const chatColors = {
  // Message bubble colors
  userMessage: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    backgroundHover: "linear-gradient(135deg, #8fa4f3 0%, #9575cd 100%)",
    text: "#ffffff",
  },
  otherMessage: {
    background: "#2d3748",
    backgroundHover: "#4a5568",
    text: "#e2e8f0",
  },
  
  // System and status colors
  systemMessage: {
    background: "#1a202c",
    text: "#a0aec0",
    border: "#4a5568",
  },
  
  // Mention and link colors
  mention: {
    background: "rgba(49, 130, 206, 0.2)",
    text: "#63b3ed",
    border: "#3182ce",
  },
  
  // Reaction colors
  reactions: {
    background: "#2d3748",
    backgroundHover: "#4a5568",
    backgroundActive: "rgba(102, 126, 234, 0.3)",
    text: "#e2e8f0",
    border: "#4a5568",
  },
  
  // Online status
  onlineStatus: {
    online: "#38a169",
    away: "#d69e2e",
    offline: "#718096",
  },
  
  // Hover and focus states
  hover: "rgba(102, 126, 234, 0.1)",
  focus: "rgba(102, 126, 234, 0.2)",
  active: "rgba(102, 126, 234, 0.3)",
};

// Spacing utilities for chat components
export const chatSpacing = {
  messagePadding: "12px 16px",
  messageMargin: "4px 0",
  bubbleRadius: "18px",
  avatarSize: {
    small: 32,
    medium: 40,
    large: 48,
  },
  reactions: {
    padding: "4px 8px",
    margin: "2px 4px",
    radius: "12px",
  },
};

// Typography utilities for chat
export const chatTypography = {
  messageText: {
    fontSize: "0.95rem",
    lineHeight: 1.4,
    fontWeight: 400,
  },
  timestamp: {
    fontSize: "0.75rem",
    lineHeight: 1,
    fontWeight: 400,
    opacity: 0.7,
  },
  username: {
    fontSize: "0.875rem",
    lineHeight: 1,
    fontWeight: 600,
  },
  systemMessage: {
    fontSize: "0.8rem",
    lineHeight: 1.3,
    fontWeight: 400,
    fontStyle: "italic",
  },
};

export { theme };
export default theme;