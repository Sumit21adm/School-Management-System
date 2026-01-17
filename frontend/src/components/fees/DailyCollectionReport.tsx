import { useState, useMemo } from 'react';
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
    TextField,
    Button,
    IconButton,
    Stack,
    Skeleton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    Menu,
    Divider,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
    Download,
    Print,
    FilterAlt,
    KeyboardArrowDown,
    ChevronLeft,
    ChevronRight,
    FirstPage,
    LastPage,
} from '@mui/icons-material';
import { apiClient } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';

interface Transaction {
    id: number;
    receiptNo: string;
    date: string;
    studentId: string;
    student: {
        name: string;
        className: string;
        section: string;
    };
    amount: number;
    paymentMode: string;
    paymentModes?: Array<{ mode: string; amount: number; reference?: string }>;
}

interface DailyCollectionReportProps {
    sessionId: number;
    classes: Array<{ id: number; name: string; displayName?: string }>;
}

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

const filterLabels: Record<DateFilter, string> = {
    all: 'All Time',
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
    year: 'This Year',
    custom: 'Custom Range',
};

const getDateRange = (filter: DateFilter): { from: string; to: string } => {
    const today = new Date();
    const formatDateStr = (d: Date) => d.toISOString().split('T')[0];

    switch (filter) {
        case 'today':
            return { from: formatDateStr(today), to: formatDateStr(today) };
        case 'week': {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            return { from: formatDateStr(startOfWeek), to: formatDateStr(today) };
        }
        case 'month': {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            return { from: formatDateStr(startOfMonth), to: formatDateStr(today) };
        }
        case 'year': {
            const startOfYear = new Date(today.getFullYear(), 0, 1);
            return { from: formatDateStr(startOfYear), to: formatDateStr(today) };
        }
        case 'all':
        case 'custom':
        default:
            return { from: '', to: '' };
    }
};

export default function DailyCollectionReport({ sessionId, classes }: DailyCollectionReportProps) {
    const [dateFilter, setDateFilter] = useState<DateFilter>('today');
    const [customDateFrom, setCustomDateFrom] = useState('');
    const [customDateTo, setCustomDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Student filters
    const [studentId, setStudentId] = useState('');
    const [studentName, setStudentName] = useState('');
    const [className, setClassName] = useState('');
    const [section, setSection] = useState('');

    // Calculate actual date range
    const dateRange = useMemo(() => {
        if (dateFilter === 'all' || dateFilter === 'custom') {
            return { from: customDateFrom, to: customDateTo };
        }
        return getDateRange(dateFilter);
    }, [dateFilter, customDateFrom, customDateTo]);

    // Fetch transactions
    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            const params: any = { sessionId };
            if (dateRange.from) params.dateFrom = dateRange.from;
            if (dateRange.to) params.dateTo = dateRange.to;

            const { data } = await apiClient.get('/fees/transactions', { params });
            setTransactions(data?.data || data || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch on mount and when filters change
    useMemo(() => {
        if (sessionId) {
            fetchTransactions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, dateRange.from, dateRange.to]);

    // Filter transactions client-side for additional filters
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            if (studentId && !t.studentId.toLowerCase().includes(studentId.toLowerCase())) return false;
            if (studentName && !t.student?.name?.toLowerCase().includes(studentName.toLowerCase())) return false;
            if (className && t.student?.className !== className) return false;
            if (section && t.student?.section !== section) return false;
            return true;
        });
    }, [transactions, studentId, studentName, className, section]);

    // Pagination
    const totalPages = Math.ceil(filteredTransactions.length / pageSize);
    const paginatedTransactions = filteredTransactions.slice(
        (page - 1) * pageSize,
        page * pageSize
    );

    const totalCollection = filteredTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const handleFilterSelect = (filter: DateFilter) => {
        setDateFilter(filter);
        setPage(1);
        if (filter !== 'custom') {
            setFilterMenuAnchor(null);
        }
    };

    const handlePageSizeChange = (e: SelectChangeEvent<number>) => {
        setPageSize(e.target.value as number);
        setPage(1);
    };

    const handlePrintReceipt = (receiptNo: string) => {
        feeService.openReceiptPdf(receiptNo);
    };

    const clearFilters = () => {
        setStudentId('');
        setStudentName('');
        setClassName('');
        setSection('');
    };

    return (
        <Box>
            {/* Student Filters */}
            <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
                    <TextField
                        size="small"
                        label="Student ID"
                        placeholder="Search ID..."
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        sx={{ minWidth: 150 }}
                    />
                    <TextField
                        size="small"
                        label="Student Name"
                        placeholder="Search Name..."
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        sx={{ minWidth: 200, flexGrow: 1 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Class</InputLabel>
                        <Select
                            value={className}
                            label="Class"
                            onChange={(e) => setClassName(e.target.value)}
                        >
                            <MenuItem value="">All Classes</MenuItem>
                            {classes?.map((c) => (
                                <MenuItem key={c.id} value={c.name}>
                                    {c.displayName || c.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                        <InputLabel>Section</InputLabel>
                        <Select
                            value={section}
                            label="Section"
                            onChange={(e) => setSection(e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            {['A', 'B', 'C', 'D', 'E'].map((s) => (
                                <MenuItem key={s} value={s}>{s}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button variant="text" onClick={clearFilters}>Clear</Button>
                </Stack>
            </Paper>

            {/* Stats + Date Filter Row */}
            <Paper elevation={2} sx={{ p: 2.5, mb: 3, borderRadius: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    {/* Stats */}
                    <Stack direction="row" spacing={4} alignItems="center">
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Total Collection
                            </Typography>
                            <Typography variant="h5" fontWeight={700} color="success.main">
                                {formatCurrency(totalCollection)}
                            </Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem />
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Total Transactions
                            </Typography>
                            <Typography variant="h5" fontWeight={700} color="primary.main">
                                {filteredTransactions.length}
                            </Typography>
                        </Box>
                    </Stack>

                    {/* Date Filter */}
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Button
                            variant="outlined"
                            startIcon={<FilterAlt />}
                            endIcon={<KeyboardArrowDown />}
                            onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                            sx={{ textTransform: 'none' }}
                        >
                            {filterLabels[dateFilter]}
                        </Button>

                        <Menu
                            anchorEl={filterMenuAnchor}
                            open={Boolean(filterMenuAnchor)}
                            onClose={() => setFilterMenuAnchor(null)}
                            PaperProps={{ sx: { minWidth: 280, p: 1 } }}
                        >
                            {Object.entries(filterLabels).filter(([key]) => key !== 'custom').map(([key, label]) => (
                                <MenuItem
                                    key={key}
                                    selected={dateFilter === key}
                                    onClick={() => handleFilterSelect(key as DateFilter)}
                                >
                                    {label}
                                </MenuItem>
                            ))}

                            <Divider sx={{ my: 1 }} />

                            <Box sx={{ px: 2, py: 1 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    Custom Range
                                </Typography>
                                <Stack spacing={1.5} mt={1}>
                                    <TextField
                                        label="From"
                                        type="date"
                                        size="small"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        value={customDateFrom}
                                        onChange={(e) => {
                                            setCustomDateFrom(e.target.value);
                                            setDateFilter('custom');
                                        }}
                                    />
                                    <TextField
                                        label="To"
                                        type="date"
                                        size="small"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        value={customDateTo}
                                        onChange={(e) => {
                                            setCustomDateTo(e.target.value);
                                            setDateFilter('custom');
                                        }}
                                    />
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={() => setFilterMenuAnchor(null)}
                                        disabled={!customDateFrom || !customDateTo}
                                    >
                                        Apply
                                    </Button>
                                </Stack>
                            </Box>
                        </Menu>

                        {dateFilter !== 'all' && (
                            <Chip
                                label={dateFilter === 'custom'
                                    ? `${customDateFrom} - ${customDateTo}`
                                    : filterLabels[dateFilter]}
                                onDelete={() => {
                                    setDateFilter('all');
                                    setCustomDateFrom('');
                                    setCustomDateTo('');
                                }}
                                size="small"
                                color="primary"
                            />
                        )}

                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<Download />}
                            size="small"
                        >
                            Export
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            {/* Transactions Table */}
            <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                {/* Pagination Top */}
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}
                >
                    <Typography variant="body2" color="text.secondary">
                        Showing {paginatedTransactions.length} of {filteredTransactions.length} receipts
                    </Typography>

                    <Stack direction="row" alignItems="center" spacing={2}>
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                            <InputLabel>Per Page</InputLabel>
                            <Select
                                value={pageSize}
                                label="Per Page"
                                onChange={handlePageSizeChange}
                            >
                                {[10, 20, 40, 80, 100].map((size) => (
                                    <MenuItem key={size} value={size}>{size}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            <IconButton size="small" disabled={page <= 1} onClick={() => setPage(1)}>
                                <FirstPage />
                            </IconButton>
                            <IconButton size="small" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                                <ChevronLeft />
                            </IconButton>
                            <Typography variant="body2" sx={{ mx: 1 }}>
                                Page {page} of {totalPages || 1}
                            </Typography>
                            <IconButton size="small" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                                <ChevronRight />
                            </IconButton>
                            <IconButton size="small" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>
                                <LastPage />
                            </IconButton>
                        </Stack>
                    </Stack>
                </Stack>

                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: 'grey.100' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Receipt No</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Student ID</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Student Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Payment Mode</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>Print</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        {[...Array(8)].map((_, j) => (
                                            <TableCell key={j}><Skeleton variant="text" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : paginatedTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        No transactions found for the selected filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedTransactions.map((txn) => (
                                    <TableRow key={txn.id} hover>
                                        <TableCell sx={{ fontWeight: 500, color: 'primary.main' }}>
                                            {txn.receiptNo}
                                        </TableCell>
                                        <TableCell>{formatDate(txn.date)}</TableCell>
                                        <TableCell>{txn.studentId}</TableCell>
                                        <TableCell>{txn.student?.name || '-'}</TableCell>
                                        <TableCell>{txn.student?.className} {txn.student?.section}</TableCell>
                                        <TableCell>
                                            {txn.paymentModes && txn.paymentModes.length > 0 ? (
                                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                                    {txn.paymentModes.map((pm, idx) => (
                                                        <Chip
                                                            key={idx}
                                                            label={`${pm.mode.toUpperCase()} ₹${pm.amount}`}
                                                            size="small"
                                                            variant="outlined"
                                                            color={pm.mode === 'cash' ? 'success' : 'primary'}
                                                            sx={{ mb: 0.5 }}
                                                        />
                                                    ))}
                                                </Stack>
                                            ) : (
                                                <Chip
                                                    label={txn.paymentMode?.toUpperCase()}
                                                    size="small"
                                                    variant="outlined"
                                                    color={txn.paymentMode === 'cash' ? 'success' : 'primary'}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>
                                            {formatCurrency(Number(txn.amount))}
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton
                                                color="primary"
                                                size="small"
                                                onClick={() => handlePrintReceipt(txn.receiptNo)}
                                                title="Print Receipt"
                                            >
                                                <Print fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
