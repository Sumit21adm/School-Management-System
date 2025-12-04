import { useParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import StudentDiscounts from '../../components/StudentDiscounts';

export default function StudentDiscountsPage() {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();

    if (!studentId) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography color="error">Student ID is required</Typography>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/admissions')}
                >
                    Back
                </Button>
                <Typography variant="h5">
                    Manage Fee Discounts - Student {studentId}
                </Typography>
            </Box>

            <StudentDiscounts studentId={studentId} />
        </Container>
    );
}
