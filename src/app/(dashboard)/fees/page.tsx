'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    Skeleton,
} from '@mui/material';
import { Plus, Trash2, IndianRupee, Clock, Printer } from 'lucide-react';
import { feeService, feeTypeService, sessionService } from '@/lib/api';
import { useSessionContext } from '@/contexts/SessionContext';

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
    billNo: z.string().optional(),
});

type FeeCollectionFormData = z.infer<typeof feeCollectionSchema>;

// Wrapper component to handle URL search params
function FeeCollectionContent({ initialStudentId }: { initialStudentId: string | null }) {
    const [studentInfo, setStudentInfo] = useState<any>(null);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [lastReceiptNo, setLastReceiptNo] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const { selectedSessionId } = useSessionContext();

    const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FeeCollectionFormData>({
        resolver: zodResolver(feeCollectionSchema),
        defaultValues: {
            studentId: initialStudentId || '',
            sessionId: selectedSessionId || 1,
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
            const response = await feeTypeService.getAll();
            return response.feeTypes || response;
        },
        staleTime: 5 * 60 * 1000,
    });

    // Fetch recent transactions
    const { data: recentTransactions } = useQuery({
        queryKey: ['recent-transactions'],
        queryFn: async () => {
            const response = await feeService.getTransactions({ limit: 10 });
            return response.transactions || response;
        },
        staleTime: 30 * 1000,
    });

    // Fetch student dashboard for fee structure
    const { data: dashboard, isLoading: loadingStudent } = useQuery({
        queryKey: ['student-dashboard', studentId, sessionId],
        queryFn: async () => {
            const response = await feeService.getStudentDashboard(studentId, sessionId);
            return response;
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
        mutationFn: feeService.collect,
        onSuccess: (data, variables) => {
            setSuccess(`Fee collected successfully! Receipt No: ${data.receiptNo}`);
            setLastReceiptNo(data.receiptNo);
            setError('');
            queryClient.invalidateQueries({ queryKey: ['student-dashboard', variables.studentId, variables.sessionId] });
            queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
            reset();
            setStudentInfo(null);
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || err.response?.data?.message || 'Failed to collect fee');
            setSuccess('');
            setLastReceiptNo(null);
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
        if (dashboard?.pendingBills) {
            const unpaidBill = dashboard.pendingBills.find((bill: any) => bill.balance > 0);
            if (unpaidBill) {
                let billPaidPool = unpaidBill.paid;
                const unpaidItems: any[] = [];

                unpaidBill.items.forEach((item: any) => {
                    const itemNet = item.amount - (item.discount || 0);
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

    const inputProps = useMemo(() => ({
        endAdornment: loadingStudent && (
            <InputAdornment position="end">
                <CircularProgress size={20} />
            </InputAdornment>
        ),
    }), [loadingStudent]);

    return (
        <Box>
            <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
                Fee Collection
            </Typography>

            <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', lg: 'nowrap' } }}>
                {/* Main Collection Form */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                            {success && (
                                <Alert
                                    severity="success"
                                    sx={{ mb: 3 }}
                                    action={
                                        lastReceiptNo && (
                                            <Button
                                                color="inherit"
                                                size="small"
                                                startIcon={<Printer size={16} />}
                                                onClick={() => window.open(`/api/fees/receipt/${lastReceiptNo}/pdf`, '_blank')}
                                            >
                                                Print Receipt
                                            </Button>
                                        )
                                    }
                                >
                                    {success}
                                </Alert>
                            )}

                            <Stack spacing={3}>
                                {/* Student Selection */}
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <Box sx={{ flex: '2 1 300px' }}>
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
                                                    InputProps={inputProps}
                                                />
                                            )}
                                        />
                                    </Box>
                                    <Box sx={{ flex: '1 1 200px' }}>
                                        <TextField
                                            label="Session"
                                            fullWidth
                                            value="APR 2024 - MAR 2025"
                                            InputProps={{ readOnly: true }}
                                        />
                                    </Box>
                                </Box>

                                {studentInfo && (
                                    <Alert
                                        severity={dashboard?.pendingBills?.length === 0 ? "warning" : "info"}
                                        action={
                                            dashboard?.pendingBills?.length === 0 && (
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    size="small"
                                                    component={Link}
                                                    href="/fees/demand-bills"
                                                >
                                                    Create Demand Bill
                                                </Button>
                                            )
                                        }
                                    >
                                        <Typography variant="subtitle2" fontWeight={600}>{studentInfo.name}</Typography>
                                        <Typography variant="body2">
                                            Class: {studentInfo.className}-{studentInfo.section} | Father: {studentInfo.fatherName}
                                        </Typography>
                                        {dashboard && (
                                            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                                                Outstanding Dues: ₹{dashboard.summary?.totalDues?.toLocaleString() || 0}
                                            </Typography>
                                        )}
                                        {dashboard?.pendingBills?.length > 0 && (
                                            <Button size="small" onClick={fillFeeStructure} sx={{ mt: 1 }}>
                                                Auto-Fill Outstanding Dues
                                            </Button>
                                        )}
                                    </Alert>
                                )}

                                <Divider />

                                {/* Fee Details Section */}
                                <Box>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                        <Typography variant="h6" fontWeight={600}>Fee Details</Typography>
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
                                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Net Amount</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 600 }}>Action</TableCell>
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
                                                                        <FormControl fullWidth size="small">
                                                                            <Select {...field} displayEmpty>
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
                                                        <Typography variant="h6" fontWeight={700}>Total:</Typography>
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
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <Box sx={{ flex: '1 1 200px' }}>
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
                                    </Box>
                                    <Box sx={{ flex: '1 1 200px' }}>
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
                                    </Box>
                                    <Box sx={{ flex: '1 1 200px' }}>
                                        <Controller
                                            name="collectedBy"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} label="Collected By" fullWidth placeholder="Staff name" />
                                            )}
                                        />
                                    </Box>
                                </Box>

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

                {/* Sidebar - Fee Status & Recent Transactions */}
                <Box sx={{ width: { xs: '100%', lg: 380 }, flexShrink: 0 }}>
                    <Stack spacing={3}>
                        {dashboard && (
                            <>
                                <Card elevation={2} sx={{ borderRadius: 3 }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Typography variant="h6" fontWeight={600} gutterBottom>Fee Summary</Typography>
                                        <Divider sx={{ my: 2 }} />
                                        <Stack spacing={2}>
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">Total Fee</Typography>
                                                <Typography variant="h6" fontWeight={600}>
                                                    ₹{dashboard.summary?.totalNet?.toLocaleString() || 0}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">Total Paid</Typography>
                                                <Typography variant="h6" fontWeight={600} color="success.main">
                                                    ₹{dashboard.summary?.totalPaid?.toLocaleString() || 0}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ pt: 2, borderTop: '1px solid #eee' }}>
                                                <Typography variant="body2" color="text.secondary">Outstanding Dues</Typography>
                                                <Typography variant="h4" fontWeight={700} color="error.main">
                                                    ₹{dashboard.summary?.totalDues?.toLocaleString() || 0}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>

                                {dashboard.feeHeads && (
                                    <Card elevation={2} sx={{ borderRadius: 3 }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography variant="h6" fontWeight={600} gutterBottom>Fee Head Status</Typography>
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
                                )}
                            </>
                        )}

                        {/* Recent Transactions */}
                        <Card elevation={2} sx={{ borderRadius: 3 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                                    <Clock size={18} />
                                    <Typography variant="subtitle1" fontWeight={600}>Recent Collections</Typography>
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
                                                        <Typography variant="body2" fontWeight={600}>{txn.receiptNo}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {txn.student?.name || txn.studentId}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ textAlign: 'right' }}>
                                                        <Typography variant="body2" fontWeight={700} color="success.main">
                                                            ₹{Number(txn.amount).toLocaleString()}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                        </Typography>
                                                    </Box>
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

// Component to extract search params
function SearchParamsWrapper() {
    const searchParams = useSearchParams();
    const studentId = searchParams.get('studentId');
    return <FeeCollectionContent initialStudentId={studentId} />;
}

// Main exported component with Suspense boundary
export default function FeeCollectionPage() {
    return (
        <Suspense fallback={
            <Box>
                <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
                    Fee Collection
                </Typography>
                <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
                    <Stack spacing={3}>
                        <Skeleton variant="rounded" height={56} />
                        <Skeleton variant="rounded" height={200} />
                        <Skeleton variant="rounded" height={56} />
                    </Stack>
                </Paper>
            </Box>
        }>
            <SearchParamsWrapper />
        </Suspense>
    );
}
