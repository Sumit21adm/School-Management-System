import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  InputAdornment,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Autocomplete,
} from '@mui/material';
import { Plus, Trash2, IndianRupee, Clock, Printer, Search } from 'lucide-react';
import { feeService, admissionService, apiClient } from '../../lib/api';
import PageHeader from '../../components/PageHeader';
import { hasPermission, getCurrentUserPermissions } from '../../utils/permissions';

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

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
  billNo: z.string().optional(),  // Bill number this payment is against
});

type FeeCollectionFormData = z.infer<typeof feeCollectionSchema>;

export default function EnhancedFeeCollection() {
  const { selectedSession } = useSession();
  const [searchParams] = useSearchParams();
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  // Permission check
  const { role, permissions } = getCurrentUserPermissions();
  const canCollectFees = hasPermission('fees_collect', role, permissions);

  // Early return if user lacks permission
  if (!canCollectFees) {
    return (
      <Box>
        <PageHeader title="Fee Collection" />
        <Alert severity="error" sx={{ mt: 2 }}>
          You do not have permission to access this page. Contact your administrator if you believe this is an error.
        </Alert>
      </Box>
    );
  }

  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FeeCollectionFormData>({
    resolver: zodResolver(feeCollectionSchema),
    defaultValues: {
      studentId: '',
      sessionId: selectedSession?.id || 1,
      feeDetails: [{ feeTypeId: 0, amount: 0, discountAmount: 0 }],
      paymentMode: 'cash',
      receiptNo: '',
      remarks: '',
      collectedBy: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  // Auto-populate student ID from URL parameters
  useEffect(() => {
    const urlStudentId = searchParams.get('studentId');
    if (urlStudentId) {
      setValue('studentId', urlStudentId);
    }
  }, [searchParams, setValue]);

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
      const response = await apiClient.get('/fee-types');
      return response.data.feeTypes;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true, // Always refetch when component mounts
  });

  // Fetch recent transactions (last 10)
  const { data: recentTransactions } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const response = await apiClient.get('/fees/transactions', {
        params: { limit: 10, sortBy: 'date', sortOrder: 'desc' }
      });
      return response.data.transactions || response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: true,
  });

  // Fetch student dashboard for fee structure
  const { data: dashboard, isLoading: loadingStudent } = useQuery({
    queryKey: ['student-dashboard', studentId, sessionId],
    queryFn: async () => {
      const response = await apiClient.get(
        `/fees/dashboard/${studentId}/session/${sessionId}`
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

  // Auto-populate fee items from bill number if provided
  useEffect(() => {
    const billNo = searchParams.get('billNo');
    if (billNo && dashboard?.pendingBills && feeTypes) {
      const bill = dashboard.pendingBills.find((b: any) => b.billNo === billNo);
      if (bill && bill.items && bill.items.length > 0 && bill.balance > 0) {
        // Use waterfall allocation to determine which items are still unpaid
        let paidPool = bill.paid;
        const unpaidItems: any[] = [];

        bill.items.forEach((item: any) => {
          const itemNet = item.amount - (item.discount || 0);

          // Allocate paid amount to this item
          let allocatedPay = 0;
          if (paidPool >= itemNet) {
            allocatedPay = itemNet;
            paidPool -= itemNet;
          } else {
            allocatedPay = paidPool;
            paidPool = 0;
          }

          const itemDue = itemNet - allocatedPay;

          if (itemDue > 0) {
            const feeType = feeTypes.find((ft: any) => ft.name === item.feeType);
            if (feeType) {
              // If fully unpaid, show original gross/discount. If partial, just balance.
              if (itemDue === itemNet) {
                unpaidItems.push({
                  feeTypeId: feeType.id,
                  amount: item.amount,
                  discountAmount: item.discount || 0,
                });
              } else {
                unpaidItems.push({
                  feeTypeId: feeType.id,
                  amount: itemDue,
                  discountAmount: 0,
                });
              }
            }
          }
        });

        if (unpaidItems.length > 0) {
          setValue('feeDetails', unpaidItems);
          setValue('remarks', `Payment for Bill: ${billNo}`);
          setValue('billNo', billNo);
        }
      }
    }
  }, [searchParams, dashboard, feeTypes, setValue]);

  // Auto-fill ALL outstanding dues when navigating with studentId but no billNo
  useEffect(() => {
    const billNo = searchParams.get('billNo');
    const studentIdParam = searchParams.get('studentId');

    // Only auto-fill if we have studentId in URL, no billNo, and dashboard is loaded
    if (studentIdParam && !billNo && dashboard?.pendingBills && feeTypes && dashboard.pendingBills.length > 0) {
      const allUnpaidItems: any[] = [];
      const billNumbers: string[] = [];

      // Process ALL pending bills
      dashboard.pendingBills.forEach((bill: any) => {
        if (bill.balance > 0 && bill.items && bill.items.length > 0) {
          billNumbers.push(bill.billNo);

          // Use waterfall allocation for each bill
          let paidPool = bill.paid;

          bill.items.forEach((item: any) => {
            const itemNet = item.amount - (item.discount || 0);

            // Allocate paid amount to this item
            let allocatedPay = 0;
            if (paidPool >= itemNet) {
              allocatedPay = itemNet;
              paidPool -= itemNet;
            } else {
              allocatedPay = paidPool;
              paidPool = 0;
            }

            const itemDue = itemNet - allocatedPay;

            if (itemDue > 0) {
              const feeType = feeTypes.find((ft: any) => ft.name === item.feeType);
              if (feeType) {
                // Check if we already have this fee type from another bill
                const existingItem = allUnpaidItems.find(ui => ui.feeTypeId === feeType.id);
                if (existingItem) {
                  // Add to existing amount
                  existingItem.amount += itemDue === itemNet ? item.amount : itemDue;
                  if (itemDue === itemNet) {
                    existingItem.discountAmount += item.discount || 0;
                  }
                } else {
                  // Add new item
                  if (itemDue === itemNet) {
                    allUnpaidItems.push({
                      feeTypeId: feeType.id,
                      amount: item.amount,
                      discountAmount: item.discount || 0,
                    });
                  } else {
                    allUnpaidItems.push({
                      feeTypeId: feeType.id,
                      amount: itemDue,
                      discountAmount: 0,
                    });
                  }
                }
              }
            }
          });
        }
      });

      if (allUnpaidItems.length > 0) {
        setValue('feeDetails', allUnpaidItems);
        setValue('remarks', `Payment for Bills: ${billNumbers.join(', ')}`);
        // Don't set billNo when multiple bills - let backend handle via remarks
      }
    }
  }, [searchParams, dashboard, feeTypes, setValue]);

  // Auto-update sessionId when selected session changes
  useEffect(() => {
    if (selectedSession) {
      setValue('sessionId', selectedSession.id);
    }
  }, [selectedSession, setValue]);

  // Collect fee mutation
  const collectFeeMutation = useMutation({
    mutationFn: async (data: FeeCollectionFormData) => {
      const response = await apiClient.post('/fees/collect', data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      setSuccess(`Fee collected successfully! Receipt No: ${data.receiptNo}`);
      setError('');
      // Invalidate student dashboard query to refresh data
      queryClient.invalidateQueries({ queryKey: ['student-dashboard', variables.studentId, variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['student-fee-status', variables.studentId, variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
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
    // Strategy: Use pendingBills to ensure Bill-First principle.
    // Only allow collecting fees that have a corresponding pending bill.

    if (dashboard?.pendingBills) {
      // Find the first bill with a positive balance
      const unpaidBill = dashboard.pendingBills.find((bill: any) => bill.balance > 0);

      if (unpaidBill) {
        // Calculate unpaid items from this bill
        let billPaidPool = unpaidBill.paid;
        const unpaidItems: any[] = [];

        unpaidBill.items.forEach((item: any) => {
          const itemNet = item.amount - (item.discount || 0);

          // Allocate paid amount to this item
          let allocatedPay = 0;
          if (billPaidPool >= itemNet) {
            allocatedPay = itemNet;
            billPaidPool -= itemNet;
          } else {
            allocatedPay = billPaidPool;
            billPaidPool = 0;
          }

          const itemDue = itemNet - allocatedPay;

          if (itemDue > 0) {
            const feeTypeObj = feeTypes?.find((ft: any) => ft.name === item.feeType);
            if (feeTypeObj) {
              // If fully unpaid, show original gross/discount. If partial, just balance.
              if (itemDue === itemNet) {
                unpaidItems.push({
                  feeTypeId: feeTypeObj.id,
                  amount: item.amount,
                  discountAmount: item.discount || 0,
                });
              } else {
                unpaidItems.push({
                  feeTypeId: feeTypeObj.id,
                  amount: itemDue,
                  discountAmount: 0,
                });
              }
            }
          }
        });

        if (unpaidItems.length > 0) {
          setValue('feeDetails', unpaidItems);
          setValue('remarks', `Payment for Bill: ${unpaidBill.billNo}`);
          setValue('billNo', unpaidBill.billNo);
        }
      }
    }
  };

  return (
    <Box>
      <PageHeader
        title="Fee Collection"
        quickTips={[
          { text: 'Use "Auto-Fill" to populate outstanding dues', highlight: '"Auto-Fill"' },
          { text: 'You can collect multiple fee types in one receipt', highlight: 'multiple fee types' },
          { text: 'Discounts are applied per fee type', highlight: 'Discounts' },
          { text: 'Receipt will be auto-generated and can be printed', highlight: 'auto-generated' },
        ]}
      />

      <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
        {/* Main Collection Form */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
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
                  {/* 1. Academic Session */}
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      label="Academic Session"
                      fullWidth
                      value={selectedSession?.name || 'No session selected'}
                      InputProps={{ readOnly: true }}
                      helperText={selectedSession ? `Session ID: ${selectedSession.id}` : 'Select a session from the top-right dropdown'}
                    />
                    <Controller
                      name="sessionId"
                      control={control}
                      render={({ field }) => <input type="hidden" {...field} />}
                    />
                  </Grid>

                  {/* 2. Student ID Search */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Controller
                      name="studentId"
                      control={control}
                      render={({ field }) => {
                        const [open, setOpen] = useState(false);
                        const [options, setOptions] = useState<any[]>([]);
                        const [loading, setLoading] = useState(false);
                        const [inputValue, setInputValue] = useState('');

                        const searchStudents = useMemo(
                          () =>
                            debounce(async (query: string) => {
                              if (!query || query.length < 1) {
                                setOptions([]);
                                return;
                              }
                              setLoading(true);
                              try {
                                const response = await admissionService.getStudents({
                                  search: query,
                                  limit: 10,
                                  status: 'active'
                                });
                                setOptions(response.data.data || []);
                              } catch (err) {
                                console.error('Error searching students:', err);
                              } finally {
                                setLoading(false);
                              }
                            }, 500),
                          []
                        );

                        useEffect(() => {
                          searchStudents(inputValue);
                        }, [inputValue, searchStudents]);

                        // Determine selected value object for Autocomplete from field.value (studentId) string
                        // We need to keep track of the selected student object to show correct label
                        const [selectedOpt, setSelectedOpt] = useState<any>(null);

                        // If studentId changes externally (e.g. URL), try to fetch basic info if not already set
                        useEffect(() => {
                          if (field.value && !selectedOpt) {
                            if (studentInfo && studentInfo.studentId === field.value) {
                              setSelectedOpt(studentInfo);
                            }
                          } else if (field.value && selectedOpt && selectedOpt.studentId !== field.value) {
                            // Sync handling if needed, usually managed by onChange
                            if (studentInfo && studentInfo.studentId === field.value) {
                              setSelectedOpt(studentInfo);
                            }
                          } else if (!field.value) {
                            // Cleared by the other autocomplete, sync this one
                            setSelectedOpt(null);
                            setInputValue('');
                          }
                        }, [field.value, studentInfo, selectedOpt]);

                        return (
                          <Autocomplete
                            fullWidth
                            value={selectedOpt}
                            open={open}
                            onOpen={() => setOpen(true)}
                            onClose={() => setOpen(false)}
                            isOptionEqualToValue={(option, value) => option.studentId === value.studentId}
                            getOptionLabel={(option) => option.studentId || ''}
                            filterOptions={(x) => x}
                            forcePopupIcon={false}
                            options={options}
                            loading={loading}
                            inputValue={inputValue}
                            onInputChange={(event, newInputValue) => {
                              setInputValue(newInputValue);
                            }}
                            onChange={(event, newValue: any) => {
                              if (newValue) {
                                field.onChange(newValue.studentId);
                                setSelectedOpt(newValue);
                                setStudentInfo(newValue);
                              } else {
                                field.onChange('');
                                setSelectedOpt(null);
                                setStudentInfo(null);
                              }
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                fullWidth
                                label="Student ID"
                                placeholder="Enter ID..."
                                required={!selectedOpt}
                                error={!!errors.studentId}
                                InputProps={{
                                  ...params.InputProps,
                                  endAdornment: (
                                    <>
                                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                      {params.InputProps.endAdornment}
                                    </>
                                  ),
                                }}
                              />
                            )}
                            renderOption={(props, option) => (
                              <li {...props} key={option.id}>
                                <Box>
                                  <Typography variant="subtitle2">
                                    {option.name} <span style={{ color: 'gray' }}>({option.studentId})</span>
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Class: {option.className}-{option.section} | Father: {option.fatherName}
                                  </Typography>
                                  {option.address && (
                                    <Typography variant="caption" display="block" color="text.secondary">
                                      Address: {option.address}
                                    </Typography>
                                  )}
                                </Box>
                              </li>
                            )}
                          />
                        );
                      }}
                    />
                  </Grid>

                  {/* 3. Student Name Search */}
                  <Grid size={{ xs: 12, md: 5 }}>
                    <Controller
                      name="studentId"
                      control={control}
                      render={({ field }) => {
                        const [open, setOpen] = useState(false);
                        const [options, setOptions] = useState<any[]>([]);
                        const [loading, setLoading] = useState(false);
                        const [inputValue, setInputValue] = useState('');

                        const searchStudents = useMemo(
                          () =>
                            debounce(async (query: string) => {
                              if (!query || query.length < 2) {
                                setOptions([]);
                                return;
                              }
                              setLoading(true);
                              try {
                                const response = await admissionService.getStudents({
                                  search: query,
                                  limit: 10,
                                  status: 'active'
                                });
                                setOptions(response.data.data || []);
                              } catch (err) {
                                console.error('Error searching students:', err);
                              } finally {
                                setLoading(false);
                              }
                            }, 500),
                          []
                        );

                        useEffect(() => {
                          searchStudents(inputValue);
                        }, [inputValue, searchStudents]);

                        // Sync with parent state logic (simplified duplication for now to ensure both work)
                        // In a refactor, we should hoist this state up, but for now we rely on the form field value + studentInfo
                        const [selectedOpt, setSelectedOpt] = useState<any>(null);

                        useEffect(() => {
                          // Use studentInfo as the source of truth for the 'selected object' when it changes
                          if (studentInfo && studentInfo.studentId === field.value) {
                            setSelectedOpt(studentInfo);
                          } else if (!field.value) {
                            // Cleared by the other autocomplete, sync this one
                            setSelectedOpt(null);
                            setInputValue('');
                          }
                        }, [field.value, studentInfo]);

                        return (
                          <Autocomplete
                            fullWidth
                            value={selectedOpt}
                            open={open}
                            onOpen={() => setOpen(true)}
                            onClose={() => setOpen(false)}
                            isOptionEqualToValue={(option, value) => option.studentId === value.studentId}
                            getOptionLabel={(option) => option.name || ''}
                            filterOptions={(x) => x}
                            forcePopupIcon={false}
                            options={options}
                            loading={loading}
                            inputValue={inputValue}
                            onInputChange={(event, newInputValue) => {
                              setInputValue(newInputValue);
                            }}
                            onChange={(event, newValue: any) => {
                              if (newValue) {
                                field.onChange(newValue.studentId);
                                setSelectedOpt(newValue);
                                setStudentInfo(newValue);
                              } else {
                                field.onChange('');
                                setSelectedOpt(null);
                                setStudentInfo(null);
                              }
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                fullWidth
                                label="Student Name"
                                placeholder="Enter Name..."
                                InputProps={{
                                  ...params.InputProps,
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <Search size={20} color="gray" />
                                    </InputAdornment>
                                  ),
                                  endAdornment: (
                                    <>
                                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                      {params.InputProps.endAdornment}
                                    </>
                                  ),
                                }}
                              />
                            )}
                            renderOption={(props, option) => (
                              <li {...props} key={option.id}>
                                <Box>
                                  <Typography variant="subtitle2">
                                    {option.name} <span style={{ color: 'gray' }}>({option.studentId})</span>
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Class: {option.className}-{option.section} | Father: {option.fatherName}
                                  </Typography>
                                  {option.address && (
                                    <Typography variant="caption" display="block" color="text.secondary">
                                      Address: {option.address}
                                    </Typography>
                                  )}
                                </Box>
                              </li>
                            )}
                          />
                        );
                      }}
                    />
                  </Grid>
                </Grid>

                {studentInfo && (
                  <Alert
                    severity={dashboard?.pendingBills?.length === 0 ? "warning" : "info"}
                    sx={{ mb: 2 }}
                    action={
                      dashboard?.pendingBills?.length === 0 && (
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          component={Link}
                          to="/fees/demand-bills"
                          sx={{ fontWeight: 600 }}
                        >
                          Create Demand Bill
                        </Button>
                      )
                    }
                  >
                    <Typography variant="subtitle2" fontWeight={600}>
                      {studentInfo.name}
                    </Typography>
                    <Typography variant="body2">
                      Class: {studentInfo.className}-{studentInfo.section} | Father: {studentInfo.fatherName}
                    </Typography>
                    {dashboard && (
                      <Typography variant="body2" color={dashboard.pendingBills?.length === 0 ? "text.secondary" : "error"} sx={{ mt: 1 }}>
                        Outstanding Dues: ₹{dashboard.summary.totalDues.toLocaleString()}
                      </Typography>
                    )}
                    {dashboard?.pendingBills?.length === 0 ? (
                      <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>
                        No demand bill found, create demand bill first.
                      </Typography>
                    ) : (
                      <Button
                        size="small"
                        onClick={fillFeeStructure}
                        sx={{ mt: 1 }}
                        disabled={!dashboard?.feeHeads}
                      >
                        Auto-Fill Outstanding Dues
                      </Button>
                    )}
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
                                      <Select
                                        {...field}
                                        displayEmpty
                                        onChange={(e) => {
                                          const selectedTypeId = Number(e.target.value);
                                          field.onChange(selectedTypeId);

                                          // Auto-populate amount and discount from dashboard
                                          if (dashboard?.feeHeads) {
                                            const feeHead = dashboard.feeHeads.find((h: any) => h.feeTypeId === selectedTypeId);
                                            if (feeHead && feeHead.balance > 0) {
                                              // Use logic similar to auto-fill:
                                              // If no paid amount, show Gross & Discount. Otherwise show Balance & 0 Discount.
                                              if (feeHead.paid === 0) {
                                                setValue(`feeDetails.${index}.amount`, feeHead.grossAmount);
                                                setValue(`feeDetails.${index}.discountAmount`, feeHead.discount);
                                              } else {
                                                setValue(`feeDetails.${index}.amount`, feeHead.balance);
                                                setValue(`feeDetails.${index}.discountAmount`, 0);
                                              }
                                            }
                                          }
                                        }}
                                      >
                                        <MenuItem value={0}>Select Fee Type</MenuItem>
                                        {(feeTypes || []).map((type: any) => (
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
                  <Grid size={{ xs: 12, md: 6 }}>
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
                  <Grid size={{ xs: 12, md: 6 }}>
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
                  <Grid size={{ xs: 12, md: 6 }}>
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
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="collectedBy"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} label="Collected By" fullWidth placeholder="Staff name" />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
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
        </Box>

        {/* Sidebar - Student Fee Status */}
        <Box sx={{ width: { xs: '100%', sm: 400 }, flexShrink: 0 }}>
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
                      {dashboard.summary.advanceBalance > 0 && (
                        <Box
                          sx={{
                            mt: 2,
                            p: 2,
                            backgroundColor: 'success.light',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'success.main',
                          }}
                        >
                          <Typography variant="body2" color="success.dark" fontWeight={500}>
                            Advance Balance
                          </Typography>
                          <Typography variant="h5" fontWeight={700} color="success.dark">
                            ₹{dashboard.summary.advanceBalance.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="success.dark">
                            Will be auto-applied to next bill
                          </Typography>
                        </Box>
                      )}
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

            {/* Recent Transactions */}
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <Clock size={18} />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Recent Collections
                  </Typography>
                </Stack>
                {recentTransactions && recentTransactions.length > 0 ? (
                  <Stack spacing={1.5} sx={{ maxHeight: 280, overflowY: 'auto' }}>
                    {recentTransactions.slice(0, 10).map((txn: any, idx: number) => (
                      <Box
                        key={txn.receiptNo || idx}
                        sx={{
                          p: 1.5,
                          bgcolor: 'grey.50',
                          borderRadius: 2,
                          borderLeft: '3px solid',
                          borderLeftColor: 'success.main',
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {txn.receiptNo}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {txn.student?.name || txn.studentId} • {txn.student?.className || ''}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" fontWeight={700} color="success.main">
                              ₹{Number(txn.amount).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {new Date(txn.timestamp || txn.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => feeService.openReceiptPdf(txn.receiptNo)}
                            sx={{
                              ml: 1,
                              bgcolor: 'primary.light',
                              color: 'primary.main',
                              '&:hover': { bgcolor: 'primary.main', color: 'white' }
                            }}
                            title="Print Receipt"
                          >
                            <Printer size={14} />
                          </IconButton>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    No recent transactions
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
