import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Paper,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Button,
    IconButton,
    Chip,
    Alert,
    Snackbar,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { discountService } from '../lib/api';
import DiscountDialog, { type DiscountFormData } from './DiscountDialog';

interface StudentDiscountsProps {
    studentId: string;
}

export default function StudentDiscounts({ studentId }: StudentDiscountsProps) {
    const [openDialog, setOpenDialog] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<DiscountFormData | null>(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');
    const queryClient = useQueryClient();

    // Fetch discounts for student
    const { data, isLoading } = useQuery({
        queryKey: ['discounts', studentId],
        queryFn: () => discountService.getByStudent(studentId),
        enabled: !!studentId,
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (data: DiscountFormData) =>
            discountService.create({
                studentId,
                feeTypeId: data.feeTypeId,
                sessionId: data.sessionId,
                discountType: data.discountType,
                discountValue: data.discountValue,
                reason: data.reason,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discounts', studentId] });
            handleCloseDialog();
            setSuccessMessage('Discount added successfully!');
        },
        onError: (error: any) => {
            setError(error?.response?.data?.message || 'Failed to add discount');
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: DiscountFormData }) =>
            discountService.update(id, {
                discountType: data.discountType,
                discountValue: data.discountValue,
                reason: data.reason,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discounts', studentId] });
            handleCloseDialog();
            setSuccessMessage('Discount updated successfully!');
        },
        onError: (error: any) => {
            setError(error?.response?.data?.message || 'Failed to update discount');
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: discountService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discounts', studentId] });
            setSuccessMessage('Discount deleted successfully!');
        },
        onError: (error: any) => {
            setError(error?.response?.data?.message || 'Failed to delete discount');
        },
    });

    const handleOpenDialog = (discount?: any) => {
        if (discount) {
            setEditingDiscount({
                id: discount.id,
                feeTypeId: discount.feeTypeId,
                sessionId: discount.sessionId,
                discountType: discount.discountType,
                discountValue: parseFloat(discount.discountValue),
                reason: discount.reason,
            });
        } else {
            setEditingDiscount(null);
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingDiscount(null);
    };

    const handleSave = (data: DiscountFormData) => {
        if (editingDiscount?.id) {
            updateMutation.mutate({ id: editingDiscount.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleDelete = (id: number, feeTypeName: string) => {
        if (
            confirm(`Are you sure you want to delete the discount for "${feeTypeName}"?`)
        ) {
            deleteMutation.mutate(id);
        }
    };

    if (isLoading) {
        return (
            <Paper sx={{ p: 3 }}>
                <Typography>Loading discounts...</Typography>
            </Paper>
        );
    }

    const discounts = data?.discounts || [];

    return (
        <>
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Fee Discounts</Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                        size="small"
                    >
                        Add Discount
                    </Button>
                </Box>

                {discounts.length === 0 ? (
                    <Alert severity="info">
                        No discounts configured. Click "Add Discount" to create one.
                    </Alert>
                ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Fee Type</strong></TableCell>
                                <TableCell><strong>Discount Type</strong></TableCell>
                                <TableCell><strong>Amount</strong></TableCell>
                                <TableCell><strong>Reason</strong></TableCell>
                                <TableCell><strong>Session</strong></TableCell>
                                <TableCell align="right"><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {discounts.map((discount: any) => (
                                <TableRow key={discount.id}>
                                    <TableCell>{discount.feeTypeName || discount.feeType?.name}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={discount.discountType}
                                            size="small"
                                            color={discount.discountType === 'PERCENTAGE' ? 'primary' : 'secondary'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {discount.discountType === 'PERCENTAGE'
                                            ? `${discount.discountValue}%`
                                            : `₹${discount.discountValue}`}
                                    </TableCell>
                                    <TableCell>{discount.reason || '-'}</TableCell>
                                    <TableCell>{discount.session?.name}</TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleOpenDialog(discount)}
                                            title="Edit Discount"
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDelete(discount.id, discount.feeType?.name)}
                                            title="Delete Discount"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Paper>

            {/* Dialog */}
            <DiscountDialog
                open={openDialog}
                onClose={handleCloseDialog}
                onSave={handleSave}
                editData={editingDiscount}
            />

            {/* Success Snackbar */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={4000}
                onClose={() => setSuccessMessage('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>

            {/* Error Snackbar */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>
        </>
    );
}
