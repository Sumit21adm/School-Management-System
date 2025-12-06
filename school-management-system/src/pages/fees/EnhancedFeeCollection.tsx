import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
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
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import { Plus, Trash2, IndianRupee, Receipt, Search } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const feeDetailSchema = z.object({
  feeTypeId: z.number().min(1, 'Select fee type'),
  amount: z.number().min(0, 'Amount must be positive'),
  discountAmount: z.number().min(0).optional(),
});

const feeCollectionSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  sessionId: z.number().min(1),
  feeDetails: z.array(feeDetailSchema).min(1, 'Add at least one fee item'),
  paymentMode: z.enum(['cash', 'cheque', 'online', 'card', 'upi']),
  receiptNo: z.string().optional(),
  remarks: z.string().optional(),
  collectedBy: z.string().optional(),
  date: z.string().optional(),
});

type FeeCollectionFormData = z.infer<typeof feeCollectionSchema>;

export default function EnhancedFeeCollection() {
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FeeCollectionFormData>({
    resolver: zodResolver(feeCollectionSchema),
    defaultValues: {
      studentId: '',
      sessionId: 1,
      feeDetails: [{ feeTypeId: 0, amount: 0, discountAmount: 0 }],
      paymentMode: 'cash',
      receiptNo: '',
      remarks: '',
      collectedBy: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'feeDetails',
  });

  const studentId = watch('studentId');
  const sessionId = watch('sessionId');
  const feeDetails = watch('feeDetails');

  // Fetch fee types
  const { data: feeTypes } = useQuery({
    queryKey: ['fee-types'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/fee-types`);
      return response.data.feeTypes;
    },
  });

  // Fetch student dashboard for fee structure
  const { data: dashboard, isLoading: loadingStudent } = useQuery({
    queryKey: ['student-dashboard', studentId, sessionId],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/fees/dashboard/${studentId}/session/${sessionId}`
      );
      return response.data;
    },
    enabled: !!studentId && studentId.length > 0,
  });

  useEffect(() => {
    if (dashboard) {
      setStudentInfo(dashboard.student);
    }
  }, [dashboard]);

  // Collect fee mutation
  const collectFeeMutation = useMutation({
    mutationFn: async (data: FeeCollectionFormData) => {
      const response = await axios.post(`${API_URL}/fees/collect`, data);
      return response.data;
    },
    onSuccess: (data) => {
      setSuccess(`Fee collected successfully! Receipt No: ${data.receiptNo}`);
      setError('');
      reset();
      setStudentInfo(null);
      // Print receipt logic can be added here
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to collect fee');
      setSuccess('');
    },
  });

  const onSubmit = (data: FeeCollectionFormData) => {
    collectFeeMutation.mutate(data);
  };

  const totalAmount = feeDetails.reduce((sum, detail) => {
    const netAmount = (detail.amount || 0) - (detail.discountAmount || 0);
    return sum + netAmount;
  }, 0);

  const fillFeeStructure = () => {
    if (dashboard?.feeHeads) {
      const unpaidFees = dashboard.feeHeads.filter((head: any) => head.balance > 0);
      setValue(
        'feeDetails',
        unpaidFees.map((head: any) => ({
          feeTypeId: head.feeTypeId,
          amount: head.balance,
          discountAmount: 0,
        }))
      );
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
        Fee Collection
      </Typography>

      <Grid container spacing={3}>
        {/* Main Collection Form */}
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
                {/* Student Selection */}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Controller
                      name="studentId"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Student ID"
                          fullWidth
                          required
                          error={!!errors.studentId}
                          helperText={errors.studentId?.message}
                          placeholder="Enter student ID"
                          InputProps={{
                            endAdornment: loadingStudent && (
                              <InputAdornment position="end">
                                <CircularProgress size={20} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="sessionId"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Session ID"
                          type="number"
                          fullWidth
                          required
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                {studentInfo && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {studentInfo.name}
                    </Typography>
                    <Typography variant="body2">
                      Class: {studentInfo.className}-{studentInfo.section} | Father: {studentInfo.fatherName}
                    </Typography>
                    {dashboard && (
                      <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        Outstanding Dues: ₹{dashboard.summary.totalDues.toLocaleString()}
                      </Typography>
                    )}
                    <Button
                      size="small"
                      onClick={fillFeeStructure}
                      sx={{ mt: 1 }}
                      disabled={!dashboard?.feeHeads}
                    >
                      Auto-Fill Outstanding Dues
                    </Button>
                  </Alert>
                )}

                <Divider />

                {/* Fee Details Section */}
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight={600}>
                      Fee Details
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Plus size={18} />}
                      onClick={() => append({ feeTypeId: 0, amount: 0, discountAmount: 0 })}
                    >
                      Add Fee Item
                    </Button>
                  </Stack>

                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Fee Type</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Discount</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            Net Amount
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>
                            Action
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {fields.map((field, index) => {
                          const amount = watch(`feeDetails.${index}.amount`) || 0;
                          const discount = watch(`feeDetails.${index}.discountAmount`) || 0;
                          const netAmount = amount - discount;

                          return (
                            <TableRow key={field.id}>
                              <TableCell>
                                <Controller
                                  name={`feeDetails.${index}.feeTypeId`}
                                  control={control}
                                  render={({ field }) => (
                                    <FormControl fullWidth size="small" error={!!errors.feeDetails?.[index]?.feeTypeId}>
                                      <Select {...field} displayEmpty>
                                        <MenuItem value={0}>Select Fee Type</MenuItem>
                                        {feeTypes?.map((type: any) => (
                                          <MenuItem key={type.id} value={type.id}>
                                            {type.name}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Controller
                                  name={`feeDetails.${index}.amount`}
                                  control={control}
                                  render={({ field }) => (
                                    <TextField
                                      {...field}
                                      type="number"
                                      size="small"
                                      fullWidth
                                      InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                      }}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      error={!!errors.feeDetails?.[index]?.amount}
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <Controller
                                  name={`feeDetails.${index}.discountAmount`}
                                  control={control}
                                  render={({ field }) => (
                                    <TextField
                                      {...field}
                                      type="number"
                                      size="small"
                                      fullWidth
                                      InputProps={{
                                        startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                      }}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography fontWeight={600}>₹{netAmount.toLocaleString()}</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => remove(index)}
                                  disabled={fields.length === 1}
                                >
                                  <Trash2 size={18} />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            <Typography variant="h6" fontWeight={700}>
                              Total:
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="h6" fontWeight={700} color="primary">
                              ₹{totalAmount.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                <Divider />

                {/* Payment Details */}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="paymentMode"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Payment Mode *</InputLabel>
                          <Select {...field} label="Payment Mode *">
                            <MenuItem value="cash">Cash</MenuItem>
                            <MenuItem value="cheque">Cheque</MenuItem>
                            <MenuItem value="online">Online Transfer</MenuItem>
                            <MenuItem value="card">Card</MenuItem>
                            <MenuItem value="upi">UPI</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="date"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Payment Date"
                          type="date"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
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
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="collectedBy"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} label="Collected By" fullWidth placeholder="Staff name" />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Controller
                      name="remarks"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Remarks"
                          fullWidth
                          multiline
                          rows={2}
                          placeholder="Any additional notes..."
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={collectFeeMutation.isPending}
                  startIcon={
                    collectFeeMutation.isPending ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <IndianRupee size={20} />
                    )
                  }
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  {collectFeeMutation.isPending ? 'Processing...' : `Collect ₹${totalAmount.toLocaleString()}`}
                </Button>
              </Stack>
            </form>
          </Paper>
        </Grid>

        {/* Sidebar - Student Fee Status */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {dashboard && (
              <>
                <Card elevation={2} sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Fee Summary
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Total Fee
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                          ₹{dashboard.summary.totalNet.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Total Paid
                        </Typography>
                        <Typography variant="h6" fontWeight={600} color="success.main">
                          ₹{dashboard.summary.totalPaid.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ pt: 2, borderTop: '1px solid #eee' }}>
                        <Typography variant="body2" color="text.secondary">
                          Outstanding Dues
                        </Typography>
                        <Typography variant="h4" fontWeight={700} color="error.main">
                          ₹{dashboard.summary.totalDues.toLocaleString()}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                <Card elevation={2} sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Fee Head Status
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Stack spacing={2}>
                      {dashboard.feeHeads.map((head: any) => (
                        <Box key={head.feeTypeId}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">{head.feeType}</Typography>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color={head.balance > 0 ? 'error.main' : 'success.main'}
                            >
                              {head.balance > 0 ? `₹${head.balance.toLocaleString()}` : 'Paid'}
                            </Typography>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </>
            )}

            <Card elevation={0} sx={{ borderRadius: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ opacity: 0.9 }}>
                  Quick Tips
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  • Use "Auto-Fill" to populate outstanding dues
                  <br />
                  • You can collect multiple fee types in one receipt
                  <br />
                  • Discounts are applied per fee type
                  <br />• Receipt will be auto-generated and can be printed
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
