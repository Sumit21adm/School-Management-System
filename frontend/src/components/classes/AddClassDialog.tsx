import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Grid,
    Alert
} from '@mui/material';
import { classService } from '../../lib/api';

interface AddClassDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface FormErrors {
    name?: string;
    displayName?: string;
    order?: string;
}

const AddClassDialog: React.FC<AddClassDialogProps> = ({ open, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        displayName: '',
        order: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Clear field error on change
        if (fieldErrors[name as keyof FormErrors]) {
            setFieldErrors({ ...fieldErrors, [name]: undefined });
        }
    };

    const validateForm = (): boolean => {
        const errors: FormErrors = {};

        if (!formData.name.trim()) {
            errors.name = 'Class code is required';
        }
        if (!formData.displayName.trim()) {
            errors.displayName = 'Display name is required';
        }
        if (!formData.order.trim()) {
            errors.order = 'Order number is required';
        } else if (isNaN(Number(formData.order)) || Number(formData.order) < 0) {
            errors.order = 'Order must be a positive number';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await classService.create({
                name: formData.name,
                displayName: formData.displayName,
                order: parseInt(formData.order)
            });
            onSuccess();
            setFormData({ name: '', displayName: '', order: '' });
            setFieldErrors({});
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to create class');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Class</DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            name="name"
                            label="Class Code (e.g. M1)"
                            fullWidth
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="M1"
                            error={!!fieldErrors.name}
                            helperText={fieldErrors.name || "Short code/abbreviation"}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            name="order"
                            label="Order Number"
                            type="number"
                            fullWidth
                            required
                            value={formData.order}
                            onChange={handleChange}
                            placeholder="1"
                            error={!!fieldErrors.order}
                            helperText={fieldErrors.order || "Sorting order"}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            name="displayName"
                            label="Display Name (e.g. Mount 1)"
                            fullWidth
                            required
                            value={formData.displayName}
                            onChange={handleChange}
                            placeholder="Mount 1"
                            error={!!fieldErrors.displayName}
                            helperText={fieldErrors.displayName}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Class'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddClassDialog;

