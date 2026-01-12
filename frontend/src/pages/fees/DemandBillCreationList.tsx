import React from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Button,
    Stack,
    CircularProgress
} from '@mui/material';
import { Printer, Download } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

interface BillItem {
    feeType: string;
    amount: number;
    discount: number;
}

interface BillData {
    billNo: string;
    studentId: string;
    studentName: string;
    className: string;
    section: string;
    amount: number;
    previousDues?: number;
    advanceUsed?: number;
    status: string;
    items: BillItem[];
}

interface CreationListProps {
    batchId: string; // Timestamp ISO string
    bills: BillData[];
    loading?: boolean;
}

const DemandBillCreationList: React.FC<CreationListProps> = ({ batchId, bills, loading }) => {
    // 1. Identify all unique fee types (columns) for this batch
    const uniqueFeeTypes = React.useMemo(() => {
        const types = new Set<string>();
        bills.forEach(bill => {
            bill.items?.forEach(item => types.add(item.feeType));
        });
        return Array.from(types).sort();
    }, [bills]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    // Calculate Column Totals
    const columnTotals = uniqueFeeTypes.reduce((acc, type) => {
        acc[type] = bills.reduce((sum, bill) => {
            const item = bill.items?.find(i => i.feeType === type);
            return sum + (item ? item.amount : 0);
        }, 0);
        return acc;
    }, {} as Record<string, number>);

    const totalAdvance = bills.reduce((sum, bill) => sum + (bill.advanceUsed || 0), 0);
    const totalDues = bills.reduce((sum, bill) => sum + (bill.previousDues || 0), 0);
    const grandTotal = bills.reduce((sum, bill) => sum + bill.amount, 0);

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                <Box>
                    <Typography variant="h6" fontWeight={700}>
                        Creation List
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Batch Generated: {new Date(batchId).toLocaleString()}
                    </Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    <Button variant="outlined" startIcon={<Download size={18} />}>
                        Export Excel
                    </Button>
                    <Button variant="contained" startIcon={<Printer size={18} />} onClick={() => window.print()}>
                        Print List
                    </Button>
                </Stack>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ flex: 1, borderRadius: 0 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.light', color: 'primary.contrastText' }}>Bill No</TableCell>
                            <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.light', color: 'primary.contrastText' }}>Student ID</TableCell>
                            <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.light', color: 'primary.contrastText' }}>Student Name</TableCell>
                            <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.light', color: 'primary.contrastText' }}>Class</TableCell>

                            <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'warning.light', color: 'warning.dark' }}>Advance</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'error.light', color: 'error.dark' }}>Prev. Dues</TableCell>

                            {uniqueFeeTypes.map(type => (
                                <TableCell key={type} align="right" sx={{ fontWeight: 700, bgcolor: 'grey.100', minWidth: 100 }}>
                                    {type}
                                </TableCell>
                            ))}
                            <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                                Total
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {bills.map((bill) => (
                            <TableRow key={bill.billNo} hover>
                                <TableCell>{bill.billNo}</TableCell>
                                <TableCell>{bill.studentId}</TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>{bill.studentName}</TableCell>
                                <TableCell>{bill.className} - {bill.section}</TableCell>

                                <TableCell align="right" sx={{ color: 'text.secondary' }}>{(bill.advanceUsed || 0).toLocaleString()}</TableCell>
                                <TableCell align="right" sx={{ color: 'error.main' }}>{(bill.previousDues || 0).toLocaleString()}</TableCell>

                                {/* Dynamic Fee Columns */}
                                {uniqueFeeTypes.map(type => {
                                    const item = bill.items?.find(i => i.feeType === type);
                                    return (
                                        <TableCell key={type} align="right">
                                            {item ? item.amount.toLocaleString() : '-'}
                                        </TableCell>
                                    );
                                })}
                                <TableCell align="right" sx={{ fontWeight: 600, bgcolor: 'success.light', color: 'success.dark' }}>
                                    {bill.amount.toLocaleString()}
                                </TableCell>
                            </TableRow>
                        ))}

                        {/* Totals Row */}
                        <TableRow sx={{ bgcolor: 'grey.200' }}>
                            <TableCell colSpan={4} align="right" sx={{ fontWeight: 700 }}>
                                Grand Totals:
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{totalAdvance.toLocaleString()}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{totalDues.toLocaleString()}</TableCell>

                            {uniqueFeeTypes.map(type => (
                                <TableCell key={type} align="right" sx={{ fontWeight: 700 }}>
                                    {columnTotals[type].toLocaleString()}
                                </TableCell>
                            ))}
                            <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                {grandTotal.toLocaleString()}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default DemandBillCreationList;

