import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Container, Paper, Typography, Box, Table, TableBody, TableCell,
    TableHead, TableRow, Button, IconButton, Chip, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Alert, Snackbar, MenuItem, Stack
} from '@mui/material';
import { Add, Visibility, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { examinationService } from '../../lib/api';
import type { Exam, ExamType } from '../../types/examination';
import { useSession } from '../../contexts/SessionContext';
import PageHeader from '../../components/PageHeader';

export default function ExamList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { selectedSession } = useSession(); // Use global session context

    // Local state for Create Dialog if we want it here, or standalone page. 
    // Let's do a Dialog here for quick creation.
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        examTypeId: '',
        startDate: '',
        endDate: '',
        description: ''
    });

    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });
    const showMessage = (message: string, severity: 'success' | 'error' = 'success') => setSnackbar({ open: true, message, severity });

    // Queries
    const { data: examsData } = useQuery({
        queryKey: ['exams', selectedSession?.id],
        queryFn: () => examinationService.getExams({ sessionId: selectedSession?.id }),
        enabled: !!selectedSession
    });
    const exams = (examsData?.data || []) as Exam[];

    const { data: examTypesData } = useQuery({
        queryKey: ['examTypes'],
        queryFn: examinationService.getExamTypes
    });
    const examTypes = (examTypesData?.data || []) as ExamType[];

    // Mutations
    const createExamMutation = useMutation({
        mutationFn: examinationService.createExam,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exams'] });
            setCreateDialogOpen(false);
            setFormData({ name: '', examTypeId: '', startDate: '', endDate: '', description: '' });
            showMessage('Exam created successfully');
        },
        onError: (err: any) => showMessage(err.response?.data?.message || 'Failed to create Exam', 'error')
    });

    const deleteExamMutation = useMutation({
        mutationFn: examinationService.deleteExam,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exams'] });
            showMessage('Exam deleted successfully');
        },
        onError: (err: any) => showMessage(err.response?.data?.message || 'Failed to delete Exam', 'error')
    });

    const handleCreate = () => {
        if (!selectedSession) {
            showMessage('Please select a session first', 'error');
            return;
        }
        createExamMutation.mutate({
            ...formData,
            examTypeId: Number(formData.examTypeId),
            sessionId: selectedSession.id
        });
    };

    return (
        <Box>
            <PageHeader
                title="Examinations"
                action={
                    <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}>
                        Create Exam
                    </Button>
                }
            />

            <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
                {!selectedSession ? (
                    <Alert severity="warning">Please select a session to view exams.</Alert>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Start Date</TableCell>
                                <TableCell>End Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {exams.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">No exams found for this session.</TableCell>
                                </TableRow>
                            ) : (
                                exams.map((exam) => (
                                    <TableRow key={exam.id} hover>
                                        <TableCell>{exam.name}</TableCell>
                                        <TableCell>{exam.examType?.name}</TableCell>
                                        <TableCell>{new Date(exam.startDate).toLocaleDateString()}</TableCell>
                                        <TableCell>{new Date(exam.endDate).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={exam.status}
                                                color={exam.status === 'COMPLETED' ? 'success' : exam.status === 'ONGOING' ? 'warning' : 'primary'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<Visibility />}
                                                onClick={() => navigate(`/exams/${exam.id}`)}
                                                sx={{ mr: 1 }}
                                            >
                                                Details
                                            </Button>
                                            <IconButton color="error" size="small" onClick={() => {
                                                if (confirm('Are you sure you want to delete this exam?')) {
                                                    deleteExamMutation.mutate(exam.id);
                                                }
                                            }}>
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </Paper>

            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Exam</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Exam Name"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <TextField
                            select
                            label="Exam Type"
                            fullWidth
                            value={formData.examTypeId}
                            onChange={(e) => setFormData({ ...formData, examTypeId: e.target.value })}
                        >
                            {examTypes.map((type) => (
                                <MenuItem key={type.id} value={type.id}>
                                    {type.name}
                                </MenuItem>
                            ))}
                        </TextField>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Start Date"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            />
                            <TextField
                                label="End Date"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </Box>
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleCreate}
                        variant="contained"
                        disabled={!formData.name || !formData.examTypeId || !formData.startDate || !formData.endDate}
                    >
                        Create
                    </Button>
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
