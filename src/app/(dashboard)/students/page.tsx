'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
    Avatar,
    TablePagination,
    Button,
    Tooltip,
} from '@mui/material';
import {
    Search as SearchIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { admissionService, classService } from '@/lib/api';

export default function StudentsList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Fetch classes
    const { data: classes } = useQuery({
        queryKey: ['classes'],
        queryFn: classService.getAll,
    });

    // Reset section filter when class changes
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSectionFilter('');
    }, [classFilter]);

    // Fetch students
    const { data: response = { data: [], meta: { total: 0 } }, isLoading } = useQuery({
        queryKey: ['students', searchTerm, classFilter, sectionFilter, statusFilter, page, rowsPerPage],
        queryFn: async () => {
            const res = await admissionService.getStudents({
                search: searchTerm,
                class: classFilter,
                section: sectionFilter,
                status: statusFilter,
                page: page + 1,
                limit: rowsPerPage,
            });
            return res.data;
        },
    });

    const students = response.data || [];
    const totalStudents = response.meta?.total || 0;

    const handleViewStudent = async (student: any) => {
        setSelectedStudent(student);
        setOpenDialog(true);

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
    };

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} mb={3}>
                <Box>
                    <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
                        Students
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage and view all students
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    component={Link}
                    href="/admissions"
                >
                    New Admission
                </Button>
            </Stack>

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
                        <FormControl sx={{ minWidth: 120 }}>
                            <InputLabel>Class</InputLabel>
                            <Select
                                value={classFilter}
                                label="Class"
                                onChange={(e) => setClassFilter(e.target.value)}
                            >
                                <MenuItem value="">All Classes</MenuItem>
                                {(classes || []).map((cls: any) => (
                                    <MenuItem key={cls.id} value={cls.name}>
                                        {cls.displayName || cls.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl sx={{ minWidth: 120 }}>
                            <InputLabel>Section</InputLabel>
                            <Select
                                value={sectionFilter}
                                label="Section"
                                onChange={(e) => setSectionFilter(e.target.value)}
                            >
                                <MenuItem value="">All</MenuItem>
                                {['A', 'B', 'C', 'D'].map((sec) => (
                                    <MenuItem key={sec} value={sec}>{sec}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl sx={{ minWidth: 120 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="alumni">Alumni</MenuItem>
                                <MenuItem value="passout">Passout</MenuItem>
                                <MenuItem value="all">All</MenuItem>
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
                                <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Father&apos;s Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}><TableCell colSpan={7}><Skeleton /></TableCell></TableRow>
                                ))
                            ) : students.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">No students found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                students.map((student: any) => (
                                    <TableRow key={student.id} hover>
                                        <TableCell>
                                            <Avatar src={student.photoUrl || undefined}>
                                                {student.name?.charAt(0)}
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
                                            <Typography variant="body2">{student.phone}</Typography>
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
                                            <Tooltip title="View Details">
                                                <IconButton size="small" onClick={() => handleViewStudent(student)}>
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Collect Fee">
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    component={Link}
                                                    href={`/fees?studentId=${student.studentId}`}
                                                    sx={{ ml: 1 }}
                                                >
                                                    Collect Fee
                                                </Button>
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

            {/* Student Details Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>Student Details</DialogTitle>
                <DialogContent dividers>
                    {selectedStudent && (
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Avatar
                                    src={selectedStudent.photoUrl || undefined}
                                    sx={{ width: 100, height: 100, mx: 'auto', mb: 1 }}
                                >
                                    {selectedStudent.name?.charAt(0)}
                                </Avatar>
                                <Typography variant="h6">{selectedStudent.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{selectedStudent.studentId}</Typography>
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 300 }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Class</Typography>
                                        <Typography variant="body1">{selectedStudent.className}-{selectedStudent.section}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                                        <Chip label={selectedStudent.status} size="small" color="success" />
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Father&apos;s Name</Typography>
                                        <Typography variant="body1">{selectedStudent.fatherName}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                                        <Typography variant="body1">{selectedStudent.phone}</Typography>
                                    </Box>
                                    <Box sx={{ gridColumn: 'span 2' }}>
                                        <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                                        <Typography variant="body1">{selectedStudent.address}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}
