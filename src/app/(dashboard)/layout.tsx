'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
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
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
} from '@mui/icons-material';
import { useColorMode } from '@/contexts/ThemeContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSessionContext } from '@/contexts/SessionContext';
import SessionSelector from '@/components/layout/SessionSelector';
import { printSettingsService, dashboardService } from '@/lib/api';

const drawerWidth = 260;

const menuItems = [
    {
        title: 'Main',
        items: [
            { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
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
            { path: '/fees', label: 'Fee Collection', icon: MoneyIcon },
            { path: '/fees/demand-bills', label: 'Demand Bills', icon: Description },
            { path: '/fees/reports', label: 'Fee Reports', icon: Receipt },
            { path: '/fees/fee-book', label: 'Student Fee Book', icon: Description },
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
            { path: '/settings/classes', label: 'Class Management', icon: School },
            { path: '/settings/print', label: 'School Settings', icon: Settings },
            { path: '/settings/users', label: 'User Management', icon: Settings },
        ],
    },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [mobileOpen, setMobileOpen] = useState(false);

    // ... inside component ...

    const { mode, toggleColorMode } = useColorMode();
    const { selectedSessionId } = useSessionContext();

    // Fetch school branding
    const { data: printSettings, isLoading: isLoadingSettings } = useQuery({
        queryKey: ['printSettings'],
        queryFn: printSettingsService.get,
        staleTime: 5 * 60 * 1000,
    });

    // Live sync status
    const { dataUpdatedAt, refetch: refetchDashboard, isFetching: isDashboardFetching } = useQuery({
        queryKey: ['dashboardStats', selectedSessionId],
        queryFn: () => dashboardService.getStats('today', selectedSessionId),
        refetchInterval: 15000,
        staleTime: 10000,
        enabled: !!selectedSessionId, // Only fetch if session is selected
    });

    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        if (!dataUpdatedAt) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setElapsedSeconds(0);
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

    // Update favicon dynamically when logo is available
    useEffect(() => {
        if (printSettings?.logoUrl) {
            // Remove all existing favicon links
            const existingIcons = document.querySelectorAll("link[rel*='icon']");
            existingIcons.forEach(icon => icon.remove());

            // Create new favicon link with cache-busting
            const link = document.createElement('link');
            link.rel = 'icon';
            link.type = 'image/png';
            link.href = `${printSettings.logoUrl}?v=${Date.now()}`;
            document.head.appendChild(link);

            // Also add apple-touch-icon for mobile
            const appleLink = document.createElement('link');
            appleLink.rel = 'apple-touch-icon';
            appleLink.href = printSettings.logoUrl;
            document.head.appendChild(appleLink);

            // Update page title
            document.title = printSettings.schoolName || 'School Management System';
        }
    }, [printSettings?.logoUrl, printSettings?.schoolName]);

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Toolbar
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: 64,
                    px: 2,
                    flexShrink: 0,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {isLoadingSettings ? (
                        <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: 1 }} />
                    ) : printSettings?.logoUrl ? (
                        <Box
                            component="img"
                            src={printSettings.logoUrl}
                            alt="School Logo"
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
                        <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2, maxWidth: 150 }} noWrap>
                            {printSettings?.schoolName || 'School ERP'}
                        </Typography>
                    )}
                </Box>
                <IconButton onClick={handleDrawerToggle} sx={{ display: { sm: 'none' } }}>
                    <ChevronLeftIcon />
                </IconButton>
            </Toolbar>

            <Divider />

            <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                <List sx={{ px: 1.5, py: 2 }}>
                    {menuItems.map((section, index) => (
                        <Box key={section.title || index} sx={{ mb: 2 }}>
                            {section.title && (
                                <ListSubheader
                                    sx={{
                                        bgcolor: 'background.paper',
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
                                const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname?.startsWith(item.path));

                                return (
                                    <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                                        <ListItemButton
                                            component={Link}
                                            href={item.path}
                                            onClick={() => setMobileOpen(false)}
                                            selected={isActive}
                                            sx={{
                                                borderRadius: 2,
                                                py: 1.5,
                                                px: 2,
                                                '&.Mui-selected': {
                                                    bgcolor: 'primary.main',
                                                    color: 'primary.contrastText',
                                                    '&:hover': { bgcolor: 'primary.dark' },
                                                    '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                                                },
                                                '&:hover': {
                                                    bgcolor: isActive ? 'primary.dark' : 'action.hover',
                                                },
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'inherit' : 'text.secondary' }}>
                                                <Icon />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={item.label}
                                                primaryTypographyProps={{ fontWeight: isActive ? 600 : 500, fontSize: '0.95rem' }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                );
                            })}
                        </Box>
                    ))}
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

                    {/* Theme Toggle */}
                    <IconButton color="inherit" onClick={toggleColorMode} sx={{ ml: 1, mr: 1 }}>
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
                            '&:hover': { bgcolor: 'primary.50', color: 'primary.main' },
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
                            onClick={(e) => {
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
                            }}
                        >
                            Refresh
                        </Button>
                    </Box>

                    <Box sx={{ flexGrow: 1 }} />

                    {/* Session Selector */}
                    <SessionSelector />

                    {/* User Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mx: 2, gap: 1 }}>
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                                {session?.user?.name || 'User'}
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'white',
                                    bgcolor: '#1976d2',
                                    px: 1,
                                    py: 0.2,
                                    borderRadius: 1,
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                }}
                            >
                                {(session?.user as any)?.role?.replace('_', ' ') || 'USER'}
                            </Typography>
                        </Box>
                    </Box>

                    <IconButton
                        color="inherit"
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        sx={{ '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' } }}
                    >
                        <LogoutIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* Drawer */}
            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
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
                <Toolbar />
                {children}
            </Box>
        </Box>
    );
}
