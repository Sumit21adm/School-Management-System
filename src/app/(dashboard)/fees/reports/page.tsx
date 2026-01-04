'use client';

import { Container, Paper, Typography, Alert } from '@mui/material';

export default function FeeReports() {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>Fee Receipts</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    View and print fee receipts.
                </Typography>

                <Alert severity="info">
                    Fee receipt viewing and printing feature coming soon. You&apos;ll be able to search receipts by date, student, or receipt number.
                </Alert>
            </Paper>
        </Container>
    );
}
