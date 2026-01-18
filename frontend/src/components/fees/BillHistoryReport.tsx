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
    Schedule,
} from '@mui/icons-material';
import { apiClient } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';

interface BillDetail {
    billNo: string;
    studentId: string;
    studentName: string;
    className: string;
    section: string;
    amount: number;
    netAmount: number;
    status: string;
}

interface HistoryBatch {
    timestamp: string;
    billType: string;
    month: number;
    year: number;
    classes: string[];
    sections: string[];
    feeTypes: string[];
    studentCount: number;
    totalAmount: number;
    bills: BillDetail[];
}

interface HistoryReport {
    sessionId: number;
    generatedAt: string;
    totalBatches: number;
    totalBills: number;
    history: HistoryBatch[];
}

interface BillHistoryReportProps {
    sessionId: number;
}

const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const billTypeColors: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning'> = {
    'Single Student': 'default',
    'Entire Section': 'primary',
    'Entire Class': 'secondary',
    'Multiple Classes': 'warning',
};

function BatchRow({ batch }: { batch: HistoryBatch }) {
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
                <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Schedule fontSize="small" color="action" />
                        <Typography variant="body2">{formatDateTime(batch.timestamp)}</Typography>
                    </Stack>
                </TableCell>
                <TableCell>
                    <Chip
                        label={batch.billType}
                        size="small"
                        color={billTypeColors[batch.billType] || 'default'}
                    />
                </TableCell>
                <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                        {monthNames[batch.month]} {batch.year}
                    </Typography>
                </TableCell>
                <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {batch.classes.map((cls) => (
                            <Chip key={cls} label={cls} size="small" variant="outlined" sx={{ mb: 0.5 }} />
                        ))}
                    </Stack>
                </TableCell>
                <TableCell align="center">
                    <Chip label={batch.studentCount} size="small" color="primary" />
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {formatCurrency(batch.totalAmount)}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2 }}>
                            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                                Fee Types: {batch.feeTypes.join(', ')}
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>Bill No</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Student ID</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {batch.bills.slice(0, 20).map((bill) => (
                                        <TableRow key={bill.billNo} hover>
                                            <TableCell sx={{ color: 'primary.main', fontWeight: 500 }}>
                                                {bill.billNo}
                                            </TableCell>
                                            <TableCell>{bill.studentId}</TableCell>
                                            <TableCell>{bill.studentName}</TableCell>
                                            <TableCell>{bill.className} {bill.section}</TableCell>
                                            <TableCell align="right">{formatCurrency(bill.netAmount)}</TableCell>
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
                                    {batch.bills.length > 20 && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>
                                                ... and {batch.bills.length - 20} more bills
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}

export default function BillHistoryReport({ sessionId }: BillHistoryReportProps) {
    const [data, setData] = useState<HistoryReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!sessionId) return;

            setIsLoading(true);
            setError(null);
            try {
                const { data: result } = await apiClient.get('/fees/reports/history', {
                    params: { sessionId }
                });
                setData(result);
            } catch (err) {
                setError('Failed to load bill history');
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
            {/* Summary */}
            <Paper elevation={2} sx={{ p: 2.5, mb: 3, borderRadius: 3 }}>
                <Stack direction="row" spacing={4} divider={<Box sx={{ borderRight: 1, borderColor: 'divider' }} />}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Total Bill Batches</Typography>
                        <Typography variant="h4" fontWeight={700} color="primary.main">
                            {isLoading ? <Skeleton width={80} /> : data?.totalBatches || 0}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Total Bills Generated</Typography>
                        <Typography variant="h4" fontWeight={700} color="secondary.main">
                            {isLoading ? <Skeleton width={80} /> : data?.totalBills || 0}
                        </Typography>
                    </Box>
                </Stack>
            </Paper>

            {/* History Table */}
            <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: 50 }} />
                                <TableCell sx={{ fontWeight: 600 }}>Generated At</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>For Month</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Classes</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="center">Students</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Total Amount</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        {[...Array(7)].map((_, j) => (
                                            <TableCell key={j}><Skeleton variant="text" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : data?.history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        No bill generation history found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data?.history.map((batch, idx) => (
                                    <BatchRow key={idx} batch={batch} />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
