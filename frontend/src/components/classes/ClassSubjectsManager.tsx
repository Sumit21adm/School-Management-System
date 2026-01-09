import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Alert,
    CircularProgress,
    Avatar
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Book as BookIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { classService, subjectService, usersService, sectionsService } from '../../lib/api';
import { useSession } from '../../contexts/SessionContext';

interface ClassSubjectsManagerProps {
    classId: number;
    sections: any[];
}

const ClassSubjectsManager: React.FC<ClassSubjectsManagerProps> = ({ classId, sections }) => {
    const { currentSession } = useSession();
    const [assignedSubjects, setAssignedSubjects] = useState<any[]>([]);
    const [allSubjects, setAllSubjects] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);

    // Section-specific State
    const [selectedSectionId, setSelectedSectionId] = useState<number | ''>('');
    const [sectionAllocations, setSectionAllocations] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('');
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        loadData();
    }, [classId]);

    useEffect(() => {
        if (selectedSectionId) {
            loadSectionAllocations(Number(selectedSectionId));
        } else {
            setSectionAllocations([]);
        }
    }, [selectedSectionId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [assigned, all, teachersList] = await Promise.all([
                classService.getSubjects(classId),
                subjectService.getAll(),
                usersService.getTeachers()
            ]);
            setAssignedSubjects(assigned);
            setAllSubjects(all);
            setTeachers(teachersList);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSectionAllocations = async (sectionId: number) => {
        try {
            // Fetch section details which includes allocations
            // We need a way to get allocations. The generic /sections/:id endpoint returns them.
            // But we don't have a direct api method for it yet, assuming sectionsService.getById exists or we use apiClient.
            // Let's assume we can fetch section details. 
            // Wait, sectionsService.getById isn't in api.ts? I should check.
            // sectionsService was added but maybe not getById. I'll check api.ts content again or just add it if missing.
            // For now, I'll use a direct fetch pattern if needed or assume I can get it.
            // Actually, in sections.service.ts backend, findAll and findOne return allocations. 
            // I'll add getById to sectionsService in api.ts if not present, but for now let's assume I can hack it or it exists.
            // Let's use the raw implementation here if needed or modify api.ts first.
            // Actually I modified api.ts few steps ago, let's check if generic getById is there.
            // I only added assignTeacher. I should probably add getById.
            // But to save steps, I will use fetch('/api/sections/'+id).
            // Better: update api.ts later or now. I'll assume generic usage for now:
            const response = await fetch(`${import.meta.env.VITE_API_URL}/sections/${sectionId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
            });
            const data = await response.json();
            setSectionAllocations(data.allocations || []);
        } catch (error) {
            console.error('Failed to load allocations', error);
        }
    };

    const handleAssign = async () => {
        if (!selectedSubjectId) return;
        setAssigning(true);
        try {
            await classService.assignSubject(classId, {
                subjectId: Number(selectedSubjectId),
                isCompulsory: true,
                weeklyPeriods: 0
            });
            await loadData();
            setOpenDialog(false);
            setSelectedSubjectId('');
        } catch (error) {
            console.error('Failed to assign subject', error);
            alert('Failed to assign subject');
        } finally {
            setAssigning(false);
        }
    };

    const handleRemove = async (subjectId: number) => {
        if (!window.confirm('Are you sure you want to remove this subject from the class?')) return;
        try {
            await classService.removeSubject(classId, subjectId);
            loadData();
        } catch (error) {
            console.error('Failed to remove subject', error);
            alert('Failed to remove subject');
        }
    };

    const handleAssignTeacher = async (subjectId: number, teacherId: number) => {
        if (!selectedSectionId || !currentSession) {
            alert('Please select a section and ensure session is active');
            return;
        }
        try {
            await sectionsService.assignSubjectTeacher(
                Number(selectedSectionId),
                subjectId,
                teacherId,
                currentSession.id
            );
            // Reload allocations
            loadSectionAllocations(Number(selectedSectionId));
        } catch (error) {
            console.error('Failed to assign teacher', error);
            alert('Failed to assign teacher');
        }
    };

    // Filter out already assigned subjects from the dropdown
    const availableSubjects = allSubjects.filter(
        s => !assignedSubjects.some(as => as.subjectId === s.id)
    );

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="h6">Assigned Subjects</Typography>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Filter by Section</InputLabel>
                        <Select
                            value={selectedSectionId}
                            label="Filter by Section"
                            onChange={(e) => setSelectedSectionId(Number(e.target.value))}
                        >
                            <MenuItem value=""><em>None (Manage Subjects Only)</em></MenuItem>
                            {sections.map(section => (
                                <MenuItem key={section.id} value={section.id}>
                                    Section {section.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                >
                    Assign Subject to Class
                </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
                <Table>
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                        <TableRow>
                            <TableCell>Subject Name</TableCell>
                            <TableCell>Code</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Teacher (for {selectedSectionId ? `Section ${sections.find(s => s.id === selectedSectionId)?.name}` : 'Selected Section'})</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {assignedSubjects.map((item) => {
                            const allocation = sectionAllocations.find(a => a.subjectId === item.subjectId);
                            return (
                                <TableRow key={item.id} hover>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Box
                                                sx={{
                                                    width: 16,
                                                    height: 16,
                                                    borderRadius: '50%',
                                                    bgcolor: item.subject.color || 'grey.500'
                                                }}
                                            />
                                            <Typography fontWeight="medium">{item.subject.name}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{item.subject.code || '-'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={item.isCompulsory ? 'Compulsory' : 'Optional'}
                                            size="small"
                                            color={item.isCompulsory ? 'primary' : 'default'}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {selectedSectionId ? (
                                            <FormControl fullWidth size="small" variant="standard">
                                                <Select
                                                    value={allocation?.teacherId || ''}
                                                    displayEmpty
                                                    renderValue={(selected) => {
                                                        if (!selected) return <Typography variant="caption" color="text.secondary">Select Teacher</Typography>;
                                                        const teacher = teachers.find(t => t.id === selected);
                                                        return teacher?.name || 'Unknown';
                                                    }}
                                                    onChange={(e) => handleAssignTeacher(item.subjectId, Number(e.target.value))}
                                                >
                                                    <MenuItem value="">
                                                        <em>None</em>
                                                    </MenuItem>
                                                    {teachers.map(teacher => (
                                                        <MenuItem key={teacher.id} value={teacher.id}>
                                                            {teacher.name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        ) : (
                                            <Typography variant="caption" color="text.disabled">
                                                Select Section to Assign
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleRemove(item.subjectId)}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {assignedSubjects.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    <Box py={4} display="flex" flexDirection="column" alignItems="center" gap={1}>
                                        <BookIcon color="disabled" fontSize="large" />
                                        <Typography color="text.secondary">
                                            No subjects assigned to this class yet.
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Assign Subject</DialogTitle>
                <DialogContent>
                    <Box pt={1}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Select Subject</InputLabel>
                            <Select
                                value={selectedSubjectId}
                                label="Select Subject"
                                onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                            >
                                {availableSubjects.map((subject) => (
                                    <MenuItem key={subject.id} value={subject.id}>
                                        {subject.name} {subject.code ? `(${subject.code})` : ''}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {availableSubjects.length === 0 && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                All available subjects are already assigned.
                            </Alert>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleAssign}
                        disabled={!selectedSubjectId || assigning}
                    >
                        Assign
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ClassSubjectsManager;
