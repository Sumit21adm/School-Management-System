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

const AddClassDialog: React.FC<AddClassDialogProps> = ({ open, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        displayName: '',
        order: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.displayName || !formData.order) {
            setError('All fields are required');
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
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="M1"
                            helperText="Short code/abbreviation"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            name="order"
                            label="Order Number"
                            type="number"
                            fullWidth
                            value={formData.order}
                            onChange={handleChange}
                            placeholder="1"
                            helperText="Sorting order"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            name="displayName"
                            label="Display Name (e.g. Mount 1)"
                            fullWidth
                            value={formData.displayName}
                            onChange={handleChange}
                            placeholder="Mount 1"
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
