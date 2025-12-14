import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '../../contexts/SessionContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  Calendar,
  AlertCircle,
  FileText,
  Download,
} from 'lucide-react';
import axios from 'axios';
import { admissionService } from '../../lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Student {
  id: number;
  studentId: string;
  name: string;
  className: string;
  section: string;
  fatherName?: string;
  motherName?: string;
}

export default function FeeDashboard() {
  const { selectedSession } = useSession();
  const [studentId, setStudentId] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [showFeeBook, setShowFeeBook] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['fee-dashboard', studentId, selectedSession?.id],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/fees/dashboard/${studentId}/session/${selectedSession?.id}`
      );
      return response.data;
    },
    enabled: searchTriggered && !!studentId && !!selectedSession,
  });

  const { data: feeBook } = useQuery({
    queryKey: ['fee-book', studentId, selectedSession?.id],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/fees/fee-book/${studentId}/session/${selectedSession?.id}`
      );
      return response.data;
    },
    enabled: showFeeBook && !!studentId && !!selectedSession,
  });

  // Fetch students for search (minimum 3 characters)
  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ['students-search', studentSearchTerm],
    queryFn: async () => {
      if (!studentSearchTerm || studentSearchTerm.length < 3) return { students: [] };
      const response = await admissionService.getStudents({
        search: studentSearchTerm,
        limit: 20,
      });
      return response.data;
    },
    enabled: studentSearchTerm.length >= 3,
    staleTime: 30000, // 30 seconds
  });

  const studentOptions: Student[] = studentsData?.data || [];

  // Show/hide search results
  useEffect(() => {
    // Don't show results if the search term matches the currently selected student ID
    if (studentSearchTerm.length >= 3 && studentSearchTerm !== studentId) {
      setShowSearchResults(true);
    } else {
      setShowSearchResults(false);
    }
  }, [studentSearchTerm, studentOptions, loadingStudents, studentId]);

  const handleSearch = () => {
    if (studentId) {
      setSearchTriggered(true);
      setShowSearchResults(false);
      // setStudentSearchTerm(''); // Keep the search term visible
    }
  };

  const handleSelectStudent = (student: Student) => {
    setStudentId(student.studentId);
    setSearchTriggered(true);
    setStudentSearchTerm(student.studentId); // Autofill ID
    setShowSearchResults(false); // Hide search results
  };

  const getStatusColor = (balance: number) => {
    if (balance === 0) return 'success';
    if (balance < 0) return 'info';
    return 'error';
  };

  const getStatusLabel = (balance: number) => {
    if (balance === 0) return 'Paid';
    if (balance < 0) return 'Advance';
    return 'Pending';
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
        Student Fee Dashboard
      </Typography>

      {/* Search Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              label="Search Student"
              fullWidth
              value={studentSearchTerm}
              onChange={(e) => setStudentSearchTerm(e.target.value)}
              placeholder="Enter student name or ID (min 3 characters)"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                endAdornment: loadingStudents && studentSearchTerm.length >= 3 ? (
                  <CircularProgress size={20} />
                ) : null,
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Academic Session"
              fullWidth
              value={selectedSession?.name || 'No session selected'}
              InputProps={{ readOnly: true }}
            />
          </Grid>
        </Grid>

        {/* Search Results Table - Displayed below the search section */}
        {showSearchResults && (
          <Box sx={{ mt: 2 }}>
            <Paper
              elevation={3}
              sx={{
                maxHeight: 400,
                overflow: 'auto',
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Student ID</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Class</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Father Name</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Mother Name</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {studentOptions.map((student) => (
                    <TableRow
                      key={student.id}
                      hover
                      onClick={() => handleSelectStudent(student)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{student.name}</TableCell>
                      <TableCell>
                        {student.className}-{student.section}
                      </TableCell>
                      <TableCell>{student.fatherName || '-'}</TableCell>
                      <TableCell>{student.motherName || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {studentOptions.length === 0 && !loadingStudents && (
                <Box p={2} textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    No students found
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error instanceof Error ? error.message : 'Failed to load dashboard'}
        </Alert>
      )}

      {isLoading && <LinearProgress sx={{ mb: 3 }} />}

      {dashboard && (
        <>
          {/* Student Info Card */}
          <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    {dashboard.student.name}
                  </Typography>
                  <Typography color="text.secondary">
                    ID: {dashboard.student.studentId} | Class: {dashboard.student.className}-
                    {dashboard.student.section}
                  </Typography>
                  <Typography color="text.secondary">
                    Father: {dashboard.student.fatherName}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      startIcon={<FileText size={18} />}
                      onClick={() => setShowFeeBook(true)}
                    >
                      View Fee Book
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<Download size={18} />}
                    >
                      Download Statement
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <Grid container spacing={3} mb={4} sx={{ width: '100%' }}>
            <Grid item xs={12} sm={6} md>
              <Card elevation={2} sx={{ borderRadius: 3, bgcolor: 'primary.main', color: 'white', minHeight: 140, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                    Total Fee
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    ₹{dashboard.summary.totalGross.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md>
              <Card elevation={2} sx={{ borderRadius: 3, bgcolor: 'success.main', color: 'white', minHeight: 140, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                    Total Paid
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    ₹{dashboard.summary.totalPaid.toLocaleString()}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                    <TrendingUp size={16} />
                    <Typography variant="caption">
                      {((dashboard.summary.totalPaid / dashboard.summary.totalNet) * 100).toFixed(1)}%
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md>
              <Card elevation={2} sx={{ borderRadius: 3, bgcolor: 'warning.main', color: 'white', minHeight: 140, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                    Discount
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    ₹{dashboard.summary.totalDiscount.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md>
              <Card
                elevation={2}
                sx={{
                  borderRadius: 3,
                  bgcolor: dashboard.summary.totalDues > 0 ? 'error.main' : 'info.main',
                  color: 'white',
                  minHeight: 140,
                  height: '100%'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                    {dashboard.summary.totalDues > 0 ? 'Pending Dues' : 'Advance'}
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    ₹{Math.abs(dashboard.summary.totalDues).toLocaleString()}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                    {dashboard.summary.totalDues > 0 ? (
                      <>
                        <AlertCircle size={16} />
                        <Typography variant="caption">Payment Required</Typography>
                      </>
                    ) : (
                      <>
                        <TrendingDown size={16} />
                        <Typography variant="caption">No Dues</Typography>
                      </>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Fee Heads Breakdown */}
          <Card elevation={2} sx={{ mb: 4, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Fee Head Breakdown
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Fee Type</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Gross Amount
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Discount
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Net Amount
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Paid
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Balance
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        Status
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboard.feeHeads.map((head: any) => (
                      <TableRow key={head.feeTypeId} hover>
                        <TableCell>{head.feeType}</TableCell>
                        <TableCell align="right">₹{head.grossAmount.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main' }}>
                          {head.discount > 0 ? `-₹${head.discount.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          ₹{head.netAmount.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'primary.main' }}>
                          ₹{head.paid.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          ₹{Math.abs(head.balance).toLocaleString()}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={getStatusLabel(head.balance)}
                            color={getStatusColor(head.balance)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Progress Bar */}
              <Box sx={{ mt: 3 }}>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Progress
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {((dashboard.summary.totalPaid / dashboard.summary.totalNet) * 100).toFixed(1)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={(dashboard.summary.totalPaid / dashboard.summary.totalNet) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>
                  Recent Transactions
                </Typography>
                <Chip
                  icon={<Receipt size={16} />}
                  label={`${dashboard.recentTransactions.length} Transactions`}
                  size="small"
                />
              </Stack>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Receipt No</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Mode</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Amount
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboard.recentTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      dashboard.recentTransactions.map((txn: any, index: number) => (
                        <TableRow key={index} hover>
                          <TableCell sx={{ fontWeight: 500 }}>{txn.receiptNo}</TableCell>
                          <TableCell>{new Date(txn.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Stack spacing={0.5}>
                              {txn.details.map((detail: any, idx: number) => (
                                <Typography key={idx} variant="body2" color="text.secondary">
                                  {detail.feeType}: ₹{detail.amount.toLocaleString()}
                                </Typography>
                              ))}
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ textTransform: 'capitalize' }}>{txn.paymentMode}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>
                            ₹{txn.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Pending Bills */}
          {dashboard.pendingBills && dashboard.pendingBills.length > 0 && (
            <Card elevation={2} sx={{ mt: 3, borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Pending Bills
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Bill No</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Month/Year</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          Amount
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          Paid
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          Balance
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                          Status
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboard.pendingBills.map((bill: any) => (
                        <TableRow key={bill.billNo} hover>
                          <TableCell>{bill.billNo}</TableCell>
                          <TableCell>
                            {bill.month}/{bill.year}
                          </TableCell>
                          <TableCell>{new Date(bill.dueDate).toLocaleDateString()}</TableCell>
                          <TableCell align="right">₹{bill.amount.toLocaleString()}</TableCell>
                          <TableCell align="right" sx={{ color: 'success.main' }}>
                            ₹{bill.paid.toLocaleString()}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            ₹{bill.balance.toLocaleString()}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={bill.status}
                              color={
                                bill.status === 'PAID' ? 'success' :
                                  bill.status === 'PARTIALLY_PAID' ? 'warning' :
                                    bill.status === 'PENDING' ? 'warning' : 'error'
                              }
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Fee Book Dialog */}
      <Dialog open={showFeeBook} onClose={() => setShowFeeBook(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              Yearly Fee Book
            </Typography>
            <Button startIcon={<Download size={18} />} variant="outlined" size="small">
              Download PDF
            </Button>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {feeBook && (
            <Box>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Student
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {feeBook.student.name} ({feeBook.student.studentId})
                  </Typography>
                  <Typography variant="body2">
                    Class: {feeBook.student.className}-{feeBook.student.section}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Session
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {feeBook.session}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" fontWeight={600} gutterBottom>
                Fee Structure
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fee Type</TableCell>
                      <TableCell align="right">Gross</TableCell>
                      <TableCell align="right">Discount</TableCell>
                      <TableCell align="right">Net</TableCell>
                      <TableCell align="right">Paid</TableCell>
                      <TableCell align="right">Balance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {feeBook.feeStructure.map((item: any) => (
                      <TableRow key={item.feeTypeId}>
                        <TableCell>{item.feeType}</TableCell>
                        <TableCell align="right">₹{item.grossAmount.toLocaleString()}</TableCell>
                        <TableCell align="right">₹{item.discount.toLocaleString()}</TableCell>
                        <TableCell align="right">₹{item.netAmount.toLocaleString()}</TableCell>
                        <TableCell align="right">₹{item.paid.toLocaleString()}</TableCell>
                        <TableCell align="right">₹{item.balance.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="h6" fontWeight={600} gutterBottom>
                Monthly Payment Details
              </Typography>
              <Grid container spacing={2}>
                {feeBook.monthlyPayments.map((month: any) => (
                  <Grid item xs={12} sm={6} md={4} key={month.month}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          {new Date(2024, month.month - 1).toLocaleDateString('en', { month: 'long' })}
                        </Typography>
                        <Typography variant="h6" color="success.main" fontWeight={600}>
                          ₹{month.totalPaid.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {month.transactions.length} transaction(s)
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Opening Balance
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    ₹{feeBook.openingBalance.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  <Typography variant="body2" color="text.secondary">
                    Closing Balance
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    color={feeBook.closingBalance > 0 ? 'error.main' : 'success.main'}
                  >
                    ₹{Math.abs(feeBook.closingBalance).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFeeBook(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
