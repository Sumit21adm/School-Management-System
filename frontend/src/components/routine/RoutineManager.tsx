import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { routineService, classService, usersService } from '../../lib/api';
import { useSession } from '../../contexts/SessionContext';

interface RoutineManagerProps {
    classId: number;
    sections: any[];
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const RoutineManager: React.FC<RoutineManagerProps> = ({ classId, sections }) => {
    const { currentSession } = useSession();
    const [selectedSection, setSelectedSection] = useState<number | ''>('');
    const [routines, setRoutines] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Editor State
    const [subjects, setSubjects] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedCell, setSelectedCell] = useState<{ day: string, period: number } | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
    const [selectedTeacher, setSelectedTeacher] = useState<number | ''>('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (sections.length > 0 && !selectedSection) {
            setSelectedSection(sections[0].id);
        }
        loadMetadata();
    }, [sections]);

    useEffect(() => {
        if (selectedSection) {
            loadRoutines();
        }
    }, [selectedSection]);

    const loadMetadata = async () => {
        try {
            const [subjectsData, teachersData] = await Promise.all([
                classService.getSubjects(classId),
                usersService.getTeachers()
            ]);
            // classService.getSubjects returns generic object? extract properly
            // backend returns list of ClassSubject objects? or just subjects?
            // Usually returns { classSubjects: [...] } or [...]
            // Let's assume list or handle response
            setSubjects(Array.isArray(subjectsData) ? subjectsData : (subjectsData as any).subjects || []);
            setTeachers(teachersData);
        } catch (error) {
            console.error('Failed to load metadata', error);
        }
    };

    const loadRoutines = async () => {
        setLoading(true);
        try {
            const data = await routineService.getAll({
                classId,
                sectionId: Number(selectedSection)
            });
            setRoutines(data);
        } catch (error) {
            console.error('Failed to fetch routines', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCellClick = (day: string, period: number) => {
        if (!selectedSection) return;
        const existing = getRoutineForCell(day, period);
        setSelectedCell({ day, period });
        setSelectedSubject(existing?.subjectId || '');
        setSelectedTeacher(existing?.teacherId || '');
        setEditDialogOpen(true);
    };

    const handleSave = async () => {
        if (!selectedSection || !selectedCell || !currentSession) return;
        setSaving(true);
        try {
            await routineService.create({
                sectionId: Number(selectedSection),
                sessionId: currentSession.id,
                dayOfWeek: selectedCell.day,
                periodNo: selectedCell.period,
                subjectId: Number(selectedSubject),
                teacherId: Number(selectedTeacher)
            });
            await loadRoutines();
            setEditDialogOpen(false);
        } catch (error) {
            console.error('Failed to save routine', error);
            alert('Failed to save routine');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const existing = getRoutineForCell(selectedCell!.day, selectedCell!.period);
        if (!existing) return;

        if (!window.confirm('Clear this slot?')) return;

        setSaving(true);
        try {
            await routineService.delete(existing.id);
            await loadRoutines();
            setEditDialogOpen(false);
        } catch (error) {
            console.error('Failed to delete routine', error);
        } finally {
            setSaving(false);
        }
    };

    const getRoutineForCell = (day: string, period: number) => {
        return routines.find(r => r.dayOfWeek === day && r.period === period);
    };

    if (sections.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography>No sections available for this class.</Typography>
            </Paper>
        );
    }

    return (
        <Box>
            <Box mb={3} display="flex" alignItems="center" gap={2}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Select Section</InputLabel>
                    <Select
                        value={selectedSection}
                        label="Select Section"
                        onChange={(e) => setSelectedSection(Number(e.target.value))}
                    >
                        {sections.map((sec) => (
                            <MenuItem key={sec.id} value={sec.id}>
                                Section {sec.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Typography variant="body2" color="text.secondary">
                    Viewing Time Table for Section {sections.find(s => s.id === selectedSection)?.name}
                </Typography>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" p={5}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box sx={{ overflowX: 'auto' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '100px repeat(8, 1fr)', gap: 1, minWidth: 900 }}>
                        {/* Header Row: Periods */}
                        <Box sx={{ p: 1, fontWeight: 'bold', bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            Day / Period
                        </Box>
                        {PERIODS.map(p => (
                            <Box key={p} sx={{ p: 1, fontWeight: 'bold', bgcolor: 'primary.light', color: 'white', textAlign: 'center', borderRadius: 1 }}>
                                {p}
                            </Box>
                        ))}

                        {/* Data Rows: Days */}
                        {DAYS.map(day => (
                            <React.Fragment key={day}>
                                <Box sx={{ p: 1, fontWeight: 'bold', bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: 1, borderColor: 'divider' }}>
                                    {day.slice(0, 3)}
                                </Box>
                                {PERIODS.map(period => {
                                    const entry = getRoutineForCell(day, period);
                                    return (
                                        <Paper
                                            key={`${day}-${period}`}
                                            elevation={0}
                                            sx={{
                                                p: 1,
                                                minHeight: 80,
                                                border: '1px dashed',
                                                borderColor: 'divider',
                                                bgcolor: entry ? 'primary.50' : 'transparent',
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: 'action.hover' },
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                textAlign: 'center'
                                            }}
                                            onClick={() => handleCellClick(day, period)}
                                        >
                                            {entry ? (
                                                <>
                                                    <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
                                                        {entry.subject?.name || 'Subject'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {entry.teacher?.name || 'Teacher'}
                                                    </Typography>
                                                </>
                                            ) : (
                                                <Typography variant="caption" color="text.disabled">
                                                    -
                                                </Typography>
                                            )}
                                        </Paper>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </Box>
                </Box>
            )}

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>
                    Edit Routine
                    <Typography variant="body2" color="text.secondary">
                        {selectedCell?.day} - Period {selectedCell?.period}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={1}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Subject</InputLabel>
                            <Select
                                value={selectedSubject}
                                label="Subject"
                                onChange={(e) => setSelectedSubject(Number(e.target.value))}
                            >
                                {subjects.map((sub: any) => {
                                    // Handle both direct Subject object or ClassSubject structure
                                    const subject = sub.subject || sub;
                                    return (
                                        <MenuItem key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth size="small">
                            <InputLabel>Teacher</InputLabel>
                            <Select
                                value={selectedTeacher}
                                label="Teacher"
                                onChange={(e) => setSelectedTeacher(Number(e.target.value))}
                            >
                                {teachers.map((t) => (
                                    <MenuItem key={t.id} value={t.id}>
                                        {t.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    {getRoutineForCell(selectedCell?.day || '', selectedCell?.period || 0) && (
                        <Button color="error" onClick={handleDelete} disabled={saving}>
                            Clear
                        </Button>
                    )}
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving || !selectedSubject || !selectedTeacher}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RoutineManager;
