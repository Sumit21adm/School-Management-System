import { type ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  ListSubheader,
  Avatar,
  Skeleton,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  PersonAdd as PersonAddIcon,
  CurrencyRupee as MoneyIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  School,
  Receipt,
  TrendingUp,
  Settings,
  CalendarToday,
  AccountBalance,
  Description,
  Sync as SyncIcon,
  School as AlumniIcon, // Added AlumniIcon
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { printSettingsService, dashboardService } from '../lib/api';
import SessionSelector from './SessionSelector';
import { formatDistanceToNow } from 'date-fns';

interface LayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

const drawerWidth = 260;

const menuItems = [
  {
    title: 'Main',
    items: [
      { path: '/', label: 'Dashboard', icon: DashboardIcon },
    ],
  },
  {
    title: 'Student Info',
    items: [
      { path: '/admissions', label: 'Admissions', icon: PersonAddIcon },
      { path: '/promotions', label: 'Promotions', icon: TrendingUp },
    ],
  },
  {
    title: 'Fee Management',
    items: [
      { path: '/fees/collection-enhanced', label: 'Fee Collection', icon: MoneyIcon },
      { path: '/fees/demand-bills', label: 'Demand Bills', icon: Description },
      { path: '/fees/reports', label: 'Fee Receipt', icon: Receipt },
      { path: '/settings/fee-structure', label: 'Fee Structure', icon: AccountBalance },
    ],
  },
  {
    title: 'Examination',
    items: [
      { path: '/exams', label: 'Exams', icon: Description },
      { path: '/examination/configuration', label: 'Configuration', icon: Description },
    ],
  },
  {
    title: 'Settings',
    items: [
      { path: '/settings/sessions', label: 'Sessions', icon: CalendarToday },
      { path: '/settings/print', label: 'School Settings', icon: Settings },
    ],
  },
];

export default function Layout({ children, onLogout }: LayoutProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fetch school branding from print settings
  const { data: printSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['printSettings'],
    queryFn: printSettingsService.get,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch dashboard stats for last updated indicator
  const { dataUpdatedAt, refetch: refetchDashboard, isFetching: isDashboardFetching } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: dashboardService.getStats,
    refetchInterval: 15000,
    staleTime: 10000,
  });

  // Live elapsed seconds counter
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!dataUpdatedAt) return;

    // Reset counter when data is updated
    setElapsedSeconds(0);

    // Update counter every second
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - dataUpdatedAt) / 1000);
      setElapsedSeconds(seconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [dataUpdatedAt]);

  const getElapsedText = () => {
    if (isDashboardFetching) return 'Syncing...';
    if (!dataUpdatedAt) return 'Click to sync';
    if (elapsedSeconds === 0) return 'Synced now';
    if (elapsedSeconds < 60) return `Synced ${elapsedSeconds}s ago`;
    const minutes = Math.floor(elapsedSeconds / 60);
    return `Synced ${minutes}m ago`;
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box>
      {/* Drawer Header - matches AppBar height */}
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 64,
          px: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {isLoadingSettings ? (
            <Skeleton variant="circular" width={36} height={36} />
          ) : printSettings?.logoUrl ? (
            <Avatar
              src={`${import.meta.env.VITE_API_URL}${printSettings.logoUrl}`}
              alt={printSettings?.schoolName || 'School'}
              sx={{ width: 36, height: 36 }}
            />
          ) : (
            <School sx={{ fontSize: 28, color: 'primary.main' }} />
          )}
          {isLoadingSettings ? (
            <Skeleton variant="text" width={100} height={24} />
          ) : (
            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }} noWrap>
              {printSettings?.schoolName || 'School ERP'}
            </Typography>
          )}
        </Box>
        <IconButton
          onClick={handleDrawerToggle}
          sx={{ display: { sm: 'none' } }}
        >
          <ChevronLeftIcon />
        </IconButton>
      </Toolbar>

      <Divider />

      {/* Last Updated Indicator */}
      <Box
        onClick={() => refetchDashboard()}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.75,
          mx: 2,
          my: 1.5,
          px: 1.5,
          py: 0.75,
          borderRadius: 3,
          bgcolor: isDashboardFetching ? 'action.hover' : 'grey.100',
          color: 'text.secondary',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          border: '1px dashed',
          borderColor: 'grey.300',
          '&:hover': {
            bgcolor: 'primary.50',
            borderColor: 'primary.light',
            color: 'primary.main',
          },
        }}
      >
        <SyncIcon sx={{
          fontSize: 14,
          animation: isDashboardFetching ? 'spin 1s linear infinite' : 'none',
          '@keyframes spin': {
            from: { transform: 'rotate(0deg)' },
            to: { transform: 'rotate(360deg)' }
          }
        }} />
        <Typography variant="caption" fontWeight={500} sx={{ fontSize: '0.7rem' }}>
          {getElapsedText()}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          color="primary"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            window.location.reload();
          }}
          sx={{
            ml: 1,
            minWidth: 'auto',
            fontSize: '0.65rem',
            py: 0.2,
            px: 1,
            height: 24,
            borderColor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.main',
              color: 'white',
            }
          }}
        >
          Sync Now
        </Button>
      </Box>

      {/* Navigation Menu */}
      <List sx={{ px: 1.5, py: 2 }}>
        {menuItems.map((section, index) => (
          <Box key={section.title || index} sx={{ mb: 2 }}>
            {section.title && (
              <ListSubheader
                sx={{
                  bgcolor: 'transparent',
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  lineHeight: '20px',
                  mb: 1,
                }}
              >
                {section.title}
              </ListSubheader>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));

              return (
                <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    selected={isActive}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      px: 2,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'primary.contrastText',
                        },
                      },
                      '&:hover': {
                        bgcolor: isActive ? 'primary.dark' : 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 40,
                        color: isActive ? 'inherit' : 'text.secondary',
                      }}
                    >
                      <Icon />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 600 : 500,
                        fontSize: '0.95rem',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </Box>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }} />

          {/* Session Selector */}
          <SessionSelector />

          <IconButton
            color="inherit"
            onClick={onLogout}
            sx={{
              '&:hover': {
                bgcolor: 'error.light',
                color: 'error.contrastText',
              },
            }}
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 2, md: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        {children}
      </Box>
    </Box>
  );
}
