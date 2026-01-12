import { useParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import StudentDiscounts from '../../components/StudentDiscounts';
import PageHeader from '../../components/PageHeader';

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
        <Box>
            <PageHeader
                title={`Manage Fee Discounts - Student ${studentId}`}
                action={
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/admissions')}
                    >
                        Back
                    </Button>
                }
            />

            <StudentDiscounts studentId={studentId} />
        </Box>
    );
}
