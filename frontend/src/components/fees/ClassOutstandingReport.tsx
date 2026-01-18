import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Stack,
    Skeleton,
    Collapse,
    Chip,
    Alert,
} from '@mui/material';
import {
    KeyboardArrowDown,
    KeyboardArrowUp,
    Phone,
    Download,
} from '@mui/icons-material';
import { apiClient } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';

interface StudentOutstanding {
    studentId: string;
    name: string;
    fatherName: string;
    section: string;
    mobile: string | null;
    totalBilled: number;
    totalPaid: number;
    outstanding: number;
}

interface ClassOutstanding {
    className: string;
    totalOutstanding: number;
    studentCount: number;
    students: StudentOutstanding[];
}

interface OutstandingReport {
    sessionId: number;
    generatedAt: string;
    summary: {
        totalClasses: number;
        totalStudents: number;
        grandTotal: number;
    };
    classes: ClassOutstanding[];
}

interface ClassOutstandingReportProps {
    sessionId: number;
}

function ClassRow({ classData }: { classData: ClassOutstanding }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <TableRow
                sx={{
                    '& > *': { borderBottom: 'unset' },
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => setOpen(!open)}
            >
                <TableCell>
                    <IconButton size="small">
                        {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Class {classData.className}
                </TableCell>
                <TableCell align="center">
                    <Chip
                        label={`${classData.studentCount} students`}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main', fontSize: '1.1rem' }}>
                    {formatCurrency(classData.totalOutstanding)}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>Student ID</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Father's Name</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Section</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Billed</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Paid</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Outstanding</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {classData.students.map((student) => (
                                        <TableRow key={student.studentId} hover>
                                            <TableCell sx={{ color: 'primary.main', fontWeight: 500 }}>
                                                {student.studentId}
                                            </TableCell>
                                            <TableCell>{student.name}</TableCell>
                                            <TableCell>{student.fatherName}</TableCell>
                                            <TableCell>{student.section}</TableCell>
                                            <TableCell>
                                                {student.mobile && (
                                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                                        <Phone fontSize="small" color="action" />
                                                        <Typography variant="body2">{student.mobile}</Typography>
                                                    </Stack>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">{formatCurrency(student.totalBilled)}</TableCell>
                                            <TableCell align="right" sx={{ color: 'success.main' }}>
                                                {formatCurrency(student.totalPaid)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>
                                                {formatCurrency(student.outstanding)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}

export default function ClassOutstandingReport({ sessionId }: ClassOutstandingReportProps) {
    const [data, setData] = useState<OutstandingReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!sessionId) return;

            setIsLoading(true);
            setError(null);
            try {
                const { data: result } = await apiClient.get('/fees/reports/outstanding', {
                    params: { sessionId }
                });
                setData(result);
            } catch (err) {
                setError('Failed to load outstanding report');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [sessionId]);

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Box>
            {/* Summary Cards */}
            <Paper elevation={2} sx={{ p: 2.5, mb: 3, borderRadius: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={4} divider={<Box sx={{ borderRight: 1, borderColor: 'divider' }} />}>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Total Outstanding</Typography>
                            <Typography variant="h4" fontWeight={700} color="error.main">
                                {isLoading ? <Skeleton width={150} /> : formatCurrency(data?.summary.grandTotal || 0)}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Students with Dues</Typography>
                            <Typography variant="h4" fontWeight={700} color="warning.main">
                                {isLoading ? <Skeleton width={80} /> : data?.summary.totalStudents || 0}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Classes</Typography>
                            <Typography variant="h4" fontWeight={700} color="primary.main">
                                {isLoading ? <Skeleton width={50} /> : data?.summary.totalClasses || 0}
                            </Typography>
                        </Box>
                    </Stack>
                    <IconButton color="success" title="Export to Excel">
                        <Download />
                    </IconButton>
                </Stack>
            </Paper>

            {/* Classes Table */}
            <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: 50 }} />
                                <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="center">Students</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Outstanding Amount</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        {[...Array(4)].map((_, j) => (
                                            <TableCell key={j}><Skeleton variant="text" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : data?.classes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        🎉 No outstanding dues! All fees are paid.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data?.classes.map((classData) => (
                                    <ClassRow key={classData.className} classData={classData} />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
