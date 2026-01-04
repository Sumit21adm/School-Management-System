'use client';

import { Container, Paper, Typography, Alert } from '@mui/material';

export default function Exams() {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>Examinations</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Manage exams, schedules, and results.
                </Typography>

                <Alert severity="info">
                    Examination management feature coming soon. This will allow you to create exams, set schedules, and record results.
                </Alert>
            </Paper>
        </Container>
    );
}
