'use client';

import { Container, Paper, Typography, Alert } from '@mui/material';

export default function ExamConfiguration() {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>Examination Configuration</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Configure exam types, subjects, and grading systems.
                </Typography>

                <Alert severity="info">
                    Examination configuration feature coming soon. This will allow you to set up exam types (Unit Test, Half Yearly, etc.) and subjects.
                </Alert>
            </Paper>
        </Container>
    );
}
