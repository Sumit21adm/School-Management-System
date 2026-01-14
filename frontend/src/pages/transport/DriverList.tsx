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
    Avatar,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Person as PersonIcon,
    Phone as PhoneIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { transportService, type Driver } from '../../lib/api/transport';
import PageHeader from '../../components/PageHeader';
import { useSnackbar } from 'notistack';
import { format, isBefore, addDays } from 'date-fns';

export default function DriverList() {
    const { enqueueSnackbar } = useSnackbar();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [open, setOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

    const { control, handleSubmit, reset } = useForm({
        defaultValues: {
            name: '',
            phone: '',
            licenseNo: '',
            licenseType: 'LMV',
            licenseExpiry: '',
            status: 'active',
            address: '',
        },
    });

    const fetchData = async () => {
        try {
            const data = await transportService.getDrivers();
            setDrivers(data);
        } catch (error: any) {
            console.error('Fetch error:', error);
            const message = error.response?.data?.message || 'Failed to fetch drivers';
            enqueueSnackbar(message, { variant: 'error' });
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpen = (driver?: Driver) => {
        if (driver) {
            setEditingDriver(driver);
            reset({
                name: driver.name,
                phone: driver.phone,
                licenseNo: driver.licenseNo,
                licenseType: 'LMV', // TODO: Add to API type if missing, assume LMV default
                licenseExpiry: driver.licenseExpiry ? new Date(driver.licenseExpiry).toISOString().split('T')[0] : '',
                status: driver.status,
                address: '', // Add address if available in API
            });
        } else {
            setEditingDriver(null);
            reset({
                name: '',
                phone: '',
                licenseNo: '',
                licenseType: 'LMV',
                licenseExpiry: '',
                status: 'active',
                address: '',
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditingDriver(null);
        reset();
    };

    const onSubmit = async (data: any) => {
        try {
            if (editingDriver) {
                await transportService.updateDriver(editingDriver.id, data);
                enqueueSnackbar('Driver updated successfully', { variant: 'success' });
            } else {
                await transportService.createDriver(data);
                enqueueSnackbar('Driver added successfully', { variant: 'success' });
            }
            handleClose();
            fetchData();
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.message || 'Operation failed', { variant: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this driver?')) {
            try {
                await transportService.deleteDriver(id);
                enqueueSnackbar('Driver deleted successfully', { variant: 'success' });
                fetchData();
            } catch (error: any) {
                enqueueSnackbar('Failed to delete driver', { variant: 'error' });
            }
        }
    };

    const isLicenseExpiring = (expiryDate: string) => {
        if (!expiryDate) return false;
        const expiry = new Date(expiryDate);
        const warningDate = addDays(new Date(), 30); // Warn 30 days in advance
        return isBefore(expiry, warningDate);
    };

    return (
        <Box>
            <PageHeader
                title="Driver Management"
                subtitle="Manage drivers and conductors"
                action={
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpen()}
                    >
                        Add Driver
                    </Button>
                }
            />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Contact</TableCell>
                            <TableCell>License No</TableCell>
                            <TableCell>Expiry</TableCell>
                            <TableCell>Assigned Vehicle</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {drivers.map((driver) => (
                            <TableRow key={driver.id}>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                                            <PersonIcon />
                                        </Avatar>
                                        <Typography variant="subtitle2">{driver.name}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <PhoneIcon fontSize="small" color="action" />
                                        {driver.phone}
                                    </Box>
                                </TableCell>
                                <TableCell>{driver.licenseNo}</TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {format(new Date(driver.licenseExpiry), 'dd MMM yyyy')}
                                        {isLicenseExpiring(driver.licenseExpiry) && (
                                            <Tooltip title="License Expiring Soon">
                                                <WarningIcon color="warning" fontSize="small" />
                                            </Tooltip>
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    {driver.vehicles && driver.vehicles.length > 0 ? (
                                        driver.vehicles.map(v => (
                                            <Chip key={v.id} label={v.vehicleNo} size="small" variant="outlined" sx={{ mr: 0.5 }} />
                                        ))
                                    ) : (
                                        <Typography variant="caption" color="text.secondary">None</Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={driver.status}
                                        color={driver.status === 'active' ? 'success' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => handleOpen(driver)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDelete(driver.id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {drivers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No drivers found. Click "Add Driver" to create one.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogContent>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="name"
                                    control={control}
                                    rules={{ required: 'Name is required' }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            label="Driver Name"
                                            fullWidth
                                            error={!!error}
                                            helperText={error?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="phone"
                                    control={control}
                                    rules={{ required: 'Phone is required' }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            label="Phone Number"
                                            fullWidth
                                            error={!!error}
                                            helperText={error?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="licenseNo"
                                    control={control}
                                    rules={{ required: 'License No is required' }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            label="License Number"
                                            fullWidth
                                            error={!!error}
                                            helperText={error?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="licenseExpiry"
                                    control={control}
                                    rules={{ required: 'Expiry Date is required' }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            label="License Expiry"
                                            type="date"
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                            error={!!error}
                                            helperText={error?.message}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="licenseType"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} select label="License Type" fullWidth>
                                            <MenuItem value="LMV">LMV</MenuItem>
                                            <MenuItem value="HMV">HMV</MenuItem>
                                            <MenuItem value="Transport">Transport</MenuItem>
                                            <MenuItem value="Other">Other</MenuItem>
                                        </TextField>
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
                                            <MenuItem value="inactive">Inactive</MenuItem>
                                            <MenuItem value="terminated">Terminated</MenuItem>
                                        </TextField>
                                    )}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="address"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="Address"
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
                            {editingDriver ? 'Update' : 'Add Driver'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
