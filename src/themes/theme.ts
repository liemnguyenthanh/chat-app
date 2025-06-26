import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#667eea",
      light: "#8fa4f3",
      dark: "#4c63d2",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#764ba2",
      light: "#9575cd",
      dark: "#512da8",
      contrastText: "#ffffff",
    },
    background: {
      default: "#09090a", // Deep dark background
      paper: "#09090a", // Slightly lighter for cards/papers
    },
    text: {
      primary: "#e2e8f0", // Light text for good contrast
      secondary: "#a0aec0", // Muted text for secondary content
    },
    divider: "#2d3748",
    grey: {
      50: "#171923",
      100: "#1a202c",
      200: "#2d3748",
      300: "#4a5568",
      400: "#718096",
      500: "#a0aec0",
      600: "#cbd5e0",
      700: "#e2e8f0",
      800: "#edf2f7",
      900: "#f7fafc",
    },
    // Chat-specific colors
    info: {
      main: "#3182ce", // For mentions and links
      light: "#63b3ed",
      dark: "#2c5282",
    },
    success: {
      main: "#38a169", // For online status
      light: "#68d391",
      dark: "#2f855a",
    },
    warning: {
      main: "#d69e2e", // For warnings
      light: "#f6e05e",
      dark: "#b7791f",
    },
    error: {
      main: "#e53e3e", // For errors
      light: "#fc8181",
      dark: "#c53030",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: "2.5rem",
      lineHeight: 1.2,
      color: "#e2e8f0",
    },
    h2: {
      fontWeight: 700,
      fontSize: "2rem",
      lineHeight: 1.3,
      color: "#e2e8f0",
    },
    h3: {
      fontWeight: 600,
      fontSize: "1.75rem",
      lineHeight: 1.3,
      color: "#e2e8f0",
    },
    h4: {
      fontWeight: 600,
      fontSize: "1.5rem",
      lineHeight: 1.4,
      color: "#e2e8f0",
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.25rem",
      lineHeight: 1.4,
      color: "#e2e8f0",
    },
    h6: {
      fontWeight: 600,
      fontSize: "1.125rem",
      lineHeight: 1.4,
      color: "#e2e8f0",
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
      color: "#e2e8f0",
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
      color: "#a0aec0",
    },
    button: {
      fontWeight: 500,
      textTransform: "none" as const,
    },
  },
  shape: {
    borderRadius: 16, // More rounded for modern look
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#0f0f23",
          scrollbarWidth: "thin",
          scrollbarColor: "#4a5568 #1a1a3a",
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#1a1a3a",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#4a5568",
            borderRadius: "4px",
            "&:hover": {
              backgroundColor: "#718096",
            },
          },
        },
        // Add keyframe animations
        "@keyframes pulse": {
          "0%": {
            opacity: 1,
          },
          "50%": {
            opacity: 0.5,
          },
          "100%": {
            opacity: 1,
          },
        },
        "@keyframes messageSlideIn": {
          "0%": {
            opacity: 0,
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: 1,
            transform: "translateY(0)",
          },
        },
        "@keyframes buttonBounce": {
          "0%": {
            transform: "scale(1)",
          },
          "50%": {
            transform: "scale(0.95)",
          },
          "100%": {
            transform: "scale(1)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "10px 20px",
          fontWeight: 500,
          textTransform: "none",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:active": {
            animation: "buttonBounce 0.1s ease-in-out",
          },
        },
        contained: {
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
          "&:hover": {
            background: "linear-gradient(135deg, #8fa4f3 0%, #9575cd 100%)",
            boxShadow: "0 6px 16px rgba(102, 126, 234, 0.4)",
            transform: "translateY(-1px)",
          },
        },
        outlined: {
          borderColor: "#4a5568",
          color: "#e2e8f0",
          "&:hover": {
            borderColor: "#667eea",
            backgroundColor: "rgba(102, 126, 234, 0.1)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#1a1a3a",
          backgroundImage: "none",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
          border: "1px solid #2d3748",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#1a1a3a",
          backgroundImage: "none",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          borderBottom: "1px solid #2d3748",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: "2px 0",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: "rgba(102, 126, 234, 0.1)",
            transform: "translateX(4px)",
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(102, 126, 234, 0.2)",
            "&:hover": {
              backgroundColor: "rgba(102, 126, 234, 0.3)",
            },
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#2d3748",
            borderRadius: 12,
            transition: "all 0.2s ease-in-out",
            "& fieldset": {
              borderColor: "#4a5568",
            },
            "&:hover fieldset": {
              borderColor: "#667eea",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#667eea",
              boxShadow: "0 0 0 2px rgba(102, 126, 234, 0.2)",
            },
          },
          "& .MuiInputLabel-root": {
            color: "#a0aec0",
          },
          "& .MuiOutlinedInput-input": {
            color: "#e2e8f0",
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: "2px solid #4a5568",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            borderColor: "#667eea",
            transform: "scale(1.05)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: "#2d3748",
          color: "#e2e8f0",
          borderRadius: 12,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: "#4a5568",
            transform: "translateY(-1px)",
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#2d3748",
          color: "#e2e8f0",
          border: "1px solid #4a5568",
          borderRadius: 8,
          fontSize: "0.875rem",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#ffffff",
          "&:hover": {
            background: "linear-gradient(135deg, #8fa4f3 0%, #9575cd 100%)",
            transform: "scale(1.1)",
          },
        },
      },
    },
  },
});

export default theme;