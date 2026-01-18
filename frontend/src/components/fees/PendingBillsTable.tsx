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
    Collapse,
    IconButton
} from '@mui/material';
import {
    Payment as PaymentIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    KeyboardArrowUp as KeyboardArrowUpIcon
} from '@mui/icons-material';

interface BillItem {
    feeType: string;
    amount: number;
    discount: number;
}

interface Bill {
    billNo: string;
    month: number;
    year: number;
    amount: number;
    paid: number;
    balance: number;
    status: string;
    dueDate: string;
    items: BillItem[];
}

interface PendingBillsTableProps {
    bills: Bill[];
    onPay: (bill: Bill) => void;
}

const Row = (props: { bill: Bill, onPay: (bill: Bill) => void }) => {
    const { bill, onPay } = props;
    const [open, setOpen] = React.useState(false);

    const isOverdue = new Date(bill.dueDate) < new Date() && bill.balance > 0;
    const monthName = new Date(bill.year, bill.month - 1).toLocaleString('default', { month: 'long' });

    return (
        <React.Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                    {bill.billNo}
                </TableCell>
                <TableCell>{monthName} {bill.year}</TableCell>
                <TableCell>₹{bill.amount.toLocaleString()}</TableCell>
                <TableCell>₹{bill.paid.toLocaleString()}</TableCell>
                <TableCell sx={{ color: 'error.main', fontWeight: 'bold' }}>
                    ₹{bill.balance.toLocaleString()}
                </TableCell>
                <TableCell>
                    <Chip
                        label={bill.status}
                        color={bill.status === 'PAID' ? 'success' : isOverdue ? 'error' : 'warning'}
                        size="small"
                        variant="outlined"
                    />
                    {isOverdue && <Typography variant="caption" color="error" display="block">Overdue</Typography>}
                </TableCell>
                <TableCell>
                    {bill.balance > 0 && (
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<PaymentIcon />}
                            onClick={() => onPay(bill)}
                        >
                            Pay
                        </Button>
                    )}
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="subtitle2" gutterBottom component="div">
                                Bill Details
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Fee Head</TableCell>
                                        <TableCell align="right">Amount</TableCell>
                                        <TableCell align="right">Discount</TableCell>
                                        <TableCell align="right">Net Amount</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {bill.items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell component="th" scope="row">
                                                {item.feeType}
                                            </TableCell>
                                            <TableCell align="right">{item.amount}</TableCell>
                                            <TableCell align="right" sx={{ color: 'success.main' }}>
                                                {item.discount > 0 ? `- ${item.discount}` : '-'}
                                            </TableCell>
                                            <TableCell align="right">
                                                {item.amount - item.discount}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
}

const PendingBillsTable: React.FC<PendingBillsTableProps> = ({ bills, onPay }) => {
    if (bills.length === 0) {
        return (
            <Box p={3} textAlign="center" bgcolor="background.default" borderRadius={1}>
                <Typography variant="body1" color="text.secondary">No pending bills found.</Typography>
            </Box>
        );
    }

    return (
        <TableContainer component={Paper} variant="outlined">
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell />
                        <TableCell sx={{ fontWeight: 'bold' }}>Bill No</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Period</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Paid</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Balance</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {bills.map((bill) => (
                        <Row key={bill.billNo} bill={bill} onPay={onPay} />
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default PendingBillsTable;
