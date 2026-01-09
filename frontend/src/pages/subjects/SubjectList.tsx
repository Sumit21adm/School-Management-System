import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip,
    FormControlLabel,
    Switch,
    Tooltip,
    Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Book as BookIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { subjectService } from '../../lib/api';

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f', '#0288d1', '#7b1fa2'];

const SubjectList = () => {
    const queryClient = useQueryClient();
    const [openDialog, setOpenDialog] = useState(false);
    const [editingSubject, setEditingSubject] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        color: COLORS[0],
        isActive: true
    });

    const { data: subjects, isLoading } = useQuery({
        queryKey: ['subjects'],
        queryFn: subjectService.getAll
    });

    const handleOpenDialog = (subject?: any) => {
        if (subject) {
            setEditingSubject(subject);
            setFormData({
                name: subject.name,
                code: subject.code || '',
                description: subject.description || '',
                color: subject.color || COLORS[0],
                isActive: subject.isActive
            });
        } else {
            setEditingSubject(null);
            setFormData({
                name: '',
                code: '',
                description: '',
                color: COLORS[0],
                isActive: true
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingSubject(null);
    };

    const handleSubmit = async () => {
        try {
            if (editingSubject) {
                await subjectService.update(editingSubject.id, formData);
            } else {
                await subjectService.create(formData);
            }
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            handleCloseDialog();
        } catch (error) {
            console.error('Failed to save subject', error);
            alert('Failed to save subject. Name or Code might be duplicate.');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this subject? It will be removed from all classes.')) {
            try {
                await subjectService.delete(id);
                queryClient.invalidateQueries({ queryKey: ['subjects'] });
            } catch (error) {
                console.error('Failed to delete', error);
                alert('Failed to delete subject');
            }
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        Add Subject
                    </Button>
                    <Typography variant="h5" fontWeight="bold" color="text.secondary">
                        Manage Subjects
                    </Typography>
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                        <TableRow>
                            <TableCell>Color</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Code</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {subjects?.map((subject: any) => (
                            <TableRow key={subject.id} hover>
                                <TableCell>
                                    <Box
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: '50%',
                                            bgcolor: subject.color || 'grey.500'
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography fontWeight="bold">{subject.name}</Typography>
                                </TableCell>
                                <TableCell>
                                    {subject.code ? (
                                        <Chip label={subject.code} size="small" variant="outlined" />
                                    ) : '-'}
                                </TableCell>
                                <TableCell>{subject.description || '-'}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={subject.isActive ? 'Active' : 'Inactive'}
                                        color={subject.isActive ? 'success' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => handleOpenDialog(subject)}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDelete(subject.id)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {subjects?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Box py={3} display="flex" flexDirection="column" alignItems="center" gap={2}>
                                        <BookIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                                        <Typography color="text.secondary">No subjects found. Create one to get started.</Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingSubject ? 'Edit Subject' : 'Add New Subject'}
                </DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={1}>
                        <TextField
                            label="Subject Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Subject Code (Optional)"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            fullWidth
                            placeholder="e.g. MATH, ENG"
                        />
                        <TextField
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            fullWidth
                            multiline
                            rows={2}
                        />

                        <Typography variant="subtitle2" gutterBottom>Color Label</Typography>
                        <Box display="flex" gap={1}>
                            {COLORS.map(color => (
                                <Box
                                    key={color}
                                    onClick={() => setFormData({ ...formData, color })}
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        bgcolor: color,
                                        cursor: 'pointer',
                                        border: formData.color === color ? '3px solid white' : 'none',
                                        outline: formData.color === color ? `2px solid ${color}` : 'none',
                                    }}
                                />
                            ))}
                        </Box>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                            }
                            label="Active"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={!formData.name}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default SubjectList;
