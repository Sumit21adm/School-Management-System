
import { useQuery } from '@tanstack/react-query';
import { Box, Card, CardContent, Typography, Grid, Chip, CircularProgress, Stack, Button } from '@mui/material';
import { transportService } from '../../lib/api/transport';
import { DirectionsBus, Person } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { hasPermission } from '../../utils/permissions';

import type { StudentTransport } from '../../lib/api/transport';

interface StudentTransportDetailsProps {
    studentId: string;
    transportData?: StudentTransport | null;
}

export default function StudentTransportDetails({ studentId, transportData }: StudentTransportDetailsProps) {
    const { data: assignment, isLoading, error } = useQuery({
        queryKey: ['student-transport', studentId],
        queryFn: () => transportService.getStudentAssignment(studentId),
        retry: false,
        enabled: !transportData, // Don't fetch if data is passed
        initialData: transportData || undefined, // Use passed data if available
    });

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;
    }

    if (error || !assignment) {
        return (
            <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography color="text.secondary" gutterBottom>No transport assigned to this student.</Typography>
                {hasPermission('transport_assign') && (
                    <Button
                        variant="outlined"
                        startIcon={<DirectionsBus />}
                        component={Link}
                        to="/transport/assignments"
                    >
                        Assign Transport
                    </Button>
                )}
            </Box>
        );
    }

    return (
        <Card variant="outlined">
            <CardContent>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" color="primary">Transport Details</Typography>
                            <Chip
                                label={assignment.status}
                                color={assignment.status === 'active' ? 'success' : 'default'}
                                size="small"
                                sx={{ textTransform: 'capitalize' }}
                            />
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary">Route</Typography>
                        <Typography variant="body1" fontWeight="medium">
                            {assignment.route?.routeName} ({assignment.route?.routeCode})
                        </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary">Vehicle</Typography>
                        <Typography variant="body1">
                            {assignment.route?.vehicle?.vehicleNo ? (
                                <>
                                    {assignment.route.vehicle.vehicleNo}
                                    <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                        ({assignment.route.vehicle.vehicleType})
                                    </Typography>
                                </>
                            ) : '-'}
                        </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary">Pickup Point</Typography>
                        <Typography variant="body1">{assignment.pickupStop?.stopName || 'N/A'}</Typography>
                        {assignment.pickupStop?.pickupTime && (
                            <Typography variant="caption" color="text.secondary">
                                Arrival: {assignment.pickupStop.pickupTime}
                            </Typography>
                        )}
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary">Drop Point</Typography>
                        <Typography variant="body1">{assignment.dropStop?.stopName || 'N/A'}</Typography>
                        {assignment.dropStop?.dropTime && (
                            <Typography variant="caption" color="text.secondary">
                                Departure: {assignment.dropStop.dropTime}
                            </Typography>
                        )}
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary">Driver</Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Person fontSize="small" color="action" />
                            <Typography variant="body1">
                                {assignment.route?.vehicle?.driver?.name || 'Unassigned'}
                            </Typography>
                        </Stack>
                        {assignment.route?.vehicle?.driver?.phone && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 3 }}>
                                {assignment.route.vehicle.driver.phone}
                            </Typography>
                        )}
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" color="text.secondary">Monthly Fee</Typography>
                        <Typography variant="h6" color="primary.main">
                            ₹{assignment.calculatedFee || assignment.route?.monthlyFee || 0}
                        </Typography>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}
