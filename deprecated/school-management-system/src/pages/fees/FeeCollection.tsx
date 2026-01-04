import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { IndianRupee, Receipt } from 'lucide-react';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Stack,
  InputAdornment,
  FormHelperText,
  Divider,
  Avatar
} from '@mui/material';
import { feeService } from '../../lib/api';
import { db, addToSyncQueue } from '../../lib/db';

const feeSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required'),
  paymentMode: z.enum(['cash', 'cheque', 'online']),
  receiptNo: z.string().optional(),
});

type FeeFormData = z.infer<typeof feeSchema>;

export default function FeeCollection() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [duesInfo, setDuesInfo] = useState<any>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FeeFormData>({
    resolver: zodResolver(feeSchema),
    defaultValues: {
      paymentMode: 'cash',
      amount: undefined,
      description: '',
      receiptNo: '',
    },
  });

  const fetchDues = async (studentId: string) => {
    if (!studentId) return;
    try {
      const response = await feeService.getDues(studentId);
      setDuesInfo(response.data);
    } catch (err) {
      setDuesInfo(null);
    }
  };

  const onSubmit = async (data: FeeFormData) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const transactionData = {
        ...data,
        transactionId: `TXN${Date.now()}`,
        receiptNo: data.receiptNo || `REC${Date.now()}`,
        date: new Date().toISOString(),
        yearId: new Date().getFullYear(),
        synced: false,
        lastModified: new Date(),
      };

      if (navigator.onLine) {
        const response = await feeService.collectFee(transactionData);
        setSuccess(`Fee collected successfully! Receipt No: ${response.data.receiptNo}`);
      } else {
        await db.feeTransactions.add(transactionData);
        await addToSyncQueue('feeTransactions', 'create', transactionData.transactionId, transactionData);
        setSuccess('Fee collected (offline). Will sync when online.');
      }

      reset();
      setDuesInfo(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to collect fee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
        Fee Collection
      </Typography>

      <Grid container spacing={3}>
        {/* Fee Collection Form */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {success}
                </Alert>
              )}

              <Stack spacing={3}>
                {/* Student ID */}
                <Controller
                  name="studentId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Student ID"
                      fullWidth
                      required
                      onBlur={(e) => {
                        field.onBlur();
                        fetchDues(e.target.value);
                      }}
                      error={!!errors.studentId}
                      helperText={errors.studentId?.message}
                      placeholder="Enter student ID"
                    />
                  )}
                />

                {/* Amount */}
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Amount"
                      type="number"
                      fullWidth
                      required
                      InputProps={{
                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      }}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      error={!!errors.amount}
                      helperText={errors.amount?.message}
                      placeholder="0.00"
                    />
                  )}
                />

                {/* Description */}
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.description}>
                      <InputLabel>Description *</InputLabel>
                      <Select
                        {...field}
                        label="Description *"
                      >
                        <MenuItem value="">Select Fee Type</MenuItem>
                        <MenuItem value="Tuition Fee">Tuition Fee</MenuItem>
                        <MenuItem value="Computer Fine Arts">Computer Fine Arts</MenuItem>
                        <MenuItem value="Smart Class">Smart Class</MenuItem>
                        <MenuItem value="Generator">Generator</MenuItem>
                        <MenuItem value="Activity">Activity</MenuItem>
                        <MenuItem value="Conveyance">Conveyance</MenuItem>
                        <MenuItem value="Development">Development</MenuItem>
                        <MenuItem value="Laboratory">Laboratory</MenuItem>
                        <MenuItem value="Library">Library</MenuItem>
                        <MenuItem value="Hostel Fee">Hostel Fee</MenuItem>
                        <MenuItem value="Others">Others</MenuItem>
                      </Select>
                      {errors.description && (
                        <FormHelperText>{errors.description.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />

                {/* Payment Mode */}
                <Controller
                  name="paymentMode"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Payment Mode *</InputLabel>
                      <Select
                        {...field}
                        label="Payment Mode *"
                      >
                        <MenuItem value="cash">Cash</MenuItem>
                        <MenuItem value="cheque">Cheque</MenuItem>
                        <MenuItem value="online">Online Transfer</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />

                {/* Receipt Number */}
                <Controller
                  name="receiptNo"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Receipt Number (Optional)"
                      fullWidth
                      placeholder="Auto-generated if left blank"
                    />
                  )}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <IndianRupee size={20} />}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  {loading ? 'Processing...' : 'Collect Fee'}
                </Button>
              </Stack>
            </form>
          </Paper>
        </Grid>

        {/* Sidebar Info */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Dues Information */}
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Receipt size={20} />
                  Student Dues
                </Typography>

                <Divider sx={{ my: 2 }} />

                {duesInfo ? (
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Student Name</Typography>
                      <Typography variant="body1" fontWeight={500}>{duesInfo.name}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Class</Typography>
                      <Typography variant="body1" fontWeight={500}>{duesInfo.className}</Typography>
                    </Box>
                    <Box sx={{ pt: 2, borderTop: '1px solid #eee' }}>
                      <Typography variant="body2" color="text.secondary">Total Dues</Typography>
                      <Typography variant="h4" fontWeight={700} color="error.main">
                        ₹{duesInfo.totalDues?.toLocaleString() || 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Last Payment</Typography>
                      <Typography variant="body1" fontWeight={500}>{duesInfo.lastPayment || 'N/A'}</Typography>
                    </Box>
                  </Stack>
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                    Enter student ID to view dues
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card elevation={0} sx={{ borderRadius: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ opacity: 0.9 }}>
                  Today's Collection
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  ₹45,000
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                  23 transactions
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
