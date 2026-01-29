import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Container, Paper, Typography, Box, Table, TableBody, TableCell,
    TableHead, TableRow, Button, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Alert, Snackbar, MenuItem, Stack, Chip, Checkbox, List, ListItem, ListItemText, ListItemIcon, Divider
} from '@mui/material';
import { ArrowBack, Delete, Add, Print, PictureAsPdf } from '@mui/icons-material';
import { examinationService, admissionService as studentService, subjectService, classService, sessionService, apiClient } from '../../lib/api';
import type { Exam, Subject } from '../../types/examination';


export default function ExamDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const examId = Number(id);

    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
    const [admitCardDialogOpen, setAdmitCardDialogOpen] = useState(false);
    const [scheduleData, setScheduleData] = useState({
        subjectId: '',
        className: '',
        date: '',
        startTime: '',
        endTime: '',
        roomNo: '',
        period: ''
    });

    // Admit Card Generation States
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState(''); // Empty string = All Sections
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [studentsList, setStudentsList] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [availableSections, setAvailableSections] = useState<string[]>([]);
    const [admitCardSections, setAdmitCardSections] = useState<string[]>([]); // Sections for admit card dialog

    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
    const showMessage = (message: string, severity: 'success' | 'error' = 'success') => setSnackbar({ open: true, message, severity });

    // Queries
    // Fetch active session
    const { data: activeSession } = useQuery({
        queryKey: ['activeSession'],
        queryFn: sessionService.getActive,
    });

    const { data: examData, isLoading: examLoading } = useQuery({
        queryKey: ['exam', examId],
        queryFn: () => examinationService.getExam(examId),
        enabled: !!examId
    });
    const exam = examData?.data as Exam;

    const { data: subjectsData } = useQuery({
        queryKey: ['subjects'],
        queryFn: subjectService.getAll
    });
    const subjects = (subjectsData || []) as Subject[];

    // Fetch classes from database (same as Attendance module)
    const { data: classesData = [] } = useQuery({
        queryKey: ['classes'],
        queryFn: classService.getAll,
    });
    const classes = (classesData as any[]) || [];

    // Fetch sections when a class is selected (for schedule dialog)
    useEffect(() => {
        const fetchSections = async () => {
            if (scheduleData.className) {
                try {
                    const response = await studentService.getAvailableSections(scheduleData.className);
                    setAvailableSections(response.data || []);
                } catch {
                    setAvailableSections([]);
                }
            } else {
                setAvailableSections([]);
            }
        };
        fetchSections();
    }, [scheduleData.className]);

    // Fetch sections when class is selected for admit card dialog, then auto-load students
    useEffect(() => {
        const fetchAdmitCardSectionsAndStudents = async () => {
            if (selectedClass && activeSession?.id) {
                try {
                    // Fetch available sections
                    const response = await studentService.getAvailableSections(selectedClass);
                    setAdmitCardSections(response.data || []);
                } catch {
                    setAdmitCardSections([]);
                }
                setSelectedSection(''); // Reset section when class changes
                setSelectedStudents([]);

                // Auto-load all students for the selected class (Active Session & Active Status)
                setLoadingStudents(true);
                try {
                    const studentsResponse = await studentService.getStudents({
                        className: selectedClass,
                        limit: 500,
                        sessionId: activeSession.id,
                        status: 'active'
                    });
                    setStudentsList(studentsResponse.data.data || []);
                } catch {
                    setStudentsList([]);
                } finally {
                    setLoadingStudents(false);
                }
            } else {
                setAdmitCardSections([]);
                setStudentsList([]);
                setSelectedStudents([]);
            }
        };
        fetchAdmitCardSectionsAndStudents();
    }, [selectedClass, activeSession]);

    // Fetch students when class or section changes for admit card
    const fetchStudentsForClassAndSection = async (className: string, section: string) => {
        if (!className || !activeSession?.id) return;
        setLoadingStudents(true);
        try {
            // Fetch students by class and optionally by section (Active Session & Active Status)
            const params: any = {
                className,
                limit: 500,
                sessionId: activeSession.id,
                status: 'active'
            };
            if (section) {
                params.section = section;
            }
            const response = await studentService.getStudents(params);
            let students = response.data.data || [];

            // If filtering by section returned no results but section was specified, that's expected
            // If no section filter and no results, students might not exist for this class
            setStudentsList(students);
            setSelectedStudents([]); // Reset selection
        } catch (error) {
            showMessage('Failed to fetch students', 'error');
        } finally {
            setLoadingStudents(false);
        }
    };

    // Mutations
    const addScheduleMutation = useMutation({
        mutationFn: (data: any) => examinationService.addSchedule(examId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exam', examId] });
            setScheduleDialogOpen(false);
            setScheduleData({ subjectId: '', className: '', date: '', startTime: '', endTime: '', roomNo: '', period: '' });
            showMessage('Schedule added successfully');
        },
        onError: (err: any) => showMessage(err.response?.data?.message || 'Failed to add schedule', 'error')
    });

    const deleteScheduleMutation = useMutation({
        mutationFn: examinationService.deleteSchedule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exam', examId] });
            showMessage('Schedule removed successfully');
        },
        onError: (err: any) => showMessage(err.response?.data?.message || 'Failed to remove schedule', 'error')
    });

    const handleAddSchedule = () => {
        if (!scheduleData.subjectId || !scheduleData.className || !scheduleData.date) {
            showMessage('Please fill all required fields (Subject, Class, Date)', 'error');
            return;
        }

        const hasTime = scheduleData.startTime && scheduleData.endTime;
        const hasPeriod = scheduleData.period;

        if (!hasTime && !hasPeriod) {
            showMessage('Please provide either Time Range or Period', 'error');
            return;
        }

        let startDateTime = undefined;
        let endDateTime = undefined;

        if (scheduleData.startTime && scheduleData.endTime) {
            startDateTime = new Date(`${scheduleData.date}T${scheduleData.startTime}`);
            endDateTime = new Date(`${scheduleData.date}T${scheduleData.endTime}`);
        }

        addScheduleMutation.mutate({
            subjectId: Number(scheduleData.subjectId),
            className: scheduleData.className,
            date: new Date(scheduleData.date).toISOString(),
            startTime: startDateTime?.toISOString(),
            endTime: endDateTime?.toISOString(),
            roomNo: scheduleData.roomNo,
            period: scheduleData.period ? Number(scheduleData.period) : undefined
        });
    };

    const handleSelectAllStudents = (checked: boolean) => {
        if (checked) {
            setSelectedStudents(studentsList.map(s => s.studentId));
        } else {
            setSelectedStudents([]);
        }
    };

    const handleToggleStudent = (studentId: string) => {
        setSelectedStudents(prev =>
            prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
        );
    };

    const generateAdmitCardsPdf = async () => {
        if (selectedStudents.length === 0) {
            showMessage('Please select at least one student', 'error');
            return;
        }

        setGeneratingPdf(true);
        try {
            // Call backend endpoint to generate PDF
            const response = await apiClient.post('/examination/admit-card/pdf', {
                examId,
                studentIds: selectedStudents
            }, {
                responseType: 'blob'
            });

            // Create blob URL and open in new tab
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');

            showMessage('Admit Cards generated successfully');
            setAdmitCardDialogOpen(false);
        } catch (error) {
            console.error(error);
            showMessage('Failed to generate PDF. Please try again.', 'error');
        } finally {
            setGeneratingPdf(false);
        }
    };

    if (examLoading) return <Container sx={{ mt: 4 }}><Typography>Loading...</Typography></Container>;
    if (!exam) return <Container sx={{ mt: 4 }}><Alert severity="error">Exam not found</Alert></Container>;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Button startIcon={<ArrowBack />} onClick={() => navigate('/exams')}>
                    Back to Exams
                </Button>
                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<PictureAsPdf />}
                    onClick={() => {
                        setSelectedStudents([]);
                        setSelectedClass('');
                        setAdmitCardDialogOpen(true);
                    }}
                >
                    Generate Admit Card
                </Button>
            </Box>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="h4" gutterBottom>{exam.name}</Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            {exam.examType?.name} • {new Date(exam.startDate).toLocaleDateString()} - {new Date(exam.endDate).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>{exam.description}</Typography>
                    </Box>
                    <Chip
                        label={exam.status}
                        color={exam.status === 'COMPLETED' ? 'success' : exam.status === 'ONGOING' ? 'warning' : 'primary'}
                    />
                </Box>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Exam Schedule</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => setScheduleDialogOpen(true)}>
                    Add Scheduled Paper
                </Button>
            </Box>

            <Paper sx={{ width: '100%', p: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Class</TableCell>
                            <TableCell>Subject</TableCell>
                            <TableCell>Time</TableCell>
                            <TableCell>Room</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!exam.schedules || exam.schedules.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">No schedules added yet.</TableCell>
                            </TableRow>
                        ) : (
                            exam.schedules.map((schedule) => (
                                <TableRow key={schedule.id}>
                                    <TableCell>{new Date(schedule.date).toLocaleDateString()}</TableCell>
                                    <TableCell><Chip label={schedule.className} size="small" variant="outlined" /></TableCell>
                                    <TableCell>{schedule.subject?.name}</TableCell>
                                    <TableCell>
                                        {schedule.startTime && schedule.endTime ? (
                                            <>
                                                {new Date(schedule.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                {new Date(schedule.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </>
                                        ) : (
                                            <Typography variant="caption" color="textSecondary">No Time Set</Typography>
                                        )}
                                        {schedule.period && <Typography variant="caption" display="block" color="primary">Period: {schedule.period}</Typography>}
                                    </TableCell>
                                    <TableCell>{schedule.roomNo || '-'}</TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" color="error" onClick={() => deleteScheduleMutation.mutate(schedule.id)}>
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Paper>

            {/* Schedule Dialog (Existing) */}
            <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Exam Schedule</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            select
                            label="Subject"
                            fullWidth
                            value={scheduleData.subjectId}
                            onChange={(e) => setScheduleData({ ...scheduleData, subjectId: e.target.value })}
                        >
                            {subjects.map((subj) => (
                                <MenuItem key={subj.id} value={subj.id}>
                                    {subj.name}
                                </MenuItem>
                            ))}
                        </TextField>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                select
                                label="Class"
                                fullWidth
                                value={scheduleData.className}
                                onChange={(e) => setScheduleData({ ...scheduleData, className: e.target.value })}
                            >
                                {classes.map((cls: any) => (
                                    <MenuItem key={cls.id} value={cls.name}>
                                        {cls.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                label="Section"
                                fullWidth
                                value={(scheduleData as any).section || 'ALL'}
                                onChange={(e) => setScheduleData({ ...scheduleData, section: e.target.value === 'ALL' ? '' : e.target.value } as any)}
                            >
                                <MenuItem value="ALL">All Sections</MenuItem>
                                {availableSections.map((sec: string) => (
                                    <MenuItem key={sec} value={sec}>
                                        Section {sec}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                type="date"
                                label="Date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={scheduleData.date}
                                onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                type="time"
                                label="Start Time"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={scheduleData.startTime}
                                onChange={(e) => setScheduleData({ ...scheduleData, startTime: e.target.value })}
                            />
                            <TextField
                                type="time"
                                label="End Time"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={scheduleData.endTime}
                                onChange={(e) => setScheduleData({ ...scheduleData, endTime: e.target.value })}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                select
                                label="Period (Optional)"
                                fullWidth
                                value={scheduleData.period}
                                onChange={(e) => setScheduleData({ ...scheduleData, period: e.target.value })}
                            >
                                <MenuItem value=""><em>None</em></MenuItem>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                                    <MenuItem key={p} value={p}>Period {p}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                label="Room No (Optional)"
                                fullWidth
                                value={scheduleData.roomNo}
                                onChange={(e) => setScheduleData({ ...scheduleData, roomNo: e.target.value })}
                            />
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddSchedule} variant="contained">Add</Button>
                </DialogActions>
            </Dialog>

            {/* Admit Card Generation Dialog */}
            <Dialog
                open={admitCardDialogOpen}
                onClose={() => setAdmitCardDialogOpen(false)}
                maxWidth='sm'
                fullWidth
            >
                <DialogTitle>Generate Admit Cards (PDF)</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <TextField
                                select
                                label="Select Class"
                                fullWidth
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                            >
                                <MenuItem value="">Select Class</MenuItem>
                                {classes.map((cls: any) => (
                                    <MenuItem key={cls.id} value={cls.name}>{cls.name}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                label="Section"
                                fullWidth
                                value={selectedSection || 'ALL'}
                                onChange={(e) => {
                                    const section = e.target.value === 'ALL' ? '' : e.target.value;
                                    setSelectedSection(section);
                                    if (selectedClass) {
                                        fetchStudentsForClassAndSection(selectedClass, section);
                                    }
                                }}
                                disabled={!selectedClass}
                            >
                                <MenuItem value="ALL">All Sections</MenuItem>
                                {admitCardSections.map((sec: string) => (
                                    <MenuItem key={sec} value={sec}>Section {sec}</MenuItem>
                                ))}
                            </TextField>
                        </Box>

                        {loadingStudents && <Typography sx={{ mb: 2 }}>Loading students...</Typography>}

                        {!loadingStudents && selectedClass && studentsList.length === 0 && (
                            <Typography color="textSecondary" sx={{ mb: 2 }}>
                                No students found for this class/section.
                            </Typography>
                        )}

                        {!loadingStudents && studentsList.length > 0 && (
                            <Typography variant="body2" color="primary" sx={{ mb: 1, fontWeight: 'bold' }}>
                                Total Students: {studentsList.length}
                            </Typography>
                        )}

                        {!loadingStudents && studentsList.length > 0 && (
                            <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                                <List dense>
                                    <ListItem>
                                        <ListItemIcon>
                                            <Checkbox
                                                edge="start"
                                                checked={selectedStudents.length === studentsList.length && studentsList.length > 0}
                                                indeterminate={selectedStudents.length > 0 && selectedStudents.length < studentsList.length}
                                                onChange={(e) => handleSelectAllStudents(e.target.checked)}
                                            />
                                        </ListItemIcon>
                                        <ListItemText primary="Select All" />
                                    </ListItem>
                                    <Divider />
                                    {studentsList.map((student) => (
                                        <ListItem key={student.studentId} onClick={() => handleToggleStudent(student.studentId)} sx={{ cursor: 'pointer' }}>
                                            <ListItemIcon>
                                                <Checkbox
                                                    edge="start"
                                                    checked={selectedStudents.includes(student.studentId)}
                                                    tabIndex={-1}
                                                    disableRipple
                                                />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={`${student.name} (${student.studentId})`}
                                                secondary={`Roll: ${student.rollNumber || 'N/A'}`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>
                        )}

                        {!loadingStudents && selectedClass && studentsList.length === 0 && (
                            <Typography color="text.secondary">No students found in this class.</Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAdmitCardDialogOpen(false)}>Close</Button>
                    <Button
                        onClick={generateAdmitCardsPdf}
                        variant="contained"
                        disabled={selectedStudents.length === 0 || generatingPdf}
                        startIcon={generatingPdf ? <PictureAsPdf /> : <Print />}
                    >
                        {generatingPdf ? 'Generating...' : `Generate PDF (${selectedStudents.length})`}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
