'use client';

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Typography,
    InputAdornment,
    Skeleton,
    Card,
    CardContent,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tabs,
    Tab,
    Avatar,
    TablePagination,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormLabel,
    Alert,
    TableSortLabel,
    CircularProgress,
    LinearProgress,
    Divider,
    Paper,
    Snackbar,
    Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Visibility as VisibilityIcon,
    Download as DownloadIcon,
    Delete as DeleteIcon,
    CloudUpload as UploadIcon,
    FileDownload as FileDownloadIcon,
    RestoreFromTrash,
    School as AlumniIcon,
} from '@mui/icons-material';
import {
    TrendingUp,
    TrendingDown,
    Receipt,
    AlertCircle,
    FileText,
    Users,
    UserCheck,
    UserX,
    Cake,
    Download,
    Printer,
} from 'lucide-react';
import { useSessionContext } from '@/contexts/SessionContext';
import { admissionService, feeService, classService, sessionService } from '@/lib/api';

export default function AdmissionList() {
    const queryClient = useQueryClient();
    const { selectedSessionId } = useSessionContext();
    const [searchTerm, setSearchTerm] = useState('');

    // Dashboard Stats
    const { data: statsData } = useQuery({
        queryKey: ['admission-stats'],
        queryFn: async () => {
            const response = await admissionService.getDashboardStats();
            return response.data;
        }
    });

    // Fetch classes for filter
    const { data: classes } = useQuery({
        queryKey: ['classes'],
        queryFn: classService.getAll,
    });

    const [birthdayDialogOpen, setBirthdayDialogOpen] = useState(false);
    const [classFilter, setClassFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [expandedBills, setExpandedBills] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState('active');
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [showFeeBook, setShowFeeBook] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [orderBy, setOrderBy] = useState<string>('');
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');

    const handleRequestSort = (property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    // Export State
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [exportClass, setExportClass] = useState('');
    const [exportSection, setExportSection] = useState('');
    const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');
    const [exportLoading, setExportLoading] = useState(false);

    // Delete State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<any | null>(null);

    // Import State
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importLoading, setImportLoading] = useState(false);

    // Snackbar State
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Restore State
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [studentToRestore, setStudentToRestore] = useState<any | null>(null);

    // Alumni State
    const [alumniDialogOpen, setAlumniDialogOpen] = useState(false);
    const [studentToAlumni, setStudentToAlumni] = useState<any | null>(null);

    // Fetch fee status for selected student
    const { data: feeStatus, isLoading: loadingFees } = useQuery({
        queryKey: ['student-fee-status', selectedStudent?.studentId, selectedSessionId],
        queryFn: async () => {
            const response = await fetch(`/api/fees/dashboard/${selectedStudent?.studentId}/session/${selectedSessionId}`);
            return response.json();
        },
        enabled: !!selectedStudent && !!selectedSessionId && tabValue === 2,
    });

    // Reset section filter when class changes
    useEffect(() => {
        setSectionFilter('');
    }, [classFilter]);

    // Fetch students
    const { data: response = { data: [], meta: { total: 0 } }, isLoading, refetch } = useQuery({
        queryKey: ['students', searchTerm, classFilter, sectionFilter, statusFilter, selectedSessionId, page, rowsPerPage, orderBy, order],
        queryFn: async () => {
            const res = await admissionService.getStudents({
                search: searchTerm,
                class: classFilter,
                section: sectionFilter,
                status: statusFilter,
                sessionId: selectedSessionId,
                page: page + 1,
                limit: rowsPerPage,
                sortBy: orderBy,
                order: order,
            });
            return res.data;
        },
        enabled: !!selectedSessionId && selectedSessionId > 0,
    });

    const students = response.data || [];
    const totalStudents = response.meta?.total || 0;

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleViewStudent = async (student: any) => {
        setSelectedStudent(student);
        setOpenDialog(true);
        setTabValue(0);

        try {
            const res = await admissionService.getStudent(student.id);
            setSelectedStudent(res.data);
        } catch (error) {
            console.error("Failed to fetch full student details:", error);
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedStudent(null);
        setTabValue(0);
    };

    const handleRestoreClick = (student: any) => {
        setStudentToRestore(student);
        setRestoreDialogOpen(true);
    };

    const handleRestoreConfirm = async () => {
        if (!studentToRestore) return;

        try {
            const formData = new FormData();
            formData.append('status', 'active');
            await admissionService.updateStudent(studentToRestore.id, formData);
            setSnackbar({ open: true, message: 'Student restored successfully', severity: 'success' });
            refetch();
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to restore student', severity: 'error' });
        } finally {
            setRestoreDialogOpen(false);
            setStudentToRestore(null);
        }
    };

    const handleAlumniClick = (student: any) => {
        setStudentToAlumni(student);
        setAlumniDialogOpen(true);
    };

    const handleAlumniConfirm = async () => {
        if (!studentToAlumni) return;

        try {
            const formData = new FormData();
            formData.append('status', 'alumni');
            await admissionService.updateStudent(studentToAlumni.id, formData);
            setSnackbar({ open: true, message: 'Student moved to Alumni successfully', severity: 'success' });
            refetch();
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to move student to Alumni', severity: 'error' });
        } finally {
            setAlumniDialogOpen(false);
            setStudentToAlumni(null);
        }
    };

    const handleDeleteClick = (student: any) => {
        setStudentToDelete(student);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!studentToDelete) return;

        try {
            await admissionService.deleteStudent(studentToDelete.id);
            setSnackbar({ open: true, message: 'Student deleted successfully', severity: 'success' });
            refetch();
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to delete student', severity: 'error' });
        } finally {
            setDeleteDialogOpen(false);
            setStudentToDelete(null);
        }
    };

    const getStatusColor = (balance: number) => {
        if (balance === 0) return 'success';
        if (balance < 0) return 'info';
        return 'error';
    };

    const getStatusLabel = (balance: number) => {
        if (balance === 0) return 'Paid';
        if (balance < 0) return 'Advance';
        return 'Pending';
    };

    return (
        <Box>
            {/* Header */}
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} mb={3}>
                <Box>
                    <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
                        Student Admissions
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage student admissions and records
                    </Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    <Button
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        onClick={() => setImportDialogOpen(true)}
                    >
                        Import
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => setExportDialogOpen(true)}
                    >
                        Export
                    </Button>
                    <Button
                        component={Link}
                        href="/admissions/new"
                        variant="contained"
                        startIcon={<AddIcon />}
                        size="large"
                    >
                        New Admission
                    </Button>
                </Stack>
            </Stack>

            {/* Stats Cards */}
            {statsData && (
                <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
                    <Card elevation={0} variant="outlined" sx={{ borderRadius: 4, flex: '1 1 200px', minWidth: 200 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: (theme) => alpha(theme.palette.success.main, 0.1), color: 'success.main', display: 'flex' }}>
                                    <UserCheck size={28} strokeWidth={2} />
                                </Box>
                                <Box>
                                    <Typography color="text.secondary" variant="body2" fontWeight={600}>Active Students</Typography>
                                    <Typography variant="h3" fontWeight={800} sx={{ color: 'success.main' }}>{statsData.stats.active}</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>

                    <Card elevation={0} variant="outlined" sx={{ borderRadius: 4, flex: '1 1 200px', minWidth: 200 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1), color: 'warning.main', display: 'flex' }}>
                                    <Users size={28} strokeWidth={2} />
                                </Box>
                                <Box>
                                    <Typography color="text.secondary" variant="body2" fontWeight={600}>Alumni / Passed Out</Typography>
                                    <Typography variant="h3" fontWeight={800} sx={{ color: 'warning.main' }}>{statsData.stats.alumni}</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>

                    <Card elevation={0} variant="outlined" sx={{ borderRadius: 4, flex: '1 1 200px', minWidth: 200 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: (theme) => alpha(theme.palette.error.main, 0.1), color: 'error.main', display: 'flex' }}>
                                    <UserX size={28} strokeWidth={2} />
                                </Box>
                                <Box>
                                    <Typography color="text.secondary" variant="body2" fontWeight={600}>Archived Students</Typography>
                                    <Typography variant="h3" fontWeight={800} sx={{ color: 'error.main' }}>{statsData.stats.archived}</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>

                    <Card
                        elevation={0}
                        variant="outlined"
                        sx={{
                            borderRadius: 4,
                            flex: '1 1 200px',
                            minWidth: 200,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)' }
                        }}
                        onClick={() => setBirthdayDialogOpen(true)}
                    >
                        <CardContent sx={{ p: 3 }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex' }}>
                                    <Cake size={28} strokeWidth={2} />
                                </Box>
                                <Box>
                                    <Typography color="text.secondary" variant="body2" fontWeight={600}>Today&apos;s Birthdays</Typography>
                                    <Typography variant="h3" fontWeight={800} sx={{ color: 'primary.main' }}>{statsData.stats.birthdayCount}</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Box>
            )}

            {/* Filters */}
            <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <TextField
                            placeholder="Search by name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ flex: 2 }}
                        />

                        <FormControl fullWidth sx={{ flex: 1 }}>
                            <InputLabel>Class</InputLabel>
                            <Select
                                value={classFilter}
                                label="Class"
                                onChange={(e) => setClassFilter(e.target.value as string)}
                            >
                                <MenuItem value="">All Classes</MenuItem>
                                {(classes || []).map((cls: any) => (
                                    <MenuItem key={cls.id} value={cls.name}>
                                        {cls.displayName || cls.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth sx={{ flex: 1 }}>
                            <InputLabel>Section</InputLabel>
                            <Select
                                value={sectionFilter}
                                label="Section"
                                onChange={(e) => setSectionFilter(e.target.value as string)}
                            >
                                <MenuItem value="">All Sections</MenuItem>
                                {['A', 'B', 'C', 'D'].map((sec) => (
                                    <MenuItem key={sec} value={sec}>Section {sec}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 150 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="alumni">Alumni / Passed Out</MenuItem>
                                <MenuItem value="archived">Archived</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </CardContent>
            </Card>

            {/* Students Table */}
            <Card elevation={2} sx={{ borderRadius: 3 }}>
                <TableContainer>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell sx={{ fontWeight: 600 }}>Photo</TableCell>
                                <TableCell sx={{ fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>
                                    <TableSortLabel
                                        active={orderBy === 'studentId'}
                                        direction={orderBy === 'studentId' ? order : 'asc'}
                                        onClick={() => handleRequestSort('studentId')}
                                    >
                                        Student ID
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>
                                    <TableSortLabel
                                        active={orderBy === 'name'}
                                        direction={orderBy === 'name' ? order : 'asc'}
                                        onClick={() => handleRequestSort('name')}
                                    >
                                        Name
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>
                                    <TableSortLabel
                                        active={orderBy === 'className'}
                                        direction={orderBy === 'className' ? order : 'asc'}
                                        onClick={() => handleRequestSort('className')}
                                    >
                                        Class
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>Father&apos;s Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>Phone</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell colSpan={8}><Skeleton /></TableCell>
                                    </TableRow>
                                ))
                            ) : students.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">No students found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                students.map((student: any) => (
                                    <TableRow key={student.id} hover>
                                        <TableCell>
                                            <Avatar src={student.photoUrl || undefined} sx={{ width: 40, height: 40 }}>
                                                {student.name?.charAt(0)}
                                            </Avatar>
                                        </TableCell>
                                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                            <Typography variant="body2" fontWeight={500}>{student.studentId}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{student.name}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{student.className}-{student.section}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                            <Typography variant="body2" color="text.secondary">{student.fatherName}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                            <Typography variant="body2" color="text.secondary">{student.phone}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={student.status}
                                                size="small"
                                                color={student.status === 'active' ? 'success' : 'default'}
                                                sx={{ textTransform: 'capitalize' }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                <IconButton
                                                    component={Link}
                                                    href={`/admissions/${student.id}/edit`}
                                                    size="small"
                                                    color="primary"
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="default"
                                                    onClick={() => handleViewStudent(student)}
                                                >
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                                {statusFilter === 'archived' && (
                                                    <Tooltip title="Restore Student">
                                                        <IconButton
                                                            size="small"
                                                            color="success"
                                                            onClick={() => handleRestoreClick(student)}
                                                        >
                                                            <RestoreFromTrash fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {student.status === 'alumni' ? (
                                                    <Tooltip title="Restore to Active">
                                                        <IconButton
                                                            size="small"
                                                            color="success"
                                                            onClick={() => handleRestoreClick(student)}
                                                        >
                                                            <RestoreFromTrash fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : student.status === 'active' && (
                                                    <Tooltip title="Move to Alumni">
                                                        <IconButton
                                                            size="small"
                                                            color="warning"
                                                            onClick={() => handleAlumniClick(student)}
                                                        >
                                                            <AlumniIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteClick(student)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={totalStudents}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Card>

            {/* Student Details Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Student Details</Typography>
                    <Chip
                        label={selectedStudent?.status}
                        color={selectedStudent?.status === 'active' ? 'success' : 'default'}
                        size="small"
                    />
                </DialogTitle>
                <DialogContent dividers>
                    {selectedStudent && (
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 3 }}>
                                <Avatar
                                    src={selectedStudent.photoUrl || undefined}
                                    sx={{ width: 100, height: 100, border: '3px solid white', boxShadow: 2 }}
                                >
                                    {selectedStudent.name?.charAt(0)}
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" fontWeight={600}>{selectedStudent.name}</Typography>
                                    <Typography color="text.secondary" gutterBottom>ID: {selectedStudent.studentId}</Typography>
                                    <Typography variant="body2" sx={{ bgcolor: 'primary.main', color: 'white', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                                        Class {selectedStudent.className} - {selectedStudent.section}
                                    </Typography>
                                </Box>
                            </Box>

                            <Tabs value={tabValue} onChange={(_e, val) => setTabValue(val)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                                <Tab label="Personal Details" />
                                <Tab label="Academic Records" />
                                <Tab label="Fee Status" />
                            </Tabs>

                            {tabValue === 0 && (
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Date of Birth</Typography>
                                        <Typography variant="body1">{selectedStudent.dob ? new Date(selectedStudent.dob).toLocaleDateString() : '-'}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Gender</Typography>
                                        <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{selectedStudent.gender}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                                        <Typography variant="body1">{selectedStudent.phone}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Father&apos;s Name</Typography>
                                        <Typography variant="body1">{selectedStudent.fatherName}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Mother&apos;s Name</Typography>
                                        <Typography variant="body1">{selectedStudent.motherName}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Aadhar No</Typography>
                                        <Typography variant="body1">{selectedStudent.aadharCardNo || '-'}</Typography>
                                    </Box>
                                    <Box sx={{ gridColumn: 'span 3' }}>
                                        <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                                        <Typography variant="body1">{selectedStudent.address}</Typography>
                                    </Box>
                                </Box>
                            )}

                            {tabValue === 1 && (
                                <Box>
                                    {selectedStudent.academicHistory && selectedStudent.academicHistory.length > 0 ? (
                                        <TableContainer component={Card} variant="outlined">
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>Session</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>Class</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>Section</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {selectedStudent.academicHistory.map((history: any) => (
                                                        <TableRow key={history.id}>
                                                            <TableCell>{history.session?.name || '-'}</TableCell>
                                                            <TableCell>{history.className}</TableCell>
                                                            <TableCell>{history.section}</TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={history.status}
                                                                    size="small"
                                                                    color={history.status === 'promoted' ? 'success' : 'default'}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    ) : (
                                        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                                            <Typography>No academic history found.</Typography>
                                        </Box>
                                    )}
                                </Box>
                            )}

                            {tabValue === 2 && (
                                <Box>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                                        <Button
                                            component={Link}
                                            href={`/fees?studentId=${selectedStudent.studentId}`}
                                            variant="contained"
                                            color="primary"
                                            startIcon={<Receipt size={18} />}
                                        >
                                            Collect Fee
                                        </Button>
                                    </Stack>

                                    {loadingFees ? (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <CircularProgress size={40} sx={{ mb: 2 }} />
                                            <Typography color="text.secondary">Loading fee status...</Typography>
                                        </Box>
                                    ) : !feeStatus ? (
                                        <Box sx={{ p: 3, textAlign: 'center' }}>
                                            <Typography color="text.secondary">No fee data available.</Typography>
                                        </Box>
                                    ) : (
                                        <>
                                            <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
                                                <Card elevation={2} sx={{ borderRadius: 3, bgcolor: 'primary.main', color: 'white', flex: '1 1 150px' }}>
                                                    <CardContent sx={{ p: 3 }}>
                                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Fee</Typography>
                                                        <Typography variant="h4" fontWeight={700}>₹{feeStatus.summary?.totalGross?.toLocaleString() || 0}</Typography>
                                                    </CardContent>
                                                </Card>
                                                <Card elevation={2} sx={{ borderRadius: 3, bgcolor: 'success.main', color: 'white', flex: '1 1 150px' }}>
                                                    <CardContent sx={{ p: 3 }}>
                                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Paid</Typography>
                                                        <Typography variant="h4" fontWeight={700}>₹{feeStatus.summary?.totalPaid?.toLocaleString() || 0}</Typography>
                                                    </CardContent>
                                                </Card>
                                                <Card elevation={2} sx={{ borderRadius: 3, bgcolor: feeStatus.summary?.totalDues > 0 ? 'error.main' : 'info.main', color: 'white', flex: '1 1 150px' }}>
                                                    <CardContent sx={{ p: 3 }}>
                                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                                            {feeStatus.summary?.totalDues > 0 ? 'Pending Dues' : 'Advance'}
                                                        </Typography>
                                                        <Typography variant="h4" fontWeight={700}>
                                                            ₹{Math.abs(feeStatus.summary?.totalDues || 0).toLocaleString()}
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            </Box>

                                            {feeStatus.feeHeads && (
                                                <Card elevation={2} sx={{ mb: 4, borderRadius: 3 }}>
                                                    <CardContent sx={{ p: 3 }}>
                                                        <Typography variant="h6" fontWeight={600} gutterBottom>Fee Head Breakdown</Typography>
                                                        <TableContainer>
                                                            <Table>
                                                                <TableHead>
                                                                    <TableRow>
                                                                        <TableCell sx={{ fontWeight: 600 }}>Fee Type</TableCell>
                                                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                                                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Paid</TableCell>
                                                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Balance</TableCell>
                                                                        <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {feeStatus.feeHeads.map((head: any) => (
                                                                        <TableRow key={head.feeTypeId} hover>
                                                                            <TableCell>{head.feeType}</TableCell>
                                                                            <TableCell align="right">₹{head.netAmount?.toLocaleString() || 0}</TableCell>
                                                                            <TableCell align="right" sx={{ color: 'primary.main' }}>₹{head.paid?.toLocaleString() || 0}</TableCell>
                                                                            <TableCell align="right" sx={{ fontWeight: 600 }}>₹{Math.abs(head.balance || 0).toLocaleString()}</TableCell>
                                                                            <TableCell align="center">
                                                                                <Chip
                                                                                    label={getStatusLabel(head.balance || 0)}
                                                                                    color={getStatusColor(head.balance || 0) as any}
                                                                                    size="small"
                                                                                />
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </TableContainer>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </>
                                    )}
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Close</Button>
                    <Button
                        component={Link}
                        href={`/admissions/${selectedStudent?.id}/edit`}
                        variant="contained"
                        startIcon={<EditIcon />}
                    >
                        Edit Student
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Export Dialog */}
            <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Export Student Data</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Class</InputLabel>
                            <Select value={exportClass} label="Class" onChange={(e) => setExportClass(e.target.value)}>
                                <MenuItem value="">All Classes</MenuItem>
                                {(classes || []).map((cls: any) => (
                                    <MenuItem key={cls.id} value={cls.name}>{cls.displayName || cls.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Section</InputLabel>
                            <Select value={exportSection} label="Section" onChange={(e) => setExportSection(e.target.value)}>
                                <MenuItem value="">All Sections</MenuItem>
                                {['A', 'B', 'C', 'D'].map((sec) => (
                                    <MenuItem key={sec} value={sec}>Section {sec}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl>
                            <FormLabel>Export Format</FormLabel>
                            <RadioGroup row value={exportFormat} onChange={(e) => setExportFormat(e.target.value as 'excel' | 'pdf')}>
                                <FormControlLabel value="excel" control={<Radio />} label="Excel" />
                                <FormControlLabel value="pdf" control={<Radio />} label="PDF" />
                            </RadioGroup>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" disabled={exportLoading} startIcon={<DownloadIcon />}>
                        {exportLoading ? 'Exporting...' : 'Download'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AlertCircle size={24} />
                    Confirm Deletion
                </DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete student <strong>{studentToDelete?.name}</strong>?</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        This action will move the student to the <strong>Archived</strong> list.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined">Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">Confirm Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Restore Confirmation Dialog */}
            <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)}>
                <DialogTitle sx={{ color: 'success.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RestoreFromTrash />
                    Confirm Restore
                </DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to restore student <strong>{studentToRestore?.name}</strong>?</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        This will move the student back to the <strong>Active</strong> list.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRestoreDialogOpen(false)} variant="outlined">Cancel</Button>
                    <Button onClick={handleRestoreConfirm} color="success" variant="contained">Confirm Restore</Button>
                </DialogActions>
            </Dialog>

            {/* Alumni Confirmation Dialog */}
            <Dialog open={alumniDialogOpen} onClose={() => setAlumniDialogOpen(false)}>
                <DialogTitle sx={{ color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AlumniIcon />
                    Confirm Status Change
                </DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to move student <strong>{studentToAlumni?.name}</strong> to Alumni?</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        This student will be listed under <strong>passout/alumni</strong> and removed from the active list.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAlumniDialogOpen(false)} variant="outlined">Cancel</Button>
                    <Button onClick={handleAlumniConfirm} color="warning" variant="contained">Confirm</Button>
                </DialogActions>
            </Dialog>

            {/* Import Dialog */}
            <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Import Students</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Upload an Excel file to bulk import students. Please use the template to ensure correct formatting.
                        </Typography>
                        <Button variant="outlined" startIcon={<FileDownloadIcon />}>
                            Download Template
                        </Button>
                        <Box
                            sx={{
                                border: '2px dashed #ccc',
                                borderRadius: 2,
                                p: 3,
                                textAlign: 'center',
                                cursor: 'pointer',
                                '&:hover': { borderColor: 'primary.main' }
                            }}
                            onClick={() => document.getElementById('import-file-input')?.click()}
                        >
                            <input
                                type="file"
                                id="import-file-input"
                                hidden
                                accept=".xlsx, .xls, .csv"
                                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                            />
                            <UploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                            <Typography>
                                {importFile ? importFile.name : 'Click to upload Excel file'}
                            </Typography>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" disabled={!importFile || importLoading}>
                        {importLoading ? 'Importing...' : 'Import'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Birthday List Dialog */}
            <Dialog open={birthdayDialogOpen} onClose={() => setBirthdayDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Cake color="#E91E63" />
                    Today&apos;s Birthdays
                    <Chip label={statsData?.stats.birthdayCount || 0} color="primary" size="small" />
                </DialogTitle>
                <DialogContent dividers>
                    {statsData?.birthdays?.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography color="text.secondary">No birthdays today!</Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>ID</TableCell>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Class</TableCell>
                                        <TableCell>Section</TableCell>
                                        <TableCell>Age</TableCell>
                                        <TableCell align="right">Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {statsData?.birthdays?.map((student: any) => (
                                        <TableRow key={student.id}>
                                            <TableCell>{student.studentId}</TableCell>
                                            <TableCell sx={{ fontWeight: 500 }}>{student.name}</TableCell>
                                            <TableCell>{student.className}</TableCell>
                                            <TableCell>{student.section}</TableCell>
                                            <TableCell>
                                                <Chip label={`${student.age} Years`} size="small" color="success" variant="outlined" />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => {
                                                        setBirthdayDialogOpen(false);
                                                        handleViewStudent(student);
                                                    }}
                                                >
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBirthdayDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}
