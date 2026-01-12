import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Paper, Box, Tabs, Tab, Table, TableBody, TableCell,
    TableHead, TableRow, Button, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Alert, Snackbar
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { examinationService } from '../../lib/api';
import type { ExamType, Subject } from '../../types/examination';
import PageHeader from '../../components/PageHeader';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function ExamConfiguration() {
    const [tabValue, setTabValue] = useState(0);
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

    // --- Subjects State ---
    const { data: subjectsData } = useQuery({
        queryKey: ['subjects'],
        queryFn: examinationService.getSubjects
    });
    const subjects = (subjectsData?.data || []) as Subject[];

    const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [subjectName, setSubjectName] = useState('');
    const [subjectCode, setSubjectCode] = useState('');


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

    // --- Subject Mutations ---
    const createSubjectMutation = useMutation({
        mutationFn: examinationService.createSubject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            handleCloseSubjectDialog();
            showMessage('Subject created successfully');
        },
        onError: (err: any) => showMessage(err.response?.data?.message || 'Failed to create Subject', 'error')
    });

    const updateSubjectMutation = useMutation({
        mutationFn: (data: { id: number, payload: any }) => examinationService.updateSubject(data.id, data.payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            handleCloseSubjectDialog();
            showMessage('Subject updated successfully');
        },
        onError: (err: any) => showMessage(err.response?.data?.message || 'Failed to update Subject', 'error')
    });

    const deleteSubjectMutation = useMutation({
        mutationFn: examinationService.deleteSubject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            showMessage('Subject deleted successfully');
        },
        onError: (err: any) => showMessage(err.response?.data?.message || 'Failed to delete Subject', 'error')
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

    // --- Subject Dialog Handlers ---
    const handleOpenSubjectDialog = (subj?: Subject) => {
        if (subj) {
            setEditingSubject(subj);
            setSubjectName(subj.name);
            setSubjectCode(subj.code || '');
        } else {
            setEditingSubject(null);
            setSubjectName('');
            setSubjectCode('');
        }
        setSubjectDialogOpen(true);
    };

    const handleCloseSubjectDialog = () => {
        setSubjectDialogOpen(false);
        setEditingSubject(null);
    };

    const handleSaveSubject = () => {
        if (!subjectName.trim()) return;
        const payload = { name: subjectName, code: subjectCode || undefined };
        if (editingSubject) {
            updateSubjectMutation.mutate({ id: editingSubject.id, payload });
        } else {
            createSubjectMutation.mutate(payload);
        }
    };


    return (
        <Box>
            <PageHeader title="Examination Configuration" />

            <Paper sx={{ width: '100%', mb: 2 }}>
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} indicatorColor="primary" textColor="primary">
                    <Tab label="Exam Types" />
                    <Tab label="Subjects" />
                </Tabs>

                {/* Exam Types Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
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
                </TabPanel>

                {/* Subjects Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenSubjectDialog()}>
                            Add Subject
                        </Button>
                    </Box>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Code</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {subjects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} align="center">No subjects found.</TableCell>
                                </TableRow>
                            ) : (
                                subjects.map((subj) => (
                                    <TableRow key={subj.id}>
                                        <TableCell>{subj.name}</TableCell>
                                        <TableCell>{subj.code || '-'}</TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" onClick={() => handleOpenSubjectDialog(subj)}>
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => deleteSubjectMutation.mutate(subj.id)}>
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TabPanel>
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

            {/* Subject Dialog */}
            <Dialog open={subjectDialogOpen} onClose={handleCloseSubjectDialog}>
                <DialogTitle>{editingSubject ? 'Edit' : 'Add'} Subject</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Subject Name"
                        fullWidth
                        variant="outlined"
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)}
                        placeholder="e.g., Mathematics, Science"
                    />
                    <TextField
                        margin="dense"
                        label="Subject Code"
                        fullWidth
                        variant="outlined"
                        value={subjectCode}
                        onChange={(e) => setSubjectCode(e.target.value)}
                        placeholder="e.g., MATH, SCI (Optional)"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseSubjectDialog}>Cancel</Button>
                    <Button onClick={handleSaveSubject} variant="contained">{editingSubject ? 'Update' : 'Create'}</Button>
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
