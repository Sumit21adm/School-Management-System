import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Box,
    Card,
    CardContent,
    Stack,
    Grid,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Tooltip,
    CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { format } from 'date-fns';
import { apiClient as api, classService, admissionService, sessionService } from '../../lib/api';
import { useSnackbar } from 'notistack';

interface Student {
    studentId: string;
    name: string;
    rollNumber: string;
    attendance?: {
        status: string;
        remarks?: string;
    } | null;
}

const ATTENDANCE_STATUSES = [
    { value: 'present', label: 'Present', color: 'success', icon: <CheckCircleIcon /> },
    { value: 'absent', label: 'Absent', color: 'error', icon: <CancelIcon /> },
    { value: 'late', label: 'Late', color: 'warning', icon: <AccessTimeIcon /> },
    { value: 'half_day', label: 'Half Day', color: 'info', icon: <AccessTimeIcon /> },
];

export default function MarkAttendance() {
    const { enqueueSnackbar } = useSnackbar();
    const [date, setDate] = useState<Date | null>(new Date());
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeSession, setActiveSession] = useState<any>(null);

    // Fetch active session
    useQuery({
        queryKey: ['activeSession'],
        queryFn: async () => {
            const session = await sessionService.getActive();
            setActiveSession(session);
            return session;
        },
    });

    // Fetch classes
    const { data: classes = [] } = useQuery({
        queryKey: ['classes'],
        queryFn: classService.getAll,
    });

    // Fetch sections for selected class
    const { data: availableSections = [] } = useQuery({
        queryKey: ['availableSections', selectedClass],
        queryFn: async () => {
            if (!selectedClass) return [];
            const response = await admissionService.getAvailableSections(selectedClass);
            return response.data;
        },
        enabled: !!selectedClass,
    });

    // Reset section when class changes
    useEffect(() => {
        setSelectedSection('');
    }, [selectedClass]);

    const fetchAttendance = async () => {
        if (!selectedClass || !date) return;

        if (!activeSession) {
            enqueueSnackbar('Session not loaded. Please try again.', { variant: 'warning' });
            return;
        }

        setLoading(true);
        try {
            const formattedDate = format(date, 'yyyy-MM-dd');
            const res = await api.get('/attendance/daily', {
                params: {
                    date: formattedDate,
                    className: selectedClass,
                    section: selectedSection,
                    sessionId: activeSession.id
                }
            });
            setStudents(res.data);
        } catch (error) {
            console.error(error);
            enqueueSnackbar('Failed to fetch students', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedClass && date) {
            fetchAttendance();
        }
    }, [selectedClass, selectedSection, date]);

    const handleStatusChange = (studentId: string, status: string) => {
        setStudents(prev => prev.map(s =>
            s.studentId === studentId
                ? { ...s, attendance: { ...s.attendance, status } }
                : s
        ));
    };

    const handleBulkMark = (status: string) => {
        setStudents(prev => prev.map(s => ({
            ...s,
            attendance: { ...s.attendance, status }
        })));
    };

    const saveAttendance = async () => {
        if (!date) return;

        if (!activeSession) {
            enqueueSnackbar('Session not loaded. Please try again.', { variant: 'warning' });
            return;
        }

        setSaving(true);
        try {
            const payload = {
                date: format(date, 'yyyy-MM-dd'),
                sessionId: activeSession.id,
                items: students.map(s => ({
                    studentId: s.studentId,
                    status: s.attendance?.status || 'present', // Default to present if unmarked? Or keep null?
                    remarks: s.attendance?.remarks
                }))
            };

            await api.post('/attendance/bulk', payload);
            enqueueSnackbar('Attendance saved successfully', { variant: 'success' });
        } catch (error) {
            console.error(error);
            enqueueSnackbar('Failed to save attendance', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box p={3}>
            <Typography variant="h5" gutterBottom>Mark Daily Attendance</Typography>

            <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Date"
                                value={date}
                                onChange={(newValue) => setDate(newValue)}
                                slotProps={{
                                    textField: { 
                                        fullWidth: true,
                                        sx: { flex: 1 }
                                    }
                                }}
                            />
                        </LocalizationProvider>

                        <FormControl fullWidth sx={{ flex: 1 }}>
                            <InputLabel>Class</InputLabel>
                            <Select
                                value={selectedClass}
                                label="Class"
                                onChange={(e) => setSelectedClass(e.target.value)}
                            >
                                <MenuItem value="">Select Class</MenuItem>
                                {classes.map((cls: any) => (
                                    <MenuItem key={cls.id} value={cls.name}>
                                        {cls.displayName || cls.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth sx={{ flex: 1 }}>
                            <InputLabel>Section</InputLabel>
                            <Select
                                value={selectedSection}
                                label="Section"
                                onChange={(e) => setSelectedSection(e.target.value)}
                                disabled={!selectedClass}
                            >
                                <MenuItem value="">All Sections</MenuItem>
                                {availableSections.map((sec: string) => (
                                    <MenuItem key={sec} value={sec}>
                                        Section {sec}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Button
                            variant="contained"
                            size="large"
                            onClick={saveAttendance}
                            disabled={!selectedClass || loading || saving || students.length === 0}
                            startIcon={<SaveIcon />}
                            sx={{ minWidth: 200 }}
                        >
                            {saving ? 'Saving...' : 'Save Attendance'}
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            {loading ? (
                <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
            ) : (
                students.length > 0 && (
                    <TableContainer component={Paper}>
                        <Box p={2} display="flex" gap={1}>
                            <Typography variant="subtitle2" component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                                Quick Actions:
                            </Typography>
                            <Button size="small" color="success" onClick={() => handleBulkMark('present')}>Mark All Present</Button>
                            <Button size="small" color="error" onClick={() => handleBulkMark('absent')}>Mark All Absent</Button>
                        </Box>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Roll No</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Remarks</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {students.map((student) => (
                                    <TableRow key={student.studentId} hover>
                                        <TableCell>{student.rollNumber}</TableCell>
                                        <TableCell>{student.name}</TableCell>
                                        <TableCell>
                                            <Box display="flex" gap={1}>
                                                {ATTENDANCE_STATUSES.map((status) => (
                                                    <Tooltip title={status.label} key={status.value}>
                                                        <IconButton
                                                            color={student.attendance?.status === status.value ? status.color as any : 'default'}
                                                            onClick={() => handleStatusChange(student.studentId, status.value)}
                                                        >
                                                            {student.attendance?.status === status.value ? status.icon : status.icon}
                                                        </IconButton>
                                                    </Tooltip>
                                                ))}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {/* Add TextField for remarks if needed */}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )
            )}
        </Box>
    );
}
