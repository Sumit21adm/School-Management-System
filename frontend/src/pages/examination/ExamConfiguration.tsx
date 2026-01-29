import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Paper, Box, Table, TableBody, TableCell,
    TableHead, TableRow, Button, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Alert, Snackbar,
    Typography
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { examinationService } from '../../lib/api';
import type { ExamType } from '../../types/examination';
import PageHeader from '../../components/PageHeader';


export default function ExamConfiguration() {
    const queryClient = useQueryClient();
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

    // --- Exam Types State ---
    const { data: examTypesData } = useQuery({
        queryKey: ['examTypes'],
        queryFn: examinationService.getExamTypes
    });
    const examTypes = (examTypesData?.data || []) as ExamType[];

    const [examTypeDialogOpen, setExamTypeDialogOpen] = useState(false);
    const [editingExamType, setEditingExamType] = useState<ExamType | null>(null);
    const [examTypeName, setExamTypeName] = useState('');
    const [examTypeDesc, setExamTypeDesc] = useState('');

    // --- Generic Handlers ---
    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });
    const showMessage = (message: string, severity: 'success' | 'error' = 'success') => setSnackbar({ open: true, message, severity });

    // --- Exam Type Mutations ---
    const createExamTypeMutation = useMutation({
        mutationFn: examinationService.createExamType,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['examTypes'] });
            handleCloseExamTypeDialog();
            showMessage('Exam Type created successfully');
        },
        onError: (err: any) => showMessage(err.response?.data?.message || 'Failed to create Exam Type', 'error')
    });

    const updateExamTypeMutation = useMutation({
        mutationFn: (data: { id: number, payload: any }) => examinationService.updateExamType(data.id, data.payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['examTypes'] });
            handleCloseExamTypeDialog();
            showMessage('Exam Type updated successfully');
        },
        onError: (err: any) => showMessage(err.response?.data?.message || 'Failed to update Exam Type', 'error')
    });

    const deleteExamTypeMutation = useMutation({
        mutationFn: examinationService.deleteExamType,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['examTypes'] });
            showMessage('Exam Type deleted successfully');
        },
        onError: (err: any) => showMessage(err.response?.data?.message || 'Failed to delete Exam Type', 'error')
    });

    // --- Exam Type Dialog Handlers ---
    const handleOpenExamTypeDialog = (type?: ExamType) => {
        if (type) {
            setEditingExamType(type);
            setExamTypeName(type.name);
            setExamTypeDesc(type.description || '');
        } else {
            setEditingExamType(null);
            setExamTypeName('');
            setExamTypeDesc('');
        }
        setExamTypeDialogOpen(true);
    };

    const handleCloseExamTypeDialog = () => {
        setExamTypeDialogOpen(false);
        setEditingExamType(null);
    };

    const handleSaveExamType = () => {
        if (!examTypeName.trim()) return;
        const payload = { name: examTypeName, description: examTypeDesc };
        if (editingExamType) {
            updateExamTypeMutation.mutate({ id: editingExamType.id, payload });
        } else {
            createExamTypeMutation.mutate(payload);
        }
    };


    return (
        <Box>
            <PageHeader title="Examination Configuration" />

            <Paper sx={{ width: '100%', mb: 2 }}>
                {/* Single View for Exam Types - Tabs removed as we only have one item now */}

                <Box sx={{ p: 3 }}>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Exam Types</Typography>
                        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenExamTypeDialog()}>
                            Add Exam Type
                        </Button>
                    </Box>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {examTypes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} align="center">No exam types found.</TableCell>
                                </TableRow>
                            ) : (
                                examTypes.map((type) => (
                                    <TableRow key={type.id}>
                                        <TableCell>{type.name}</TableCell>
                                        <TableCell>{type.description}</TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" onClick={() => handleOpenExamTypeDialog(type)}>
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => deleteExamTypeMutation.mutate(type.id)}>
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Box>
            </Paper>

            {/* Exam Type Dialog */}
            <Dialog open={examTypeDialogOpen} onClose={handleCloseExamTypeDialog}>
                <DialogTitle>{editingExamType ? 'Edit' : 'Add'} Exam Type</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Exam Type Name"
                        fullWidth
                        variant="outlined"
                        value={examTypeName}
                        onChange={(e) => setExamTypeName(e.target.value)}
                        placeholder="e.g., Weekly Test, Annual Exam"
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={2}
                        value={examTypeDesc}
                        onChange={(e) => setExamTypeDesc(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseExamTypeDialog}>Cancel</Button>
                    <Button onClick={handleSaveExamType} variant="contained">{editingExamType ? 'Update' : 'Create'}</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
