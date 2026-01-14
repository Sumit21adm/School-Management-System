import { useState } from 'react';
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Switch,
    FormControlLabel,
    Typography,
    Chip,
    Alert,
    CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete, Straighten } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { transportService, type FareSlab } from '../../lib/api/transport';
import PageHeader from '../../components/PageHeader';
import { hasPermission, getCurrentUserPermissions } from '../../utils/permissions';

export default function FareSlabs() {
    const queryClient = useQueryClient();
    const { enqueueSnackbar } = useSnackbar();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSlab, setEditingSlab] = useState<FareSlab | null>(null);
    const [formData, setFormData] = useState({
        minDistance: 0,
        maxDistance: 0,
        monthlyFee: 0,
        description: '',
    });

    const { data: slabs = [], isLoading, error } = useQuery<FareSlab[]>({
        queryKey: ['fare-slabs'],
        queryFn: () => transportService.getFareSlabs(),
    });

    const createMutation = useMutation({
        mutationFn: (data: typeof formData) => transportService.createFareSlab(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fare-slabs'] });
            enqueueSnackbar('Fare slab created successfully', { variant: 'success' });
            handleCloseDialog();
        },
        onError: (err: any) => {
            enqueueSnackbar(err.response?.data?.message || 'Failed to create fare slab', { variant: 'error' });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<FareSlab> }) =>
            transportService.updateFareSlab(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fare-slabs'] });
            enqueueSnackbar('Fare slab updated successfully', { variant: 'success' });
            handleCloseDialog();
        },
        onError: (err: any) => {
            enqueueSnackbar(err.response?.data?.message || 'Failed to update fare slab', { variant: 'error' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => transportService.deleteFareSlab(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fare-slabs'] });
            enqueueSnackbar('Fare slab deleted successfully', { variant: 'success' });
        },
        onError: (err: any) => {
            enqueueSnackbar(err.response?.data?.message || 'Failed to delete fare slab', { variant: 'error' });
        },
    });

    const handleOpenDialog = (slab?: FareSlab) => {
        if (slab) {
            setEditingSlab(slab);
            setFormData({
                minDistance: Number(slab.minDistance),
                maxDistance: Number(slab.maxDistance),
                monthlyFee: Number(slab.monthlyFee),
                description: slab.description || '',
            });
        } else {
            setEditingSlab(null);
            setFormData({ minDistance: 0, maxDistance: 0, monthlyFee: 0, description: '' });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingSlab(null);
    };

    const handleSubmit = () => {
        if (editingSlab) {
            updateMutation.mutate({ id: editingSlab.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleToggleActive = (slab: FareSlab) => {
        updateMutation.mutate({ id: slab.id, data: { isActive: !slab.isActive } });
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this fare slab?')) {
            deleteMutation.mutate(id);
        }
    };

    // Permission check
    const { role, permissions } = getCurrentUserPermissions();
    const canManage = hasPermission('transport_manage', role, permissions);

    if (error) {
        return (
            <Box>
                <PageHeader title="Transport Fare Slabs" />
                <Alert severity="error">Failed to load fare slabs.</Alert>
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="Transport Fare Slabs"
                subtitle="Configure distance-based transport fees"
                action={
                    canManage && (
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => handleOpenDialog()}
                        >
                            Add Fare Slab
                        </Button>
                    )
                }
            />

            {isLoading ? (
                <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                </Box>
            ) : slabs.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Straighten sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>No Fare Slabs Configured</Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Add fare slabs to enable distance-based transport fee calculation.
                    </Typography>
                    {canManage && (
                        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
                            Add First Fare Slab
                        </Button>
                    )}
                </Paper>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell>Distance Range</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell align="right">Monthly Fee</TableCell>
                                <TableCell align="center">Status</TableCell>
                                {canManage && <TableCell align="center">Actions</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {slabs.map((slab) => (
                                <TableRow key={slab.id} sx={{ opacity: slab.isActive ? 1 : 0.5 }}>
                                    <TableCell>
                                        <Chip
                                            icon={<Straighten />}
                                            label={`${Number(slab.minDistance)} - ${Number(slab.maxDistance)} km`}
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>{slab.description || '-'}</TableCell>
                                    <TableCell align="right">
                                        <Typography variant="h6" color="success.main">
                                            ₹{Number(slab.monthlyFee).toLocaleString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={slab.isActive ? 'Active' : 'Inactive'}
                                            color={slab.isActive ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    {canManage && (
                                        <TableCell align="center">
                                            <IconButton size="small" onClick={() => handleOpenDialog(slab)}>
                                                <Edit />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(slab.id)}
                                            >
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editingSlab ? 'Edit Fare Slab' : 'Add Fare Slab'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Min Distance (km)"
                                type="number"
                                value={formData.minDistance}
                                onChange={(e) => setFormData({ ...formData, minDistance: parseFloat(e.target.value) || 0 })}
                                fullWidth
                                inputProps={{ step: 0.5, min: 0 }}
                            />
                            <TextField
                                label="Max Distance (km)"
                                type="number"
                                value={formData.maxDistance}
                                onChange={(e) => setFormData({ ...formData, maxDistance: parseFloat(e.target.value) || 0 })}
                                fullWidth
                                inputProps={{ step: 0.5, min: 0 }}
                            />
                        </Box>
                        <TextField
                            label="Monthly Fee (₹)"
                            type="number"
                            value={formData.monthlyFee}
                            onChange={(e) => setFormData({ ...formData, monthlyFee: parseFloat(e.target.value) || 0 })}
                            fullWidth
                            inputProps={{ min: 0 }}
                        />
                        <TextField
                            label="Description (optional)"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            fullWidth
                            placeholder="e.g., 0-3 km zone"
                        />
                        {editingSlab && (
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={editingSlab.isActive}
                                        onChange={() => handleToggleActive(editingSlab)}
                                    />
                                }
                                label="Active"
                            />
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={createMutation.isPending || updateMutation.isPending}
                    >
                        {editingSlab ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
