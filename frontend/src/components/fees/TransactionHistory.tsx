import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Chip,
    Typography,
    Box,
    IconButton
} from '@mui/material';
import {
    Download as DownloadIcon,
    Receipt as ReceiptIcon
} from '@mui/icons-material';
import { feeService } from '../../lib/api';

interface Transaction {
    receiptNo: string;
    date: string;
    amount: number;
    paymentMode?: string;
    paymentModes?: Array<{ mode: string; amount: number; reference?: string }>;
}

interface TransactionHistoryProps {
    transactions: Transaction[];
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {

    const handleDownloadReceipt = (receiptNo: string) => {
        feeService.openReceiptPdf(receiptNo);
    };

    if (transactions.length === 0) {
        return (
            <Box p={3} textAlign="center" bgcolor="grey.50" borderRadius={1}>
                <Typography variant="body1" color="text.secondary">No transaction history found.</Typography>
            </Box>
        );
    }

    return (
        <TableContainer component={Paper} variant="outlined">
            <Table>
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Receipt No</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Mode</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {transactions.map((txn) => (
                        <TableRow key={txn.receiptNo} hover>
                            <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                {txn.receiptNo}
                            </TableCell>
                            <TableCell>
                                {new Date(txn.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>
                                ₹{txn.amount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                                {txn.paymentModes && txn.paymentModes.length > 0 ? (
                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                        {txn.paymentModes.map((pm, idx) => (
                                            <Chip
                                                key={idx}
                                                label={`${pm.mode.toUpperCase()} ₹${pm.amount}`}
                                                size="small"
                                                variant="outlined"
                                                color={pm.mode === 'cash' ? 'success' : 'primary'}
                                            />
                                        ))}
                                    </Box>
                                ) : (
                                    <Chip
                                        label={txn.paymentMode?.toUpperCase() || 'UNKNOWN'}
                                        size="small"
                                        variant="outlined"
                                    />
                                )}
                            </TableCell>
                            <TableCell>
                                <Button
                                    size="small"
                                    startIcon={<DownloadIcon />}
                                    variant="outlined"
                                    onClick={() => handleDownloadReceipt(txn.receiptNo)}
                                >
                                    Receipt
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default TransactionHistory;
