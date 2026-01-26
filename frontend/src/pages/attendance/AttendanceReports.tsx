import React, { useState } from 'react';
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
    Tab,
    Tabs,
    CircularProgress,
    Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DownloadIcon from '@mui/icons-material/Download';
import { format } from 'date-fns';
import { apiClient as api, classService, admissionService, sessionService } from '../../lib/api';
import { useSnackbar } from 'notistack';
import { useQuery } from '@tanstack/react-query';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

export default function AttendanceReports() {
    const { enqueueSnackbar } = useSnackbar();
    const [tabValue, setTabValue] = useState(0);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [loading, setLoading] = useState(false);
    const [monthlyData, setMonthlyData] = useState<any>(null);
    const [defaultersData, setDefaultersData] = useState<any>(null);
    const [threshold, setThreshold] = useState(75);
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

    const fetchMonthlyReport = async () => {
        if (!selectedClass) {
            enqueueSnackbar('Please select a class', { variant: 'warning' });
            return;
        }

        setLoading(true);
        try {
            if (!activeSession) {
                enqueueSnackbar('Session not loaded. Please try again.', { variant: 'warning' });
                setLoading(false);
                return;
            }

            const res = await api.get('/attendance/reports/monthly', {
                params: {
                    sessionId: activeSession.id,
                    month,
                    year,
                    className: selectedClass,
                    section: selectedSection
                }
            });
            setMonthlyData(res.data);
        } catch (error) {
            console.error(error);
            enqueueSnackbar('Failed to fetch report', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchDefaulters = async () => {
        setLoading(true);
        try {
            if (!activeSession) {
                enqueueSnackbar('Session not loaded. Please try again.', { variant: 'warning' });
                setLoading(false);
                return;
            }

            const res = await api.get('/attendance/reports/defaulters', {
                params: {
                    sessionId: activeSession.id,
                    threshold,
                    className: selectedClass || undefined,
                    section: selectedSection || undefined
                }
            });
            setDefaultersData(res.data);
        } catch (error) {
            console.error(error);
            enqueueSnackbar('Failed to fetch defaulters', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (percentage: number) => {
        if (percentage >= 90) return 'success';
        if (percentage >= 75) return 'warning';
        return 'error';
    };

    return (
        <Box p={3}>
            <Typography variant="h5" gutterBottom>Attendance Reports</Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                    <Tab label="Monthly Report" />
                    <Tab label="Defaulters" />
                </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
                <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                            <FormControl sx={{ minWidth: 150 }}>
                                <InputLabel>Month</InputLabel>
                                <Select
                                    value={month}
                                    label="Month"
                                    onChange={(e) => setMonth(Number(e.target.value))}
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <MenuItem key={i + 1} value={i + 1}>
                                            {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl sx={{ minWidth: 120 }}>
                                <InputLabel>Year</InputLabel>
                                <Select
                                    value={year}
                                    label="Year"
                                    onChange={(e) => setYear(Number(e.target.value))}
                                >
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <MenuItem key={i} value={new Date().getFullYear() - 2 + i}>
                                            {new Date().getFullYear() - 2 + i}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

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
                                onClick={fetchMonthlyReport}
                                disabled={loading}
                                sx={{ minWidth: 120 }}
                            >
                                Generate
                            </Button>

                            <Button
                                variant="outlined"
                                size="large"
                                startIcon={<DownloadIcon />}
                                disabled={!monthlyData}
                                sx={{ minWidth: 120 }}
                            >
                                Export
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>

                {loading ? (
                    <Box display="flex" justifyContent="center" p={5}>
                        <CircularProgress />
                    </Box>
                ) : monthlyData ? (
                    <>
                        <Card sx={{ p: 2, mb: 2 }}>
                            <Typography variant="h6">Summary</Typography>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="body2" color="text.secondary">Total Students</Typography>
                                    <Typography variant="h4">{monthlyData.summary.totalStudents}</Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="body2" color="text.secondary">Average Attendance</Typography>
                                    <Typography variant="h4">{monthlyData.summary.averageAttendance.toFixed(2)}%</Typography>
                                </Grid>
                            </Grid>
                        </Card>

                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Roll No</TableCell>
                                        <TableCell>Student Name</TableCell>
                                        <TableCell align="center">Total Days</TableCell>
                                        <TableCell align="center">Present</TableCell>
                                        <TableCell align="center">Absent</TableCell>
                                        <TableCell align="center">Late</TableCell>
                                        <TableCell align="center">Percentage</TableCell>
                                        <TableCell align="center">Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {monthlyData.students.map((student: any) => (
                                        <TableRow key={student.studentId}>
                                            <TableCell>{student.rollNumber}</TableCell>
                                            <TableCell>{student.name}</TableCell>
                                            <TableCell align="center">{student.stats.totalDays}</TableCell>
                                            <TableCell align="center">{student.stats.present}</TableCell>
                                            <TableCell align="center">{student.stats.absent}</TableCell>
                                            <TableCell align="center">{student.stats.late}</TableCell>
                                            <TableCell align="center">
                                                <strong>{student.stats.percentage}%</strong>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={student.stats.percentage >= 75 ? 'Good' : 'Low'}
                                                    color={getStatusColor(student.stats.percentage)}
                                                    size="small"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                ) : (
                    <Alert severity="info">Select filters and click Generate to view report</Alert>
                )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                            <FormControl sx={{ minWidth: 150 }}>
                                <InputLabel>Threshold %</InputLabel>
                                <Select
                                    value={threshold}
                                    label="Threshold %"
                                    onChange={(e) => setThreshold(Number(e.target.value))}
                                >
                                    <MenuItem value={50}>50%</MenuItem>
                                    <MenuItem value={60}>60%</MenuItem>
                                    <MenuItem value={75}>75%</MenuItem>
                                    <MenuItem value={80}>80%</MenuItem>
                                    <MenuItem value={90}>90%</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl fullWidth sx={{ flex: 1 }}>
                                <InputLabel>Class</InputLabel>
                                <Select
                                    value={selectedClass}
                                    label="Class"
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                >
                                    <MenuItem value="">All Classes</MenuItem>
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
                                onClick={fetchDefaulters}
                                disabled={loading}
                                sx={{ minWidth: 180 }}
                            >
                                Find Defaulters
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>

                {loading ? (
                    <Box display="flex" justifyContent="center" p={5}>
                        <CircularProgress />
                    </Box>
                ) : defaultersData ? (
                    <>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Found {defaultersData.count} students with attendance below {defaultersData.threshold}%
                        </Alert>

                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Roll No</TableCell>
                                        <TableCell>Student Name</TableCell>
                                        <TableCell>Class</TableCell>
                                        <TableCell align="center">Total Days</TableCell>
                                        <TableCell align="center">Present</TableCell>
                                        <TableCell align="center">Absent</TableCell>
                                        <TableCell align="center">Percentage</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {defaultersData.students.map((student: any) => (
                                        <TableRow key={student.studentId}>
                                            <TableCell>{student.rollNumber}</TableCell>
                                            <TableCell>{student.name}</TableCell>
                                            <TableCell>{student.className}-{student.section}</TableCell>
                                            <TableCell align="center">{student.totalDays}</TableCell>
                                            <TableCell align="center">{student.present}</TableCell>
                                            <TableCell align="center">{student.absent}</TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={`${student.percentage}%`}
                                                    color="error"
                                                    size="small"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                ) : (
                    <Alert severity="info">Click "Find Defaulters" to view students with low attendance</Alert>
                )}
            </TabPanel>
        </Box>
    );
}
