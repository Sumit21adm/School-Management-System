'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { FileText, Download, Printer } from 'lucide-react';
import { feeService, feeTypeService, classService } from '@/lib/api';

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
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

export default function DemandBillGeneration() {
    const [generationResult, setGenerationResult] = useState<any>(null);
    const [error, setError] = useState('');
    const [selectedFeeTypes, setSelectedFeeTypes] = useState<number[]>([]);
    const [autoCalculateLateFees, setAutoCalculateLateFees] = useState(true);
    const queryClient = useQueryClient();

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const { control, handleSubmit, watch, formState: { errors } } = useForm<DemandBillFormData>({
        resolver: zodResolver(demandBillSchema),
        defaultValues: {
            generationType: 'single',
            studentId: '',
            className: '',
            section: '',
            sessionId: 1,
            month: currentMonth,
            year: currentYear,
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
    });

    const generationType = watch('generationType');

    // Fetch fee types
    const { data: feeTypesData } = useQuery({
        queryKey: ['fee-types'],
        queryFn: () => feeTypeService.getAll(),
        staleTime: 5 * 60 * 1000,
    });

    const feeTypes = feeTypesData?.feeTypes || feeTypesData || [];

    // Fetch classes
    const { data: classes } = useQuery({
        queryKey: ['classes'],
        queryFn: () => classService.getAll(),
    });

    // Pre-select Tuition Fee when fee types load
    const hasInitializedRef = useRef(false);
    useEffect(() => {
        if (feeTypes.length > 0 && !hasInitializedRef.current) {
            const tuitionFee = feeTypes.find((ft: any) => ft.name === 'Tuition Fee');
            if (tuitionFee) {
                setSelectedFeeTypes([tuitionFee.id]);
                hasInitializedRef.current = true;
            }
        }
    }, [feeTypes]);

    // Generate bills mutation
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

            return feeService.generateDemandBills(payload);
        },
        onSuccess: (data) => {
            setGenerationResult(data);
            setError('');
            queryClient.invalidateQueries({ queryKey: ['bill-generation-history'] });
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Failed to generate bills');
            setGenerationResult(null);
        },
    });

    const onSubmit = (data: DemandBillFormData) => {
        if (selectedFeeTypes.length === 0) {
            setError('Please select at least one fee type');
            return;
        }
        setError('');
        generateBillsMutation.mutate(data);
    };

    return (
        <Box>
            <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
                Demand Bill Generation
            </Typography>

            <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', lg: 'nowrap' } }}>
                {/* Left Side - Generation Form */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            {error && (
                                <Alert severity="error" sx={{ mb: 3 }}>
                                    <Typography variant="body2" fontWeight={600}>Error: {error}</Typography>
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
                                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                        <Box sx={{ flex: '1 1 200px' }}>
                                            <Controller
                                                name="className"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormControl fullWidth required>
                                                        <InputLabel>Class</InputLabel>
                                                        <Select {...field} label="Class">
                                                            <MenuItem value="">Select Class</MenuItem>
                                                            {(classes || []).map((cls: any) => (
                                                                <MenuItem key={cls.id} value={cls.name}>
                                                                    {cls.displayName || cls.name}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                )}
                                            />
                                        </Box>
                                        <Box sx={{ flex: '1 1 200px' }}>
                                            <Controller
                                                name="section"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormControl fullWidth>
                                                        <InputLabel>Section (Optional)</InputLabel>
                                                        <Select {...field} label="Section (Optional)">
                                                            <MenuItem value="">All Sections</MenuItem>
                                                            {SECTIONS.map((sec) => (
                                                                <MenuItem key={sec} value={sec}>Section {sec}</MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                )}
                                            />
                                        </Box>
                                    </Box>
                                )}

                                {/* Student ID, Month, Year */}
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    {generationType === 'single' && (
                                        <Box sx={{ flex: '1 1 200px' }}>
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
                                                        placeholder="Enter ID"
                                                    />
                                                )}
                                            />
                                        </Box>
                                    )}
                                    <Box sx={{ flex: '1 1 150px' }}>
                                        <Controller
                                            name="month"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControl fullWidth required>
                                                    <InputLabel>Month</InputLabel>
                                                    <Select {...field} label="Month">
                                                        {MONTHS.map((month, index) => (
                                                            <MenuItem key={month} value={index + 1}>{month}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            )}
                                        />
                                    </Box>
                                    <Box sx={{ flex: '1 1 120px' }}>
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
                                    </Box>
                                </Box>

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
                                        />
                                    )}
                                />

                                {/* Fee Types Selection */}
                                <Box>
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
                                                const tuitionFee = feeTypes.find((ft: any) => ft.name === 'Tuition Fee');
                                                setSelectedFeeTypes(tuitionFee ? [tuitionFee.id] : []);
                                            }}
                                        >
                                            Deselect All
                                        </Button>
                                    </Box>
                                    <FormGroup>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 1 }}>
                                            {feeTypes
                                                .filter((feeType: any) => !['Late Fee', 'Caution Money'].includes(feeType.name))
                                                .map((feeType: any) => (
                                                    <FormControlLabel
                                                        key={feeType.id}
                                                        control={
                                                            <Checkbox
                                                                checked={selectedFeeTypes.includes(feeType.id)}
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
                                                                    <Chip size="small" label={feeType.frequency} sx={{ height: 20 }} />
                                                                )}
                                                            </Box>
                                                        }
                                                    />
                                                ))}
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
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                                <Card variant="outlined" sx={{ flex: '1 1 100px' }}>
                                    <CardContent>
                                        <Typography variant="body2" color="text.secondary">Total</Typography>
                                        <Typography variant="h5" fontWeight={700}>{generationResult.total}</Typography>
                                    </CardContent>
                                </Card>
                                <Card variant="outlined" sx={{ flex: '1 1 100px', bgcolor: 'success.light' }}>
                                    <CardContent>
                                        <Typography variant="body2" color="text.secondary">Generated</Typography>
                                        <Typography variant="h5" fontWeight={700} color="success.dark">{generationResult.generated}</Typography>
                                    </CardContent>
                                </Card>
                                <Card variant="outlined" sx={{ flex: '1 1 100px', bgcolor: 'warning.light' }}>
                                    <CardContent>
                                        <Typography variant="body2" color="text.secondary">Skipped</Typography>
                                        <Typography variant="h5" fontWeight={700} color="warning.dark">{generationResult.skipped}</Typography>
                                    </CardContent>
                                </Card>
                                <Card variant="outlined" sx={{ flex: '1 1 100px', bgcolor: 'error.light' }}>
                                    <CardContent>
                                        <Typography variant="body2" color="text.secondary">Failed</Typography>
                                        <Typography variant="h5" fontWeight={700} color="error.dark">{generationResult.failed}</Typography>
                                    </CardContent>
                                </Card>
                            </Box>

                            {generationResult.results && generationResult.results.length > 0 && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>Bill Details</Typography>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600 }}>Student ID</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>Bill No</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
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
                                                                    result.status === 'success' ? 'success' :
                                                                        result.status === 'skipped' ? 'warning' : 'error'
                                                                }
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            {result.status === 'success' && result.billNo && (
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    startIcon={<Printer size={14} />}
                                                                    onClick={() => feeService.openDemandBillPdf(result.billNo)}
                                                                >
                                                                    Print
                                                                </Button>
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
                            </Stack>
                        </Paper>
                    )}
                </Box>

                {/* Right Sidebar */}
                <Box sx={{ width: { xs: '100%', lg: 380 }, flexShrink: 0 }}>
                    <Stack spacing={3}>
                        <Card elevation={2} sx={{ borderRadius: 3, bgcolor: 'primary.main', color: 'white' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight={600} gutterBottom>💡 Quick Tips</Typography>
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
                                <Typography variant="h6" fontWeight={600} gutterBottom>About Demand Bills</Typography>
                                <Typography variant="body2" paragraph>
                                    Demand bills are monthly fee invoices generated for students. They include:
                                </Typography>
                                <Stack spacing={1}>
                                    <Typography variant="body2">✓ Selected fee types for the month</Typography>
                                    <Typography variant="body2">✓ Previous month&apos;s outstanding dues</Typography>
                                    <Typography variant="body2">✓ Applicable discounts</Typography>
                                    <Typography variant="body2">✓ Late fees (auto-calculated if enabled)</Typography>
                                    <Typography variant="body2">✓ Due date for payment</Typography>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                </Box>
            </Box>
        </Box>
    );
}
