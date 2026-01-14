import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Grid,
    Typography,
    Autocomplete,
    CircularProgress,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { transportService, type Route, type StudentTransport } from '../../lib/api/transport';
import { apiClient } from '../../lib/api'; // Direct api access for student search
import PageHeader from '../../components/PageHeader';
import { useSnackbar } from 'notistack';

// Initial form types
interface AssignmentFormData {
    studentId: string | null;
    routeId: string;
    pickupStopId: string;
    dropStopId: string;
    transportType: 'pickup' | 'drop' | 'both';
    startDate: string;
}

export default function TransportAssignments() {
    const { enqueueSnackbar } = useSnackbar();
    const [assignments, setAssignments] = useState<StudentTransport[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Student Search State
    const [studentOptions, setStudentOptions] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Selected Route logic
    const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);

    const { control, handleSubmit, reset, watch } = useForm<AssignmentFormData>({
        defaultValues: {
            studentId: null,
            routeId: '',
            pickupStopId: '',
            dropStopId: '',
            transportType: 'both',
            startDate: new Date().toISOString().split('T')[0],
        },
    });

    const watchedRouteId = watch('routeId');

    useEffect(() => {
        if (watchedRouteId) {
            setSelectedRouteId(Number(watchedRouteId));
        } else {
            setSelectedRouteId(null);
        }
    }, [watchedRouteId]);

    const fetchData = async () => {
        try {
            const [assignmentsData, routesData] = await Promise.all([
                transportService.getAssignments(),
                transportService.getRoutes('active'),
            ]);
            setAssignments(assignmentsData);
            setRoutes(routesData);
        } catch (error: any) {
            console.error('Fetch error:', error);
            const message = error.response?.data?.message || 'Failed to fetch data';
            enqueueSnackbar(message, { variant: 'error' });
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStudentSearch = async (query: string) => {
        if (!query) return;
        setLoadingStudents(true);
        try {
            // Mock search if admissionService.searchStudents doesn't exist
            // Or use apiClient directly
            // Use apiClient to call /admissions (findAll)
            const response = await apiClient.get('/admissions', { params: { search: query } });
            // The API returns { data: [...], meta: ... }, so we need response.data.data
            setStudentOptions(response.data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleOpen = (assignment?: StudentTransport) => {
        if (assignment) {
            setEditingId(assignment.id);
            setSelectedRouteId(assignment.route.id);
            reset({
                studentId: assignment.student.studentId, // We can't easily set the object for Autocomplete in edit mode without fetching full student... 
                // For Edit, maybe just show student name as readonly and hide autocomplete?
                routeId: assignment.route.id.toString(),
                pickupStopId: assignment.pickupStop?.id?.toString() || '',
                dropStopId: assignment.dropStop?.id?.toString() || '',
                transportType: assignment.transportType as 'pickup' | 'drop' | 'both',
                startDate: '', // Can't edit start date easily
            });
            // Pre-set student option for display
            setStudentOptions([{
                studentId: assignment.student.studentId,
                name: assignment.student.name,
                className: assignment.student.className,
                section: assignment.student.section
            }]);
        } else {
            setEditingId(null);
            setSelectedRouteId(null);
            reset({
                studentId: null,
                routeId: '',
                pickupStopId: '',
                dropStopId: '',
                transportType: 'both',
                startDate: new Date().toISOString().split('T')[0],
            });
            setStudentOptions([]);
        }
        setOpen(true);
    };

    const onSubmit = async (data: AssignmentFormData) => {
        try {
            const payload = {
                routeId: Number(data.routeId),
                pickupStopId: data.pickupStopId ? Number(data.pickupStopId) : undefined,
                dropStopId: data.dropStopId ? Number(data.dropStopId) : undefined,
                transportType: data.transportType,
                startDate: data.startDate,
            };

            if (editingId) {
                await transportService.updateAssignment(editingId, {
                    ...payload,
                    startDate: undefined
                });
                enqueueSnackbar('Assignment updated', { variant: 'success' });
            } else {
                if (!data.studentId) {
                    enqueueSnackbar("Please select a student", { variant: 'error' });
                    return;
                }
                await transportService.assignTransport({
                    studentId: data.studentId,
                    ...payload
                } as any);
                enqueueSnackbar('Transport assigned', { variant: 'success' });
            }
            setOpen(false);
            fetchData();
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.message || 'Operation failed', { variant: 'error' });
        }
    };

    const handleRemove = async (id: number) => {
        if (window.confirm('Remove transport assignment for this student?')) {
            try {
                await transportService.removeAssignment(id);
                enqueueSnackbar('Assignment removed', { variant: 'success' });
                fetchData();
            } catch (error) {
                enqueueSnackbar('Failed to remove assignment', { variant: 'error' });
            }
        }
    };

    // Get stops for the currently selected route
    const currentRouteStops = routes.find(r => r.id === selectedRouteId)?.stops || [];

    return (
        <Box>
            <PageHeader
                title="Student Transport Assignments"
                subtitle="Assign buses and routes to students"
                action={
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpen()}
                    >
                        Assign Transport
                    </Button>
                }
            />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Student</TableCell>
                            <TableCell>Class</TableCell>
                            <TableCell>Route</TableCell>
                            <TableCell>Stop (Pickup/Drop)</TableCell>
                            <TableCell>Fee</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {assignments.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell>
                                    <Typography variant="subtitle2">{row.student.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{row.student.studentId}</Typography>
                                </TableCell>
                                <TableCell>{row.student.className} - {row.student.section}</TableCell>
                                <TableCell>
                                    {row.route.routeName}
                                    <br />
                                    <Typography variant="caption" color="text.secondary">{row.route.routeCode}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Box>
                                        {row.pickupStop && <Typography variant="caption" display="block">P: {row.pickupStop.stopName}</Typography>}
                                        {row.dropStop && <Typography variant="caption" display="block">D: {row.dropStop.stopName}</Typography>}
                                        {!row.pickupStop && !row.dropStop && "-"}
                                    </Box>
                                </TableCell>
                                <TableCell>₹{row.route.monthlyFee}</TableCell>
                                <TableCell>
                                    <Chip label={row.transportType} size="small" sx={{ textTransform: 'capitalize' }} />
                                </TableCell>
                                <TableCell>
                                    <Chip label={row.status} color="success" size="small" />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => handleOpen(row)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleRemove(row.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {assignments.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No assignments found.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingId ? 'Edit Assignment' : 'Assign Transport'}</DialogTitle>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogContent>
                        <Grid container spacing={2}>
                            {/* Student Search - Only show when creating new */}
                            {!editingId && (
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="studentId"
                                        control={control}
                                        rules={{ required: 'Student is required' }}
                                        render={({ field }) => (
                                            <Autocomplete
                                                options={studentOptions}
                                                loading={loadingStudents}
                                                getOptionLabel={(option) => `${option.name} (${option.studentId})`}
                                                onInputChange={(_, value) => handleStudentSearch(value)}
                                                onChange={(_, value) => field.onChange(value?.studentId)}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="Search Student (ID or Name)"
                                                        InputProps={{
                                                            ...params.InputProps,
                                                            endAdornment: (
                                                                <>
                                                                    {loadingStudents ? <CircularProgress color="inherit" size={20} /> : null}
                                                                    {params.InputProps.endAdornment}
                                                                </>
                                                            ),
                                                        }}
                                                    />
                                                )}
                                            />
                                        )}
                                    />
                                </Grid>
                            )}

                            <Grid size={{ xs: 12 }}>
                                <Controller
                                    name="routeId"
                                    control={control}
                                    rules={{ required: 'Route is required' }}
                                    render={({ field }) => (
                                        <TextField {...field} select label="Select Route" fullWidth>
                                            {routes.map((route) => (
                                                <MenuItem key={route.id} value={route.id}>
                                                    {route.routeName} (₹{route.monthlyFee})
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    )}
                                />
                            </Grid>

                            {selectedRouteId && (
                                <>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Controller
                                            name="pickupStopId"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} select label="Pickup Stop" fullWidth>
                                                    <MenuItem value=""><em>None</em></MenuItem>
                                                    {currentRouteStops.map(stop => (
                                                        <MenuItem key={stop.id} value={stop.id}>{stop.stopName} ({stop.pickupTime})</MenuItem>
                                                    ))}
                                                </TextField>
                                            )}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Controller
                                            name="dropStopId"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} select label="Drop Stop" fullWidth>
                                                    <MenuItem value=""><em>None</em></MenuItem>
                                                    {currentRouteStops.map(stop => (
                                                        <MenuItem key={stop.id} value={stop.id}>{stop.stopName} ({stop.dropTime})</MenuItem>
                                                    ))}
                                                </TextField>
                                            )}
                                        />
                                    </Grid>
                                </>
                            )}

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Controller
                                    name="transportType"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} select label="Transport Type" fullWidth>
                                            <MenuItem value="both">Both (Pickup & Drop)</MenuItem>
                                            <MenuItem value="pickup">Pickup Only</MenuItem>
                                            <MenuItem value="drop">Drop Only</MenuItem>
                                        </TextField>
                                    )}
                                />
                            </Grid>

                            {!editingId && (
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Controller
                                        name="startDate"
                                        control={control}
                                        rules={{ required: 'Start Date is required' }}
                                        render={({ field, fieldState: { error } }) => (
                                            <TextField
                                                {...field}
                                                label="Start Date"
                                                type="date"
                                                fullWidth
                                                InputLabelProps={{ shrink: true }}
                                                error={!!error}
                                                helperText={error?.message}
                                            />
                                        )}
                                    />
                                </Grid>
                            )}
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">{editingId ? 'Update' : 'Assign'}</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
