import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Stepper, Step, StepLabel, Box, TextField, MenuItem,
    Typography, Stack, CircularProgress,
    Alert, Paper, Switch, Divider, Chip
} from '@mui/material';
import { LockReset as LockResetIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { staffService, UserRole, type Staff } from '../../lib/api/staff';
import { roleSettingsService, type EnabledRole } from '../../lib/api/roleSettings';
import { ROLE_DEFAULT_PERMISSIONS } from '../../utils/permissions';
import { useSnackbar } from 'notistack';

interface AddStaffDialogProps {
    open: boolean;
    onClose: (refresh?: boolean) => void;
    staffToEdit: Staff | null;
    initialRole?: UserRole;
}

const steps = ['Identity & Role', 'HR Details', 'Professional Info', 'Login & Access', 'Review'];

export default function AddUserDialog({ open, onClose, staffToEdit, initialRole }: AddStaffDialogProps) {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [enabledRoles, setEnabledRoles] = useState<EnabledRole[]>([]);
    const { enqueueSnackbar } = useSnackbar();

    // Fetch enabled roles on mount
    useEffect(() => {
        roleSettingsService.getEnabledRoles()
            .then(roles => {
                const staffRoles = roles.filter(r => r.role !== 'STUDENT' && r.role !== 'PARENT');
                setEnabledRoles(staffRoles);
            })
            .catch(err => console.error('Failed to fetch enabled roles:', err));
    }, []);

    const isEdit = !!staffToEdit;

    const { control, handleSubmit, watch, reset, getValues, setValue, trigger } = useForm({
        shouldUnregister: false,
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            role: initialRole || UserRole.TEACHER,
            username: '',
            password: '',
            active: true,
            permissions: [] as string[],

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

    const watchedActive = watch('active');

    // Effect to update permissions when role changes (only for new users or if explicitly requested)
    useEffect(() => {
        if (!isEdit && watchedRole) {
            setValue('permissions', ROLE_DEFAULT_PERMISSIONS[watchedRole] || []);
        }
    }, [watchedRole, isEdit, setValue]);

    useEffect(() => {
        if (staffToEdit) {
            reset({
                name: staffToEdit.name,
                email: staffToEdit.email || '',
                phone: staffToEdit.phone || '',
                role: staffToEdit.role,
                username: staffToEdit.username,
                password: '',
                active: staffToEdit.active ?? true,
                permissions: staffToEdit.permissions || ROLE_DEFAULT_PERMISSIONS[staffToEdit.role] || [],

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
            reset({
                role: initialRole || UserRole.TEACHER,
                permissions: ROLE_DEFAULT_PERMISSIONS[initialRole || UserRole.TEACHER] || [],
                active: true,
                joiningDate: new Date().toISOString().split('T')[0],
            });
        }
        setActiveStep(0);
    }, [staffToEdit, open, reset, initialRole]);

    // Define which fields belong to each step for validation
    const stepFields: Record<number, (keyof typeof control._defaultValues)[]> = {
        0: ['role', 'name', 'email', 'phone', 'username', 'password'], // Identity & Role
        1: ['designation', 'department', 'joiningDate', 'basicSalary', 'bankName', 'accountNo', 'ifscCode', 'panNo'], // HR Details
        2: ['qualification', 'experience', 'specialization', 'licenseNumber', 'licenseExpiry', 'badgeNumber'], // Professional Info
        3: ['active', 'password'], // Login & Access
        4: [], // Review (no additional fields)
    };

    const handleNext = async () => {
        if (activeStep === steps.length - 1) {
            submitForm();
        } else {
            // Validate only fields in the current step
            const fieldsToValidate = stepFields[activeStep] || [];
            const isValid = await trigger(fieldsToValidate as any);

            if (isValid) {
                setActiveStep((prev) => prev + 1);
            }
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };



    const submitForm = handleSubmit(async (data) => {
        setLoading(true);
        const formValues = getValues();
        console.log('AddStaffDialog Submit Payload (Raw):', data);

        try {
            const payload = {
                ...formValues,
                joiningDate: formValues.joiningDate ? new Date(formValues.joiningDate) : undefined,
                basicSalary: Number(formValues.basicSalary),
                licenseExpiry: formValues.licenseExpiry ? new Date(formValues.licenseExpiry) : undefined,
            };

            // Safety cleanup
            if (payload.joiningDate && isNaN(payload.joiningDate.getTime())) delete payload.joiningDate;
            if (payload.licenseExpiry && isNaN(payload.licenseExpiry.getTime())) delete payload.licenseExpiry;

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
            case 0: // Identity & Role
                return (
                    <Stack spacing={2} key="step-identity">
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
                                    rules={{
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: 'Please enter a valid email address'
                                        }
                                    }}
                                    render={({ field, fieldState }) => (
                                        <TextField
                                            {...field}
                                            label="Email"
                                            fullWidth
                                            type="email"
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                        />
                                    )}
                                />
                            </Box>
                            <Box flex={1}>
                                <Controller
                                    name="phone"
                                    control={control}
                                    rules={{
                                        pattern: {
                                            value: /^[6-9]\d{9}$/,
                                            message: 'Please enter a valid 10-digit phone number'
                                        }
                                    }}
                                    render={({ field, fieldState }) => (
                                        <TextField
                                            {...field}
                                            label="Phone"
                                            fullWidth
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                        />
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
            case 1: // HR Details
                return (
                    <Stack spacing={2} key="step-hr">
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
            case 2: // Professional Info
                return (
                    <Stack spacing={2} key="step-prof">
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
            case 3: // Login & Access (NEW)
                return (
                    <Box key="step-login">
                        <Stack spacing={3}>
                            {/* Account Status Card */}
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: watchedActive ? 'success.lighter' : 'grey.100' }}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">Login Access</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Allow this staff member to log in to the portal
                                        </Typography>
                                    </Box>
                                    <Controller
                                        name="active"
                                        control={control}
                                        render={({ field }) => (
                                            <Switch
                                                checked={field.value}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                                color="success"
                                            />
                                        )}
                                    />
                                </Stack>
                            </Paper>

                            {/* Credentials Section */}
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                {isEdit && (
                                    <Box flex={1}>
                                        <TextField
                                            label="Username"
                                            value={watch('username') || getValues('username')}
                                            fullWidth
                                            disabled
                                            size="small"
                                            helperText="Username cannot be changed"
                                        />
                                    </Box>
                                )}
                                <Box flex={1}>
                                    <Controller
                                        name="password"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label={isEdit ? "Set New Password" : "Password"}
                                                placeholder={isEdit ? "Leave blank to keep current" : ""}
                                                fullWidth
                                                type="password"
                                                size="small"
                                                helperText={isEdit ? "Only enter to reset password" : "Default: Welcome@123"}
                                                InputProps={{
                                                    startAdornment: isEdit ? <LockResetIcon color="action" sx={{ mr: 1 }} /> : null
                                                }}
                                            />
                                        )}
                                    />
                                </Box>
                            </Stack>

                            <Alert severity="info" sx={{ mt: 2 }}>
                                <Typography variant="caption">
                                    Detailed permissions can be configured in <strong>User Permissions</strong> after creation.
                                    Default permissions for <strong>{watchedRole}</strong> will be applied automatically.
                                </Typography>
                            </Alert>
                        </Stack>
                    </Box>
                );
            case 4: // Review
                return (
                    <Box key="step-review">
                        <Typography variant="h6" gutterBottom>Confirm Details</Typography>
                        <Stack spacing={1}>
                            <Stack direction="row"><Typography color="textSecondary" width={120}>Name:</Typography><Typography>{watch('name')}</Typography></Stack>
                            <Stack direction="row"><Typography color="textSecondary" width={120}>Role:</Typography><Typography>{watch('role')}</Typography></Stack>
                            <Stack direction="row"><Typography color="textSecondary" width={120}>Status:</Typography><Chip label={watch('active') ? 'Active' : 'Inactive'} size="small" color={watch('active') ? 'success' : 'default'} /></Stack>
                            <Stack direction="row"><Typography color="textSecondary" width={120}>Permissions:</Typography><Typography>Default (Role Based)</Typography></Stack>
                            <Divider sx={{ my: 1 }} />
                            <Stack direction="row"><Typography color="textSecondary" width={120}>Designation:</Typography><Typography>{watch('designation')}</Typography></Stack>
                            <Stack direction="row"><Typography color="textSecondary" width={120}>Department:</Typography><Typography>{watch('department')}</Typography></Stack>
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
                {isEdit ? 'Edit User & Access' : 'Add New User'}
            </DialogTitle>
            <DialogContent dividers>
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Box sx={{ mt: 2, minHeight: '350px' }}>
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
