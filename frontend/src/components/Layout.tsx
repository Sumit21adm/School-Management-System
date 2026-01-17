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
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Skeleton,
  Button,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  PersonAdd as PersonAddIcon,
  AccountBalanceWallet as WalletIcon,
  Logout as LogoutIcon,
  TrendingUp,
  Settings,
  AccountBalance,
  Sync as SyncIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  RestoreFromTrash as BackupIcon,
  DirectionsBus as BusIcon,
  AltRoute as RouteIcon,
  AssignmentTurnedIn as AssignmentIcon,
  ExpandLess,
  ExpandMore,
  PushPin as PinIcon,
  Payments as PaymentsIcon,
  RequestQuote as BillIcon,
  HistoryEdu as ExamIcon,
  Assignment as ExamPaperIcon,
  SettingsSuggest as ConfigIcon,
  Commute as TransportIcon,
  Badge as DriverIcon,
  Business as SchoolIcon,
  SupervisedUserCircle as UserIcon,
  Domain as DomainIcon,
  Groups as StudentsIcon,
  LocalPrintshop as PrintIcon,
  Class as ClassIcon,
  EventNote as SessionIcon,
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

const drawerWidth = 280;
const collapsedDrawerWidth = 72;

interface MenuItem {
  path?: string;
  labelKey: string;
  icon: React.ElementType;
  requiredPermission?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    path: '/',
    labelKey: 'sidebar.dashboard',
    icon: DashboardIcon,
    requiredPermission: 'dashboard_view',
  },
  {
    labelKey: 'sidebar.studentInfo',
    icon: StudentsIcon,
    children: [
      { path: '/admissions', labelKey: 'sidebar.admissions', icon: PersonAddIcon, requiredPermission: 'admissions_view' },
      { path: '/promotions', labelKey: 'sidebar.promotions', icon: TrendingUp, requiredPermission: 'promotions_view' },
    ],
  },
  {
    labelKey: 'sidebar.feeManagement',
    icon: WalletIcon,
    children: [
      { path: '/fees/collection-enhanced', labelKey: 'sidebar.feeCollection', icon: PaymentsIcon, requiredPermission: 'fees_collect' },
      { path: '/fees/demand-bills', labelKey: 'sidebar.demandBills', icon: BillIcon, requiredPermission: 'demand_bills_view' },
      { path: '/fees/reports', labelKey: 'sidebar.feeReceipt', icon: PrintIcon, requiredPermission: 'fees_receipts' },
      { path: '/settings/fee-structure', labelKey: 'sidebar.feeStructure', icon: AccountBalance, requiredPermission: 'fee_structure_view' },
    ],
  },
  {
    labelKey: 'sidebar.examination',
    icon: ExamIcon,
    children: [
      { path: '/exams', labelKey: 'sidebar.exams', icon: ExamPaperIcon, requiredPermission: 'exams_view' },
      { path: '/examination/configuration', labelKey: 'sidebar.configuration', icon: ConfigIcon, requiredPermission: 'exam_config' },
    ],
  },
  {
    labelKey: 'sidebar.staff',
    icon: UserIcon,
    children: [
      { path: '/users', labelKey: 'sidebar.staffList', icon: UserIcon, requiredPermission: 'users_manage' },
    ],
  },
  {
    labelKey: 'sidebar.transport',
    icon: TransportIcon,
    children: [
      { path: '/transport/vehicles', labelKey: 'sidebar.vehicles', icon: BusIcon, requiredPermission: 'transport_view' },
      { path: '/transport/drivers', labelKey: 'sidebar.drivers', icon: DriverIcon, requiredPermission: 'transport_view' },
      { path: '/transport/routes', labelKey: 'sidebar.routes', icon: RouteIcon, requiredPermission: 'transport_view' },
      { path: '/transport/assignments', labelKey: 'sidebar.assignments', icon: AssignmentIcon, requiredPermission: 'transport_assign' },
      { path: '/transport/reports', labelKey: 'sidebar.transportReports', icon: PrintIcon, requiredPermission: 'transport_reports' },
      { path: '/transport/fare-slabs', labelKey: 'sidebar.fareSlabs', icon: RouteIcon, requiredPermission: 'transport_manage' },
    ],
  },
  {
    labelKey: 'sidebar.settings',
    icon: Settings,
    children: [
      { path: '/settings/sessions', labelKey: 'sidebar.sessions', icon: SessionIcon, requiredPermission: 'sessions_view' },
      { path: '/settings/classes', labelKey: 'sidebar.classManagement', icon: ClassIcon, requiredPermission: 'school_settings' },
      { path: '/settings/print', labelKey: 'sidebar.schoolSettings', icon: DomainIcon, requiredPermission: 'school_settings' },
      { path: '/settings/users', labelKey: 'sidebar.userManagement', icon: UserIcon, requiredPermission: 'users_manage' },
      { path: '/settings/roles', labelKey: 'sidebar.roleSettings', icon: Settings, requiredPermission: 'users_manage' },
    ],
  },
];

import { getCurrentUserPermissions, hasPermission } from '../utils/permissions';

export default function Layout({ children, onLogout }: LayoutProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDrawerHovered, setIsDrawerHovered] = useState(false);
  const [isDrawerPinned, setIsDrawerPinned] = useState(() => {
    const saved = localStorage.getItem('sidebarPinned');
    return saved === 'true';
  });
  const { mode, toggleColorMode } = useColorMode();
  const { t } = useTranslation('common');

  const togglePin = () => {
    const newValue = !isDrawerPinned;
    setIsDrawerPinned(newValue);
    localStorage.setItem('sidebarPinned', String(newValue));
  };

  // Determine if drawer should be expanded
  const isDrawerExpanded = isDrawerPinned || isDrawerHovered;

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

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (labelKey: string) => {
    setOpenSections((prev) => ({ ...prev, [labelKey]: !prev[labelKey] }));
  };

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
          px: isDrawerExpanded ? 1.5 : 0,
          py: 2,
          transition: 'padding 0.2s ease-in-out',
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
          {menuItems.map((item) => {
            const { role: userRole, permissions: userPermissions } = getCurrentUserPermissions();

            // Check parent permission (if specified)
            if (item.requiredPermission && !hasPermission(item.requiredPermission, userRole, userPermissions)) {
              return null;
            }

            const Icon = item.icon;

            // Handle items with children (Collapsible Sections)
            if (item.children) {
              const visibleChildren = item.children.filter(child =>
                !child.requiredPermission || hasPermission(child.requiredPermission, userRole, userPermissions)
              );

              if (visibleChildren.length === 0) return null;

              const isOpen = openSections[item.labelKey];
              const isGroupActive = visibleChildren.some(child =>
                location.pathname === child.path || (child.path !== '/' && location.pathname.startsWith(child.path || ''))
              );

              return (
                <Box key={item.labelKey}>
                  <ListItemButton
                    onClick={() => toggleSection(item.labelKey)}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      justifyContent: isDrawerExpanded ? 'flex-start' : 'center',
                      px: isDrawerExpanded ? 2 : 1,
                      color: isGroupActive ? 'primary.main' : 'text.primary',
                      bgcolor: isDrawerExpanded && isGroupActive
                        ? (theme) => theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.08)' : 'rgba(25, 118, 210, 0.08)'
                        : 'transparent',
                      '&:hover': {
                        bgcolor: isDrawerExpanded && isGroupActive
                          ? (theme) => theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.16)' : 'rgba(25, 118, 210, 0.16)'
                          : 'action.hover',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: isDrawerExpanded ? 44 : 'auto' }}>
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: isGroupActive
                            ? (theme) => theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.15)' : 'rgba(25, 118, 210, 0.15)'
                            : (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                          color: isGroupActive ? 'primary.main' : 'text.secondary',
                        }}
                      >
                        <Icon sx={{ fontSize: 22 }} />
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={t(item.labelKey)}
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                      sx={{
                        opacity: isDrawerExpanded ? 1 : 0,
                        display: isDrawerExpanded ? 'block' : 'none',
                        transition: 'opacity 0.2s ease-in-out'
                      }}
                    />
                    {isDrawerExpanded && (
                      <Box sx={{ transition: 'opacity 0.2s ease-in-out' }}>
                        {isOpen ? <ExpandLess color={isGroupActive ? 'primary' : 'inherit'} /> : <ExpandMore color={isGroupActive ? 'primary' : 'inherit'} />}
                      </Box>
                    )}
                  </ListItemButton>

                  <Collapse in={isOpen && isDrawerExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ pl: 2 }}>
                      {visibleChildren.map((child) => {
                        const ChildIcon = child.icon;
                        const isActive = location.pathname === child.path || (child.path !== '/' && location.pathname.startsWith(child.path || ''));

                        return (
                          <ListItemButton
                            key={child.labelKey}
                            component={Link}
                            to={child.path!}
                            selected={isActive}
                            onClick={() => setMobileOpen(false)}
                            sx={{
                              borderRadius: 2,
                              mb: 0.5,
                              pl: 1.5,
                              '&.Mui-selected': {
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                '&:hover': { bgcolor: 'primary.dark' },
                                '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                              },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 44 }}>
                              <Box
                                sx={{
                                  p: 0.5,
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: isActive ? 'transparent' : 'transparent',
                                  color: isActive ? 'inherit' : 'text.secondary',
                                }}
                              >
                                <ChildIcon sx={{ fontSize: 20 }} />
                              </Box>
                            </ListItemIcon>
                            <ListItemText
                              primary={t(child.labelKey)}
                              primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: isActive ? 600 : 500 }}
                            />
                          </ListItemButton>
                        );
                      })}
                    </List>
                  </Collapse>
                </Box>
              );
            }

            // Single Item (Dashboard)
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path || ''));

            return (
              <Box key={item.labelKey}>
                <ListItemButton
                  component={Link}
                  to={item.path!}
                  onClick={() => setMobileOpen(false)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    justifyContent: isDrawerExpanded ? 'flex-start' : 'center',
                    px: isDrawerExpanded ? 2 : 1,
                    color: isActive ? 'primary.main' : 'text.primary',
                    bgcolor: isDrawerExpanded && isActive
                      ? (theme) => theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.08)' : 'rgba(25, 118, 210, 0.08)'
                      : 'transparent',
                    '&:hover': {
                      bgcolor: isDrawerExpanded && isActive
                        ? (theme) => theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.16)' : 'rgba(25, 118, 210, 0.16)'
                        : 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: isDrawerExpanded ? 44 : 'auto' }}>
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: isActive
                          ? (theme) => theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.15)' : 'rgba(25, 118, 210, 0.15)'
                          : (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                        color: isActive ? 'primary.main' : 'text.secondary',
                      }}
                    >
                      <Icon sx={{ fontSize: 22 }} />
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={t(item.labelKey)}
                    primaryTypographyProps={{ fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap' }}
                    sx={{
                      opacity: isDrawerExpanded ? 1 : 0,
                      display: isDrawerExpanded ? 'block' : 'none',
                      transition: 'opacity 0.2s ease-in-out'
                    }}
                  />
                </ListItemButton>
              </Box>
            );
          })}
        </List>
      </Box>

      {/* Pin Toggle Button - Fixed at bottom */}
      <Box
        sx={{
          display: { xs: 'none', sm: 'flex' },
          justifyContent: 'center',
          alignItems: 'center',
          p: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Tooltip title={isDrawerPinned ? 'Unpin sidebar' : 'Pin sidebar open'} placement="right">
          <IconButton
            onClick={togglePin}
            size="small"
            sx={{
              color: isDrawerPinned ? 'primary.main' : 'text.secondary',
              bgcolor: isDrawerPinned ? 'action.selected' : 'transparent',
              '&:hover': { bgcolor: 'action.hover' },
              transform: isDrawerPinned ? 'rotate(0deg)' : 'rotate(45deg)',
              transition: 'transform 0.2s ease-in-out',
            }}
          >
            <PinIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box >
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
              <SchoolIcon sx={{ fontSize: 28, color: 'primary.main' }} />
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
        sx={{
          width: { sm: isDrawerExpanded ? drawerWidth : collapsedDrawerWidth },
          flexShrink: { sm: 0 },
          transition: 'width 0.2s ease-in-out',
        }}
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

        {/* Desktop drawer - Collapsible on hover */}
        <Drawer
          variant="permanent"
          onMouseEnter={() => setIsDrawerHovered(true)}
          onMouseLeave={() => setIsDrawerHovered(false)}
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: isDrawerExpanded ? drawerWidth : collapsedDrawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
              transition: 'width 0.2s ease-in-out',
              overflowX: 'hidden',
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
