import { useState, useEffect } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, IconButton, Typography, MenuItem, Grid, Chip, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField
} from '@mui/material';
import {
    Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    DirectionsBus as BusIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { transportService, type Vehicle } from '../../lib/api/transport';
import { staffService, UserRole, type Staff } from '../../lib/api/staff';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useSnackbar } from 'notistack';

export default function VehicleList() {
    const { enqueueSnackbar } = useSnackbar();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [drivers, setDrivers] = useState<Staff[]>([]);
    const [open, setOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const { control, handleSubmit, reset } = useForm({
        defaultValues: {
            vehicleNo: '',
            vehicleType: 'Bus',
            capacity: 40,
            make: '',
            model: '',
            driverId: '',
            status: 'active',
            notes: '',
        },
    });

    const fetchData = async () => {
        try {
            // Fetch Vehicles and Drivers (Staff with role DRIVER)
            // Note: getAll returns { data: Staff[], total }
            const [vehiclesData, driversResponse] = await Promise.all([
                transportService.getVehicles(),
                staffService.getAll(UserRole.DRIVER, undefined, 1, 100),
            ]);
            setVehicles(vehiclesData);
            setDrivers(driversResponse.data);
        } catch (error: any) {
            console.error('Fetch error:', error);
            const message = error.response?.data?.message || 'Failed to fetch data';
            enqueueSnackbar(message, { variant: 'error' });
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpen = (vehicle?: Vehicle) => {
        if (vehicle) {
            setEditingVehicle(vehicle);
            reset({
                vehicleNo: vehicle.vehicleNo,
                vehicleType: vehicle.vehicleType,
                capacity: vehicle.capacity,
                make: vehicle.make || '',
                model: vehicle.model || '',
                driverId: vehicle.driver?.id?.toString() || '',
                status: vehicle.status,
                notes: '',
            });
        } else {
            setEditingVehicle(null);
            reset({
                vehicleNo: '',
                vehicleType: 'Bus',
                capacity: 40,
                make: '',
                model: '',
                driverId: '',
                status: 'active',
                notes: '',
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditingVehicle(null);
        reset();
    };

    const onSubmit = async (data: any) => {
        try {
            const payload = {
                ...data,
                capacity: Number(data.capacity),
                driverId: data.driverId ? Number(data.driverId) : null,
            };

            if (editingVehicle) {
                await transportService.updateVehicle(editingVehicle.id, payload);
                enqueueSnackbar('Vehicle updated successfully', { variant: 'success' });
            } else {
                await transportService.createVehicle(payload);
                enqueueSnackbar('Vehicle added successfully', { variant: 'success' });
            }
            handleClose();
            fetchData();
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.message || 'Operation failed', { variant: 'error' });
        }
    };

    const handleDeleteClick = (id: number) => {
        setDeleteId(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteId) return;
        try {
            await transportService.deleteVehicle(deleteId);
            enqueueSnackbar('Vehicle deleted successfully', { variant: 'success' });
            fetchData();
        } catch (error: any) {
            enqueueSnackbar('Failed to delete vehicle', { variant: 'error' });
        }
        setConfirmOpen(false);
    };

    return (
        <Box>
            <PageHeader
                title="Vehicle Management"
                subtitle="Manage school buses, vans, and other vehicles"
                action={
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpen()}
                    >
                        Add Vehicle
                    </Button>
                }
            />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Vehicle No</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Capacity</TableCell>
                            <TableCell>Driver</TableCell>
                            <TableCell>Make/Model</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {vehicles.map((vehicle) => (
                            <TableRow key={vehicle.id}>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <BusIcon color="action" />
                                        {vehicle.vehicleNo}
                                    </Box>
                                </TableCell>
                                <TableCell>{vehicle.vehicleType}</TableCell>
                                <TableCell>{vehicle.capacity}</TableCell>
                                <TableCell>
                                    {vehicle.driver ? (
                                        <Box>
                                            <Typography variant="body2">{vehicle.driver.name}</Typography>
                                            {vehicle.driver.phone && (
                                                <Typography variant="caption" color="textSecondary">{vehicle.driver.phone}</Typography>
                                            )}
                                        </Box>
                                    ) : (
                                        <Typography variant="caption" color="text.secondary">
                                            Unassigned
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {vehicle.make} {vehicle.model}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={vehicle.status}
                                        color={vehicle.status === 'active' ? 'success' : 'warning'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => handleOpen(vehicle)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteClick(vehicle.id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {vehicles.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No vehicles found. Click "Add Vehicle" to create one.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogContent>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="vehicleNo"
                                    control={control}
                                    rules={{ required: 'Vehicle No is required' }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            label="Vehicle No"
                                            fullWidth
                                            error={!!error}
                                            helperText={error?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="vehicleType"
                                    control={control}
                                    rules={{ required: 'Type is required' }}
                                    render={({ field }) => (
                                        <TextField {...field} select label="Type" fullWidth>
                                            <MenuItem value="Bus">Bus</MenuItem>
                                            <MenuItem value="Mini Bus">Mini Bus</MenuItem>
                                            <MenuItem value="Van">Van</MenuItem>
                                            <MenuItem value="Car">Car</MenuItem>
                                        </TextField>
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="capacity"
                                    control={control}
                                    rules={{ required: 'Capacity is required' }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            label="Seating Capacity"
                                            type="number"
                                            fullWidth
                                            error={!!error}
                                            helperText={error?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="status"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} select label="Status" fullWidth>
                                            <MenuItem value="active">Active</MenuItem>
                                            <MenuItem value="maintenance">Maintenance</MenuItem>
                                            <MenuItem value="retired">Retired</MenuItem>
                                        </TextField>
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="make"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label="Make (e.g. Tata)" fullWidth />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="model"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label="Model" fullWidth />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="driverId"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} select label="Assign Driver" fullWidth>
                                            <MenuItem value="">
                                                <em>None</em>
                                            </MenuItem>
                                            {drivers.map((driver) => (
                                                <MenuItem key={driver.id} value={driver.id}>
                                                    {driver.name} {driver.driverDetails?.licenseNumber ? `(DL: ${driver.driverDetails.licenseNumber})` : ''}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="notes"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Notes"
                                            multiline
                                            rows={2}
                                            fullWidth
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button type="submit" variant="contained">
                            {editingVehicle ? 'Update' : 'Add Vehicle'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <ConfirmDialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Vehicle"
                content="Are you sure you want to delete this vehicle?"
                confirmText="Delete"
                severity="error"
            />
        </Box>
    );
}
