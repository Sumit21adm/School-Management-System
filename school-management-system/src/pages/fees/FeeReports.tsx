import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText } from 'lucide-react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Card,
  CardContent,
  IconButton,
  Stack,
  Skeleton
} from '@mui/material';
import { feeService } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function FeeReports() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['fee-transactions', dateFrom, dateTo],
    queryFn: async () => {
      const response = await feeService.getTransactions({ dateFrom, dateTo });
      return response.data;
    },
    enabled: !!dateFrom && !!dateTo,
  });

  const totalCollection = transactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          Fee Reports
        </Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<Download size={18} />}
        >
          Export Excel
        </Button>
      </Stack>

      {/* Filters */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={3} alignItems="flex-end">
          <Grid item xs={12} md={4}>
            <TextField
              label="From Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="To Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      {dateFrom && dateTo && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={4}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Collection
                </Typography>
                <Typography variant="h4" fontWeight={700} color="success.main">
                  {formatCurrency(totalCollection)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Transactions
                </Typography>
                <Typography variant="h4" fontWeight={700} color="primary.main">
                  {transactions.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Average per Transaction
                </Typography>
                <Typography variant="h4" fontWeight={700} color="secondary.main">
                  {transactions.length > 0 ? formatCurrency(totalCollection / transactions.length) : '₹0'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Transactions Table */}
      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Receipt No</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Student ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Payment Mode</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              // Loading Skeletons
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(7)].map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No transactions found for selected date range
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction: any) => (
                <TableRow key={transaction.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{transaction.receiptNo}</TableCell>
                  <TableCell color="text.secondary">{formatDate(transaction.date)}</TableCell>
                  <TableCell>{transaction.studentId}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{transaction.paymentMode}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" size="small">
                      <FileText size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
