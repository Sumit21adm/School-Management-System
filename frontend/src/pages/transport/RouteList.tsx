import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Grid,
    Typography,
    Collapse,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon,
    Place as PlaceIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { transportService, type Route, type Vehicle, type RouteStop } from '../../lib/api/transport';
import PageHeader from '../../components/PageHeader';
import { useSnackbar } from 'notistack';

function RouteRow({ route, onEdit, onDelete, onManageStops, onEditStop, onDeleteStop }: {
    route: Route;
    onEdit: (route: Route) => void;
    onDelete: (id: number) => void;
    onManageStops: (route: Route) => void;
    onEditStop: (route: Route, stop: RouteStop) => void;
    onDeleteStop: (routeId: number, stopId: number) => void;
}) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    {route.routeName}
                </TableCell>
                <TableCell>{route.routeCode}</TableCell>
                <TableCell>{route.startPoint} → {route.endPoint}</TableCell>
                <TableCell>
                    {route.vehicle ? (
                        <Chip label={route.vehicle.vehicleNo} size="small" variant="outlined" />
                    ) : (
                        <Typography variant="caption" color="text.secondary">Unassigned</Typography>
                    )}
                </TableCell>
                <TableCell>
                    <Chip label="Distance-based" size="small" color="info" variant="outlined" />
                </TableCell>
                <TableCell>
                    <Chip label={route.status} color={route.status === 'active' ? 'success' : 'default'} size="small" />
                </TableCell>
                <TableCell align="right">
                    <IconButton size="small" onClick={() => onEdit(route)}>
                        <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => onDelete(route.id)}>
                        <DeleteIcon />
                    </IconButton>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6" gutterBottom component="div" sx={{ fontSize: '0.9rem' }}>
                                    Stops ({route.stops?.length || 0})
                                </Typography>
                                <Button size="small" startIcon={<AddIcon />} onClick={() => onManageStops(route)}>
                                    Manage Stops
                                </Button>
                            </Box>
                            <Table size="small" aria-label="stops">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Order</TableCell>
                                        <TableCell>Stop Name</TableCell>
                                        <TableCell>Distance (km)</TableCell>
                                        <TableCell>Pickup Time</TableCell>
                                        <TableCell>Drop Time</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {route.stops && route.stops.map((stop) => (
                                        <TableRow key={stop.id}>
                                            <TableCell>{stop.stopOrder}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <PlaceIcon fontSize="inherit" color="action" />
                                                    {stop.stopName}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                {stop.distanceFromSchool ? `${Number(stop.distanceFromSchool)} km` : '-'}
                                            </TableCell>
                                            <TableCell>{stop.pickupTime || '-'}</TableCell>
                                            <TableCell>{stop.dropTime || '-'}</TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" onClick={() => onEditStop(route, stop)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => onDeleteStop(route.id, stop.id)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!route.stops || route.stops.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">No stops added yet.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}

export default function RouteList() {
    const { enqueueSnackbar } = useSnackbar();
    const [routes, setRoutes] = useState<Route[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    // Route Dialog State
    const [openRouteDialog, setOpenRouteDialog] = useState(false);
    const [editingRoute, setEditingRoute] = useState<Route | null>(null);

    // Stop Dialog State
    const [openStopDialog, setOpenStopDialog] = useState(false);
    const [selectedRouteForStops, setSelectedRouteForStops] = useState<Route | null>(null);
    const [editingStop, setEditingStop] = useState<RouteStop | null>(null);

    const { control: routeControl, handleSubmit: handleRouteSubmit, reset: resetRoute } = useForm({
        defaultValues: {
            routeName: '',
            routeCode: '',
            startPoint: '',
            endPoint: '',
            vehicleId: '',
            status: 'active',
        },
    });

    const { control: stopControl, handleSubmit: handleStopSubmit, reset: resetStop } = useForm({
        defaultValues: {
            stopName: '',
            stopOrder: 1,
            pickupTime: '',
            dropTime: '',
            distanceFromSchool: '',
        },
    });

    const fetchData = async () => {
        try {
            const [routesData, vehiclesData] = await Promise.all([
                transportService.getRoutes(),
                transportService.getVehicles('active'),
            ]);
            setRoutes(routesData);
            setVehicles(vehiclesData);
        } catch (error: any) {
            console.error('Fetch error:', error);
            const message = error.response?.data?.message || 'Failed to fetch data';
            enqueueSnackbar(message, { variant: 'error' });
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Route Handlers
    const handleOpenRouteDialog = (route?: Route) => {
        if (route) {
            setEditingRoute(route);
            resetRoute({
                routeName: route.routeName,
                routeCode: route.routeCode,
                startPoint: route.startPoint,
                endPoint: route.endPoint,
                vehicleId: route.vehicle?.id?.toString() || '',
                status: route.status,
            });
        } else {
            setEditingRoute(null);
            resetRoute({
                routeName: '',
                routeCode: '',
                startPoint: '',
                endPoint: '',
                vehicleId: '',
                status: 'active',
            });
        }
        setOpenRouteDialog(true);
    };

    const onRouteSubmit = async (data: any) => {
        try {
            const payload = {
                ...data,
                monthlyFee: 0, // Not used - fare calculated from stop distance
                vehicleId: data.vehicleId ? Number(data.vehicleId) : null,
            };

            if (editingRoute) {
                await transportService.updateRoute(editingRoute.id, payload);
                enqueueSnackbar('Route updated successfully', { variant: 'success' });
            } else {
                await transportService.createRoute(payload);
                enqueueSnackbar('Route added successfully', { variant: 'success' });
            }
            setOpenRouteDialog(false);
            fetchData();
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.message || 'Operation failed', { variant: 'error' });
        }
    };

    const handleDeleteRoute = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this route?')) {
            try {
                await transportService.deleteRoute(id);
                enqueueSnackbar('Route deleted successfully', { variant: 'success' });
                fetchData();
            } catch (error: any) {
                enqueueSnackbar('Failed to delete route', { variant: 'error' });
            }
        }
    };

    // Stop Handlers
    const handleManageStops = (route: Route) => {
        setSelectedRouteForStops(route);
        setEditingStop(null);
        resetStop({
            stopName: '',
            stopOrder: (route.stops?.length || 0) + 1,
            pickupTime: '',
            dropTime: '',
            distanceFromSchool: '',
        });
        setOpenStopDialog(true);
    };

    const handleEditStop = (route: Route, stop: RouteStop) => {
        setSelectedRouteForStops(route);
        setEditingStop(stop);
        resetStop({
            stopName: stop.stopName,
            stopOrder: stop.stopOrder,
            pickupTime: stop.pickupTime || '',
            dropTime: stop.dropTime || '',
            distanceFromSchool: stop.distanceFromSchool?.toString() || '',
        });
        setOpenStopDialog(true);
    };

    const handleDeleteStop = async (routeId: number, stopId: number) => {
        if (window.confirm('Are you sure you want to delete this stop?')) {
            try {
                await transportService.deleteStop(routeId, stopId);
                enqueueSnackbar('Stop deleted successfully', { variant: 'success' });
                fetchData();
            } catch (error: any) {
                enqueueSnackbar('Failed to delete stop', { variant: 'error' });
            }
        }
    };

    const onStopSubmit = async (data: any) => {
        if (!selectedRouteForStops) return;

        try {
            const payload = {
                ...data,
                stopOrder: Number(data.stopOrder),
                distanceFromSchool: data.distanceFromSchool ? Number(data.distanceFromSchool) : null,
            };

            if (editingStop) {
                await transportService.updateStop(selectedRouteForStops.id, editingStop.id, payload);
                enqueueSnackbar('Stop updated', { variant: 'success' });
            } else {
                await transportService.addStop(selectedRouteForStops.id, payload);
                enqueueSnackbar('Stop added', { variant: 'success' });
            }
            setOpenStopDialog(false);
            fetchData(); // Refresh to show new stops
            // Optionally re-open dialog or just refresh
        } catch (error: any) {
            enqueueSnackbar('Failed to save stop', { variant: 'error' });
        }
    };



    return (
        <Box>
            <PageHeader
                title="Route Management"
                subtitle="Manage routes and stops"
                action={
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenRouteDialog()}
                    >
                        Create Route
                    </Button>
                }
            />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell />
                            <TableCell>Route Name</TableCell>
                            <TableCell>Code</TableCell>
                            <TableCell>Points</TableCell>
                            <TableCell>Vehicle</TableCell>
                            <TableCell>Fare Mode</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {routes.map((route) => (
                            <RouteRow
                                key={route.id}
                                route={route}
                                onEdit={handleOpenRouteDialog}
                                onDelete={handleDeleteRoute}
                                onManageStops={handleManageStops}
                                onEditStop={handleEditStop}
                                onDeleteStop={handleDeleteStop}
                            />
                        ))}
                        {routes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No routes found. Click "Create Route" to add one.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Route Dialog */}
            <Dialog open={openRouteDialog} onClose={() => setOpenRouteDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingRoute ? 'Edit Route' : 'Create New Route'}</DialogTitle>
                <form onSubmit={handleRouteSubmit(onRouteSubmit)}>
                    <DialogContent>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="routeName"
                                    control={routeControl}
                                    rules={{ required: 'Name is required' }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField {...field} label="Route Name" fullWidth error={!!error} helperText={error?.message} />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="routeCode"
                                    control={routeControl}
                                    rules={{ required: 'Code is required' }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField {...field} label="Route Code" fullWidth error={!!error} helperText={error?.message} />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="startPoint"
                                    control={routeControl}
                                    rules={{ required: 'Start Point is required' }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField {...field} label="Start Point" fullWidth error={!!error} helperText={error?.message} />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="endPoint"
                                    control={routeControl}
                                    rules={{ required: 'End Point is required' }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField {...field} label="End Point" fullWidth error={!!error} helperText={error?.message} />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="status"
                                    control={routeControl}
                                    render={({ field }) => (
                                        <TextField {...field} select label="Status" fullWidth>
                                            <MenuItem value="active">Active</MenuItem>
                                            <MenuItem value="inactive">Inactive</MenuItem>
                                        </TextField>
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="vehicleId"
                                    control={routeControl}
                                    render={({ field }) => (
                                        <TextField {...field} select label="Assign Vehicle" fullWidth>
                                            <MenuItem value=""><em>None</em></MenuItem>
                                            {vehicles.map((v) => (
                                                <MenuItem key={v.id} value={v.id}>{v.vehicleNo} ({v.vehicleType})</MenuItem>
                                            ))}
                                        </TextField>
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenRouteDialog(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">{editingRoute ? 'Update' : 'Create'}</Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Stop Dialog */}
            <Dialog open={openStopDialog} onClose={() => setOpenStopDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingStop ? 'Edit Stop' : 'Add Stop'} - {selectedRouteForStops?.routeName}</DialogTitle>
                <form onSubmit={handleStopSubmit(onStopSubmit)}>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            {editingStop ? 'Update stop details below.' : 'Add a new stop to this route.'}
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="stopName"
                                    control={stopControl}
                                    rules={{ required: 'Stop Name is required' }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField {...field} label="Stop Name" fullWidth error={!!error} helperText={error?.message} />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Controller
                                    name="stopOrder"
                                    control={stopControl}
                                    rules={{ required: 'Order is required' }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField {...field} label="Order" type="number" fullWidth error={!!error} helperText={error?.message} />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Controller
                                    name="pickupTime"
                                    control={stopControl}
                                    render={({ field }) => (
                                        <TextField {...field} label="Pickup Time (e.g. 07:30)" fullWidth placeholder="HH:MM" />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Controller
                                    name="dropTime"
                                    control={stopControl}
                                    render={({ field }) => (
                                        <TextField {...field} label="Drop Time" fullWidth placeholder="HH:MM" />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="distanceFromSchool"
                                    control={stopControl}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Distance from School (km)"
                                            type="number"
                                            fullWidth
                                            inputProps={{ step: 0.5, min: 0 }}
                                            helperText="Used for transport fare calculation"
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenStopDialog(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">Add Stop</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
