'use client';

import { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    TextField,
    Autocomplete,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Stack,
    Skeleton,
    Chip,
    Divider,
    Button,
    Card,
    CardContent,
    Alert,
} from '@mui/material';
import {
    Print,
    Download,
    Person,
    School,
    Badge,
} from '@mui/icons-material';

interface Student {
    studentId: string;
    name: string;
    fatherName: string;
    className: string;
    section: string;
    rollNo: string;
    admissionNo: string;
}

interface FeeHeadSummary {
    feeTypeId: number;
    feeType: string;
    structureAmount: number;
    totalBilled: number;
    totalPaid: number;
    balance: number;
}

interface MonthlyPayment {
    month: number;
    totalPaid: number;
    transactions: Array<{
        receiptNo: string;
        date: string;
        amount: number;
        paymentMode: string;
    }>;
}

interface BillSummary {
    billNo: string;
    month: number;
    year: number;
    grossAmount: number;
    discount: number;
    previousDues: number;
    netAmount: number;
    paidAmount: number;
    balance: number;
    status: string;
    dueDate: string;
}

interface FeeBookData {
    student: Student;
    session: string;
    feeHeadSummary: FeeHeadSummary[];
    monthlyPayments: MonthlyPayment[];
    bills: BillSummary[];
    summary: {
        totalBilled: number;
        totalPaid: number;
        totalBalance: number;
        openingBalance: number;
        closingBalance: number;
    };
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function FeeBookPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [sessionId, setSessionId] = useState<number | null>(null);
    const [feeBook, setFeeBook] = useState<FeeBookData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    // Fetch active session on mount
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await fetch('/api/sessions');
                if (res.ok) {
                    const sessions = await res.json();
                    const active = sessions.find((s: { isActive: boolean }) => s.isActive);
                    if (active) setSessionId(active.id);
                }
            } catch (error) {
                console.error('Error fetching session:', error);
            }
        };
        fetchSession();
    }, []);

    // Search students
    const handleSearchStudent = async (searchTerm: string) => {
        if (!searchTerm || searchTerm.length < 2) return;

        setSearchLoading(true);
        try {
            const res = await fetch(`/api/admissions?search=${encodeURIComponent(searchTerm)}&limit=10`);
            if (res.ok) {
                const data = await res.json();
                setStudents(data.students || data);
            }
        } catch (error) {
            console.error('Error searching students:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    // Fetch fee book when student is selected
    useEffect(() => {
        if (!selectedStudent || !sessionId) return;

        const fetchFeeBook = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(
                    `/api/fees/reports/fee-book?studentId=${selectedStudent.studentId}&sessionId=${sessionId}`
                );
                if (res.ok) {
                    const data = await res.json();
                    setFeeBook(data);
                }
            } catch (error) {
                console.error('Error fetching fee book:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeeBook();
    }, [selectedStudent, sessionId]);

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" fontWeight={600}>
                    Student Fee Book
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Complete fee ledger with monthly payment breakdown
                </Typography>
            </Box>

            {/* Student Search */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                <Autocomplete
                    options={students}
                    getOptionLabel={(option) => `${option.studentId} - ${option.name} (Class ${option.className})`}
                    loading={searchLoading}
                    onInputChange={(_, value) => handleSearchStudent(value)}
                    onChange={(_, value) => setSelectedStudent(value)}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Search Student"
                            placeholder="Enter student ID or name..."
                            fullWidth
                        />
                    )}
                    renderOption={(props, option) => (
                        <li {...props} key={option.studentId}>
                            <Stack>
                                <Typography fontWeight={500}>{option.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {option.studentId} • Class {option.className}-{option.section}
                                </Typography>
                            </Stack>
                        </li>
                    )}
                />
            </Paper>

            {/* Loading State */}
            {isLoading && (
                <Paper sx={{ p: 3 }}>
                    <Skeleton variant="rectangular" height={200} />
                </Paper>
            )}

            {/* No Student Selected */}
            {!selectedStudent && !isLoading && (
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                    <School sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                    <Typography color="text.secondary">
                        Search and select a student to view their fee book
                    </Typography>
                </Paper>
            )}

            {/* Fee Book Content */}
            {feeBook && !isLoading && (
                <>
                    {/* Student Info Card */}
                    <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Stack direction="row" spacing={3} alignItems="center">
                                <Box sx={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    bgcolor: 'primary.light',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Person sx={{ fontSize: 40, color: 'primary.main' }} />
                                </Box>
                                <Box>
                                    <Typography variant="h5" fontWeight={600}>
                                        {feeBook.student.name}
                                    </Typography>
                                    <Stack direction="row" spacing={2} mt={1}>
                                        <Chip
                                            icon={<Badge fontSize="small" />}
                                            label={feeBook.student.studentId}
                                            size="small"
                                            color="primary"
                                        />
                                        <Chip
                                            icon={<School fontSize="small" />}
                                            label={`Class ${feeBook.student.className}-${feeBook.student.section}`}
                                            size="small"
                                        />
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary" mt={1}>
                                        Father: {feeBook.student.fatherName} | Roll: {feeBook.student.rollNo}
                                    </Typography>
                                </Box>
                            </Stack>
                            <Stack direction="row" spacing={1}>
                                <Button startIcon={<Print />} variant="outlined" size="small">
                                    Print
                                </Button>
                                <Button startIcon={<Download />} variant="outlined" color="success" size="small">
                                    Export
                                </Button>
                            </Stack>
                        </Stack>
                    </Paper>

                    {/* Summary Cards */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ borderRadius: 2 }}>
                                <CardContent>
                                    <Typography variant="caption" color="text.secondary">Total Billed</Typography>
                                    <Typography variant="h5" fontWeight={700} color="primary.main">
                                        {formatCurrency(feeBook.summary.totalBilled)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ borderRadius: 2 }}>
                                <CardContent>
                                    <Typography variant="caption" color="text.secondary">Total Paid</Typography>
                                    <Typography variant="h5" fontWeight={700} color="success.main">
                                        {formatCurrency(feeBook.summary.totalPaid)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ borderRadius: 2 }}>
                                <CardContent>
                                    <Typography variant="caption" color="text.secondary">Balance Due</Typography>
                                    <Typography variant="h5" fontWeight={700} color="error.main">
                                        {formatCurrency(feeBook.summary.totalBalance)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Card sx={{ borderRadius: 2, bgcolor: feeBook.summary.totalBalance > 0 ? 'error.50' : 'success.50' }}>
                                <CardContent>
                                    <Typography variant="caption" color="text.secondary">Status</Typography>
                                    <Typography variant="h5" fontWeight={700}>
                                        {feeBook.summary.totalBalance > 0 ? '⚠️ Due' : '✅ Clear'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Fee Head Summary */}
                    <Paper sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
                        <Box sx={{ p: 2, bgcolor: 'grey.100' }}>
                            <Typography variant="h6" fontWeight={600}>Fee Head Summary</Typography>
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Fee Type</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">Structure</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">Billed</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">Paid</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }} align="right">Balance</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {feeBook.feeHeadSummary.map((fh) => (
                                        <TableRow key={fh.feeTypeId} hover>
                                            <TableCell sx={{ fontWeight: 500 }}>{fh.feeType}</TableCell>
                                            <TableCell align="right">{formatCurrency(fh.structureAmount)}</TableCell>
                                            <TableCell align="right">{formatCurrency(fh.totalBilled)}</TableCell>
                                            <TableCell align="right" sx={{ color: 'success.main' }}>
                                                {formatCurrency(fh.totalPaid)}
                                            </TableCell>
                                            <TableCell align="right" sx={{
                                                fontWeight: 600,
                                                color: fh.balance > 0 ? 'error.main' : 'success.main'
                                            }}>
                                                {formatCurrency(fh.balance)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                    {/* Monthly Payments */}
                    <Paper sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
                        <Box sx={{ p: 2, bgcolor: 'grey.100' }}>
                            <Typography variant="h6" fontWeight={600}>Monthly Payments</Typography>
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'secondary.main' }}>
                                        {monthNames.slice(1).map((month, idx) => (
                                            <TableCell key={idx} align="center" sx={{ color: 'white', fontWeight: 600, minWidth: 80 }}>
                                                {month}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        {feeBook.monthlyPayments.map((mp) => (
                                            <TableCell key={mp.month} align="center">
                                                {mp.totalPaid > 0 ? (
                                                    <Chip
                                                        label={formatCurrency(mp.totalPaid)}
                                                        size="small"
                                                        color="success"
                                                        sx={{ fontSize: '0.7rem' }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" color="text.disabled">-</Typography>
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                    {/* Bills List */}
                    <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                        <Box sx={{ p: 2, bgcolor: 'grey.100' }}>
                            <Typography variant="h6" fontWeight={600}>Demand Bills</Typography>
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>Bill No</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Month</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }} align="right">Gross</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }} align="right">Discount</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }} align="right">Net</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }} align="right">Paid</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }} align="right">Balance</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {feeBook.bills.map((bill) => (
                                        <TableRow key={bill.billNo} hover>
                                            <TableCell sx={{ color: 'primary.main', fontWeight: 500 }}>
                                                {bill.billNo}
                                            </TableCell>
                                            <TableCell>{monthNames[bill.month]} {bill.year}</TableCell>
                                            <TableCell align="right">{formatCurrency(bill.grossAmount)}</TableCell>
                                            <TableCell align="right" sx={{ color: 'secondary.main' }}>
                                                {formatCurrency(bill.discount)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 500 }}>
                                                {formatCurrency(bill.netAmount)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: 'success.main' }}>
                                                {formatCurrency(bill.paidAmount)}
                                            </TableCell>
                                            <TableCell align="right" sx={{
                                                fontWeight: 600,
                                                color: bill.balance > 0 ? 'error.main' : 'success.main'
                                            }}>
                                                {formatCurrency(bill.balance)}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={bill.status}
                                                    size="small"
                                                    color={
                                                        bill.status === 'PAID' ? 'success' :
                                                            bill.status === 'PARTIALLY_PAID' ? 'warning' :
                                                                bill.status === 'OVERDUE' ? 'error' : 'default'
                                                    }
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {feeBook.bills.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                No bills generated yet
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </>
            )}
        </Container>
    );
}
