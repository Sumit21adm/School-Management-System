import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Paper,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip,
    IconButton,
    Alert,
    Snackbar,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Checkbox,
    FormGroup,
    Divider,
    Grid,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    LockReset as LockResetIcon,
    Person as PersonIcon,
    ExpandMore as ExpandMoreIcon,
    Security as SecurityIcon,
} from '@mui/icons-material';
import { usersService } from '../../lib/api';
import { format } from 'date-fns';
import PageHeader from '../../components/PageHeader';

const USER_ROLES = [
    { value: 'SUPER_ADMIN', label: 'Super Admin', color: '#d32f2f' },
    { value: 'ADMIN', label: 'Admin', color: '#1976d2' },
    { value: 'ACCOUNTANT', label: 'Accountant', color: '#388e3c' },
    { value: 'TEACHER', label: 'Teacher', color: '#7b1fa2' },
    { value: 'COORDINATOR', label: 'Coordinator', color: '#f57c00' },
    { value: 'RECEPTIONIST', label: 'Receptionist', color: '#0097a7' },
    { value: 'SECURITY', label: 'Security', color: '#455a64' },
    { value: 'PARENT', label: 'Parent', color: '#795548' },
    { value: 'STUDENT', label: 'Student', color: '#9e9e9e' },
];

import { PERMISSION_MODULES, ROLE_DEFAULT_PERMISSIONS } from '../../utils/permissions';

const getRoleColor = (role: string) => {
    const found = USER_ROLES.find(r => r.value === role);
    return found?.color || '#9e9e9e';
};

const getRoleLabel = (role: string) => {
    const found = USER_ROLES.find(r => r.value === role);
    return found?.label || role;
};

export default function UserManagement() {
    const [openDialog, setOpenDialog] = useState(false);
    const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [passwordUserId, setPasswordUserId] = useState<number | null>(null);
    const [showInactive, setShowInactive] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        email: '',
        phone: '',
        role: 'RECEPTIONIST',
    });
    const [permissions, setPermissions] = useState<string[]>([]);
    const [newPassword, setNewPassword] = useState('');
    const queryClient = useQueryClient();

    // When role changes, update permissions to defaults
    useEffect(() => {
        if (!editingUser) {
            setPermissions(ROLE_DEFAULT_PERMISSIONS[formData.role] || []);
        }
    }, [formData.role, editingUser]);

    const { data, isLoading } = useQuery({
        queryKey: ['users', showInactive],
        queryFn: () => usersService.getAll(showInactive),
    });

    const createMutation = useMutation({
        mutationFn: usersService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            handleCloseDialog();
            setSuccessMessage('User created successfully!');
        },
        onError: (error: any) => {
            setError(error?.response?.data?.message || 'Failed to create user');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: any) => usersService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            handleCloseDialog();
            setSuccessMessage('User updated successfully!');
        },
        onError: (error: any) => {
            setError(error?.response?.data?.message || 'Failed to update user');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: usersService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setSuccessMessage('User deleted successfully!');
        },
        onError: (error: any) => {
            setError(error?.response?.data?.message || 'Failed to delete user');
        },
    });

    const changePasswordMutation = useMutation({
        mutationFn: ({ id, password }: { id: number; password: string }) =>
            usersService.changePassword(id, password),
        onSuccess: () => {
            setOpenPasswordDialog(false);
            setNewPassword('');
            setPasswordUserId(null);
            setSuccessMessage('Password changed successfully!');
        },
        onError: (error: any) => {
            setError(error?.response?.data?.message || 'Failed to change password');
        },
    });

    const handleOpenDialog = (user?: any) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                password: '',
                name: user.name,
                email: user.email || '',
                phone: user.phone || '',
                role: user.role,
            });
            // Load user's saved permissions or default for their role
            setPermissions(user.permissions || ROLE_DEFAULT_PERMISSIONS[user.role] || []);
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                password: '',
                name: '',
                email: '',
                phone: '',
                role: 'RECEPTIONIST',
            });
            setPermissions(ROLE_DEFAULT_PERMISSIONS['RECEPTIONIST'] || []);
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingUser(null);
        setFormData({
            username: '',
            password: '',
            name: '',
            email: '',
            phone: '',
            role: 'RECEPTIONIST',
        });
        setPermissions([]);
        setError('');
    };

    const handlePermissionChange = (permKey: string, checked: boolean) => {
        if (checked) {
            setPermissions([...permissions, permKey]);
        } else {
            setPermissions(permissions.filter(p => p !== permKey));
        }
    };

    const handleModuleSelectAll = (modulePermissions: { key: string }[], selectAll: boolean) => {
        if (selectAll) {
            const newPerms = [...new Set([...permissions, ...modulePermissions.map(p => p.key)])];
            setPermissions(newPerms);
        } else {
            const keysToRemove = modulePermissions.map(p => p.key);
            setPermissions(permissions.filter(p => !keysToRemove.includes(p)));
        }
    };

    const handleSubmit = () => {
        if (!formData.name || !formData.role) {
            setError('Please fill required fields');
            return;
        }

        if (!editingUser && (!formData.username || !formData.password)) {
            setError('Username and password are required for new users');
            return;
        }

        if (!editingUser && formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (editingUser) {
            updateMutation.mutate({
                id: editingUser.id,
                data: {
                    name: formData.name,
                    email: formData.email || undefined,
                    phone: formData.phone || undefined,
                    role: formData.role,
                    permissions: permissions,
                },
            });
        } else {
            createMutation.mutate({
                username: formData.username,
                password: formData.password,
                name: formData.name,
                email: formData.email || undefined,
                phone: formData.phone || undefined,
                role: formData.role,
                permissions: permissions,
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this user?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleToggleActive = async (user: any) => {
        updateMutation.mutate({
            id: user.id,
            data: { active: !user.active },
        });
    };

    const handleChangePassword = () => {
        if (!passwordUserId || !newPassword) return;
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        changePasswordMutation.mutate({ id: passwordUserId, password: newPassword });
    };

    const countSelectedPermissions = () => permissions.length;
    const totalPermissions = PERMISSION_MODULES.flatMap(m => m.permissions).length;

    return (
        <Box>
            <PageHeader
                title="User Management"
                action={
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={showInactive}
                                    onChange={(e) => setShowInactive(e.target.checked)}
                                />
                            }
                            label="Show Inactive"
                        />
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog()}
                        >
                            Add New User
                        </Button>
                    </Box>
                }
            />

            <Paper sx={{ p: 3 }}>

                {isLoading ? (
                    <Typography>Loading...</Typography>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                <TableCell><strong>Name</strong></TableCell>
                                <TableCell><strong>Username</strong></TableCell>
                                <TableCell><strong>Role</strong></TableCell>
                                <TableCell><strong>Email</strong></TableCell>
                                <TableCell><strong>Phone</strong></TableCell>
                                <TableCell><strong>Last Login</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell align="right"><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data?.users?.map((user: any) => (
                                <TableRow key={user.id} hover sx={{ opacity: user.active ? 1 : 0.5 }}>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                            {user.username}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={getRoleLabel(user.role)}
                                            size="small"
                                            sx={{
                                                bgcolor: getRoleColor(user.role),
                                                color: 'white',
                                                fontWeight: 600,
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>{user.email || '-'}</TableCell>
                                    <TableCell>{user.phone || '-'}</TableCell>
                                    <TableCell>
                                        {user.lastLogin
                                            ? format(new Date(user.lastLogin), 'dd MMM yyyy HH:mm')
                                            : 'Never'}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.active ? 'Active' : 'Inactive'}
                                            size="small"
                                            color={user.active ? 'success' : 'default'}
                                            variant={user.active ? 'filled' : 'outlined'}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleOpenDialog(user)}
                                            title="Edit User"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="warning"
                                            onClick={() => {
                                                setPasswordUserId(user.id);
                                                setOpenPasswordDialog(true);
                                            }}
                                            title="Reset Password"
                                        >
                                            <LockResetIcon />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDelete(user.id)}
                                            title="Delete User"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Paper>

            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon />
                        {editingUser ? 'Edit User' : 'Add New User'}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        {error && (
                            <Alert severity="error" onClose={() => setError('')}>
                                {error}
                            </Alert>
                        )}

                        {/* Basic Info Section */}
                        <Typography variant="subtitle2" color="text.secondary">Basic Information</Typography>
                        <Grid container spacing={2}>
                            {!editingUser && (
                                <>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            label="Username"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            fullWidth
                                            required
                                            size="small"
                                            helperText="Used for login (cannot be changed)"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            label="Password"
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            fullWidth
                                            required
                                            size="small"
                                            helperText="Minimum 6 characters"
                                        />
                                    </Grid>
                                </>
                            )}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Full Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    fullWidth
                                    required
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth required size="small">
                                    <InputLabel>Role</InputLabel>
                                    <Select
                                        value={formData.role}
                                        label="Role"
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        disabled={editingUser && (editingUser.role === 'SUPER_ADMIN' || formData.role === 'SUPER_ADMIN')}
                                    >
                                        {USER_ROLES.map((role) => (
                                            <MenuItem key={role.value} value={role.value}>
                                                <Chip
                                                    label={role.label}
                                                    size="small"
                                                    sx={{ bgcolor: role.color, color: 'white', mr: 1 }}
                                                />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 1 }} />

                        {/* Permissions Section */}
                        <Accordion defaultExpanded sx={{ bgcolor: 'grey.50' }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                    <SecurityIcon color="primary" />
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        Access Permissions
                                    </Typography>
                                    {formData.role === 'SUPER_ADMIN' ? (
                                        <Chip
                                            label="Full Access"
                                            size="small"
                                            color="success"
                                            sx={{ ml: 'auto', mr: 2 }}
                                        />
                                    ) : (
                                        <Chip
                                            label={`${countSelectedPermissions()} / ${totalPermissions} selected`}
                                            size="small"
                                            color={countSelectedPermissions() > 0 ? 'primary' : 'default'}
                                            sx={{ ml: 'auto', mr: 2 }}
                                        />
                                    )}
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                {formData.role === 'SUPER_ADMIN' ? (
                                    <Alert severity="success" variant="filled">
                                        <Typography fontWeight={600}>
                                            Super Admin has full system access.
                                        </Typography>
                                        <Typography variant="body2">
                                            Permissions cannot be modified for this role properly.
                                        </Typography>
                                    </Alert>
                                ) : (
                                    <>
                                        <Alert severity="info" sx={{ mb: 2 }}>
                                            <Typography variant="body2">
                                                Select a role above to load default permissions, then customize as needed.
                                            </Typography>
                                        </Alert>
                                        <Grid container spacing={2}>
                                            {PERMISSION_MODULES.map((module) => {
                                                const moduleSelected = module.permissions.filter(p => permissions.includes(p.key)).length;
                                                const allSelected = moduleSelected === module.permissions.length;
                                                const someSelected = moduleSelected > 0 && !allSelected;

                                                return (
                                                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={module.module}>
                                                        <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                                <FormControlLabel
                                                                    control={
                                                                        <Checkbox
                                                                            checked={allSelected}
                                                                            indeterminate={someSelected}
                                                                            onChange={(e) => handleModuleSelectAll(module.permissions, e.target.checked)}
                                                                            size="small"
                                                                        />
                                                                    }
                                                                    label={
                                                                        <Typography variant="subtitle2" fontWeight={600}>
                                                                            {module.module}
                                                                        </Typography>
                                                                    }
                                                                />
                                                            </Box>
                                                            <FormGroup sx={{ pl: 3 }}>
                                                                {module.permissions.map((perm) => (
                                                                    <FormControlLabel
                                                                        key={perm.key}
                                                                        control={
                                                                            <Checkbox
                                                                                checked={permissions.includes(perm.key)}
                                                                                onChange={(e) => handlePermissionChange(perm.key, e.target.checked)}
                                                                                size="small"
                                                                            />
                                                                        }
                                                                        label={
                                                                            <Typography variant="body2">
                                                                                {perm.label}
                                                                            </Typography>
                                                                        }
                                                                    />
                                                                ))}
                                                            </FormGroup>
                                                        </Paper>
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    </>
                                )}
                            </AccordionDetails>
                        </Accordion>

                        {editingUser && (
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={editingUser.active}
                                        onChange={() => handleToggleActive(editingUser)}
                                        disabled={editingUser.role === 'SUPER_ADMIN'}
                                    />
                                }
                                label={editingUser.active ? 'Active' : 'Inactive'}
                            />
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={createMutation.isPending || updateMutation.isPending}
                    >
                        {editingUser ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Change Password Dialog */}
            <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="New Password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            fullWidth
                            required
                            helperText="Minimum 6 characters"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPasswordDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleChangePassword}
                        variant="contained"
                        color="warning"
                        disabled={changePasswordMutation.isPending}
                    >
                        Reset Password
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success Snackbar */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={4000}
                onClose={() => setSuccessMessage('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>

            {/* Error Snackbar */}
            <Snackbar
                open={!!error && !openDialog}
                autoHideDuration={6000}
                onClose={() => setError('')}
            >
                <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
}
