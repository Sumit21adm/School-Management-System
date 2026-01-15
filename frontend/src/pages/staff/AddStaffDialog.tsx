import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Stepper, Step, StepLabel, Box, TextField, MenuItem,
    Typography, Stack, CircularProgress
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { staffService, UserRole, type Staff } from '../../lib/api/staff';
import { roleSettingsService, type EnabledRole } from '../../lib/api/roleSettings';
import { useSnackbar } from 'notistack';

interface AddStaffDialogProps {
    open: boolean;
    onClose: (refresh?: boolean) => void;
    staffToEdit: Staff | null;
    initialRole?: UserRole;
}

const steps = ['Identity & Role', 'HR Details', 'Professional Info', 'Review'];

export default function AddStaffDialog({ open, onClose, staffToEdit, initialRole }: AddStaffDialogProps) {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [enabledRoles, setEnabledRoles] = useState<EnabledRole[]>([]);
    const { enqueueSnackbar } = useSnackbar();

    // Fetch enabled roles on mount
    useEffect(() => {
        roleSettingsService.getEnabledRoles()
            .then(roles => {
                // Filter out STUDENT and PARENT for staff management
                const staffRoles = roles.filter(r => r.role !== 'STUDENT' && r.role !== 'PARENT');
                setEnabledRoles(staffRoles);
            })
            .catch(err => console.error('Failed to fetch enabled roles:', err));
    }, []);

    // Determine if we are editing
    const isEdit = !!staffToEdit;

    const { control, handleSubmit, watch, reset } = useForm({
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            role: initialRole || UserRole.TEACHER,
            username: '',
            password: '',

            // HR
            designation: '',
            department: '',
            joiningDate: new Date().toISOString().split('T')[0],
            basicSalary: 0,
            bankName: '',
            accountNo: '',
            ifscCode: '',
            panNo: '',
            aadharNo: '',

            // Professional
            qualification: '',
            experience: '',
            specialization: '',

            // Driver
            licenseNumber: '',
            licenseExpiry: '',
            badgeNumber: '',
        }
    });

    const watchedRole = watch('role');

    useEffect(() => {
        if (staffToEdit) {
            reset({
                name: staffToEdit.name,
                email: staffToEdit.email || '',
                phone: staffToEdit.phone || '',
                role: staffToEdit.role,
                username: staffToEdit.username,
                password: '',

                designation: staffToEdit.staffDetails?.designation || '',
                department: staffToEdit.staffDetails?.department || '',
                joiningDate: staffToEdit.staffDetails?.joiningDate ? new Date(staffToEdit.staffDetails.joiningDate).toISOString().split('T')[0] : '',
                basicSalary: staffToEdit.staffDetails?.basicSalary || 0,
                bankName: staffToEdit.staffDetails?.bankName || '',
                accountNo: staffToEdit.staffDetails?.accountNo || '',
                ifscCode: staffToEdit.staffDetails?.ifscCode || '',
                panNo: staffToEdit.staffDetails?.panNo || '',
                aadharNo: staffToEdit.staffDetails?.aadharNo || '',

                qualification: staffToEdit.teacherProfile?.qualification || staffToEdit.staffDetails?.qualification || '',
                experience: staffToEdit.teacherProfile?.experience || staffToEdit.staffDetails?.experience || '',
                specialization: staffToEdit.teacherProfile?.specialization || '',
                licenseNumber: staffToEdit.driverDetails?.licenseNumber || '',
                licenseExpiry: staffToEdit.driverDetails?.licenseExpiry ? new Date(staffToEdit.driverDetails.licenseExpiry).toISOString().split('T')[0] : '',
                badgeNumber: staffToEdit.driverDetails?.badgeNumber || '',
            });
        } else {
            reset();
        }
        setActiveStep(0);
    }, [staffToEdit, open, reset]);

    const handleNext = () => {
        if (activeStep === steps.length - 1) {
            submitForm();
        } else {
            setActiveStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const submitForm = handleSubmit(async (data) => {
        setLoading(true);
        try {
            const payload = {
                ...data,
                joiningDate: new Date(data.joiningDate),
                basicSalary: Number(data.basicSalary)
            };

            if (isEdit && staffToEdit) {
                await staffService.update(staffToEdit.id, payload);
                enqueueSnackbar('Staff updated successfully', { variant: 'success' });
            } else {
                await staffService.create(payload);
                enqueueSnackbar('Staff created successfully', { variant: 'success' });
            }
            onClose(true);
        } catch (error: any) {
            console.error(error);
            enqueueSnackbar(error.response?.data?.message || 'Operation failed', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    });

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <Stack spacing={2}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <Box flex={1}>
                                <Controller
                                    name="role"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} select label="Role" fullWidth required>
                                            {enabledRoles.map((role) => (
                                                <MenuItem key={role.role} value={role.role}>
                                                    {role.displayName}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    )}
                                />
                            </Box>
                            <Box flex={1}>
                                <Controller
                                    name="name"
                                    control={control}
                                    rules={{ required: 'Name is required' }}
                                    render={({ field, fieldState }) => (
                                        <TextField {...field} label="Full Name" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
                                    )}
                                />
                            </Box>
                        </Stack>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <Box flex={1}>
                                <Controller
                                    name="email"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label="Email" fullWidth type="email" />
                                    )}
                                />
                            </Box>
                            <Box flex={1}>
                                <Controller
                                    name="phone"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label="Phone" fullWidth />
                                    )}
                                />
                            </Box>
                        </Stack>
                        {!isEdit && (
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <Box flex={1}>
                                    <Controller
                                        name="username"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField {...field} label="Username (Optional)" fullWidth helperText="Leave blank to auto-generate" />
                                        )}
                                    />
                                </Box>
                                <Box flex={1}>
                                    <Controller
                                        name="password"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField {...field} label="Password (Optional)" fullWidth type="password" helperText="Default: Welcome@123" />
                                        )}
                                    />
                                </Box>
                            </Stack>
                        )}
                    </Stack>
                );
            case 1:
                return (
                    <Stack spacing={2}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <Box flex={1}>
                                <Controller
                                    name="designation"
                                    control={control}
                                    rules={{ required: 'Designation is required' }}
                                    render={({ field, fieldState }) => (
                                        <TextField {...field} label="Designation" fullWidth required error={!!fieldState.error} helperText={fieldState.error?.message} />
                                    )}
                                />
                            </Box>
                            <Box flex={1}>
                                <Controller
                                    name="department"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label="Department" fullWidth />
                                    )}
                                />
                            </Box>
                        </Stack>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <Box flex={1}>
                                <Controller
                                    name="joiningDate"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label="Joining Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
                                    )}
                                />
                            </Box>
                            <Box flex={1}>
                                <Controller
                                    name="basicSalary"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label="Basic Salary" type="number" fullWidth />
                                    )}
                                />
                            </Box>
                        </Stack>
                        <Typography variant="subtitle2">Bank Details</Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <Box flex={1}>
                                <Controller name="bankName" control={control} render={({ field }) => <TextField {...field} label="Bank Name" fullWidth size="small" />} />
                            </Box>
                            <Box flex={1}>
                                <Controller name="accountNo" control={control} render={({ field }) => <TextField {...field} label="Account No" fullWidth size="small" />} />
                            </Box>
                        </Stack>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <Box flex={1}>
                                <Controller name="ifscCode" control={control} render={({ field }) => <TextField {...field} label="IFSC Code" fullWidth size="small" />} />
                            </Box>
                            <Box flex={1}>
                                <Controller name="panNo" control={control} render={({ field }) => <TextField {...field} label="PAN No" fullWidth size="small" />} />
                            </Box>
                        </Stack>
                    </Stack>
                );
            case 2:
                return (
                    <Stack spacing={2}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <Box flex={1}>
                                <Controller
                                    name="qualification"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label="Qualification" fullWidth helperText="Highest Degree" />
                                    )}
                                />
                            </Box>
                            <Box flex={1}>
                                <Controller
                                    name="experience"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} label="Experience" fullWidth helperText="e.g. 5 Years" />
                                    )}
                                />
                            </Box>
                        </Stack>
                        {watchedRole === UserRole.TEACHER && (
                            <Box>
                                <Controller
                                    name="specialization"
                                    control={control}
                                    rules={{ required: watchedRole === UserRole.TEACHER ? 'Specialization is required for teachers' : false }}
                                    render={({ field, fieldState }) => (
                                        <TextField {...field} label="Specialization (Subject)" fullWidth required error={!!fieldState.error} helperText={fieldState.error?.message} />
                                    )}
                                />
                            </Box>
                        )}
                        {watchedRole === UserRole.DRIVER && (
                            <Stack spacing={2}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <Box flex={1}>
                                        <Controller
                                            name="licenseNumber"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} label="Driving License No" fullWidth required />
                                            )}
                                        />
                                    </Box>
                                    <Box flex={1}>
                                        <Controller
                                            name="licenseExpiry"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField {...field} label="License Expiry" type="date" fullWidth InputLabelProps={{ shrink: true }} />
                                            )}
                                        />
                                    </Box>
                                </Stack>
                                <Box>
                                    <Controller
                                        name="badgeNumber"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField {...field} label="Badge Number (Optional)" fullWidth />
                                        )}
                                    />
                                </Box>
                            </Stack>
                        )}
                    </Stack>
                );
            case 3:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>Confirm Details</Typography>
                        <Stack spacing={1}>
                            <Stack direction="row"><Typography color="textSecondary" width={120}>Name:</Typography><Typography>{watch('name')}</Typography></Stack>
                            <Stack direction="row"><Typography color="textSecondary" width={120}>Role:</Typography><Typography>{watch('role')}</Typography></Stack>
                            <Stack direction="row"><Typography color="textSecondary" width={120}>Designation:</Typography><Typography>{watch('designation')}</Typography></Stack>
                            <Stack direction="row"><Typography color="textSecondary" width={120}>Department:</Typography><Typography>{watch('department')}</Typography></Stack>
                            {watchedRole === UserRole.TEACHER && (
                                <Stack direction="row"><Typography color="textSecondary" width={120}>Specialization:</Typography><Typography>{watch('specialization')}</Typography></Stack>
                            )}
                            {watchedRole === UserRole.DRIVER && (
                                <Stack direction="row"><Typography color="textSecondary" width={120}>License:</Typography><Typography>{watch('licenseNumber')} (Exp: {watch('licenseExpiry')})</Typography></Stack>
                            )}
                        </Stack>
                    </Box>
                )
            default:
                return 'Unknown step';
        }
    };

    return (
        <Dialog open={open} onClose={() => onClose()} maxWidth="md" fullWidth>
            <DialogTitle>
                {isEdit ? 'Edit Staff' : 'Add New Staff'}
            </DialogTitle>
            <DialogContent dividers>
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Box sx={{ mt: 2, minHeight: '300px' }}>
                    {renderStepContent(activeStep)}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onClose()}>Cancel</Button>
                <Box sx={{ flex: '1 1 auto' }} />
                <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    sx={{ mr: 1 }}
                >
                    Back
                </Button>
                <Button onClick={handleNext} variant="contained" disabled={loading}>
                    {activeStep === steps.length - 1 ? (loading ? <CircularProgress size={24} /> : (isEdit ? 'Update' : 'Create Staff')) : 'Next'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
