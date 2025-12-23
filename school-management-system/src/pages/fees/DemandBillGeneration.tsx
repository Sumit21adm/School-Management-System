import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
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
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Chip,
  Checkbox,
  FormGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { FileText, Download, Send, Printer } from 'lucide-react';
import axios from 'axios';
import { feeService, classService } from '../../lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const demandBillSchema = z.object({
  generationType: z.enum(['single', 'class', 'all']),
  studentId: z.string().optional(),
  className: z.string().optional(),
  section: z.string().optional(),
  sessionId: z.number().min(1),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  dueDate: z.string(),
});

type DemandBillFormData = z.infer<typeof demandBillSchema>;

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

export default function DemandBillGeneration() {
  const { selectedSession } = useSession();
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [selectedFeeTypes, setSelectedFeeTypes] = useState<number[]>([]);
  const [autoCalculateLateFees, setAutoCalculateLateFees] = useState(true);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<DemandBillFormData>({
    resolver: zodResolver(demandBillSchema),
    defaultValues: {
      generationType: 'single',
      studentId: '',
      className: '',
      section: '',
      sessionId: selectedSession?.id || 1,
      month: currentMonth,
      year: currentYear,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const generationType = watch('generationType');

  const location = useLocation();

  // Fetch fee types - include location in key to force refetch on navigation
  const { data: feeTypesData } = useQuery({
    queryKey: ['fee-types', location.pathname],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/fee-types`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true, // Always refetch when component mounts
  });

  const feeTypes = feeTypesData?.feeTypes || [];

  const queryClient = useQueryClient();

  // Fetch bill generation history
  const { data: billHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['bill-generation-history', selectedSession?.id],
    queryFn: async () => {
      if (!selectedSession?.id) return [];
      const response = await axios.get(`${API_URL}/fees/demand-bills/history/${selectedSession.id}`);
      return response.data;
    },
    enabled: !!selectedSession?.id,
  });

  // Use ref to track if we've initialized Tuition Fee selection
  const hasInitializedRef = useRef(false);

  // Reset initialization flag when component unmounts
  useEffect(() => {
    return () => {
      hasInitializedRef.current = false;
    };
  }, []);

  // Pre-select Tuition Fee when fee types load
  useEffect(() => {
    if (feeTypes.length > 0 && !hasInitializedRef.current) {
      const tuitionFee = feeTypes.find((ft: any) => ft.name === 'Tuition Fee');
      if (tuitionFee) {
        setSelectedFeeTypes([tuitionFee.id]);
        hasInitializedRef.current = true;
      }
    }
  }, [feeTypes]);

  const generateBillsMutation = useMutation({
    mutationFn: async (data: DemandBillFormData) => {
      const payload: any = {
        sessionId: data.sessionId,
        month: data.month,
        year: data.year,
        dueDate: data.dueDate,
        selectedFeeTypeIds: selectedFeeTypes,
        autoCalculateLateFees,
      };

      if (data.generationType === 'single' && data.studentId) {
        payload.studentId = data.studentId;
      } else if (data.generationType === 'class') {
        payload.className = data.className;
        payload.section = data.section;
      }

      const response = await axios.post(`${API_URL}/fees/demand-bills/generate`, payload);
      return response.data;
    },
    onSuccess: (data) => {
      setGenerationResult(data);
      setError('');
      // Refresh the history
      queryClient.invalidateQueries({ queryKey: ['bill-generation-history', selectedSession?.id] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to generate bills');
      setGenerationResult(null);
    },
  });

  const onSubmit = (data: DemandBillFormData) => {
    // Validate that at least one fee type is selected
    console.log('Submitting with selectedFeeTypes:', selectedFeeTypes);

    if (selectedFeeTypes.length === 0) {
      setError('Please select at least one fee type');
      return;
    }

    setError(''); // Clear any previous errors
    generateBillsMutation.mutate(data);
  };

  // Auto-update sessionId when selected session changes
  useEffect(() => {
    if (selectedSession) {
      setValue('sessionId', selectedSession.id);
    }
  }, [selectedSession, setValue]);

  // Fetch available classes
  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: classService.getAll,
  });

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
        Demand Bill Generation
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
        {/* Left Side - Generation Form + Result + History */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight={600}>
                    Error: {error}
                  </Typography>
                </Alert>
              )}

              <Stack spacing={3}>
                {/* Generation Type */}
                <Controller
                  name="generationType"
                  control={control}
                  render={({ field }) => (
                    <FormControl component="fieldset">
                      <FormLabel component="legend">
                        <Typography variant="subtitle1" fontWeight={600}>
                          Bill Generation Type
                        </Typography>
                      </FormLabel>
                      <RadioGroup {...field} row>
                        <FormControlLabel value="single" control={<Radio />} label="Single Student" />
                        <FormControlLabel value="class" control={<Radio />} label="Entire Class" />
                        <FormControlLabel value="all" control={<Radio />} label="All Students" />
                      </RadioGroup>
                    </FormControl>
                  )}
                />

                {/* Conditional Fields */}
                {generationType === 'class' && (
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Controller
                        name="className"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth required error={!!errors.className}>
                            <InputLabel>Class</InputLabel>
                            <Select {...field} label="Class">
                              <MenuItem value="">Select Class</MenuItem>
                              {classes?.map((cls: any) => (
                                <MenuItem key={cls.id} value={cls.name}>
                                  {cls.displayName || cls.name}
                                </MenuItem>
                              ))}
                              {(!classes || classes.length === 0) && (
                                <MenuItem disabled>No classes found</MenuItem>
                              )}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Controller
                        name="section"
                        control={control}
                        render={({ field }) => {
                          const selectedClass = watch('className');

                          return (
                            <FormControl fullWidth disabled={!selectedClass}>
                              <InputLabel>Section (Optional)</InputLabel>
                              <Select {...field} label="Section (Optional)">
                                <MenuItem value="">All Sections</MenuItem>
                                {SECTIONS.map((sec) => (
                                  <MenuItem key={sec} value={sec}>
                                    Section {sec}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          );
                        }}
                      />
                    </Box>
                  </Box>
                )}

                {/* Session, Period and Student ID (all in one row) */}
                <Grid container spacing={2}>
                  {generationType === 'single' && (
                    <Grid item xs={12} md={3}>
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
                            placeholder="Enter ID"
                          />
                        )}
                      />
                    </Grid>
                  )}
                  <Grid item xs={12} md={generationType === 'single' ? 3 : 4}>
                    <TextField
                      label={selectedSession ? `Academic Session (ID: ${selectedSession.id})` : 'Academic Session'}
                      fullWidth
                      value={selectedSession?.name || 'No session selected'}
                      InputProps={{ readOnly: true }}
                    />
                    <Controller
                      name="sessionId"
                      control={control}
                      render={({ field }) => <input type="hidden" {...field} />}
                    />
                  </Grid>
                  <Grid item xs={12} md={generationType === 'single' ? 3 : 4}>
                    <Controller
                      name="month"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth required>
                          <InputLabel>Month</InputLabel>
                          <Select {...field} label="Month">
                            {MONTHS.map((month, index) => (
                              <MenuItem key={month} value={index + 1}>
                                {month}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={generationType === 'single' ? 3 : 4}>
                    <Controller
                      name="year"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Year"
                          type="number"
                          fullWidth
                          required
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                {/* Due Date */}
                <Controller
                  name="dueDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Due Date (Payment Deadline)"
                      type="date"
                      fullWidth
                      required
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.dueDate}
                      helperText={errors.dueDate?.message}
                    />
                  )}
                />

                {/* Fee Types Selection */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Select Fee Types to Include
                  </Typography>
                  <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setSelectedFeeTypes(feeTypes.map((ft: any) => ft.id))}
                    >
                      Select All
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        // Keep Tuition Fee selected even on deselect all
                        const tuitionFee = feeTypes.find((ft: any) => ft.name === 'Tuition Fee');
                        setSelectedFeeTypes(tuitionFee ? [tuitionFee.id] : []);
                      }}
                    >
                      Deselect All
                    </Button>
                  </Box>
                  <FormGroup>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: 'repeat(2, 1fr)',
                          md: 'repeat(3, 1fr)'
                        },
                        gap: 2,
                        mb: 2
                      }}
                    >
                      {feeTypes
                        .filter((feeType: any) => {
                          // Exclude Late Fee (auto-added) and Caution Money (refundable)
                          const oneTimeFees = ['Late Fee', 'Caution Money'];
                          return !oneTimeFees.includes(feeType.name);
                        })
                        .map((feeType: any) => {
                          const isTuitionFee = feeType.name === 'Tuition Fee';
                          return (
                            <FormControlLabel
                              key={feeType.id}
                              control={
                                <Checkbox
                                  checked={selectedFeeTypes.includes(feeType.id)}
                                  // disabled={isTuitionFee} // Allow editing tuition fee
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedFeeTypes([...selectedFeeTypes, feeType.id]);
                                    } else {
                                      setSelectedFeeTypes(selectedFeeTypes.filter(id => id !== feeType.id));
                                    }
                                  }}
                                />
                              }
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {feeType.name}
                                  {feeType.frequency && (
                                    <Chip
                                      size="small"
                                      label={feeType.frequency}
                                      sx={{ height: 20 }}
                                      color={
                                        feeType.frequency === 'Monthly' ? 'primary' :
                                          feeType.frequency === 'Yearly' ? 'secondary' :
                                            feeType.frequency === 'Refundable' ? 'success' :
                                              'default'
                                      }
                                    />
                                  )}
                                </Box>
                              }
                            />
                          );
                        })}
                    </Box>
                  </FormGroup>
                  <FormControlLabel
                    sx={{ mt: 2 }}
                    control={
                      <Checkbox
                        checked={autoCalculateLateFees}
                        onChange={(e) => setAutoCalculateLateFees(e.target.checked)}
                      />
                    }
                    label="Automatically add Late Fees for students with overdue payments"
                  />
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={generateBillsMutation.isPending}
                  startIcon={
                    generateBillsMutation.isPending ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <FileText size={20} />
                    )
                  }
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  {generateBillsMutation.isPending ? 'Generating Bills...' : 'Generate Demand Bills'}
                </Button>
              </Stack>
            </form>
          </Paper>

          {/* Generation Result */}
          {generationResult && (
            <Paper elevation={2} sx={{ p: 4, borderRadius: 3, mt: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Generation Summary
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Total
                      </Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {generationResult.total}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined" sx={{ bgcolor: 'success.light' }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Generated
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="success.dark">
                        {generationResult.generated}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined" sx={{ bgcolor: 'warning.light' }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Skipped
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="warning.dark">
                        {generationResult.skipped}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined" sx={{ bgcolor: 'error.light' }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Failed
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="error.dark">
                        {generationResult.failed}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Details Table */}
              {generationResult.results && generationResult.results.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Bill Details
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Student ID</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Bill No</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            Amount
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>
                            Status
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {generationResult.results.map((result: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{result.studentId}</TableCell>
                            <TableCell>{result.billNo || '-'}</TableCell>
                            <TableCell align="right">
                              {result.amount ? `₹${result.amount.toLocaleString()}` : '-'}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={result.status}
                                color={
                                  result.status === 'success'
                                    ? 'success'
                                    : result.status === 'skipped'
                                      ? 'warning'
                                      : 'error'
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              {result.status === 'success' && result.billNo && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => {
                                    // Navigate to bill view page with bill number
                                    window.open(`/fees/bill/${result.billNo}`, '_blank');
                                  }}
                                >
                                  View Bill
                                </Button>
                              )}
                              {result.status === 'failed' && result.error && (
                                <Typography variant="caption" color="error">
                                  {result.error}
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                <Button variant="outlined" startIcon={<Download size={18} />} fullWidth>
                  Download All Bills (PDF)
                </Button>
                <Button variant="contained" startIcon={<Send size={18} />} fullWidth>
                  Send via Email/SMS
                </Button>
              </Stack>
            </Paper>
          )}

          {/* Bill Generation History */}
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3, mt: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              📜 Bill Generation History
            </Typography>
            {loadingHistory ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : billHistory && billHistory.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Date & Time</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Bill Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Month/Year</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Class(es)</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Students</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Total Amount</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Print</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {billHistory.map((batch: any, index: number) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {new Date(batch.timestamp).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(batch.timestamp).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={batch.billType}
                            size="small"
                            color={
                              batch.billType === 'Single Student' ? 'default' :
                                batch.billType === 'Entire Section' ? 'primary' :
                                  batch.billType === 'Entire Class' ? 'secondary' : 'info'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {MONTHS[batch.month - 1]} {batch.year}
                        </TableCell>
                        <TableCell>
                          {batch.classes.map((cls: string) => `Class ${cls}`).join(', ')}
                          {batch.sections.length > 0 && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              Section(s): {batch.sections.join(', ')}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={batch.studentCount} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={600} color="success.main">
                            ₹{batch.totalAmount.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {batch.bills && batch.bills.length === 1 ? (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Printer size={14} />}
                              onClick={() => feeService.openDemandBillPdf(batch.bills[0].billNo)}
                            >
                              Print
                            </Button>
                          ) : batch.bills && batch.bills.length > 1 ? (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Printer size={14} />}
                              onClick={() => {
                                // Generate single PDF with all bills combined
                                const billNumbers = batch.bills.map((bill: any) => bill.billNo);
                                const period = `${MONTHS[batch.month - 1]}${batch.year}`;
                                const classInfo = batch.classes.map((c: string) => `Class${c}`).join('_');
                                feeService.openBatchDemandBillPdf(billNumbers, {
                                  period,
                                  billType: batch.billType,
                                  classInfo
                                });
                              }}
                            >
                              Print All ({batch.bills.length})
                            </Button>
                          ) : (
                            <Typography variant="caption" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                No bills generated yet for this session. Generate demand bills above to see history here.
              </Alert>
            )}
          </Paper>
        </Box>

        {/* Right Sidebar - Quick Tips & Info */}
        <Box sx={{ width: { xs: '100%', sm: 400 }, flexShrink: 0 }}>
          <Stack spacing={3}>
            {/* Quick Tips - Same style as Fee Collection */}
            <Card elevation={2} sx={{ borderRadius: 3, bgcolor: 'primary.main', color: 'white' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  💡 Quick Tips
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">• Select fee types applicable for the billing period</Typography>
                  <Typography variant="body2">• Bills are generated once per student per month</Typography>
                  <Typography variant="body2">• Previous dues are automatically added</Typography>
                  <Typography variant="body2">• Late fees are auto-calculated if enabled</Typography>
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={2} sx={{ borderRadius: 3, bgcolor: 'info.light' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  About Demand Bills
                </Typography>
                <Typography variant="body2" paragraph>
                  Demand bills are monthly fee invoices generated for students. They include:
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">✓ Selected fee types for the month</Typography>
                  <Typography variant="body2">✓ Previous month's outstanding dues</Typography>
                  <Typography variant="body2">✓ Applicable discounts</Typography>
                  <Typography variant="body2">✓ Late fees (auto-calculated if enabled)</Typography>
                  <Typography variant="body2">✓ Due date for payment</Typography>
                  <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                    Bills are generated for the selected Academic Session shown in the top-right corner.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Generation Options
                </Typography>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Monthly Demand Bills
                    </Typography>
                    <Typography variant="body2" paragraph>
                      Monthly demand bills can be generated for individual students, entire
                      classes, or all students at once. Each bill includes:
                    </Typography>
                    <Box component="ul" sx={{ pl: 3, mt: 0 }}>
                      <li>
                        <Typography variant="body2">Selected fee types for the month</Typography>
                      </li>
                      <li>
                        <Typography variant="body2">
                          Late fees (auto-added from fee structure if enabled and student has
                          outstanding dues)
                        </Typography>
                      </li>
                      <li>
                        <Typography variant="body2">Any applicable discounts</Typography>
                      </li>
                      <li>
                        <Typography variant="body2">Due date for payment</Typography>
                      </li>
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={2} sx={{ borderRadius: 3, bgcolor: 'warning.light' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom color="warning.dark">
                  Important Notes
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    • Bills are generated based on the fee structure set for each class
                  </Typography>
                  <Typography variant="body2">
                    • Existing bills for the same month will be skipped
                  </Typography>
                  <Typography variant="body2">• Previous dues are automatically carried forward</Typography>
                  <Typography variant="body2">
                    • Student-specific discounts are applied automatically
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
