import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Fade,
  Slide,
  Alert,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  SignalWifi4Bar as SignalStrongIcon,
  SignalWifi2Bar as SignalWeakIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error';

interface ConnectionStatusProps {
  connectionState?: ConnectionState;
  onRetry?: () => void;
  showDetails?: boolean;
  position?: 'top' | 'bottom';
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connectionState = 'connected',
  onRetry,
  showDetails = true,
  position = 'top',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date>(new Date());
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // Show status indicator when not connected
    setIsVisible(connectionState !== 'connected');
    
    // Show alert for connection issues
    setShowAlert(connectionState === 'disconnected' || connectionState === 'error');
    
    // Update last seen timestamp when connected
    if (connectionState === 'connected') {
      setLastSeen(new Date());
    }
  }, [connectionState]);

  const getStatusConfig = (state: ConnectionState) => {
    switch (state) {
      case 'connected':
        return {
          color: 'success' as const,
          icon: <SignalStrongIcon fontSize="small" />,
          text: 'Connected',
          bgColor: 'rgba(76, 175, 80, 0.1)',
          textColor: '#4caf50',
        };
      case 'connecting':
        return {
          color: 'warning' as const,
          icon: <SignalWeakIcon fontSize="small" />,
          text: 'Connecting...',
          bgColor: 'rgba(255, 152, 0, 0.1)',
          textColor: '#ff9800',
        };
      case 'disconnected':
        return {
          color: 'error' as const,
          icon: <WifiOffIcon fontSize="small" />,
          text: 'Disconnected',
          bgColor: 'rgba(244, 67, 54, 0.1)',
          textColor: '#f44336',
        };
      case 'error':
        return {
          color: 'error' as const,
          icon: <WifiOffIcon fontSize="small" />,
          text: 'Connection Error',
          bgColor: 'rgba(244, 67, 54, 0.1)',
          textColor: '#f44336',
        };
    }
  };

  const config = getStatusConfig(connectionState);

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Connection Status Indicator */}
      <Fade in={isVisible}>
        <Box
          sx={{
            position: 'fixed',
            [position]: 16,
            right: 16,
            zIndex: 1300,
            minWidth: showDetails ? 200 : 'auto',
          }}
        >
          <Chip
            icon={config.icon}
            label={
              showDetails ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="caption" fontWeight={600}>
                    {config.text}
                  </Typography>
                  {connectionState === 'disconnected' && (
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Last seen: {formatLastSeen(lastSeen)}
                    </Typography>
                  )}
                </Box>
              ) : config.text
            }
            color={config.color}
            variant="filled"
            sx={{
              bgcolor: config.bgColor,
              color: config.textColor,
              '& .MuiChip-icon': {
                color: config.textColor,
              },
              animation: connectionState === 'connecting' ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.5 },
                '100%': { opacity: 1 },
              },
            }}
            clickable={!!onRetry && (connectionState === 'disconnected' || connectionState === 'error')}
            onClick={onRetry}
            deleteIcon={onRetry ? <RefreshIcon fontSize="small" /> : undefined}
            onDelete={onRetry && (connectionState === 'disconnected' || connectionState === 'error') ? onRetry : undefined}
          />
        </Box>
      </Fade>

      {/* Connection Alert */}
      <Collapse in={showAlert}>
        <Alert
          severity={connectionState === 'error' ? 'error' : 'warning'}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              {onRetry && (
                <IconButton
                  color="inherit"
                  size="small"
                  onClick={onRetry}
                  aria-label="retry connection"
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              )}
              <IconButton
                color="inherit"
                size="small"
                onClick={() => setShowAlert(false)}
                aria-label="close alert"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          }
          sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            right: 16,
            zIndex: 1300,
            mx: 2,
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            {connectionState === 'error' ? 'Connection Failed' : 'You\'re offline'}
          </Typography>
          <Typography variant="caption">
            {connectionState === 'error' 
              ? 'There was an error connecting to the server. Please try again.'
              : 'Check your internet connection and try again.'
            }
          </Typography>
        </Alert>
      </Collapse>
    </>
  );
}; 