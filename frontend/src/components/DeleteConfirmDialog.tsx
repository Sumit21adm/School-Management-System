import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    FormControlLabel,
    Checkbox,
    Alert
} from '@mui/material';

interface DeleteConfirmDialogProps {
    open: boolean;
    title?: string;
    userName: string;
    onClose: () => void;
    onConfirm: (permanent: boolean) => void;
}

export default function DeleteConfirmDialog({
    open,
    title = 'Delete User',
    userName,
    onClose,
    onConfirm,
}: DeleteConfirmDialogProps) {
    const [permanentDelete, setPermanentDelete] = useState(false);

    const handleConfirm = () => {
        onConfirm(permanentDelete);
        onClose();
        setPermanentDelete(false); // Reset for next time
    };

    const handleClose = () => {
        onClose();
        setPermanentDelete(false); // Reset checkbox
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
        >
            <DialogTitle id="delete-dialog-title">
                {title}
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="delete-dialog-description">
                    Are you sure you want to delete <strong>{userName}</strong>?
                </DialogContentText>

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={permanentDelete}
                            onChange={(e) => setPermanentDelete(e.target.checked)}
                            color="error"
                        />
                    }
                    label="Permanently delete (cannot be undone)"
                    sx={{ mt: 2 }}
                />

                {permanentDelete && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        <strong>Warning:</strong> This will permanently remove the user from the database.
                        All associated data will be lost. This action cannot be undone!
                    </Alert>
                )}

                {!permanentDelete && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        The user will be marked as inactive and can be restored later.
                        Data will be preserved for historical records.
                    </Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="inherit">
                    Cancel
                </Button>
                <Button
                    onClick={handleConfirm}
                    color="error"
                    variant="contained"
                    autoFocus={!permanentDelete}
                >
                    {permanentDelete ? 'Permanently Delete' : 'Delete'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
