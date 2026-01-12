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
  Tooltip,
} from '@mui/material';
import { FileText, Download, Send, Printer } from 'lucide-react';
import { apiClient, feeService, classService } from '../../lib/api';
import PageHeader from '../../components/PageHeader';
import DemandBillCreationList from './DemandBillCreationList';
import { Dialog, DialogContent, IconButton, DialogActions, DialogTitle, DialogContentText } from '@mui/material';
import { X, Trash2 } from 'lucide-react';

// API_URL no longer needed - using apiClient with baseURL

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
  const [viewBatch, setViewBatch] = useState<any>(null); // State for viewing creation list
  const [deleteConfirmBatch, setDeleteConfirmBatch] = useState<any>(null); // State for delete confirmation

  // Get user role and permissions
  const [userRole, setUserRole] = useState<string>('');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role || '');
        setUserPermissions(user.permissions || []);
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }, []);

  const hasDeletePermission = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userPermissions.includes('demand_bills_delete');

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
      // Default due date: 10th of next month
      dueDate: (() => {
        let nextMonth = currentMonth + 1;
        let nextYear = currentYear;
        if (nextMonth > 12) {
          nextMonth = 1;
          nextYear += 1;
        }
        // Format as YYYY-MM-DD without timezone conversion
        const mm = String(nextMonth).padStart(2, '0');
        return `${nextYear}-${mm}-10`;
      })(),
    },
  });

  const generationType = watch('generationType');
  const watchedMonth = watch('month');
  const watchedYear = watch('year');

  // Auto-update due date when month or year changes
  useEffect(() => {
    if (watchedMonth && watchedYear) {
      let nextMonth = watchedMonth + 1;
      let nextYear = watchedYear;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
      }
      const mm = String(nextMonth).padStart(2, '0');
      setValue('dueDate', `${nextYear}-${mm}-10`);
    }
  }, [watchedMonth, watchedYear, setValue]);

  const watchedClassName = watch('className');
  const watchedStudentId = watch('studentId');

  // Determine the class to use for fee structure lookup
  // For 'single' type, we need to lookup the student's class (would need student info)
  // For 'class' type, use the selected class
  // For 'all' type, show all fee types
  const effectiveClassName = generationType === 'class' ? watchedClassName :
    generationType === 'all' ? undefined : undefined;

  // Fetch fee types based on structure (dynamic based on selection)
  const { data: structureFeeTypesData } = useQuery({
    queryKey: ['fee-types-by-structure', selectedSession?.id, effectiveClassName, generationType],
    queryFn: async () => {
      if (!selectedSession?.id) return { feeTypes: [] };

      // For 'all' students, get all fee types from all structures
      if (generationType === 'all' || !effectiveClassName) {
        const response = await apiClient.get('/fee-types/by-structure', {
          params: { sessionId: selectedSession.id }
        });
        return response.data;
      }

      // For specific class, get fee types for that class structure
      const response = await apiClient.get('/fee-types/by-structure', {
        params: { sessionId: selectedSession.id, className: effectiveClassName }
      });
      return response.data;
    },
    enabled: !!selectedSession?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Fallback to all fee types if no structure-based types found
  const { data: allFeeTypesData } = useQuery({
    queryKey: ['fee-types', location.pathname],
    queryFn: async () => {
      const response = await apiClient.get('/fee-types');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  });

  // Use structure-based fee types if available, otherwise fallback to all
  const feeTypes = (structureFeeTypesData?.feeTypes?.length > 0)
    ? structureFeeTypesData.feeTypes
    : (allFeeTypesData?.feeTypes || []);

  const queryClient = useQueryClient();

  // Fetch bill generation history
  const { data: billHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['bill-generation-history', selectedSession?.id],
    queryFn: async () => {
      if (!selectedSession?.id) return [];
      const response = await apiClient.get(`/fees/demand-bills/history/${selectedSession.id}`);
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

      const response = await apiClient.post('/fees/demand-bills/generate', payload);
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

  const handleDeleteBatch = async () => {
    if (!deleteConfirmBatch) return;

    try {
      const billNumbers = deleteConfirmBatch.bills.map((b: any) => b.billNo);
      await apiClient.delete('/fees/demand-bills/batch', {
        data: { billNumbers }
      });

      // Refresh history
      queryClient.invalidateQueries({ queryKey: ['bill-generation-history', selectedSession?.id] });
      setDeleteConfirmBatch(null);
    } catch (err: any) {
      console.error('Delete error', err);
      // Optional: show error toast/alert
      alert(err.response?.data?.message || 'Failed to delete batch');
    }
  };

  const onSubmit = async (data: DemandBillFormData) => {
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
      <PageHeader
        title="Demand Bill Generation"
        infoContent={
          <Stack spacing={2}>
            {/* Quick Tips */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom color="primary.main">
                💡 Quick Tips
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2">• Select fee types applicable for the billing period</Typography>
                <Typography variant="body2">• Bills are generated once per student per month</Typography>
                <Typography variant="body2">• Previous dues are automatically added</Typography>
                <Typography variant="body2">• Late fees are auto-calculated if enabled</Typography>
                <Typography variant="body2">• Demand bills are monthly fee invoices that include selected fee types, discounts, and due dates</Typography>
                <Typography variant="body2">• Bills are generated for the selected Academic Session shown in the top-right corner</Typography>
              </Stack>
            </Box>

            {/* About Demand Bills */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom color="info.main">
                About Demand Bills
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Demand bills are monthly fee invoices generated for students. They include:
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2">✓ Selected fee types for the month</Typography>
                <Typography variant="body2">✓ Previous month's outstanding dues</Typography>
                <Typography variant="body2">✓ Applicable discounts</Typography>
                <Typography variant="body2">✓ Late fees (auto-calculated if enabled)</Typography>
                <Typography variant="body2">✓ Due date for payment</Typography>
              </Stack>
            </Box>

            {/* Important Notes */}
            <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom color="warning.dark">
                ⚠️ Important Notes
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2">• Bills are generated based on the fee structure set for each class</Typography>
                <Typography variant="body2">• Existing bills for the same month will be skipped</Typography>
                <Typography variant="body2">• Previous dues are automatically carried forward</Typography>
                <Typography variant="body2">• Student-specific discounts are applied automatically</Typography>
              </Stack>
            </Box>
          </Stack>
        }
      />

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
                    <Grid size={{ xs: 12, md: 3 }}>
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
                  <Grid size={{ xs: 12, md: generationType === 'single' ? 3 : 4 }}>
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
                  <Grid size={{ xs: 12, md: generationType === 'single' ? 3 : 4 }}>
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
                  <Grid size={{ xs: 12, md: generationType === 'single' ? 3 : 4 }}>
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {structureFeeTypesData?.feeTypes?.length > 0
                        ? '✅ Applicable Fee Types (from Fee Structure)'
                        : '⚠️ Fee Structure not configured - Showing all fee types'}
                    </Typography>
                  </Box>
                  {structureFeeTypesData?.structureCount === 0 && generationType === 'class' && watchedClassName && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      No Fee Structure found for Class {watchedClassName}. Please configure Fee Structure first, or select from all available fee types below.
                    </Alert>
                  )}
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
                <Grid size={{ xs: 6, sm: 3 }}>
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
                <Grid size={{ xs: 6, sm: 3 }}>
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
                <Grid size={{ xs: 6, sm: 3 }}>
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
                <Grid size={{ xs: 6, sm: 3 }}>
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


        </Box>

        {/* Right Sidebar - Bill Generation History */}
        <Box sx={{ width: { xs: '100%', lg: 450 }, flexShrink: 0 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: '100%', overflow: 'hidden' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box component="span" sx={{ fontSize: '1.2em' }}>📜</Box> Generation History
            </Typography>

            {loadingHistory ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={30} />
              </Box>
            ) : billHistory && billHistory.length > 0 ? (
              <Stack spacing={2} sx={{ mt: 2 }}>
                {billHistory.map((batch: any, index: number) => (
                  <Card key={index} variant="outlined" sx={{ borderRadius: 2, position: 'relative' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {MONTHS[batch.month - 1]} {batch.year}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(batch.timestamp).toLocaleString('en-IN', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Chip
                            label={batch.billType === 'Single Student' ? 'Single' : batch.billType === 'Entire Class' ? 'Class' : 'All'}
                            size="small"
                            color={batch.billType === 'Entire Class' ? 'secondary' : 'default'}
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                          {hasDeletePermission && !batch.hasPayments && (
                            <Tooltip title="Delete Batch">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteConfirmBatch(batch)}
                                sx={{ p: 0.5 }}
                              >
                                <Trash2 size={14} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {batch.hasPayments && (
                            <Tooltip title="Cannot delete - has linked payments">
                              <Chip
                                label="Paid"
                                size="small"
                                color="success"
                                sx={{ height: 20, fontSize: '0.65rem', ml: 0.5 }}
                              />
                            </Tooltip>
                          )}
                        </Stack>
                      </Box>

                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                          {batch.classes.length > 0 ? `Class ${batch.classes.join(', ')}` : 'Single Student'}
                          {batch.sections.length > 0 && ` (${batch.sections.join(', ')})`}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            👥 {batch.studentCount} Students
                          </Typography>
                          <Typography variant="caption" fontWeight={600} color="success.main">
                            💰 ₹{batch.totalAmount.toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>

                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          fullWidth
                          onClick={() => setViewBatch(batch)}
                        >
                          Creation List
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          fullWidth
                          startIcon={<Printer size={14} />}
                          onClick={() => {
                            if (batch.bills.length === 1) {
                              feeService.openDemandBillPdf(batch.bills[0].billNo);
                            } else {
                              const billNumbers = batch.bills.map((bill: any) => bill.billNo);
                              const period = `${MONTHS[batch.month - 1]}${batch.year}`;
                              const classInfo = batch.classes.map((c: string) => `Class${c}`).join('_');
                              feeService.openBatchDemandBillPdf(billNumbers, {
                                period,
                                billType: batch.billType,
                                classInfo
                              });
                            }
                          }}
                        >
                          Print Bills
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary', bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="body2">
                  No generation history found.
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Creation List Dialog */}
      <Dialog
        open={!!viewBatch}
        onClose={() => setViewBatch(null)}
        fullScreen
        TransitionComponent={undefined} // Optional: Add slide transition if desired
      >
        {viewBatch && (
          <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton onClick={() => setViewBatch(null)}>
                <X />
              </IconButton>
            </Box>
            <DemandBillCreationList
              batchId={viewBatch.timestamp}
              bills={viewBatch.bills}
            />
          </Box>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmBatch}
        onClose={() => setDeleteConfirmBatch(null)}
      >
        <DialogTitle>Delete Bill Batch?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the bills generated on {deleteConfirmBatch && new Date(deleteConfirmBatch.timestamp).toLocaleString()}?
            <br /><br />
            <strong>Note:</strong> This checks if any payments have been received. If payments exist, deletion will be blocked.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmBatch(null)}>Cancel</Button>
          <Button onClick={handleDeleteBatch} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

    </Box>

  );
}
