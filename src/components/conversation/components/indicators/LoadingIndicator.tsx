import React from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Skeleton,
  Typography,
  Fade,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

type LoadingType = 'circular' | 'linear' | 'skeleton' | 'dots' | 'upload' | 'download';

interface LoadingIndicatorProps {
  type?: LoadingType;
  size?: 'small' | 'medium' | 'large';
  message?: string;
  progress?: number; // 0-100 for linear progress
  color?: 'primary' | 'secondary' | 'inherit';
  fullWidth?: boolean;
  centerOnParent?: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  type = 'circular',
  size = 'medium',
  message,
  progress,
  color = 'primary',
  fullWidth = false,
  centerOnParent = false,
}) => {
  const getCircularSize = () => {
    switch (size) {
      case 'small': return 20;
      case 'medium': return 40;
      case 'large': return 60;
      default: return 40;
    }
  };

  const getSkeletonHeight = () => {
    switch (size) {
      case 'small': return 20;
      case 'medium': return 40;
      case 'large': return 60;
      default: return 40;
    }
  };

  const renderDots = () => (
    <Box
      sx={{
        display: 'flex',
        gap: 0.5,
        alignItems: 'center',
      }}
    >
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: size === 'small' ? 4 : size === 'large' ? 8 : 6,
            height: size === 'small' ? 4 : size === 'large' ? 8 : 6,
            borderRadius: '50%',
            bgcolor: color === 'primary' ? 'primary.main' : 
                   color === 'secondary' ? 'secondary.main' : 'text.secondary',
            animation: 'pulse 1.4s infinite ease-in-out',
            animationDelay: `${i * 0.16}s`,
            '@keyframes pulse': {
              '0%, 80%, 100%': {
                transform: 'scale(0)',
                opacity: 0.5,
              },
              '40%': {
                transform: 'scale(1)',
                opacity: 1,
              },
            },
          }}
        />
      ))}
    </Box>
  );

  const renderUploadDownload = () => {
    const Icon = type === 'upload' ? UploadIcon : DownloadIcon;
    const iconSize = size === 'small' ? 'small' as const : 'medium' as const;
    
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'bounce 1s infinite',
            '@keyframes bounce': {
              '0%, 20%, 50%, 80%, 100%': {
                transform: 'translateY(0)',
              },
              '40%': {
                transform: 'translateY(-10px)',
              },
              '60%': {
                transform: 'translateY(-5px)',
              },
            },
          }}
        >
          <Icon 
            fontSize={iconSize}
            color={color}
          />
        </Box>
        {progress !== undefined && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ width: '100%', maxWidth: 200 }}
            color={color}
          />
        )}
      </Box>
    );
  };

  const renderContent = () => {
    switch (type) {
      case 'circular':
        return (
          <CircularProgress
            size={getCircularSize()}
            color={color}
          />
        );
      
      case 'linear':
        return (
          <LinearProgress
            variant={progress !== undefined ? 'determinate' : 'indeterminate'}
            value={progress}
            color={color}
            sx={{ width: fullWidth ? '100%' : 200 }}
          />
        );
      
      case 'skeleton':
        return (
          <Skeleton
            variant="rectangular"
            width={fullWidth ? '100%' : 200}
            height={getSkeletonHeight()}
            animation="wave"
          />
        );
      
      case 'dots':
        return renderDots();
      
      case 'upload':
      case 'download':
        return renderUploadDownload();
      
      default:
        return (
          <CircularProgress
            size={getCircularSize()}
            color={color}
          />
        );
    }
  };

  const containerSx = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 1,
    ...(centerOnParent && {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }),
    ...(fullWidth && { width: '100%' }),
  };

  return (
    <Fade in timeout={300}>
      <Box sx={containerSx}>
        {renderContent()}
        
        {message && (
          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
            sx={{
              fontSize: size === 'small' ? '0.7rem' : '0.75rem',
              maxWidth: 200,
            }}
          >
            {message}
            {progress !== undefined && type !== 'upload' && type !== 'download' && (
              <span> ({Math.round(progress)}%)</span>
            )}
          </Typography>
        )}
      </Box>
    </Fade>
  );
}; 