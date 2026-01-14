import { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  Grid,
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
import StudentTransportDetails from './StudentTransportDetails';
import { admissionService, feeService, classService, apiClient } from '../../lib/api';
import PageHeader from '../../components/PageHeader';
import { db } from '../../lib/db';
import { useSession } from '../../contexts/SessionContext';

import { hasPermission } from '../../utils/permissions';

export default function AdmissionList() {
  const { selectedSession } = useSession();
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

  // Fetch available sections for selected class
  const { data: availableSections = [] } = useQuery({
    queryKey: ['availableSections', classFilter],
    queryFn: async () => {
      if (!classFilter) return [];
      const response = await admissionService.getAvailableSections(classFilter);
      return response.data;
    },
    enabled: !!classFilter,
  });

  // Fetch fee status for selected student
  const { data: feeStatus, isLoading: loadingFees } = useQuery({
    queryKey: ['student-fee-status', selectedStudent?.studentId, selectedSession?.id],
    queryFn: async () => {
      const response = await apiClient.get(
        `/fees/dashboard/${selectedStudent?.studentId}/session/${selectedSession?.id}`
      );
      return response.data;
    },
    enabled: !!selectedStudent && !!selectedSession && tabValue === 2,
  });

  const { data: feeBook } = useQuery({
    queryKey: ['fee-book', selectedStudent?.studentId, selectedSession?.id],
    queryFn: async () => {
      const response = await apiClient.get(
        `/fees/fee-book/${selectedStudent?.studentId}/session/${selectedSession?.id}`
      );
      return response.data;
    },
    enabled: showFeeBook && !!selectedStudent?.studentId && !!selectedSession,
  });

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

  const handleViewStudent = async (student: any) => {
    setSelectedStudent(student); // Show basic info immediately
    setOpenDialog(true);
    setTabValue(0);

    // Fetch full details including history
    try {
      const response = await admissionService.getStudent(student.id);
      setSelectedStudent(response.data);
    } catch (error) {
      console.error("Failed to fetch full student details:", error);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStudent(null);
    setTabValue(0);
  };

  // Reset section filter when class changes
  useEffect(() => {
    setSectionFilter('');
  }, [classFilter]);

  // Try to fetch from API, fallback to IndexedDB if offline
  const { data: response = { data: [], meta: { total: 0 } }, isLoading, refetch } = useQuery({
    queryKey: ['students', searchTerm, classFilter, sectionFilter, statusFilter, page, rowsPerPage, orderBy, order],
    queryFn: async () => {
      if (navigator.onLine) {
        const response = await admissionService.getStudents({
          search: searchTerm,
          className: classFilter,
          section: sectionFilter,
          status: statusFilter,
          page: page + 1, // API is 1-indexed
          limit: rowsPerPage,
          sortBy: orderBy,
          order: order,
        });
        return response.data;
      } else {
        // Fallback to local database
        let query = db.students.where('status').equals('active');
        if (searchTerm) {
          const results = await query.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.studentId.includes(searchTerm)
          ).toArray();
          return { data: results, meta: { total: results.length } };
        }
        const results = await query.toArray();
        return { data: results, meta: { total: results.length } };
      }
    },
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

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await admissionService.exportStudents({
        class: exportClass,
        section: exportSection,
        format: exportFormat,
      });

      console.log('Export response status:', response.status);
      console.log('Export response headers:', response.headers);
      console.log('Export response data type:', typeof response.data);
      console.log('Export response data size:', response.data.size);

      if (response.data.type === 'application/json') {
        // If the response is JSON, it's likely an error message
        const text = await response.data.text();
        console.error('Export returned JSON (likely error):', text);
        alert('Export failed: ' + text);
        return;
      }

      const blob = new Blob([response.data], {
        type: exportFormat === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf'
      });

      if (blob.size === 0) {
        console.error('Export blob is empty');
        alert('Export failed: Server returned empty file.');
        return;
      }

      saveAs(blob, `students.${exportFormat === 'excel' ? 'xlsx' : 'pdf'}`);

      setExportDialogOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Check console for details.');
    } finally {
      setExportLoading(false);
    }
  };

  // Snackbar State
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  // Restore State
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [studentToRestore, setStudentToRestore] = useState<any | null>(null);

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
      setSnackbar({
        open: true,
        message: 'Student restored successfully',
        severity: 'success',
      });
      refetch();
    } catch (error) {
      console.error('Restore failed:', error);
      setSnackbar({
        open: true,
        message: 'Failed to restore student',
        severity: 'error',
      });
    } finally {
      setRestoreDialogOpen(false);
      setStudentToRestore(null);
    }
  };

  // Alumni State
  const [alumniDialogOpen, setAlumniDialogOpen] = useState(false);
  const [studentToAlumni, setStudentToAlumni] = useState<any | null>(null);

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
      setSnackbar({
        open: true,
        message: 'Student moved to Alumni successfully',
        severity: 'success',
      });
      refetch();
    } catch (error) {
      console.error('Move to Alumni failed:', error);
      setSnackbar({
        open: true,
        message: 'Failed to move student to Alumni',
        severity: 'error',
      });
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
      setSnackbar({
        open: true,
        message: 'Student deleted successfully',
        severity: 'success',
      });
      // Refresh list immediately
      refetch();
    } catch (error) {
      console.error('Delete failed:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete student',
        severity: 'error',
      });
    } finally {
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await admissionService.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'student_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download template:', error);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setImportLoading(true);
    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const response = await admissionService.importStudents(formData);
      if (response.data.success) {
        alert(`Successfully imported ${response.data.imported} students!`);
        setImportDialogOpen(false);
        setImportFile(null);
        refetch();
      } else {
        alert('Import failed:\n' + response.data.errors.join('\n'));
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import students. Please check the file format.');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <PageHeader
        title="Student Admissions"
        subtitle="Manage student admissions and records"
        action={
          <Stack direction="row" spacing={2}>
            <Stack direction="row" spacing={2}>
              {hasPermission('admissions_import') && (
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => setImportDialogOpen(true)}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Import
                </Button>
              )}
              {hasPermission('admissions_export') && (
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => setExportDialogOpen(true)}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Export
                </Button>
              )}
              {hasPermission('admissions_create') && (
                <Button
                  component={Link}
                  to="/admissions/new"
                  variant="contained"
                  startIcon={<AddIcon />}
                  size="large"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                  }}
                >
                  New Admission
                </Button>
              )}
            </Stack>
          </Stack>
        }
      />

      {/* Stats Cards */}
      {statsData && (
        <Grid container spacing={3} mb={4}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={0} variant="outlined" sx={{ borderRadius: 4, height: '100%', borderColor: 'divider' }}>
              <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '50%',
                      bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
                      color: 'success.main',
                      display: 'flex'
                    }}
                  >
                    <UserCheck size={28} strokeWidth={2} />
                  </Box>
                  <Box>
                    <Typography color="text.secondary" variant="body2" fontWeight={600} gutterBottom>
                      Active Students
                    </Typography>
                    <Typography variant="h3" fontWeight={800} sx={{ color: 'success.main', letterSpacing: '-0.02em' }}>
                      {statsData.stats.active}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={0} variant="outlined" sx={{ borderRadius: 4, height: '100%', borderColor: 'divider' }}>
              <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '50%',
                      bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
                      color: 'warning.main',
                      display: 'flex'
                    }}
                  >
                    <Users size={28} strokeWidth={2} />
                  </Box>
                  <Box>
                    <Typography color="text.secondary" variant="body2" fontWeight={600} gutterBottom>
                      Alumni / Passed Out
                    </Typography>
                    <Typography variant="h3" fontWeight={800} sx={{ color: 'warning.main', letterSpacing: '-0.02em' }}>
                      {statsData.stats.alumni}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={0} variant="outlined" sx={{ borderRadius: 4, height: '100%', borderColor: 'divider' }}>
              <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '50%',
                      bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                      color: 'error.main',
                      display: 'flex'
                    }}
                  >
                    <UserX size={28} strokeWidth={2} />
                  </Box>
                  <Box>
                    <Typography color="text.secondary" variant="body2" fontWeight={600} gutterBottom>
                      Archived Students
                    </Typography>
                    <Typography variant="h3" fontWeight={800} sx={{ color: 'error.main', letterSpacing: '-0.02em' }}>
                      {statsData.stats.archived}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={0}
              variant="outlined"
              sx={{
                borderRadius: 4,
                height: '100%',
                borderColor: 'divider',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
                  transform: 'translateY(-2px)'
                }
              }}
              onClick={() => setBirthdayDialogOpen(true)}
            >
              <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '50%',
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                      display: 'flex'
                    }}
                  >
                    <Cake size={28} strokeWidth={2} />
                  </Box>
                  <Box>
                    <Typography color="text.secondary" variant="body2" fontWeight={600} gutterBottom>
                      Today's Birthdays
                    </Typography>
                    <Typography variant="h3" fontWeight={800} sx={{ color: 'primary.main', letterSpacing: '-0.02em' }}>
                      {statsData.stats.birthdayCount}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
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
                {classes?.map((cls: any) => (
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
                disabled={!classFilter}
              >
                <MenuItem value="">All Sections</MenuItem>
                {(classFilter ? availableSections : ['A', 'B', 'C', 'D']).map((sec: string) => (
                  <MenuItem key={sec} value={sec}>
                    Section {sec}
                  </MenuItem>
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
                <MenuItem value="alumni">Alumni/ Passed Out</MenuItem>
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
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Photo</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', display: { xs: 'none', md: 'table-cell' } }}>
                  <TableSortLabel
                    active={orderBy === 'studentId'}
                    direction={orderBy === 'studentId' ? order : 'asc'}
                    onClick={() => handleRequestSort('studentId')}
                  >
                    Student ID
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  <TableSortLabel
                    active={orderBy === 'name'}
                    direction={orderBy === 'name' ? order : 'asc'}
                    onClick={() => handleRequestSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', display: { xs: 'none', md: 'table-cell' } }}>
                  <TableSortLabel
                    active={orderBy === 'dob'}
                    direction={orderBy === 'dob' ? order : 'asc'}
                    onClick={() => handleRequestSort('dob')}
                  >
                    Date of Birth
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  <TableSortLabel
                    active={orderBy === 'className'}
                    direction={orderBy === 'className' ? order : 'asc'}
                    onClick={() => handleRequestSort('className')}
                  >
                    Class
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', display: { xs: 'none', md: 'table-cell' } }}>
                  <TableSortLabel
                    active={orderBy === 'fatherName'}
                    direction={orderBy === 'fatherName' ? order : 'asc'}
                    onClick={() => handleRequestSort('fatherName')}
                  >
                    Father's Name
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', display: { xs: 'none', md: 'table-cell' } }}>
                  <TableSortLabel
                    active={orderBy === 'phone'}
                    direction={orderBy === 'phone' ? order : 'asc'}
                    onClick={() => handleRequestSort('phone')}
                  >
                    Phone
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Skeleton width={60} /></TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                  </TableRow>
                ))
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No students found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student: any) => (
                  <TableRow
                    key={student.id}
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell>
                      <Avatar
                        src={student.photoUrl ? `http://localhost:3001${student.photoUrl}` : undefined}
                        alt={student.name}
                        sx={{ width: 40, height: 40 }}
                      >
                        {student.name.charAt(0)}
                      </Avatar>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Typography variant="body2" fontWeight={500}>
                        {student.studentId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{student.name}</Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Typography variant="body2">
                        {new Date(student.dob).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {student.className}-{student.section}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Typography variant="body2" color="text.secondary">
                        {student.fatherName}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Typography variant="body2" color="text.secondary">
                        {student.phone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={student.status}
                        size="small"
                        color={student.status === 'active' ? 'success' : 'error'}
                        sx={{ fontWeight: 500, textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {hasPermission('admissions_edit') && (
                          <IconButton
                            component={Link}
                            to={`/admissions/edit/${student.id}`}
                            size="small"
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          color="default"
                          onClick={() => handleViewStudent(student)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {statusFilter === 'archived' && (
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleRestoreClick(student)}
                            title="Restore Student"
                          >
                            <RestoreFromTrash fontSize="small" />
                          </IconButton>
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
                        ) : (
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
                        {hasPermission('admissions_delete') && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(student)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
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
            color={selectedStudent?.status === 'active' ? 'success' : 'error'}
            size="small"
          />
        </DialogTitle>
        <DialogContent dividers>
          {selectedStudent && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 3 }}>
                <Avatar
                  src={selectedStudent.photoUrl ? `http://localhost:3001${selectedStudent.photoUrl}` : undefined}
                  sx={{ width: 100, height: 100, border: '3px solid white', boxShadow: 2 }}
                />
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
                {hasPermission('transport_view') && <Tab label="Transport" />}
              </Tabs>

              {tabValue === 0 && (
                <Grid container spacing={2}>
                  {/* Basic Info */}
                  <Grid size={{ xs: 12 }}><Typography variant="subtitle1" fontWeight="bold" color="primary">Basic Information</Typography></Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary">Date of Birth</Typography>
                    <Typography variant="body1">{new Date(selectedStudent.dob).toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary">Gender</Typography>
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{selectedStudent.gender}</Typography>
                  </Grid>


                  {/* Government IDs */}
                  <Grid size={{ xs: 12 }} sx={{ mt: 1 }}><Typography variant="subtitle1" fontWeight="bold" color="primary">Government Identification</Typography></Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary">Student Aadhar</Typography>
                    <Typography variant="body1">{selectedStudent.aadharCardNo || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary">APAAR ID</Typography>
                    <Typography variant="body1">{selectedStudent.apaarId || '-'}</Typography>
                  </Grid>

                  {/* Contact Info */}
                  <Grid size={{ xs: 12 }} sx={{ mt: 1 }}><Typography variant="subtitle1" fontWeight="bold" color="primary">Contact Details</Typography></Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">{selectedStudent.phone}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{selectedStudent.email || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary">WhatsApp</Typography>
                    <Typography variant="body1">{selectedStudent.whatsAppNo || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                    <Typography variant="body1">{selectedStudent.address}</Typography>
                  </Grid>

                  {/* Parents Details */}
                  <Grid size={{ xs: 12 }} sx={{ mt: 1 }}><Typography variant="subtitle1" fontWeight="bold" color="primary">Parents Details</Typography></Grid>

                  {/* Father */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined" sx={{ p: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Father</Typography>
                      <Stack spacing={1}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Name</Typography>
                          <Typography variant="body2">{selectedStudent.fatherName}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Occupation</Typography>
                          <Typography variant="body2">{selectedStudent.fatherOccupation || '-'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Aadhar</Typography>
                          <Typography variant="body2">{selectedStudent.fatherAadharNo || '-'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">PAN</Typography>
                          <Typography variant="body2">{selectedStudent.fatherPanNo || '-'}</Typography>
                        </Box>
                      </Stack>
                    </Card>
                  </Grid>

                  {/* Mother */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined" sx={{ p: 1 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Mother</Typography>
                      <Stack spacing={1}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Name</Typography>
                          <Typography variant="body2">{selectedStudent.motherName}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Occupation</Typography>
                          <Typography variant="body2">{selectedStudent.motherOccupation || '-'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Aadhar</Typography>
                          <Typography variant="body2">{selectedStudent.motherAadharNo || '-'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">PAN</Typography>
                          <Typography variant="body2">{selectedStudent.motherPanNo || '-'}</Typography>
                        </Box>
                      </Stack>
                    </Card>
                  </Grid>

                  {/* Guardian Details (Conditional) */}
                  {selectedStudent.guardianName && (
                    <>
                      <Grid size={{ xs: 12 }} sx={{ mt: 1 }}><Typography variant="subtitle1" fontWeight="bold" color="primary">Guardian Information</Typography></Grid>
                      <Grid size={{ xs: 12 }}>
                        <Card variant="outlined" sx={{ p: 2 }}>
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <Typography variant="caption" color="text.secondary">Relation</Typography>
                              <Typography variant="body2">{selectedStudent.guardianRelation || '-'}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <Typography variant="caption" color="text.secondary">Name</Typography>
                              <Typography variant="body2">{selectedStudent.guardianName}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <Typography variant="caption" color="text.secondary">Phone</Typography>
                              <Typography variant="body2">{selectedStudent.guardianPhone || '-'}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <Typography variant="caption" color="text.secondary">Occupation</Typography>
                              <Typography variant="body2">{selectedStudent.guardianOccupation || '-'}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <Typography variant="caption" color="text.secondary">Aadhar</Typography>
                              <Typography variant="body2">{selectedStudent.guardianAadharNo || '-'}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <Typography variant="caption" color="text.secondary">Email</Typography>
                              <Typography variant="body2">{selectedStudent.guardianEmail || '-'}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <Typography variant="caption" color="text.secondary">Address</Typography>
                              <Typography variant="body2">{selectedStudent.guardianAddress || '-'}</Typography>
                            </Grid>
                          </Grid>
                        </Card>
                      </Grid>
                    </>
                  )}
                </Grid>
              )}

              {tabValue === 1 && (
                <Box sx={{ p: 2 }}>
                  {selectedStudent.academicHistory && selectedStudent.academicHistory.length > 0 ? (
                    <TableContainer component={Card} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Session</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Class</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Section</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Result</TableCell>
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
                                  sx={{ textTransform: 'capitalize' }}
                                />
                              </TableCell>
                              <TableCell>{history.finalResult || '-'}</TableCell>
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
                  {/* Header Actions */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                    <Button
                      component={Link}
                      to={`/fees/collection-enhanced?studentId=${selectedStudent.studentId}`}
                      variant="contained"
                      color="primary"
                      startIcon={<Receipt size={18} />}
                    >
                      Collect Fee
                    </Button>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="outlined"
                        startIcon={<FileText size={18} />}
                        onClick={() => setShowFeeBook(true)}
                      >
                        View Fee Book
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<Download size={18} />}
                      >
                        Download Statement
                      </Button>
                    </Stack>
                  </Stack>

                  {loadingFees ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress size={40} sx={{ mb: 2 }} />
                      <Typography color="text.secondary">Loading fee status...</Typography>
                    </Box>
                  ) : !feeStatus || !feeStatus.summary ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography color="text.secondary">No fee data available for this session.</Typography>
                    </Box>
                  ) : (
                    <>
                      {/* Summary Cards */}
                      <Grid container spacing={3} mb={4}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Card elevation={2} sx={{ borderRadius: 3, bgcolor: 'primary.main', color: 'white', minHeight: 140, height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                              <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>Total Fee</Typography>
                              <Typography variant="h4" fontWeight={700}>₹{feeStatus.summary.totalGross.toLocaleString()}</Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Card elevation={2} sx={{ borderRadius: 3, bgcolor: 'success.main', color: 'white', minHeight: 140, height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                              <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>Total Paid</Typography>
                              <Typography variant="h4" fontWeight={700}>₹{feeStatus.summary.totalPaid.toLocaleString()}</Typography>
                              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                                <TrendingUp size={16} />
                                <Typography variant="caption">
                                  {((feeStatus.summary.totalPaid / feeStatus.summary.totalNet) * 100).toFixed(1)}%
                                </Typography>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Card elevation={2} sx={{ borderRadius: 3, bgcolor: 'warning.main', color: 'white', minHeight: 140, height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                              <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>Discount</Typography>
                              <Typography variant="h4" fontWeight={700}>₹{feeStatus.summary.totalDiscount.toLocaleString()}</Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Card
                            elevation={2}
                            sx={{
                              borderRadius: 3,
                              bgcolor: feeStatus.summary.totalDues > 0 ? 'error.main' : 'info.main',
                              color: 'white',
                              minHeight: 140,
                              height: '100%'
                            }}
                          >
                            <CardContent sx={{ p: 3 }}>
                              <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                                {feeStatus.summary.totalDues > 0 ? 'Pending Dues' : 'Advance'}
                              </Typography>
                              <Typography variant="h4" fontWeight={700}>
                                ₹{Math.abs(feeStatus.summary.totalDues).toLocaleString()}
                              </Typography>
                              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                                {feeStatus.summary.totalDues > 0 ? (
                                  <>
                                    <AlertCircle size={16} />
                                    <Typography variant="caption">Payment Required</Typography>
                                  </>
                                ) : (
                                  <>
                                    <TrendingDown size={16} />
                                    <Typography variant="caption">No Dues</Typography>
                                  </>
                                )}
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>

                      {/* Fee Heads Breakdown */}
                      <Card elevation={2} sx={{ mb: 4, borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography variant="h6" fontWeight={600} gutterBottom>Fee Head Breakdown</Typography>
                          <TableContainer>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 600 }}>Fee Type</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 600 }}>Gross Amount</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 600 }}>Discount</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 600 }}>Net Amount</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 600 }}>Paid</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 600 }}>Balance</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {feeStatus.feeHeads.map((head: any) => (
                                  <TableRow key={head.feeTypeId} hover>
                                    <TableCell>{head.feeType}</TableCell>
                                    <TableCell align="right">₹{head.grossAmount.toLocaleString()}</TableCell>
                                    <TableCell align="right" sx={{ color: 'success.main' }}>
                                      {head.discount > 0 ? `-₹${head.discount.toLocaleString()}` : '-'}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>₹{head.netAmount.toLocaleString()}</TableCell>
                                    <TableCell align="right" sx={{ color: 'primary.main' }}>₹{head.paid.toLocaleString()}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>₹{Math.abs(head.balance).toLocaleString()}</TableCell>
                                    <TableCell align="center">
                                      <Chip
                                        label={getStatusLabel(head.balance)}
                                        color={getStatusColor(head.balance)}
                                        size="small"
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                          {/* Progress Bar */}
                          <Box sx={{ mt: 3 }}>
                            <Stack direction="row" justifyContent="space-between" mb={1}>
                              <Typography variant="body2" color="text.secondary">Payment Progress</Typography>
                              <Typography variant="body2" fontWeight={600}>
                                {((feeStatus.summary.totalPaid / feeStatus.summary.totalNet) * 100).toFixed(1)}%
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={(feeStatus.summary.totalPaid / feeStatus.summary.totalNet) * 100}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                        </CardContent>
                      </Card>

                      {/* Recent Transactions */}
                      <Card elevation={2} sx={{ borderRadius: 3, mb: 4 }}>
                        <CardContent sx={{ p: 3 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6" fontWeight={600}>Recent Transactions</Typography>
                            <Chip
                              icon={<Receipt size={16} />}
                              label={`${feeStatus.recentTransactions.length} Transactions`}
                              size="small"
                            />
                          </Stack>
                          <TableContainer>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 600 }}>Receipt No</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Mode</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 600 }}>Action</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {feeStatus.recentTransactions.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                      No transactions found
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  feeStatus.recentTransactions.map((txn: any, index: number) => (
                                    <TableRow key={index} hover>
                                      <TableCell sx={{ fontWeight: 500 }}>{txn.receiptNo}</TableCell>
                                      <TableCell>{new Date(txn.date).toLocaleDateString()}</TableCell>
                                      <TableCell>
                                        <Stack spacing={0.5}>
                                          {txn.details.map((detail: any, idx: number) => (
                                            <Typography key={idx} variant="body2" color="text.secondary">
                                              {detail.feeType}: ₹{detail.amount.toLocaleString()}
                                            </Typography>
                                          ))}
                                        </Stack>
                                      </TableCell>
                                      <TableCell sx={{ textTransform: 'capitalize' }}>{txn.paymentMode}</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>
                                        ₹{txn.amount.toLocaleString()}
                                      </TableCell>
                                      <TableCell align="center">
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          startIcon={<Printer size={16} />}
                                          onClick={() => feeService.openReceiptPdf(txn.receiptNo)}
                                        >
                                          Print
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </CardContent>
                      </Card>

                      {/* Pending Bills - Keep existing logic which is quite good via 'pendingBills' from API */}
                      {(!feeStatus.pendingBills || feeStatus.pendingBills.length === 0) ? (
                        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                          <Typography>No demand bills generated yet.</Typography>
                        </Box>
                      ) : (
                        <Box>
                          <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="caption">
                              <strong>Note:</strong> Pending Bills shows the total balance of all generated demand bills.
                            </Typography>
                          </Alert>
                          <Typography variant="subtitle2" fontWeight={600} gutterBottom>Monthly Demand Bills</Typography>
                          <TableContainer component={Box} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                  <TableCell sx={{ fontWeight: 600 }}>Month/Year</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Bill No</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 600 }}>Discount</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 600 }}>Paid</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 600 }}>Balance</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 600 }}>Action</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {feeStatus.pendingBills.map((bill: any) => {
                                  const isExpanded = expandedBills.includes(bill.billNo);
                                  const totalDiscount = bill.items?.reduce((sum: number, item: any) => sum + (item.discount || 0), 0);
                                  return (
                                    <>
                                      <TableRow key={bill.billNo} hover>
                                        <TableCell>
                                          <Stack direction="row" alignItems="center" spacing={1}>
                                            <IconButton
                                              size="small"
                                              onClick={() => {
                                                setExpandedBills(prev =>
                                                  isExpanded
                                                    ? prev.filter(b => b !== bill.billNo)
                                                    : [...prev, bill.billNo]
                                                );
                                              }}
                                            >
                                              {isExpanded ? '▼' : '▶'}
                                            </IconButton>
                                            <Typography variant="body2">{bill.month}/{bill.year}</Typography>
                                          </Stack>
                                        </TableCell>
                                        <TableCell>{bill.billNo}</TableCell>
                                        <TableCell align="right">₹{bill.amount.toLocaleString()}</TableCell>
                                        <TableCell align="right" sx={{ color: totalDiscount > 0 ? 'error.main' : 'text.primary' }}>
                                          {totalDiscount > 0 ? `₹${totalDiscount.toLocaleString()}` : '-'}
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: 'success.main' }}>
                                          ₹{bill.paid.toLocaleString()}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                                          ₹{bill.balance.toLocaleString()}
                                        </TableCell>
                                        <TableCell align="center">
                                          <Chip
                                            label={bill.status}
                                            size="small"
                                            color={
                                              bill.status === 'PAID' || bill.status === 'paid' ? 'success' :
                                                bill.status === 'PENDING' || bill.status === 'pending' ? 'warning' : 'error'
                                            }
                                          />
                                        </TableCell>
                                        <TableCell align="center">
                                          <Stack direction="row" spacing={1} justifyContent="center">
                                            {bill.balance > 0 && (
                                              <Button
                                                component={Link}
                                                to={`/fees/collection-enhanced?studentId=${selectedStudent.studentId}&billNo=${bill.billNo}`}
                                                size="small"
                                                variant="outlined"
                                              >
                                                Pay
                                              </Button>
                                            )}
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              startIcon={<Printer size={16} />}
                                              onClick={() => feeService.openDemandBillPdf(bill.billNo)}
                                            >
                                              Print
                                            </Button>
                                          </Stack>
                                        </TableCell>
                                      </TableRow>
                                      {isExpanded && bill.items && (
                                        <TableRow>
                                          <TableCell colSpan={7} sx={{ bgcolor: 'grey.50', py: 2 }}>
                                            <Typography variant="caption" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                                              Bill Breakdown:
                                            </Typography>
                                            <Table size="small">
                                              <TableHead>
                                                <TableRow>
                                                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Fee Type</TableCell>
                                                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Discount</TableCell>
                                                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Amount</TableCell>
                                                </TableRow>
                                              </TableHead>
                                              <TableBody>
                                                {bill.items.map((item: any, idx: number) => {
                                                  return (
                                                    <TableRow key={idx}>
                                                      <TableCell sx={{ fontSize: '0.75rem' }}>{item.feeType}</TableCell>
                                                      <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{item.discount > 0 ? `₹${item.discount.toLocaleString()}` : '-'}</TableCell>
                                                      <TableCell align="right" sx={{ fontSize: '0.75rem' }}>₹{item.amount.toLocaleString()}</TableCell>
                                                    </TableRow>
                                                  );
                                                })}
                                              </TableBody>
                                            </Table>
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              )}

              {tabValue === 3 && (
                <Box sx={{ mt: 2 }}>
                  <StudentTransportDetails
                    studentId={selectedStudent.studentId}
                    transportData={selectedStudent.transport}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          <Button
            component={Link}
            to={`/admissions/edit/${selectedStudent?.id}`}
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
              <Select
                value={exportClass}
                label="Class"
                onChange={(e) => setExportClass(e.target.value)}
              >
                <MenuItem value="">All Classes</MenuItem>
                {classes?.map((cls: any) => (
                  <MenuItem key={cls.id} value={cls.name}>
                    {cls.displayName || cls.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Section</InputLabel>
              <Select
                value={exportSection}
                label="Section"
                onChange={(e) => setExportSection(e.target.value)}
              >
                <MenuItem value="">All Sections</MenuItem>
                {['A', 'B', 'C', 'D'].map((sec) => (
                  <MenuItem key={sec} value={sec}>
                    Section {sec}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Export Format</FormLabel>
              <RadioGroup
                row
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'excel' | 'pdf')}
              >
                <FormControlLabel value="excel" control={<Radio />} label="Excel" />
                <FormControlLabel value="pdf" control={<Radio />} label="PDF" />
              </RadioGroup>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={exportLoading}
            startIcon={exportLoading ? undefined : <DownloadIcon />}
          >
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
          <Typography>
            Are you sure you want to delete student <strong>{studentToDelete?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action will move the student to the <strong>Archived</strong> list. They will no longer appear in the active student list.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Notification */}
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
      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)}>
        <DialogTitle sx={{ color: 'success.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <RestoreFromTrash />
          Confirm Restore
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to restore student <strong>{studentToRestore?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will move the student back to the <strong>Active</strong> list.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleRestoreConfirm} color="success" variant="contained" autoFocus>
            Confirm Restore
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alumni Confirmation Dialog */}
      <Dialog open={alumniDialogOpen} onClose={() => setAlumniDialogOpen(false)}>
        <DialogTitle sx={{ color: 'warning.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AlumniIcon />
          Confirm Status Change
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to move student <strong>{studentToAlumni?.name}</strong> to Alumni?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This student will be listed under <strong>passout/alumni</strong> and removed from the active list.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlumniDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleAlumniConfirm} color="warning" variant="contained" autoFocus>
            Confirm
          </Button>
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

            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleDownloadTemplate}
            >
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
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={!importFile || importLoading}
          >
            {importLoading ? 'Importing...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog >
      <Dialog open={showFeeBook} onClose={() => setShowFeeBook(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              Yearly Fee Book
            </Typography>
            <Button startIcon={<DownloadIcon />} variant="outlined" size="small">
              Download PDF
            </Button>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {feeBook && (
            <Box>
              <Grid container spacing={2} mb={3}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Student
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {feeBook.student.name} ({feeBook.student.studentId})
                  </Typography>
                  <Typography variant="body2">
                    Class: {feeBook.student.className}-{feeBook.student.section}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Session
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {feeBook.session}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" fontWeight={600} gutterBottom>
                Fee Structure
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fee Type</TableCell>
                      <TableCell align="right">Gross</TableCell>
                      <TableCell align="right">Discount</TableCell>
                      <TableCell align="right">Net</TableCell>
                      <TableCell align="right">Paid</TableCell>
                      <TableCell align="right">Balance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {feeBook.feeStructure.map((item: any) => (
                      <TableRow key={item.feeTypeId}>
                        <TableCell>{item.feeType}</TableCell>
                        <TableCell align="right">₹{item.grossAmount.toLocaleString()}</TableCell>
                        <TableCell align="right">₹{item.discount.toLocaleString()}</TableCell>
                        <TableCell align="right">₹{item.netAmount.toLocaleString()}</TableCell>
                        <TableCell align="right">₹{item.paid.toLocaleString()}</TableCell>
                        <TableCell align="right">₹{item.balance.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h6" fontWeight={600} gutterBottom>
                Monthly Payment Details
              </Typography>
              <Grid container spacing={2}>
                {feeBook.monthlyPayments.map((month: any) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={month.month}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          {new Date(2024, month.month - 1).toLocaleDateString('en', { month: 'long' })}
                        </Typography>
                        <Typography variant="h6" color="success.main" fontWeight={600}>
                          ₹{month.totalPaid.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {month.transactions.length} transaction(s)
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Opening Balance
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    ₹{feeBook.openingBalance.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }} textAlign="right">
                  <Typography variant="body2" color="text.secondary">
                    Closing Balance
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    color={feeBook.closingBalance > 0 ? 'error.main' : 'success.main'}
                  >
                    ₹{Math.abs(feeBook.closingBalance).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFeeBook(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Birthday List Dialog */}
      <Dialog open={birthdayDialogOpen} onClose={() => setBirthdayDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Cake color="#E91E63" />
          Today's Birthdays
          <Chip label={statsData?.stats.birthdayCount} color="primary" size="small" />
        </DialogTitle>
        <DialogContent dividers>
          {statsData?.birthdays.length === 0 ? (
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
                    <TableCell>Age (Years)</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statsData?.birthdays.map((student: any) => (
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
      </Dialog >
    </Box >
  );
}
