'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Container,
    Paper,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip,
    IconButton,
    Alert,
    Snackbar,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CheckCircle as ActivateIcon,
} from '@mui/icons-material';
import { sessionService } from '@/lib/api';
import { format, parse } from 'date-fns';

export default function SessionsManagement() {
    const [openDialog, setOpenDialog] = useState(false);
    const [editingSession, setEditingSession] = useState<any>(null);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
    });
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['sessions'],
        queryFn: () => sessionService.getAll(true),
    });

    const createMutation = useMutation({
        mutationFn: sessionService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions'] });
            handleCloseDialog();
            setSuccessMessage('Session created successfully!');
        },
        onError: (error: any) => {
            setError(error?.response?.data?.message || 'Failed to create session');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: any) => sessionService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions'] });
            handleCloseDialog();
            setSuccessMessage('Session updated successfully!');
        },
        onError: (error: any) => {
            setError(error?.response?.data?.message || 'Failed to update session');
        },
    });

    const activateMutation = useMutation({
        mutationFn: sessionService.activate,
        onSuccess: (_, sessionId) => {
            queryClient.invalidateQueries({ queryKey: ['sessions'] });
            localStorage.setItem('selectedSessionId', sessionId.toString());
            setSuccessMessage('Session activated successfully!');
        },
        onError: (error: any) => {
            setError(error?.response?.data?.message || 'Failed to activate session');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: sessionService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions'] });
            setSuccessMessage('Session deleted successfully!');
        },
        onError: (error: any) => {
            setError(error?.response?.data?.message || 'Failed to delete session');
        },
    });

    const handleOpenDialog = (session?: any) => {
        if (session) {
            setEditingSession(session);
            setFormData({
                name: session.name,
                startDate: format(new Date(session.startDate), 'yyyy-MM-dd'),
                endDate: format(new Date(session.endDate), 'yyyy-MM-dd'),
            });
        } else {
            setEditingSession(null);
            setFormData({ name: '', startDate: '', endDate: '' });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingSession(null);
        setFormData({ name: '', startDate: '', endDate: '' });
        setError('');
    };

    const generateSessionName = (startDate: string, endDate: string): string => {
        if (!startDate || !endDate) return '';
        const start = parse(startDate, 'yyyy-MM-dd', new Date());
        const end = parse(endDate, 'yyyy-MM-dd', new Date());
        const startMonth = format(start, 'MMM').toUpperCase();
        const startYear = format(start, 'yyyy');
        const endMonth = format(end, 'MMM').toUpperCase();
        const endYear = format(end, 'yyyy');
        return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
    };

    const handleSubmit = () => {
        if (!formData.name || !formData.startDate || !formData.endDate) {
            setError('Please fill all fields');
            return;
        }

        if (editingSession) {
            updateMutation.mutate({ id: editingSession.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleActivate = (id: number) => {
        if (confirm('Activate this session? The current active session will be deactivated.')) {
            activateMutation.mutate(id);
        }
    };

    const handleDelete = (id: number, isActive: boolean) => {
        if (isActive) {
            setError('Cannot delete the active session');
            return;
        }
        if (confirm('Are you sure you want to delete this session?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5">Academic Sessions Management</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                        Add New Session
                    </Button>
                </Box>

                {isLoading ? (
                    <Typography>Loading...</Typography>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Session Name</strong></TableCell>
                                <TableCell><strong>Start Date</strong></TableCell>
                                <TableCell><strong>End Date</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell align="right"><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Array.isArray(data) && data.map((session: any) => (
                                <TableRow key={session.id}>
                                    <TableCell>{session.name}</TableCell>
                                    <TableCell>{format(new Date(session.startDate), 'dd MMM yyyy')}</TableCell>
                                    <TableCell>{format(new Date(session.endDate), 'dd MMM yyyy')}</TableCell>
                                    <TableCell>
                                        {session.isActive && <Chip label="Active" color="success" size="small" />}
                                        {session.isSetupMode && <Chip label="Setup" color="warning" size="small" sx={{ ml: 1 }} />}
                                    </TableCell>
                                    <TableCell align="right">
                                        {!session.isActive && (
                                            <IconButton size="small" color="success" onClick={() => handleActivate(session.id)} title="Activate Session">
                                                <ActivateIcon />
                                            </IconButton>
                                        )}
                                        <IconButton size="small" color="primary" onClick={() => handleOpenDialog(session)} title="Edit Session">
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(session.id, session.isActive)} title="Delete Session" disabled={session.isActive}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Paper>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editingSession ? 'Edit Session' : 'Add New Session'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
                        <TextField
                            label="Session Name"
                            value={formData.name}
                            fullWidth
                            disabled
                            helperText="Select start and end dates to auto-generate"
                        />
                        <TextField
                            label="Start Date"
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => {
                                const newName = generateSessionName(e.target.value, formData.endDate);
                                setFormData({ ...formData, startDate: e.target.value, name: newName || formData.name });
                            }}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="End Date"
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => {
                                const newName = generateSessionName(formData.startDate, e.target.value);
                                setFormData({ ...formData, endDate: e.target.value, name: newName || formData.name });
                            }}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
                        {editingSession ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!successMessage} autoHideDuration={4000} onClose={() => setSuccessMessage('')}>
                <Alert severity="success">{successMessage}</Alert>
            </Snackbar>
        </Container>
    );
}
