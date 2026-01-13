import { type ReactNode, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, Outlet } from 'react-router-dom';
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
  ListSubheader,
  Avatar,
  Skeleton,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  PersonAdd as PersonAddIcon,
  CurrencyRupee as MoneyIcon,
  Logout as LogoutIcon,
  School,
  Receipt,
  TrendingUp,
  Settings,
  CalendarToday,
  AccountBalance,
  Description,
  Sync as SyncIcon,
  School as AlumniIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  RestoreFromTrash as BackupIcon,
} from '@mui/icons-material';
import { useColorMode } from '../contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { printSettingsService, dashboardService } from '../lib/api';
import { backupService } from '../lib/backup-service';
import { format } from 'date-fns';
import SessionSelector from './SessionSelector';

interface LayoutProps {
  children?: ReactNode; // Make children optional
  onLogout: () => void;
}

const drawerWidth = 260;

const menuItems = [
  {
    titleKey: 'sidebar.main',
    items: [
      { path: '/', labelKey: 'sidebar.dashboard', icon: DashboardIcon, requiredPermission: 'dashboard_view' },
    ],
  },
  {
    titleKey: 'sidebar.studentInfo',
    items: [
      { path: '/admissions', labelKey: 'sidebar.admissions', icon: PersonAddIcon, requiredPermission: 'admissions_view' },
      { path: '/promotions', labelKey: 'sidebar.promotions', icon: TrendingUp, requiredPermission: 'promotions_view' },
    ],
  },
  {
    titleKey: 'sidebar.feeManagement',
    items: [
      { path: '/fees/collection-enhanced', labelKey: 'sidebar.feeCollection', icon: MoneyIcon, requiredPermission: 'fees_collect' },
      { path: '/fees/demand-bills', labelKey: 'sidebar.demandBills', icon: Description, requiredPermission: 'demand_bills_view' },
      { path: '/fees/reports', labelKey: 'sidebar.feeReceipt', icon: Receipt, requiredPermission: 'fees_receipts' },
      { path: '/settings/fee-structure', labelKey: 'sidebar.feeStructure', icon: AccountBalance, requiredPermission: 'fee_structure_view' },
    ],
  },
  {
    titleKey: 'sidebar.examination',
    items: [
      { path: '/exams', labelKey: 'sidebar.exams', icon: Description, requiredPermission: 'exams_view' },
      { path: '/examination/configuration', labelKey: 'sidebar.configuration', icon: Description, requiredPermission: 'exam_config' },
    ],
  },
  {
    titleKey: 'sidebar.settings',
    items: [
      { path: '/settings/sessions', labelKey: 'sidebar.sessions', icon: CalendarToday, requiredPermission: 'sessions_view' },
      { path: '/settings/classes', labelKey: 'sidebar.classManagement', icon: School, requiredPermission: 'school_settings' },
      { path: '/settings/print', labelKey: 'sidebar.schoolSettings', icon: Settings, requiredPermission: 'school_settings' },
      { path: '/settings/users', labelKey: 'sidebar.userManagement', icon: Settings, requiredPermission: 'users_manage' },
    ],
  },
];

import { getCurrentUserPermissions, hasPermission } from '../utils/permissions';

export default function Layout({ children, onLogout }: LayoutProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { mode, toggleColorMode } = useColorMode();
  const { t } = useTranslation('common');

  // Fetch school branding from print settings
  const { data: printSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['printSettings'],
    queryFn: printSettingsService.get,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch dashboard stats for last updated indicator
  const { dataUpdatedAt, refetch: refetchDashboard, isFetching: isDashboardFetching } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => dashboardService.getStats(),
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

  // Update Favicon based on Logo
  useEffect(() => {
    if (printSettings?.logoUrl) {
      const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = `${import.meta.env.VITE_API_URL}${printSettings.logoUrl}`;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, [printSettings?.logoUrl]);

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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Spacer for Fixed AppBar */}
      <Toolbar />

      {/* Scrollable Navigation Items */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          px: 1.5,
          py: 2,
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.1)',
            borderRadius: '4px',
          },
          '&:hover::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.2)',
          },
        }}
      >
        <List sx={{ p: 0 }}>
          {menuItems.map((section, index) => {
            // Get user permissions
            const { role: userRole, permissions: userPermissions } = getCurrentUserPermissions();

            // Filter items based on permissions
            const visibleItems = section.items.filter(item =>
              hasPermission(item.requiredPermission, userRole, userPermissions)
            );

            // Don't render section if no visible items
            if (visibleItems.length === 0) return null;

            return (
              <Box key={section.titleKey || index} sx={{ mb: 0 }}>
                {section.titleKey && (
                  <ListSubheader
                    disableSticky={false}
                    sx={{
                      bgcolor: 'background.paper',
                      backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.09))', // Light overlay for depth in dark mode
                      zIndex: 2,
                      position: 'sticky',
                      top: 0,
                      color: 'primary.main',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      py: 1,
                      lineHeight: '2',
                      mb: 0.5,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)', // Subtle separator
                    }}
                  >
                    {t(section.titleKey)}
                  </ListSubheader>
                )}
                {visibleItems.map((item) => {
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
                          primary={t(item.labelKey)}
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
            );
          })}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
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

          {/* Logo & School Name (Moved here from Drawer) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 4, minWidth: 'fit-content' }}>
            {isLoadingSettings ? (
              <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: 1 }} />
            ) : printSettings?.logoUrl ? (
              <Box
                component="img"
                src={`${import.meta.env.VITE_API_URL}${printSettings.logoUrl}`}
                alt={printSettings?.schoolName || 'School'}
                sx={{
                  width: 36,
                  height: 36,
                  objectFit: 'contain',
                  borderRadius: 1,
                }}
              />
            ) : (
              <School sx={{ fontSize: 28, color: 'primary.main' }} />
            )}
            {isLoadingSettings ? (
              <Skeleton variant="text" width={100} height={24} />
            ) : (
              <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                {printSettings?.schoolName || 'School ERP'}
              </Typography>
            )}
          </Box>

          {/* Session Selector (Moved here) */}
          <SessionSelector />

          <Box sx={{ flexGrow: 1 }} />

          {/* Theme Toggle */}
          <IconButton
            color="inherit"
            onClick={toggleColorMode}
            sx={{ ml: 1, mr: 1 }}
          >
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>

          {/* Sync Status */}
          <Box
            onClick={() => refetchDashboard()}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              bgcolor: isDashboardFetching ? 'action.hover' : 'grey.100',
              color: 'text.secondary',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'primary.50',
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
                ml: 0.5,
                minWidth: 'auto',
                fontSize: '0.65rem',
                py: 0.2,
                px: 1,
                height: 22,
                borderColor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.main',
                  color: 'white',
                }
              }}
            >
              Refresh
            </Button>
          </Box>

          {/* Backup & Restore Action */}
          {(() => {
            const { role, permissions } = getCurrentUserPermissions();
            if (hasPermission('school_settings', role, permissions)) {
              // Fetch latest backup info
              const { data: backups } = useQuery({
                queryKey: ['backups'],
                queryFn: backupService.list,
                staleTime: 60 * 1000,
              });

              const lastBackup = backups?.database?.[0]?.date;

              return (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                  {lastBackup && (
                    <Box sx={{ textAlign: 'right', mr: 1, display: { xs: 'none', md: 'block' } }}>
                      <Typography variant="caption" display="block" sx={{ lineHeight: 1, color: 'text.secondary', fontSize: '0.65rem' }}>
                        Last Backup
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ lineHeight: 1, fontWeight: 600, fontSize: '0.7rem' }}>
                        {format(new Date(lastBackup), 'dd MMM, HH:mm')}
                      </Typography>
                    </Box>
                  )}
                  <Tooltip title={lastBackup ? `Last Backup: ${format(new Date(lastBackup), 'PPpp')}` : "Backup & Restore"}>
                    <IconButton
                      component={Link}
                      to="/settings/backup"
                      color="inherit"
                    >
                      <BackupIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              );
            }
            return null;
          })()}

          {/* User Info */}
          {(() => {
            const userInfo = getCurrentUserPermissions();
            const roleColors: Record<string, string> = {
              SUPER_ADMIN: '#d32f2f',
              ADMIN: '#1976d2',
              ACCOUNTANT: '#388e3c',
              TEACHER: '#7b1fa2',
              COORDINATOR: '#f57c00',
              RECEPTIONIST: '#0097a7',
            };
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', mx: 2, gap: 1 }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                    {userInfo.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'white',
                      bgcolor: roleColors[userInfo.role] || '#757575',
                      px: 1,
                      py: 0.2,
                      borderRadius: 1,
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}
                  >
                    {userInfo.role.replace('_', ' ')}
                  </Typography>
                </Box>
              </Box>
            );
          })()}

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
          // width: { sm: `calc(100% - ${drawerWidth}px)` }, // No longer needed as flex takes remaining space
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        {children || <Outlet />}
      </Box>
    </Box>
  );
}
