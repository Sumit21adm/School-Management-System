import React, { useState } from 'react';
import {
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Chip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectService } from '../../lib/api';

interface Subject {
    id: number;
    name: string;
    code: string;
    description?: string;
    color?: string;
    isActive: boolean;
}

const SubjectManagement = () => {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        color: '#3B82F6',
    });

    const { data: subjects, isLoading } = useQuery({
        queryKey: ['subjects'],
        queryFn: subjectService.getAll,
    });

    const createMutation = useMutation({
        mutationFn: subjectService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            handleCloseDialog();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => subjectService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            handleCloseDialog();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: subjectService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            setDeleteDialogOpen(false);
            setSelectedSubject(null);
        },
    });

    const handleOpenDialog = (subject?: Subject) => {
        if (subject) {
            setSelectedSubject(subject);
            setFormData({
                name: subject.name,
                code: subject.code || '',
                description: subject.description || '',
                color: subject.color || '#3B82F6',
            });
        } else {
            setSelectedSubject(null);
            setFormData({ name: '', code: '', description: '', color: '#3B82F6' });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedSubject(null);
        setFormData({ name: '', code: '', description: '', color: '#3B82F6' });
    };

    const handleSubmit = () => {
        if (selectedSubject) {
            updateMutation.mutate({ id: selectedSubject.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDeleteClick = (subject: Subject) => {
        setSelectedSubject(subject);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (selectedSubject) {
            deleteMutation.mutate(selectedSubject.id);
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box />
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                    Add Subject
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Code</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Color</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {subjects && subjects.length > 0 ? (
                            subjects.map((subject: Subject) => (
                                <TableRow key={subject.id} hover>
                                    <TableCell>{subject.name}</TableCell>
                                    <TableCell>
                                        <Chip label={subject.code} size="small" />
                                    </TableCell>
                                    <TableCell>{subject.description || '-'}</TableCell>
                                    <TableCell>
                                        <Box
                                            sx={{
                                                width: 40,
                                                height: 24,
                                                bgcolor: subject.color || '#3B82F6',
                                                borderRadius: 1,
                                                border: 1,
                                                borderColor: 'divider',
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleOpenDialog(subject)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDeleteClick(subject)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    No subjects found. Click "Add Subject" to create one.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{selectedSubject ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Subject Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Subject Code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            fullWidth
                            required
                            inputProps={{ maxLength: 20 }}
                        />
                        <TextField
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            fullWidth
                            multiline
                            rows={3}
                        />
                        <Box>
                            <TextField
                                label="Color"
                                type="color"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                fullWidth
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={!formData.name || !formData.code || createMutation.isPending || updateMutation.isPending}
                    >
                        {selectedSubject ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Subject</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete "{selectedSubject?.name}"? This action cannot be undone.
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteMutation.isPending}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SubjectManagement;
