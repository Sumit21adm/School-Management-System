import { createTheme, type PaletteMode } from '@mui/material';

// Create Material Design 3 theme for School Management System
export const getTheme = (mode: PaletteMode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#1976d2', // Blue
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#9c27b0', // Purple
      light: '#ba68c8',
      dark: '#7b1fa2',
      contrastText: '#ffffff',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
    },
    background: {
      default: mode === 'light' ? '#f5f5f5' : '#121212',
      paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
    },
    text: {
      primary: mode === 'light' ? '#212121' : '#ffffff',
      secondary: mode === 'light' ? '#757575' : '#b0b0b0',
      disabled: mode === 'light' ? '#9e9e9e' : '#6e6e6e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none', // Keep normal case instead of uppercase
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8, // Rounded corners
  },
  ...(mode === 'light' ? {
    shadows: [
      'none',
      '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
      '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
      '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
      '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
      '0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)',
      '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
      '0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)',
      '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
      '0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)',
      '0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)',
      '0px 6px 7px -4px rgba(0,0,0,0.2),0px 11px 15px 1px rgba(0,0,0,0.14),0px 4px 20px 3px rgba(0,0,0,0.12)',
      '0px 7px 8px -4px rgba(0,0,0,0.2),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)',
      '0px 7px 8px -4px rgba(0,0,0,0.2),0px 13px 19px 2px rgba(0,0,0,0.14),0px 5px 24px 4px rgba(0,0,0,0.12)',
      '0px 7px 9px -4px rgba(0,0,0,0.2),0px 14px 21px 2px rgba(0,0,0,0.14),0px 5px 26px 4px rgba(0,0,0,0.12)',
      '0px 8px 9px -5px rgba(0,0,0,0.2),0px 15px 22px 2px rgba(0,0,0,0.14),0px 6px 28px 5px rgba(0,0,0,0.12)',
      '0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)',
      '0px 8px 11px -5px rgba(0,0,0,0.2),0px 17px 26px 2px rgba(0,0,0,0.14),0px 6px 32px 5px rgba(0,0,0,0.12)',
      '0px 9px 11px -5px rgba(0,0,0,0.2),0px 18px 28px 2px rgba(0,0,0,0.14),0px 7px 34px 6px rgba(0,0,0,0.12)',
      '0px 9px 12px -6px rgba(0,0,0,0.2),0px 19px 29px 2px rgba(0,0,0,0.14),0px 7px 36px 6px rgba(0,0,0,0.12)',
      '0px 10px 13px -6px rgba(0,0,0,0.2),0px 20px 31px 3px rgba(0,0,0,0.14),0px 8px 38px 7px rgba(0,0,0,0.12)',
      '0px 10px 13px -6px rgba(0,0,0,0.2),0px 21px 33px 3px rgba(0,0,0,0.14),0px 8px 40px 7px rgba(0,0,0,0.12)',
      '0px 10px 14px -6px rgba(0,0,0,0.2),0px 22px 35px 3px rgba(0,0,0,0.14),0px 8px 42px 7px rgba(0,0,0,0.12)',
      '0px 11px 14px -7px rgba(0,0,0,0.2),0px 23px 36px 3px rgba(0,0,0,0.14),0px 9px 44px 8px rgba(0,0,0,0.12)',
      '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)',
    ]
  } : {}),
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: '0.875rem',
        },
        contained: {
          boxShadow: '0px 2px 4px rgba(0,0,0,0.14)',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0,0,0,0.24)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: mode === 'light' ? '0px 2px 8px rgba(0,0,0,0.08)' : undefined,
          '&:hover': {
            boxShadow: mode === 'light' ? '0px 4px 16px rgba(0,0,0,0.12)' : undefined,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        elevation1: {
          boxShadow: mode === 'light' ? '0px 2px 4px rgba(0,0,0,0.08)' : undefined,
        },
        elevation2: {
          boxShadow: mode === 'light' ? '0px 4px 8px rgba(0,0,0,0.12)' : undefined,
        },
        elevation4: {
          boxShadow: mode === 'light' ? '0px 8px 16px rgba(0,0,0,0.16)' : undefined,
        },
        elevation8: {
          boxShadow: mode === 'light' ? '0px 12px 24px rgba(0,0,0,0.20)' : undefined,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: mode === 'light' ? '0px 2px 4px rgba(0,0,0,0.08)' : undefined,
          background: mode === 'dark' ? '#1e1e1e' : undefined,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
          borderRight: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(224, 224, 224, 1)',
        },
        head: {
          fontWeight: 600,
          backgroundColor: mode === 'dark' ? '#121212' : '#f5f5f5',
          color: mode === 'dark' ? '#ffffff' : '#212121',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'dark' ? '#121212' : '#f5f5f5',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'dark' ? '#ffffff' : '#000000',
          },
        },
        input: {
          color: mode === 'dark' ? '#ffffff' : '#000000',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          },
          '&.Mui-selected': {
            backgroundColor: mode === 'dark' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(25, 118, 210, 0.08)',
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(25, 118, 210, 0.24)' : 'rgba(25, 118, 210, 0.12)',
            },
          },
        },
      },
    },
  },
});
