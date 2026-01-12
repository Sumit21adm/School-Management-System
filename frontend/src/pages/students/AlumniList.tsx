import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Box,
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
    Grid,
    Tabs,
    Tab,
    Avatar,
    TablePagination,
    TableSortLabel,
    Tooltip,
} from '@mui/material';
import {
    Search as SearchIcon,
    Visibility as VisibilityIcon,
    RestoreFromTrash as RestoreIcon,
} from '@mui/icons-material';
import { admissionService } from '../../lib/api';
import { db } from '../../lib/db';
import { useSession } from '../../contexts/SessionContext';
import PageHeader from '../../components/PageHeader';

export default function AlumniList() {
    const { selectedSession } = useSession();
    const [searchTerm, setSearchTerm] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('alumni'); // Default to alumni
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [orderBy, setOrderBy] = useState<string>('');
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');

    // Restore State
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [studentToRestore, setStudentToRestore] = useState<any | null>(null);

    const handleRequestSort = (property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

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

    const handleViewStudent = async (student: any) => {
        setSelectedStudent(student);
        setOpenDialog(true);
        setTabValue(0);

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

    const { data: response = { data: [], meta: { total: 0 } }, isLoading, refetch } = useQuery({
        queryKey: ['students', searchTerm, classFilter, sectionFilter, statusFilter, selectedSession?.id, page, rowsPerPage, orderBy, order],
        queryFn: async () => {
            if (navigator.onLine) {
                const response = await admissionService.getStudents({
                    search: searchTerm,
                    class: classFilter,
                    section: sectionFilter,
                    status: statusFilter,
                    sessionId: selectedSession?.id,
                    page: page + 1,
                    limit: rowsPerPage,
                    sortBy: orderBy,
                    order: order,
                });
                return response.data;
            } else {
                return { data: [], meta: { total: 0 } };
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

    // Restore Logic
    const handleRestoreClick = async (student: any) => {
        if (window.confirm(`Are you sure you want to restore ${student.name} to Active status?`)) {
            try {
                const formData = new FormData();
                formData.append('status', 'active');
                // We need to use updateStudent, passing FormData with status=active
                // Or specific restore endpoint if available? 
                // api.ts has restoreStudent but that's for 'archived' (trash).
                // Let's use updateStudent for status change.

                await admissionService.updateStudent(student.id, formData);
                alert('Student restored to active list!');
                refetch();
            } catch (error) {
                console.error('Restore failed:', error);
                alert('Failed to restore student.');
            }
        }
    };

    return (
        <Box>
            <PageHeader
                title="Alumni Management"
                subtitle="View and manage graduated/passout students"
            />

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
                        <FormControl sx={{ minWidth: 150 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="alumni">Alumni</MenuItem>
                                <MenuItem value="passout">Passout</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </CardContent>
            </Card>

            <Card elevation={2} sx={{ borderRadius: 3 }}>
                <TableContainer>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell sx={{ fontWeight: 600 }}>Photo</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Class Last Attended</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Father's Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}><TableCell colSpan={6}><Skeleton /></TableCell></TableRow>
                                ))
                            ) : students.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">No alumni found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                students.map((student: any) => (
                                    <TableRow key={student.id} hover>
                                        <TableCell>
                                            <Avatar src={student.photoUrl ? `http://localhost:3001${student.photoUrl}` : undefined}>
                                                {student.name.charAt(0)}
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>{student.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{student.studentId}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{student.className}-{student.section}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">{student.fatherName}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={student.status} size="small" color="primary" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="View Details">
                                                <IconButton size="small" onClick={() => handleViewStudent(student)}>
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Restore to Active">
                                                <IconButton size="small" color="success" onClick={() => handleRestoreClick(student)}>
                                                    <RestoreIcon />
                                                </IconButton>
                                            </Tooltip>
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

            {/* Student Details Dialog - Reused Logic */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>Student Details</DialogTitle>
                <DialogContent dividers>
                    {selectedStudent && (
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                                <Typography variant="body1">{selectedStudent.name}</Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" color="text.secondary">ID</Typography>
                                <Typography variant="body1">{selectedStudent.studentId}</Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" color="text.secondary">Class</Typography>
                                <Typography variant="body1">{selectedStudent.className}-{selectedStudent.section}</Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                                <Typography variant="body1">{selectedStudent.phone}</Typography>
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                                <Typography variant="body1">{selectedStudent.address}</Typography>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}
