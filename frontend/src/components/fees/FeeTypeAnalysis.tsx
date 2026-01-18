import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Stack,
    Skeleton,
    Chip,
    Alert,
    LinearProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { apiClient } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';

interface FeeTypeData {
    feeTypeId: number;
    feeType: string;
    frequency: string;
    totalDemanded: number;
    totalDiscount: number;
    netDemanded: number;
    totalCollected: number;
    pending: number;
    collectionRate: number;
    billCount: number;
    paymentCount: number;
}

interface AnalysisReport {
    sessionId: number;
    className: string;
    generatedAt: string;
    summary: {
        totalDemanded: number;
        totalDiscount: number;
        totalCollected: number;
        totalPending: number;
        overallCollectionRate: number;
    };
    feeTypes: FeeTypeData[];
}

interface FeeTypeAnalysisProps {
    sessionId: number;
    classes: Array<{ id: number; name: string; displayName?: string }>;
}

export default function FeeTypeAnalysis({ sessionId, classes }: FeeTypeAnalysisProps) {
    const [data, setData] = useState<AnalysisReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedClass, setSelectedClass] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!sessionId) return;

            setIsLoading(true);
            setError(null);
            try {
                const params: any = { sessionId };
                if (selectedClass) params.className = selectedClass;

                const { data: result } = await apiClient.get('/fees/reports/fee-analysis', { params });
                setData(result);
            } catch (err) {
                setError('Failed to load fee analysis');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [sessionId, selectedClass]);

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    const getCollectionColor = (rate: number): 'success' | 'warning' | 'error' => {
        if (rate >= 80) return 'success';
        if (rate >= 50) return 'warning';
        return 'error';
    };

    return (
        <Box>
            {/* Filter */}
            <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Filter by Class</InputLabel>
                    <Select
                        value={selectedClass}
                        label="Filter by Class"
                        onChange={(e) => setSelectedClass(e.target.value)}
                    >
                        <MenuItem value="">All Classes</MenuItem>
                        {classes?.map((c) => (
                            <MenuItem key={c.id} value={c.name}>
                                {c.displayName || c.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Paper>

            {/* Summary Cards */}
            <Paper elevation={2} sx={{ p: 2.5, mb: 3, borderRadius: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    <Stack direction="row" spacing={4} divider={<Box sx={{ borderRight: 1, borderColor: 'divider' }} />}>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Total Demanded</Typography>
                            <Typography variant="h5" fontWeight={700} color="primary.main">
                                {isLoading ? <Skeleton width={120} /> : formatCurrency(data?.summary.totalDemanded || 0)}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Total Discount</Typography>
                            <Typography variant="h5" fontWeight={700} color="secondary.main">
                                {isLoading ? <Skeleton width={100} /> : formatCurrency(data?.summary.totalDiscount || 0)}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Total Collected</Typography>
                            <Typography variant="h5" fontWeight={700} color="success.main">
                                {isLoading ? <Skeleton width={120} /> : formatCurrency(data?.summary.totalCollected || 0)}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Pending</Typography>
                            <Typography variant="h5" fontWeight={700} color="error.main">
                                {isLoading ? <Skeleton width={100} /> : formatCurrency(data?.summary.totalPending || 0)}
                            </Typography>
                        </Box>
                    </Stack>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">Collection Rate</Typography>
                        <Typography
                            variant="h4"
                            fontWeight={700}
                            color={`${getCollectionColor(data?.summary.overallCollectionRate || 0)}.main`}
                        >
                            {isLoading ? <Skeleton width={80} /> : `${data?.summary.overallCollectionRate || 0}%`}
                        </Typography>
                    </Box>
                </Stack>
            </Paper>

            {/* Fee Types Table */}
            <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Fee Type</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Frequency</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Demanded</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Discount</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Collected</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="right">Pending</TableCell>
                                <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>Collection Rate</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                [...Array(6)].map((_, i) => (
                                    <TableRow key={i}>
                                        {[...Array(7)].map((_, j) => (
                                            <TableCell key={j}><Skeleton variant="text" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : data?.feeTypes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        No fee data found for the selected criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data?.feeTypes.map((ft) => (
                                    <TableRow key={ft.feeTypeId} hover>
                                        <TableCell sx={{ fontWeight: 500 }}>{ft.feeType}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={ft.frequency}
                                                size="small"
                                                variant="outlined"
                                                color={ft.frequency === 'monthly' ? 'primary' : 'secondary'}
                                            />
                                        </TableCell>
                                        <TableCell align="right">{formatCurrency(ft.totalDemanded)}</TableCell>
                                        <TableCell align="right" sx={{ color: 'secondary.main' }}>
                                            {formatCurrency(ft.totalDiscount)}
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: 'success.main', fontWeight: 500 }}>
                                            {formatCurrency(ft.totalCollected)}
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: 'error.main', fontWeight: 500 }}>
                                            {formatCurrency(ft.pending)}
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={ft.collectionRate}
                                                    color={getCollectionColor(ft.collectionRate)}
                                                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                                                />
                                                <Typography variant="body2" fontWeight={600} sx={{ minWidth: 40 }}>
                                                    {ft.collectionRate}%
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
