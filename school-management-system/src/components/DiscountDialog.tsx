import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    RadioGroup,
    FormControlLabel,
    Radio,
    FormLabel,
    Alert,
    Box,
    InputAdornment,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { feeTypeService, sessionService } from '../lib/api';

interface DiscountDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: DiscountFormData) => void;
    editData?: DiscountFormData | null;
    studentId?: string;
}

export interface DiscountFormData {
    id?: number;
    feeTypeId: number;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    reason?: string;
    sessionId: number;
}

export default function DiscountDialog({
    open,
    onClose,
    onSave,
    editData,
    studentId,
}: DiscountDialogProps) {
    const [formData, setFormData] = useState<DiscountFormData>({
        feeTypeId: 0,
        discountType: 'PERCENTAGE',
        discountValue: 0,
        reason: '',
        sessionId: 0,
    });
    const [error, setError] = useState('');

    // Fetch fee types
    const { data: feeTypesData } = useQuery({
        queryKey: ['feeTypes'],
        queryFn: () => feeTypeService.getAll(),
    });

    // Fetch active session
    const { data: activeSessionData } = useQuery({
        queryKey: ['activeSession'],
        queryFn: () => sessionService.getActive(),
    });

    // Fetch all sessions
    const { data: sessions } = useQuery({
        queryKey: ['allSessions'],
        queryFn: () => sessionService.getAll(),
    });

    // Set default session and load edit data
    // Set default session and load edit data
    useEffect(() => {
        if (editData) {
            setFormData(editData);
        } else if (activeSessionData?.id) {
            setFormData((prev) => ({
                ...prev,
                sessionId: activeSessionData.id,
            }));
        }
    }, [editData, activeSessionData]);

    const handleSubmit = () => {
        setError('');

        // Validation
        if (!formData.feeTypeId) {
            setError('Please select a fee type');
            return;
        }

        if (!formData.discountValue || formData.discountValue <= 0) {
            setError('Discount value must be greater than 0');
            return;
        }

        if (formData.discountType === 'PERCENTAGE' && formData.discountValue > 100) {
            setError('Percentage cannot exceed 100%');
            return;
        }

        // Merge studentId if available from props
        const finalSessionId = formData.sessionId || activeSessionData?.id;

        if (!finalSessionId) {
            setError('Active session not found. Please refresh the page.');
            return;
        }

        const payload = {
            ...formData,
            ...(studentId ? { studentId } : {}),
            sessionId: finalSessionId,
        };
        onSave(payload);
    };

    const handleClose = () => {
        setError('');
        setFormData({
            feeTypeId: 0,
            discountType: 'PERCENTAGE',
            discountValue: 0,
            reason: '',
            sessionId: activeSessionData?.id || 0,
        });
        onClose();
    };

    // ... (inside render) ...

    {
        sessions?.sessions?.map((session: any) => (
            <MenuItem key={session.id} value={session.id}>
                {session.name} {session.isActive ? '(Active)' : ''}
            </MenuItem>
        )) || (
                <MenuItem value={activeSessionData?.id}>
                    {activeSessionData?.name || 'Loading...'}
                </MenuItem>
            )
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>{editData ? 'Edit Fee Discount' : 'Add Fee Discount'}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    {error && (
                        <Alert severity="error" onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    {/* Fee Type Selector */}
                    <FormControl fullWidth required>
                        <InputLabel>Fee Type</InputLabel>
                        <Select
                            value={formData.feeTypeId}
                            onChange={(e) =>
                                setFormData({ ...formData, feeTypeId: Number(e.target.value) })
                            }
                            label="Fee Type"
                        >
                            {feeTypesData?.feeTypes?.map((type: any) => (
                                <MenuItem key={type.id} value={type.id}>
                                    {type.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Discount Type Radio */}
                    <FormControl component="fieldset">
                        <FormLabel component="legend">Discount Type *</FormLabel>
                        <RadioGroup
                            row
                            value={formData.discountType}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    discountType: e.target.value as 'PERCENTAGE' | 'FIXED',
                                })
                            }
                        >
                            <FormControlLabel
                                value="PERCENTAGE"
                                control={<Radio />}
                                label="Percentage"
                            />
                            <FormControlLabel value="FIXED" control={<Radio />} label="Fixed Amount" />
                        </RadioGroup>
                    </FormControl>

                    {/* Discount Value */}
                    <TextField
                        label="Discount Value"
                        type="number"
                        value={formData.discountValue || ''}
                        onChange={(e) =>
                            setFormData({ ...formData, discountValue: Number(e.target.value) })
                        }
                        required
                        fullWidth
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    {formData.discountType === 'PERCENTAGE' ? '%' : '₹'}
                                </InputAdornment>
                            ),
                        }}
                        helperText={
                            formData.discountType === 'PERCENTAGE'
                                ? 'Enter percentage (0-100)'
                                : 'Enter fixed amount in rupees'
                        }
                    />

                    {/* Reason */}
                    <TextField
                        label="Reason (Optional)"
                        multiline
                        rows={3}
                        value={formData.reason || ''}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        fullWidth
                        placeholder="e.g., Sibling discount, Merit scholarship, etc."
                        InputLabelProps={{ shrink: true }}
                    />

                    {/* Session Display */}
                    {/* Session Selector */}
                    <FormControl fullWidth required>
                        <InputLabel>Academic Session</InputLabel>
                        <Select
                            value={formData.sessionId}
                            onChange={(e) =>
                                setFormData({ ...formData, sessionId: Number(e.target.value) })
                            }
                            label="Academic Session"
                        >
                            {sessions?.sessions?.map((session: any) => (
                                <MenuItem key={session.id} value={session.id}>
                                    {session.name} {session.isActive ? '(Active)' : ''}
                                </MenuItem>
                            )) || (
                                    <MenuItem value={activeSessionData?.id}>
                                        {activeSessionData?.name || 'Loading...'}
                                    </MenuItem>
                                )}
                        </Select>
                    </FormControl>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained">
                    {editData ? 'Update' : 'Save'} Discount
                </Button>
            </DialogActions>
        </Dialog>
    );
}
