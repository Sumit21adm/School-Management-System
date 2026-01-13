import React, { useState, useMemo } from 'react';
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
    CircularProgress,
    TextField,
    InputAdornment,
    TableSortLabel,
} from '@mui/material';
import { Printer, Download, Search } from 'lucide-react';

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
    batchId: string;
    bills: BillData[];
    loading?: boolean;
}

type SortColumn = 'studentId' | 'studentName' | 'class' | 'totalDue' | null;
type SortDirection = 'asc' | 'desc';

const DemandBillCreationList: React.FC<CreationListProps> = ({ batchId, bills, loading }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortColumn, setSortColumn] = useState<SortColumn>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Calculate Total Due for each bill: Advance + Prev. Dues + Amount
    const billsWithTotalDue = useMemo(() => {
        return bills.map(bill => ({
            ...bill,
            totalDue: (bill.advanceUsed || 0) + (bill.previousDues || 0) + bill.amount
        }));
    }, [bills]);

    // Filter bills based on search query
    const filteredBills = useMemo(() => {
        if (!searchQuery.trim()) return billsWithTotalDue;
        const query = searchQuery.toLowerCase();
        return billsWithTotalDue.filter(bill =>
            bill.studentId.toLowerCase().includes(query) ||
            bill.studentName.toLowerCase().includes(query)
        );
    }, [billsWithTotalDue, searchQuery]);

    // Sort bills
    const sortedBills = useMemo(() => {
        if (!sortColumn) return filteredBills;

        return [...filteredBills].sort((a, b) => {
            let comparison = 0;

            switch (sortColumn) {
                case 'studentId':
                    comparison = a.studentId.localeCompare(b.studentId);
                    break;
                case 'studentName':
                    comparison = a.studentName.localeCompare(b.studentName);
                    break;
                case 'class':
                    const classA = `${a.className}-${a.section}`;
                    const classB = `${b.className}-${b.section}`;
                    comparison = classA.localeCompare(classB);
                    break;
                case 'totalDue':
                    comparison = a.totalDue - b.totalDue;
                    break;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [filteredBills, sortColumn, sortDirection]);

    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    // Unique fee types for dynamic columns
    const uniqueFeeTypes = useMemo(() => {
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

    // Calculate Column Totals (for filtered bills)
    const columnTotals = uniqueFeeTypes.reduce((acc, type) => {
        acc[type] = sortedBills.reduce((sum, bill) => {
            const item = bill.items?.find(i => i.feeType === type);
            return sum + (item ? item.amount : 0);
        }, 0);
        return acc;
    }, {} as Record<string, number>);

    const totalAdvance = sortedBills.reduce((sum, bill) => sum + (bill.advanceUsed || 0), 0);
    const totalPrevDues = sortedBills.reduce((sum, bill) => sum + (bill.previousDues || 0), 0);
    const grandTotal = sortedBills.reduce((sum, bill) => sum + bill.amount, 0);
    const grandTotalDue = sortedBills.reduce((sum, bill) => sum + bill.totalDue, 0);

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

            {/* Search Box */}
            <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                <TextField
                    size="small"
                    placeholder="Search by Student ID or Name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search size={18} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ width: 300 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                    Showing {sortedBills.length} of {bills.length} bills
                </Typography>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ flex: 1, borderRadius: 0 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.light', color: 'primary.contrastText' }}>Bill No</TableCell>
                            <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                                <TableSortLabel
                                    active={sortColumn === 'studentId'}
                                    direction={sortColumn === 'studentId' ? sortDirection : 'asc'}
                                    onClick={() => handleSort('studentId')}
                                    sx={{ color: 'inherit', '&:hover': { color: 'inherit' }, '&.Mui-active': { color: 'inherit' } }}
                                >
                                    Student ID
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                                <TableSortLabel
                                    active={sortColumn === 'studentName'}
                                    direction={sortColumn === 'studentName' ? sortDirection : 'asc'}
                                    onClick={() => handleSort('studentName')}
                                    sx={{ color: 'inherit', '&:hover': { color: 'inherit' }, '&.Mui-active': { color: 'inherit' } }}
                                >
                                    Student Name
                                </TableSortLabel>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                                <TableSortLabel
                                    active={sortColumn === 'class'}
                                    direction={sortColumn === 'class' ? sortDirection : 'asc'}
                                    onClick={() => handleSort('class')}
                                    sx={{ color: 'inherit', '&:hover': { color: 'inherit' }, '&.Mui-active': { color: 'inherit' } }}
                                >
                                    Class
                                </TableSortLabel>
                            </TableCell>

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
                            <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'info.light', color: 'info.dark' }}>
                                <TableSortLabel
                                    active={sortColumn === 'totalDue'}
                                    direction={sortColumn === 'totalDue' ? sortDirection : 'asc'}
                                    onClick={() => handleSort('totalDue')}
                                    sx={{ color: 'inherit', '&:hover': { color: 'inherit' }, '&.Mui-active': { color: 'inherit' } }}
                                >
                                    Total Due
                                </TableSortLabel>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedBills.map((bill) => (
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
                                <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'info.light', color: 'info.dark' }}>
                                    {bill.totalDue.toLocaleString()}
                                </TableCell>
                            </TableRow>
                        ))}

                        {/* Totals Row */}
                        <TableRow sx={{ bgcolor: 'grey.200' }}>
                            <TableCell colSpan={4} align="right" sx={{ fontWeight: 700 }}>
                                Grand Totals:
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{totalAdvance.toLocaleString()}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{totalPrevDues.toLocaleString()}</TableCell>

                            {uniqueFeeTypes.map(type => (
                                <TableCell key={type} align="right" sx={{ fontWeight: 700 }}>
                                    {columnTotals[type].toLocaleString()}
                                </TableCell>
                            ))}
                            <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                {grandTotal.toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: 'info.main' }}>
                                {grandTotalDue.toLocaleString()}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default DemandBillCreationList;
