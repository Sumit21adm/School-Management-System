import { useState } from 'react';
import {
    Box,
    Paper,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Chip,
    IconButton,
    Collapse,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Alert,
    CircularProgress,
    Divider,
    Stack,
    Card,
    CardContent,
} from '@mui/material';
import {
    KeyboardArrowDown,
    KeyboardArrowUp,
    Route as RouteIcon,
    LocationOn,
    Print,
    DirectionsBus,
    Person,
    Phone,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { transportService } from '../../lib/api/transport';
import PageHeader from '../../components/PageHeader';
import { hasPermission, getCurrentUserPermissions } from '../../utils/permissions';

// Types for report data
interface StudentInfo {
    studentId: string;
    name: string;
    className: string;
    section: string;
    phone?: string;
}

interface RouteReportData {
    id: number;
    routeName: string;
    routeCode: string;
    startPoint: string;
    endPoint: string;
    monthlyFee: number | string;
    status: string;
    studentCount: number;
    totalFee: number;
    vehicle?: {
        vehicleNo: string;
        vehicleType: string;
        driver?: { name: string; phone: string };
    };
    studentTransports: Array<{
        student: StudentInfo;
        pickupStop?: { stopName: string };
        dropStop?: { stopName: string };
        transportType: string;
    }>;
}

interface StopReportData {
    id: number;
    stopName: string;
    stopOrder: number;
    pickupTime?: string;
    dropTime?: string;
    pickupStudents: StudentInfo[];
    dropStudents: StudentInfo[];
    pickupCount: number;
    dropCount: number;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`transport-report-tabpanel-${index}`}
            aria-labelledby={`transport-report-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

// Collapsible Route Row for Route-wise Report
function RouteRow({ route }: { route: RouteReportData }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                </TableCell>
                <TableCell>
                    <Chip label={route.routeCode} color="primary" size="small" />
                </TableCell>
                <TableCell>
                    <Typography fontWeight={500}>{route.routeName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {route.startPoint} → {route.endPoint}
                    </Typography>
                </TableCell>
                <TableCell>
                    {route.vehicle ? (
                        <>
                            <Typography variant="body2">{route.vehicle.vehicleNo}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {route.vehicle.driver?.name || 'No driver'}
                            </Typography>
                        </>
                    ) : (
                        <Chip label="No Vehicle" size="small" color="warning" />
                    )}
                </TableCell>
                <TableCell align="center">
                    <Chip
                        label={route.studentCount}
                        color={route.studentCount > 0 ? 'success' : 'default'}
                        size="small"
                    />
                </TableCell>
                <TableCell align="right">₹{Number(route.monthlyFee).toLocaleString()}</TableCell>
                <TableCell align="right">₹{route.totalFee.toLocaleString()}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan={7} sx={{ py: 0 }}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2 }}>
                            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                                Students ({route.studentCount})
                            </Typography>
                            {route.studentTransports.length === 0 ? (
                                <Typography color="text.secondary" variant="body2">
                                    No students assigned to this route.
                                </Typography>
                            ) : (
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Student ID</TableCell>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Class</TableCell>
                                            <TableCell>Pickup Stop</TableCell>
                                            <TableCell>Drop Stop</TableCell>
                                            <TableCell>Type</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {route.studentTransports.map((t, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{t.student.studentId}</TableCell>
                                                <TableCell>{t.student.name}</TableCell>
                                                <TableCell>
                                                    {t.student.className}-{t.student.section}
                                                </TableCell>
                                                <TableCell>{t.pickupStop?.stopName || '-'}</TableCell>
                                                <TableCell>{t.dropStop?.stopName || '-'}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={t.transportType}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}

// Route-wise Report Component
function RouteWiseReport() {
    const { data: routes = [], isLoading, error } = useQuery<RouteReportData[]>({
        queryKey: ['transport-report-route-wise'],
        queryFn: () => transportService.getRouteWiseReport(),
    });

    const handlePrint = () => {
        window.print();
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">Failed to load route-wise report.</Alert>;
    }

    const totalStudents = routes.reduce((sum, r) => sum + r.studentCount, 0);
    const totalRevenue = routes.reduce((sum, r) => sum + r.totalFee, 0);

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Stack direction="row" spacing={2}>
                    <Chip
                        icon={<RouteIcon />}
                        label={`${routes.length} Routes`}
                        color="primary"
                        variant="outlined"
                    />
                    <Chip
                        icon={<Person />}
                        label={`${totalStudents} Students`}
                        color="success"
                        variant="outlined"
                    />
                    <Chip
                        label={`Total: ₹${totalRevenue.toLocaleString()}/month`}
                        color="secondary"
                    />
                </Stack>
                <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={handlePrint}
                    className="no-print"
                >
                    Print Report
                </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell width={50} />
                            <TableCell>Code</TableCell>
                            <TableCell>Route</TableCell>
                            <TableCell>Vehicle / Driver</TableCell>
                            <TableCell align="center">Students</TableCell>
                            <TableCell align="right">Fee/Student</TableCell>
                            <TableCell align="right">Total Fee</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {routes.map((route) => (
                            <RouteRow key={route.id} route={route} />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

// Stop-wise Report Component
function StopWiseReport() {
    const [selectedRouteId, setSelectedRouteId] = useState<number | ''>('');

    const { data: routes = [], isLoading: isLoadingRoutes } = useQuery({
        queryKey: ['transport-routes-for-report'],
        queryFn: () => transportService.getRoutes('active'),
    });

    const {
        data: stopReport,
        isLoading: isLoadingStops,
        error,
    } = useQuery<{ route: { id: number; routeName: string; routeCode: string; vehicle?: { vehicleNo: string; driver?: { name: string; phone: string } } }; stops: StopReportData[] }>({
        queryKey: ['transport-report-stop-wise', selectedRouteId],
        queryFn: () => transportService.getStopWiseReport(selectedRouteId as number),
        enabled: !!selectedRouteId,
    });

    const handlePrint = () => {
        window.print();
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <FormControl sx={{ minWidth: 300 }}>
                    <InputLabel>Select Route</InputLabel>
                    <Select
                        value={selectedRouteId}
                        onChange={(e) => setSelectedRouteId(e.target.value as number)}
                        label="Select Route"
                    >
                        {routes.map((route) => (
                            <MenuItem key={route.id} value={route.id}>
                                {route.routeCode} - {route.routeName}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {stopReport && (
                    <Button
                        variant="outlined"
                        startIcon={<Print />}
                        onClick={handlePrint}
                        className="no-print"
                    >
                        Print Route Sheet
                    </Button>
                )}
            </Box>

            {isLoadingRoutes && (
                <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                </Box>
            )}

            {!selectedRouteId && !isLoadingRoutes && (
                <Alert severity="info">Select a route to view stop-wise student details.</Alert>
            )}

            {error && <Alert severity="error">Failed to load stop-wise report.</Alert>}

            {isLoadingStops && selectedRouteId && (
                <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                </Box>
            )}

            {stopReport && (
                <Box>
                    {/* Route Header */}
                    <Card variant="outlined" sx={{ mb: 3, bgcolor: 'primary.50' }}>
                        <CardContent>
                            <Stack direction="row" spacing={3} alignItems="center">
                                <DirectionsBus color="primary" fontSize="large" />
                                <Box flex={1}>
                                    <Typography variant="h6">
                                        {stopReport.route.routeCode} - {stopReport.route.routeName}
                                    </Typography>
                                    {stopReport.route.vehicle && (
                                        <Stack direction="row" spacing={2} mt={0.5}>
                                            <Typography variant="body2" color="text.secondary">
                                                Vehicle: {stopReport.route.vehicle.vehicleNo}
                                            </Typography>
                                            {stopReport.route.vehicle.driver && (
                                                <Typography variant="body2" color="text.secondary">
                                                    Driver: {stopReport.route.vehicle.driver.name} ({stopReport.route.vehicle.driver.phone})
                                                </Typography>
                                            )}
                                        </Stack>
                                    )}
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Stops List */}
                    {stopReport.stops.map((stop, idx) => (
                        <Paper key={stop.id} variant="outlined" sx={{ mb: 2, p: 2 }}>
                            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                                <Chip label={`Stop ${idx + 1}`} color="primary" size="small" />
                                <LocationOn color="action" />
                                <Typography fontWeight={600}>{stop.stopName}</Typography>
                                {stop.pickupTime && (
                                    <Chip label={`Pickup: ${stop.pickupTime}`} size="small" variant="outlined" />
                                )}
                                {stop.dropTime && (
                                    <Chip label={`Drop: ${stop.dropTime}`} size="small" variant="outlined" />
                                )}
                            </Stack>

                            <Divider sx={{ my: 1 }} />

                            {stop.pickupCount + stop.dropCount === 0 ? (
                                <Typography color="text.secondary" variant="body2">
                                    No students at this stop.
                                </Typography>
                            ) : (
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                                    {/* Pickup Students */}
                                    <Box>
                                        <Typography
                                            variant="subtitle2"
                                            color="success.main"
                                            gutterBottom
                                        >
                                            Pickup ({stop.pickupCount})
                                        </Typography>
                                        {stop.pickupStudents.length === 0 ? (
                                            <Typography variant="body2" color="text.secondary">
                                                None
                                            </Typography>
                                        ) : (
                                            <Stack spacing={0.5}>
                                                {stop.pickupStudents.map((s) => (
                                                    <Box
                                                        key={s.studentId}
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1,
                                                            p: 0.5,
                                                            borderRadius: 1,
                                                            bgcolor: 'success.50',
                                                        }}
                                                    >
                                                        <Person fontSize="small" color="action" />
                                                        <Typography variant="body2">
                                                            {s.name} ({s.className}-{s.section})
                                                        </Typography>
                                                        {s.phone && (
                                                            <Chip
                                                                icon={<Phone />}
                                                                label={s.phone}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        )}
                                                    </Box>
                                                ))}
                                            </Stack>
                                        )}
                                    </Box>

                                    {/* Drop Students */}
                                    <Box>
                                        <Typography variant="subtitle2" color="warning.main" gutterBottom>
                                            Drop ({stop.dropCount})
                                        </Typography>
                                        {stop.dropStudents.length === 0 ? (
                                            <Typography variant="body2" color="text.secondary">
                                                None
                                            </Typography>
                                        ) : (
                                            <Stack spacing={0.5}>
                                                {stop.dropStudents.map((s) => (
                                                    <Box
                                                        key={s.studentId}
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1,
                                                            p: 0.5,
                                                            borderRadius: 1,
                                                            bgcolor: 'warning.50',
                                                        }}
                                                    >
                                                        <Person fontSize="small" color="action" />
                                                        <Typography variant="body2">
                                                            {s.name} ({s.className}-{s.section})
                                                        </Typography>
                                                        {s.phone && (
                                                            <Chip
                                                                icon={<Phone />}
                                                                label={s.phone}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        )}
                                                    </Box>
                                                ))}
                                            </Stack>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </Paper>
                    ))}
                </Box>
            )}
        </Box>
    );
}

// Main Component
export default function TransportReports() {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    // Permission check
    const { role, permissions } = getCurrentUserPermissions();
    const canViewReports = hasPermission('transport_reports', role, permissions) || hasPermission('transport_view', role, permissions);

    if (!canViewReports) {
        return (
            <Box>
                <PageHeader title="Transport Reports" />
                <Alert severity="error" sx={{ mt: 2 }}>
                    You do not have permission to access Transport Reports. Contact your administrator.
                </Alert>
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="Transport Reports"
                subtitle="View route-wise and stop-wise student transport details"
            />

            <Paper sx={{ borderRadius: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        sx={{
                            '& .MuiTab-root': {
                                minHeight: 64,
                                textTransform: 'none',
                                fontSize: '0.95rem',
                            },
                        }}
                    >
                        <Tab
                            icon={<RouteIcon />}
                            iconPosition="start"
                            label="Route-wise Report"
                        />
                        <Tab
                            icon={<LocationOn />}
                            iconPosition="start"
                            label="Stop-wise Report"
                        />
                    </Tabs>
                </Box>

                <Box sx={{ p: 3 }}>
                    <TabPanel value={activeTab} index={0}>
                        <RouteWiseReport />
                    </TabPanel>
                    <TabPanel value={activeTab} index={1}>
                        <StopWiseReport />
                    </TabPanel>
                </Box>
            </Paper>

            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
        </Box>
    );
}
