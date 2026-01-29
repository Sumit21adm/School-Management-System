import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    CircularProgress,
    Button,
    Avatar,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    Dialog,
    TableSortLabel
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    CalendarMonth as CalendarIcon,
    Person as PersonIcon,
    School as SchoolIcon,
    Refresh as RefreshIcon,
    Numbers as NumbersIcon,
    Book as BookIcon,
    DragIndicator as DragHandleIcon,
    Save as SaveIcon
} from '@mui/icons-material';
import RoutineManager from '../../components/routine/RoutineManager';
import ClassSubjectsManager from '../../components/classes/ClassSubjectsManager';
import { useSession } from '../../contexts/SessionContext';
import { classService, admissionService, studentsService, sectionsService, usersService } from '../../lib/api';

// DND Imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Section {
    id: number;
    name: string;
    classId: number;
    classTeacherId?: number;
    classTeacher?: {
        id: number;
        teacher: {
            id: number;
            name: string;
        }
    }
}

interface ClassData {
    id: number;
    name: string;
    displayName: string;
    order: number;
    sections: Section[];
}

// Sortable Row Component
const SortableRow = ({ student, ...props }: { student: any;[key: string]: any }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: student.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: isDragging ? '#f5f5f5' : undefined,
        zIndex: isDragging ? 2 : undefined,
        position: 'relative' as const,
    };

    return (
        <TableRow ref={setNodeRef} style={style} {...props}>
            <TableCell>
                <div
                    {...attributes}
                    {...listeners}
                    style={{ cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <DragHandleIcon fontSize="small" color="action" />
                </div>
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {student.rollNumber || '-'}
            </TableCell>
            <TableCell>{student.studentId}</TableCell>
            <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                        {student.name[0]}
                    </Avatar>
                    {student.name}
                </Box>
            </TableCell>
            <TableCell>{student.fatherName}</TableCell>
            <TableCell>
                <Chip
                    label={student.status}
                    size="small"
                    color={student.status === 'active' ? 'success' : 'default'}
                    variant="outlined"
                />
            </TableCell>
        </TableRow>
    );
};

const ClassDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentSession } = useSession();
    const [activeTab, setActiveTab] = useState(0);

    // Teacher Assignment State
    const [teachers, setTeachers] = useState<any[]>([]);
    const [teacherDialogOpen, setTeacherDialogOpen] = useState(false);
    const [selectedTeacherId, setSelectedTeacherId] = useState<number | ''>('');
    const [assigningTeacher, setAssigningTeacher] = useState(false);
    const [targetSectionId, setTargetSectionId] = useState<number | null>(null);

    // DND Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadTeachers();
    }, []);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setStudents((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Update roll numbers to match new order (1, 2, 3...)
                return newItems.map((item, index) => ({
                    ...item,
                    rollNumber: (index + 1).toString()
                }));
            });
        }
    };

    const loadTeachers = async () => {
        try {
            const data = await usersService.getTeachers();
            setTeachers(data);
        } catch (error) {
            console.error('Failed to load teachers', error);
        }
    };

    const handleOpenTeacherDialog = (sectionId: number, currentTeacherId?: number) => {
        setTargetSectionId(sectionId);
        setSelectedTeacherId(currentTeacherId || '');
        setTeacherDialogOpen(true);
    };

    const handleAssignTeacher = async () => {
        if (!targetSectionId || !selectedTeacherId || !currentSession) return;
        setAssigningTeacher(true);
        try {
            await sectionsService.assignTeacher(targetSectionId, Number(selectedTeacherId), currentSession.id);
            await loadClassData(); // Refresh to show new teacher
            setTeacherDialogOpen(false);
            setTargetSectionId(null);
            setSelectedTeacherId('');
        } catch (error) {
            console.error('Failed to assign teacher', error);
            alert('Failed to assign teacher');
        } finally {
            setAssigningTeacher(false);
        }
    };
    const [classData, setClassData] = useState<ClassData | null>(null);
    const [loading, setLoading] = useState(true);

    // State for student list
    const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [studentsLoading, setStudentsLoading] = useState(false);

    useEffect(() => {
        if (id) {
            loadClassData();
        }
    }, [id]);

    useEffect(() => {
        // Auto-select first section when class data loads
        if (classData?.sections && classData.sections.length > 0 && !selectedSectionId) {
            setSelectedSectionId(classData.sections[0].id);
        }
    }, [classData]);

    useEffect(() => {
        if (selectedSectionId && classData) {
            loadStudents();
        }
    }, [selectedSectionId]);

    const loadClassData = async () => {
        try {
            const data = await classService.getById(Number(id));
            setClassData(data);
        } catch (error) {
            console.error('Failed to load class details', error);
        } finally {
            setLoading(false);
        }
    };

    // Sorting State
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');
    const [orderBy, setOrderBy] = useState<string>('rollNumber');

    const handleRequestSort = (property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        const newOrder = isAsc ? 'desc' : 'asc';
        setOrder(newOrder);
        setOrderBy(property);

        const sortedStudents = [...students].sort((a, b) => {
            let aVal = a[property];
            let bVal = b[property];

            // Handle Roll Numbers (Numeric Sort)
            if (property === 'rollNumber') {
                aVal = parseInt(aVal) || Number.MAX_SAFE_INTEGER;
                bVal = parseInt(bVal) || Number.MAX_SAFE_INTEGER;
            }

            if (bVal < aVal) return newOrder === 'asc' ? 1 : -1;
            if (bVal > aVal) return newOrder === 'asc' ? -1 : 1;
            return 0;
        });
        setStudents(sortedStudents);
    };

    const loadStudents = async () => {
        if (!selectedSectionId || !classData) return;
        const sectionName = classData.sections.find(s => s.id === selectedSectionId)?.name;
        if (!sectionName) return;

        setStudentsLoading(true);
        try {
            const response = await admissionService.getStudents({
                className: classData.name,
                section: sectionName,
                status: 'active',
                sessionId: currentSession?.id, // Scope to active session
                limit: 1000 // Fetch all students (or sufficiently large number)
            });

            const rawData = response.data.data || [];

            // Default Sort: Roll Number Ascending
            const sortedData = rawData.sort((a: any, b: any) => {
                const rA = parseInt(a.rollNumber) || Number.MAX_SAFE_INTEGER;
                const rB = parseInt(b.rollNumber) || Number.MAX_SAFE_INTEGER;
                return rA - rB;
            });

            setStudents(sortedData);
        } catch (error) {
            console.error('Failed to load students', error);
        } finally {
            setStudentsLoading(false);
        }
    };

    const handleAssignRollNumbers = async () => {
        if (!selectedSectionId || !classData) return;

        const hasRollNumbers = students.some(s => s.rollNumber && s.rollNumber !== '-');
        const message = hasRollNumbers
            ? 'Save this roll number order?'
            : `This will assign default roll numbers (1 to ${students.length}) based on the current list order. Proceed?`;

        if (!window.confirm(message)) return;

        try {
            await studentsService.assignRollNumbers({
                classId: classData.id,
                sectionId: selectedSectionId,
                sortBy: 'NAME',
                studentIds: students.map(s => s.id), // Send current order
                sessionId: currentSession?.id // Scope assignment to active session
            });
            alert('Roll numbers assigned successfully!');
            loadStudents(); // Refresh list
        } catch (error) {
            console.error('Failed to assign roll numbers', error);
            alert('Failed to assign roll numbers');
        }
    };

    if (loading) {
        return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;
    }

    if (!classData) {
        return <Alert severity="error">Class not found</Alert>;
    }

    const currentSectionName = classData.sections.find(s => s.id === selectedSectionId)?.name;



    return (
        <Box sx={{ p: 3 }}>

            <Box display="flex" alignItems="center" mb={3}>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/settings/classes')} sx={{ mr: 2 }}>
                    Back
                </Button>
                <Typography variant="h4" fontWeight="bold">
                    {classData.displayName}
                </Typography>
                <Chip
                    label={`Class Code: ${classData.name}`}
                    sx={{ ml: 2, bgcolor: 'primary.light', color: 'white' }}
                />
            </Box>

            <Paper sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v)}>
                    <Tab icon={<SchoolIcon />} label="Sections & Students" iconPosition="start" />
                    <Tab icon={<BookIcon />} label="Subjects" iconPosition="start" />
                    <Tab icon={<CalendarIcon />} label="Routine / Timetable" iconPosition="start" />
                </Tabs>
            </Paper>

            {activeTab === 0 && (
                <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
                    {/* Left: Section List */}
                    <Box sx={{ width: { xs: '100%', md: '25%' } }}>
                        <Paper sx={{ p: 0, overflow: 'hidden' }}>
                            <Box p={2} bgcolor="grey.100" borderBottom={1} borderColor="divider">
                                <Typography variant="subtitle1" fontWeight="bold">Sections</Typography>
                            </Box>
                            {classData!.sections.map(section => (
                                <Box
                                    key={section.id}
                                    onClick={() => setSelectedSectionId(section.id)}
                                    sx={{
                                        p: 2,
                                        cursor: 'pointer',
                                        bgcolor: selectedSectionId === section.id ? 'primary.light' : 'transparent',
                                        color: selectedSectionId === section.id ? 'white' : 'text.primary',
                                        borderLeft: selectedSectionId === section.id ? '4px solid' : '4px solid transparent',
                                        borderColor: 'primary.dark',
                                        '&:hover': { bgcolor: selectedSectionId === section.id ? 'primary.main' : 'action.hover' }
                                    }}
                                >
                                    <Typography variant="body1" fontWeight={selectedSectionId === section.id ? 'bold' : 'normal'}>
                                        Section {section.name}
                                    </Typography>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                                        <Typography variant="caption" sx={{ color: selectedSectionId === section.id ? 'rgba(255,255,255,0.8)' : 'text.secondary' }}>
                                            CT: {section.classTeacher?.teacher?.name || 'Not Assigned'}
                                        </Typography>
                                        <Button
                                            size="small"
                                            sx={{
                                                minWidth: 'auto',
                                                p: 0.5,
                                                color: selectedSectionId === section.id ? 'white' : 'primary.main',
                                                bgcolor: selectedSectionId === section.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                                                '&:hover': { bgcolor: selectedSectionId === section.id ? 'rgba(255,255,255,0.3)' : 'action.hover' }
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenTeacherDialog(section.id, section.classTeacher?.teacher?.id);
                                            }}
                                        >
                                            <PersonIcon fontSize="small" />
                                        </Button>
                                    </Box>
                                </Box>
                            ))}
                        </Paper>
                    </Box>

                    {/* Right: Student List */}
                    <Box sx={{ flex: 1 }}>
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                <Typography variant="h6">
                                    Students in Section {currentSectionName}
                                    <Chip label={`${students.length} Students`} size="small" sx={{ ml: 1 }} />
                                </Typography>
                                <Box>
                                    <Button
                                        startIcon={<RefreshIcon />}
                                        onClick={loadStudents}
                                        sx={{ mr: 1 }}
                                    >
                                        Refresh
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<SaveIcon />}
                                        onClick={handleAssignRollNumbers}
                                        disabled={students.length === 0}
                                    >
                                        Assign/Save Roll No
                                    </Button>
                                </Box>
                            </Box>

                            {studentsLoading ? (
                                <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>
                            ) : students.length === 0 ? (
                                <Alert severity="info" variant="outlined">No students found in this section.</Alert>
                            ) : (
                                <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <Table size="small">
                                            <TableHead sx={{ bgcolor: 'grey.50' }}>
                                                <TableRow>
                                                    <TableCell width={50}></TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>
                                                        <TableSortLabel
                                                            active={orderBy === 'rollNumber'}
                                                            direction={orderBy === 'rollNumber' ? order : 'asc'}
                                                            onClick={() => handleRequestSort('rollNumber')}
                                                        >
                                                            Roll No
                                                        </TableSortLabel>
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Adm. No</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Father's Name</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                <SortableContext
                                                    items={students.map(s => s.id)}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    {students.map((student) => (
                                                        <SortableRow key={student.id} student={student} hover />
                                                    ))}
                                                </SortableContext>
                                            </TableBody>
                                        </Table>
                                    </DndContext>
                                </TableContainer>
                            )}
                        </Paper>
                    </Box>
                </Box>
            )
            }

            {
                activeTab === 1 && (
                    <ClassSubjectsManager classId={classData.id} sections={classData.sections} />
                )
            }

            {
                activeTab === 2 && (
                    <RoutineManager
                        classId={classData.id}
                        sections={classData.sections}
                    />
                )
            }

            {/* Teacher Assignment Dialog */}
            <Dialog open={teacherDialogOpen} onClose={() => setTeacherDialogOpen(false)} maxWidth="xs" fullWidth>
                <div style={{ padding: 20 }}>
                    <Typography variant="h6" gutterBottom>Assign Class Teacher</Typography>
                    <Box mt={2} mb={3}>
                        <select
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                            value={selectedTeacherId}
                            onChange={(e) => setSelectedTeacherId(Number(e.target.value))}
                        >
                            <option value="">Select Teacher</option>
                            {teachers.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </Box>
                    <Box display="flex" justifyContent="flex-end" gap={1}>
                        <Button onClick={() => setTeacherDialogOpen(false)}>Cancel</Button>
                        <Button variant="contained" onClick={handleAssignTeacher} disabled={assigningTeacher || !selectedTeacherId}>
                            {assigningTeacher ? 'Assigning...' : 'Assign'}
                        </Button>
                    </Box>
                </div>
            </Dialog>
        </Box >
    );
};
export default ClassDetails;
