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
    IconButton,
    Alert,
    Snackbar,
    Chip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { classService } from '@/lib/api';

export default function ClassManagement() {
    const [openDialog, setOpenDialog] = useState(false);
    const [editingClass, setEditingClass] = useState<any>(null);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [formData, setFormData] = useState({ name: '', displayName: '', sections: 'A,B,C' });
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['classes'],
        queryFn: classService.getAll,
    });

    const createMutation = useMutation({
        mutationFn: classService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            handleCloseDialog();
            setSuccessMessage('Class created successfully!');
        },
        onError: (error: any) => setError(error?.response?.data?.message || 'Failed to create class'),
    });

    const handleOpenDialog = (cls?: any) => {
        if (cls) {
            setEditingClass(cls);
            setFormData({ name: cls.name, displayName: cls.displayName, sections: cls.sections?.join(',') || 'A,B,C' });
        } else {
            setEditingClass(null);
            setFormData({ name: '', displayName: '', sections: 'A,B,C' });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingClass(null);
        setFormData({ name: '', displayName: '', sections: 'A,B,C' });
        setError('');
    };

    const handleSubmit = () => {
        if (!formData.name || !formData.displayName) {
            setError('Please fill all fields');
            return;
        }
        createMutation.mutate({
            ...formData,
            sections: formData.sections.split(',').map(s => s.trim()),
        });
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5">Class Management</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                        Add New Class
                    </Button>
                </Box>

                {isLoading ? (
                    <Typography>Loading...</Typography>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Class Name</strong></TableCell>
                                <TableCell><strong>Display Name</strong></TableCell>
                                <TableCell><strong>Sections</strong></TableCell>
                                <TableCell align="right"><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data?.map((cls: any) => (
                                <TableRow key={cls.id}>
                                    <TableCell>{cls.name}</TableCell>
                                    <TableCell>{cls.displayName}</TableCell>
                                    <TableCell>
                                        {cls.sections?.map((s: string) => (
                                            <Chip key={s} label={s} size="small" sx={{ mr: 0.5 }} />
                                        ))}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" color="primary" onClick={() => handleOpenDialog(cls)}>
                                            <EditIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Paper>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
                        <TextField
                            label="Class Name (e.g., 1, 2, LKG)"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Display Name (e.g., Class 1, Class 2)"
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Sections (comma-separated)"
                            value={formData.sections}
                            onChange={(e) => setFormData({ ...formData, sections: e.target.value })}
                            fullWidth
                            helperText="E.g., A,B,C"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={createMutation.isPending}>
                        {editingClass ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!successMessage} autoHideDuration={4000} onClose={() => setSuccessMessage('')}>
                <Alert severity="success">{successMessage}</Alert>
            </Snackbar>
        </Container>
    );
}
