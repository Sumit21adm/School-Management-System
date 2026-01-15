import { useState, useEffect } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Typography, Avatar, Tooltip, Chip, CircularProgress
} from '@mui/material';
import {
    Edit as EditIcon, Delete as DeleteIcon, Person as PersonIcon,
    Phone as PhoneIcon, Warning as WarningIcon
} from '@mui/icons-material';
import { staffService, UserRole, type Staff } from '../../lib/api/staff';
import PageHeader from '../../components/PageHeader';
import AddStaffDialog from '../staff/AddStaffDialog';
import { useSnackbar } from 'notistack';
import { format, isBefore, addDays } from 'date-fns';

export default function DriverList() {
    const { enqueueSnackbar } = useSnackbar();
    const [drivers, setDrivers] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingDriver, setEditingDriver] = useState<Staff | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Drivers only. 
            // Note: getAll returns { data: Staff[], total: number }
            const response = await staffService.getAll(UserRole.DRIVER, undefined, 1, 100);
            setDrivers(response.data);
        } catch (error: any) {
            console.error('Fetch error:', error);
            enqueueSnackbar('Failed to fetch drivers', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpen = (driver?: Staff) => {
        setEditingDriver(driver || null);
        setOpenDialog(true);
    };

    const handleClose = (refresh?: boolean) => {
        setOpenDialog(false);
        setEditingDriver(null);
        if (refresh) fetchData();
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this driver?')) {
            try {
                await staffService.delete(id);
                enqueueSnackbar('Driver deleted successfully', { variant: 'success' });
                fetchData();
            } catch (error) {
                enqueueSnackbar('Failed to delete driver', { variant: 'error' });
            }
        }
    };

    const isLicenseExpiring = (expiryDate?: string) => {
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
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : drivers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No drivers found. Please add drivers in the <a href="/staff" style={{ color: 'inherit', textDecoration: 'underline' }}>Staff Management</a> module.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            drivers.map((driver) => (
                                <TableRow key={driver.id}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                <PersonIcon />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2">{driver.name}</Typography>
                                                <Typography variant="caption" color="textSecondary">{driver.username}</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <PhoneIcon fontSize="small" color="action" />
                                            {driver.phone || '-'}
                                        </Box>
                                    </TableCell>
                                    <TableCell>{driver.driverDetails?.licenseNumber || '-'}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {driver.driverDetails?.licenseExpiry ? format(new Date(driver.driverDetails.licenseExpiry), 'dd MMM yyyy') : '-'}
                                            {isLicenseExpiring(driver.driverDetails?.licenseExpiry) && (
                                                <Tooltip title="License Expiring Soon">
                                                    <WarningIcon color="warning" fontSize="small" />
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {driver.drivenVehicles && driver.drivenVehicles.length > 0 ? (
                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                {driver.drivenVehicles.map(v => (
                                                    <Chip
                                                        key={v.id}
                                                        label={v.vehicleNo}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                ))}
                                            </Box>
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">-</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={driver.active ? 'active' : 'inactive'}
                                            color={driver.active ? 'success' : 'default'}
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
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {openDialog && (
                <AddStaffDialog
                    open={openDialog}
                    onClose={handleClose}
                    staffToEdit={editingDriver}
                    initialRole={UserRole.DRIVER}
                />
            )}
        </Box>
    );
}
