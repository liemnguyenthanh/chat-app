import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tooltip,
  Chip,
  IconButton,
  Collapse,
  Alert,
} from '@mui/material';
import {
  Schedule as PendingIcon,
  Done as SentIcon,
  DoneAll as DeliveredIcon,
  Visibility as ReadIcon,
  Error as ErrorIcon,
  Refresh as RetryIcon,
  Info as InfoIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
} from '@mui/icons-material';

type MessageStatusType = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'encrypting';

interface MessageStatusProps {
  status: MessageStatusType;
  timestamp?: Date;
  errorMessage?: string;
  onRetry?: () => void;
  showTimestamp?: boolean;
  showDetails?: boolean;
  compact?: boolean;
  readByCount?: number;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({
  status,
  timestamp = new Date(),
  errorMessage,
  onRetry,
  showTimestamp = true,
  showDetails = false,
  compact = false,
  readByCount = 0,
}) => {
  const [showDetailedStatus, setShowDetailedStatus] = useState(false);

  const getStatusConfig = (statusType: MessageStatusType) => {
    switch (statusType) {
      case 'pending':
        return {
          icon: <PendingIcon fontSize="small" />,
          color: 'text.secondary',
          text: 'Sending',
          description: 'Message is being sent...',
          chipColor: 'default' as const,
          animate: true,
        };
      case 'sent':
        return {
          icon: <SentIcon fontSize="small" />,
          color: 'text.secondary',
          text: 'Sent',
          description: 'Message sent to server',
          chipColor: 'default' as const,
          animate: false,
        };
      case 'delivered':
        return {
          icon: <DeliveredIcon fontSize="small" />,
          color: 'text.secondary',
          text: 'Delivered',
          description: 'Message delivered to recipient(s)',
          chipColor: 'primary' as const,
          animate: false,
        };
      case 'read':
        return {
          icon: <ReadIcon fontSize="small" />,
          color: 'primary.main',
          text: readByCount > 0 ? `Read by ${readByCount}` : 'Read',
          description: 'Message has been read',
          chipColor: 'success' as const,
          animate: false,
        };
      case 'failed':
        return {
          icon: <ErrorIcon fontSize="small" />,
          color: 'error.main',
          text: 'Failed',
          description: errorMessage || 'Failed to send message',
          chipColor: 'error' as const,
          animate: false,
        };
      case 'encrypting':
        return {
          icon: <InfoIcon fontSize="small" />,
          color: 'warning.main',
          text: 'Encrypting',
          description: 'Message is being encrypted...',
          chipColor: 'warning' as const,
          animate: true,
        };
      default:
        return {
          icon: <PendingIcon fontSize="small" />,
          color: 'text.secondary',
          text: 'Unknown',
          description: 'Unknown status',
          chipColor: 'default' as const,
          animate: false,
        };
    }
  };

  const config = getStatusConfig(status);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    
    // Format as time for today, date for older
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  const tooltipContent = `${config.description}${showTimestamp ? ` • ${formatTimestamp(timestamp)}` : ''}`;

  if (compact) {
    return (
      <Tooltip title={tooltipContent} arrow>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: config.color,
            opacity: 0.8,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              animation: config.animate ? 'pulse 1.5s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { opacity: 0.5 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.5 },
              },
            }}
          >
            {config.icon}
          </Box>
          {showTimestamp && (
            <Typography variant="caption" sx={{ color: 'inherit', fontSize: '0.7rem' }}>
              {formatTimestamp(timestamp)}
            </Typography>
          )}
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Status Chip */}
        <Chip
          icon={config.icon}
          label={config.text}
          size="small"
          color={config.chipColor}
          variant={status === 'read' ? 'filled' : 'outlined'}
          sx={{
            animation: config.animate ? 'pulse 1.5s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { opacity: 0.7 },
              '50%': { opacity: 1 },
              '100%': { opacity: 0.7 },
            },
          }}
        />

        {/* Timestamp */}
        {showTimestamp && (
          <Typography variant="caption" color="text.secondary">
            {formatTimestamp(timestamp)}
          </Typography>
        )}

        {/* Retry Button */}
        {status === 'failed' && onRetry && (
          <IconButton
            size="small"
            onClick={onRetry}
            color="error"
            sx={{ ml: 'auto' }}
          >
            <RetryIcon fontSize="small" />
          </IconButton>
        )}

        {/* Details Toggle */}
        {showDetails && (
          <IconButton
            size="small"
            onClick={() => setShowDetailedStatus(!showDetailedStatus)}
            sx={{ color: 'text.secondary' }}
          >
            {showDetailedStatus ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
          </IconButton>
        )}
      </Box>

      {/* Error Alert */}
      {status === 'failed' && errorMessage && (
        <Alert
          severity="error"
          action={
            onRetry && (
              <IconButton
                color="inherit"
                size="small"
                onClick={onRetry}
              >
                <RetryIcon fontSize="small" />
              </IconButton>
            )
          }
        >
          <Typography variant="caption">
            {errorMessage}
          </Typography>
        </Alert>
      )}

      {/* Detailed Status */}
      {showDetails && (
        <Collapse in={showDetailedStatus}>
          <Box
            sx={{
              p: 1,
              bgcolor: 'action.hover',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              <strong>Status:</strong> {config.description}
            </Typography>
            <br />
            <Typography variant="caption" color="text.secondary">
              <strong>Time:</strong> {timestamp.toLocaleString()}
            </Typography>
            {readByCount > 0 && (
              <>
                <br />
                <Typography variant="caption" color="text.secondary">
                  <strong>Read by:</strong> {readByCount} people
                </Typography>
              </>
            )}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}; 