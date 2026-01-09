import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Autocomplete,
  Card,
  CardContent,
  Tabs,
  Tab,
  CircularProgress,
  Avatar,
  Divider,
  Chip,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon,
  AccountBalance as AccountBalanceIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import { admissionService, feeService, sessionService } from '../../lib/api';
import PendingBillsTable from '../../components/fees/PendingBillsTable';
import TransactionHistory from '../../components/fees/TransactionHistory';
import CollectFeeDialog from '../../components/fees/CollectFeeDialog';

// Debounce helper
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

const FeeCollection = () => {
  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Session State
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  // Dialog State
  const [collectDialogOpen, setCollectDialogOpen] = useState(false);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<any | null>(null);

  // Init: Load Active Session
  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await sessionService.getActive();
        if (session) setCurrentSessionId(session.id);
      } catch (error) {
        console.error('Failed to load active session', error);
      }
    };
    loadSession();
  }, []);

  // Search Effect
  useEffect(() => {
    if (!debouncedSearch) {
      setSearchResults([]);
      return;
    }

    const handleSearch = async () => {
      setLoadingSearch(true);
      try {
        // Using admissionService.getStudents to search
        const response = await admissionService.getStudents({ search: debouncedSearch, limit: 10 });
        setSearchResults(response.data.data || []);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setLoadingSearch(false);
      }
    };

    handleSearch();
  }, [debouncedSearch]);

  // Load Dashboard when student is selected
  useEffect(() => {
    if (selectedStudent && currentSessionId) {
      loadDashboard();
    } else {
      setDashboardData(null);
    }
  }, [selectedStudent, currentSessionId]);

  const loadDashboard = async () => {
    if (!selectedStudent || !currentSessionId) return;
    setLoadingDashboard(true);
    try {
      const data = await feeService.getStudentDashboard(selectedStudent.studentId, currentSessionId);
      setDashboardData(data);
    } catch (error) {
      console.error("Failed to load dashboard", error);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handleOpenCollectDialog = (bill: any = null) => {
    setSelectedBillForPayment(bill);
    setCollectDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    loadDashboard(); // Refresh data
    setCollectDialogOpen(false);
    setSelectedBillForPayment(null);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Fee Collection
      </Typography>

      {/* Search Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Autocomplete
              freeSolo
              options={searchResults}
              getOptionLabel={(option: any) => `${option.name} (${option.studentId}) - Class ${option.className}`}
              loading={loadingSearch}
              onInputChange={(event, newInputValue) => {
                setSearchTerm(newInputValue);
              }}
              onChange={(event, newValue: any) => {
                setSelectedStudent(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Student by Name or Admission No..."
                  variant="outlined"
                  fullWidth
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <SearchIcon color="action" sx={{ mr: 1 }} />
                        {params.InputProps.startAdornment}
                      </>
                    ),
                    endAdornment: (
                      <>
                        {loadingSearch ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option: any) => (
                <Box component="li" {...props}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar src={option.photoUrl} alt={option.name}>
                      {option.name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        {option.name} <span style={{ opacity: 0.6 }}>({option.studentId})</span>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Class: {option.className}-{option.section} | Father: {option.fatherName}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            {selectedStudent && (
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<AttachMoneyIcon />}
                onClick={() => handleOpenCollectDialog(null)} // General payment
              >
                Collect Adhoc Payment
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      {selectedStudent && dashboardData && (
        <>
          {/* Student Profile & Summary */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar
                      src={selectedStudent.photoUrl}
                      sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}
                    >
                      {selectedStudent.name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">{selectedStudent.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Adm No: {selectedStudent.studentId}
                      </Typography>
                      <Chip label={selectedStudent.status} color="success" size="small" variant="outlined" sx={{ mt: 0.5 }} />
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Class</Typography>
                      <Typography variant="body2" fontWeight="bold">{selectedStudent.className} - {selectedStudent.section}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Roll No</Typography>
                      <Typography variant="body2" fontWeight="bold">{selectedStudent.rollNumber || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Father's Name</Typography>
                      <Typography variant="body2">{selectedStudent.fatherName}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, bgcolor: '#fff3e0', borderLeft: '4px solid #ff9800', height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary">Total Pending Dues</Typography>
                    <Typography variant="h4" fontWeight="bold" color="#e65100">
                      ₹{dashboardData.summary.totalDues.toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, bgcolor: '#e8f5e9', borderLeft: '4px solid #4caf50', height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary">Total Paid (This Session)</Typography>
                    <Typography variant="h4" fontWeight="bold" color="#1b5e20">
                      ₹{dashboardData.summary.totalPaid.toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, bgcolor: '#e3f2fd', borderLeft: '4px solid #2196f3', height: '100%' }}>
                    <Typography variant="subtitle2" color="text.secondary">Total Demanded</Typography>
                    <Typography variant="h4" fontWeight="bold" color="#0d47a1">
                      ₹{dashboardData.summary.totalGross.toLocaleString()}
                    </Typography>
                    {dashboardData.summary.totalDiscount > 0 && (
                      <Typography variant="caption" color="error">
                        (-₹{dashboardData.summary.totalDiscount.toLocaleString()} Disc.)
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {/* Tabs Section */}
          <Paper sx={{ mb: 3 }}>
            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Pending Bills" icon={<ReceiptIcon />} iconPosition="start" />
              <Tab label="Transaction History" icon={<HistoryIcon />} iconPosition="start" />
              <Tab label="Fee Structure Status" icon={<AccountBalanceIcon />} iconPosition="start" />
            </Tabs>

            <Box p={3}>
              {activeTab === 0 && (
                <PendingBillsTable
                  bills={dashboardData.pendingBills || []}
                  onPay={(bill) => handleOpenCollectDialog(bill)}
                />
              )}

              {activeTab === 1 && (
                <TransactionHistory transactions={dashboardData.recentTransactions || []} />
              )}

              {activeTab === 2 && (
                <Alert severity="info" variant="outlined">
                  Detailed Fee Head Breakdown coming soon.
                </Alert>
              )}
            </Box>
          </Paper>
        </>
      )}

      {/* Collect Fee Dialog */}
      {selectedStudent && currentSessionId && (
        <CollectFeeDialog
          open={collectDialogOpen}
          onClose={() => setCollectDialogOpen(false)}
          student={selectedStudent}
          sessionId={currentSessionId}
          bill={selectedBillForPayment}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </Box>
  );
};

export default FeeCollection;
