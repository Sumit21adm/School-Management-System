import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Switch,
    Alert,
    CircularProgress,
    Chip,
    TextField,
    IconButton,
    Tooltip,
    Snackbar,
} from '@mui/material';
import {
    Save as SaveIcon,
    AdminPanelSettings as AdminIcon,
    School as SchoolIcon,
    AccountBalance as FinanceIcon,
    DirectionsBus as TransportIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { roleSettingsService, type RoleSettings } from '../../lib/api/roleSettings';

// Role category icons and colors
const getRoleCategoryInfo = (role: string) => {
    const categories: Record<string, { icon: React.ReactNode; color: string; category: string }> = {
        SUPER_ADMIN: { icon: <AdminIcon />, color: '#d32f2f', category: 'Administrative' },
        PRINCIPAL: { icon: <AdminIcon />, color: '#d32f2f', category: 'Administrative' },
        VICE_PRINCIPAL: { icon: <AdminIcon />, color: '#d32f2f', category: 'Administrative' },
        ADMIN: { icon: <AdminIcon />, color: '#d32f2f', category: 'Administrative' },
        HEAD_OF_DEPARTMENT: { icon: <SchoolIcon />, color: '#1976d2', category: 'Academic' },
        COORDINATOR: { icon: <SchoolIcon />, color: '#1976d2', category: 'Academic' },
        SECTION_INCHARGE: { icon: <SchoolIcon />, color: '#1976d2', category: 'Academic' },
        TEACHER: { icon: <SchoolIcon />, color: '#1976d2', category: 'Academic' },
        ACCOUNTANT: { icon: <FinanceIcon />, color: '#2e7d32', category: 'Finance & Office' },
        RECEPTIONIST: { icon: <FinanceIcon />, color: '#2e7d32', category: 'Finance & Office' },
        LIBRARIAN: { icon: <FinanceIcon />, color: '#2e7d32', category: 'Finance & Office' },
        LAB_ASSISTANT: { icon: <FinanceIcon />, color: '#2e7d32', category: 'Finance & Office' },
        OFFICE_STAFF: { icon: <FinanceIcon />, color: '#2e7d32', category: 'Finance & Office' },
        CLERK: { icon: <FinanceIcon />, color: '#2e7d32', category: 'Finance & Office' },
        DRIVER: { icon: <TransportIcon />, color: '#ed6c02', category: 'Transport & Support' },
        CONDUCTOR: { icon: <TransportIcon />, color: '#ed6c02', category: 'Transport & Support' },
        SECURITY: { icon: <TransportIcon />, color: '#ed6c02', category: 'Transport & Support' },
        PEON: { icon: <TransportIcon />, color: '#ed6c02', category: 'Transport & Support' },
        PARENT: { icon: <PersonIcon />, color: '#9c27b0', category: 'External Users' },
        STUDENT: { icon: <PersonIcon />, color: '#9c27b0', category: 'External Users' },
    };
    return categories[role] || { icon: <PersonIcon />, color: '#757575', category: 'Other' };
};

export default function RoleSettingsPage() {
    const queryClient = useQueryClient();
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Fetch all roles
    const { data: roles, isLoading, error } = useQuery({
        queryKey: ['roleSettings'],
        queryFn: () => roleSettingsService.getAllRoles(),
    });

    // Update role mutation
    const updateRoleMutation = useMutation({
        mutationFn: ({ role, data }: { role: string; data: Partial<RoleSettings> }) =>
            roleSettingsService.updateRole(role, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roleSettings'] });
            setSnackbar({ open: true, message: 'Role updated successfully', severity: 'success' });
        },
        onError: (error: Error) => {
            setSnackbar({ open: true, message: error.message || 'Failed to update role', severity: 'error' });
        },
    });

    const handleToggleRole = (role: string, currentEnabled: boolean) => {
        // Prevent disabling SUPER_ADMIN
        if (role === 'SUPER_ADMIN') {
            setSnackbar({ open: true, message: 'Cannot disable Super Admin role', severity: 'error' });
            return;
        }
        updateRoleMutation.mutate({ role, data: { isEnabled: !currentEnabled } });
    };

    const handleUpdateDisplayName = (role: string, displayName: string) => {
        updateRoleMutation.mutate({ role, data: { displayName } });
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ m: 2 }}>
                Failed to load role settings. Please try again.
            </Alert>
        );
    }

    // Group roles by category
    const groupedRoles = roles?.reduce((acc, role) => {
        const { category } = getRoleCategoryInfo(role.role);
        if (!acc[category]) acc[category] = [];
        acc[category].push(role);
        return acc;
    }, {} as Record<string, RoleSettings[]>) || {};

    const categoryOrder = ['Administrative', 'Academic', 'Finance & Office', 'Transport & Support', 'External Users'];

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 1 }}>
                Role Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enable or disable roles available for staff and user creation. Disabled roles won't appear in dropdown menus.
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
                <strong>Note:</strong> Disabling a role only hides it from new selections. Existing users with that role will continue to function normally.
            </Alert>

            {categoryOrder.map(category => {
                const categoryRoles = groupedRoles[category];
                if (!categoryRoles || categoryRoles.length === 0) return null;

                const { color } = getRoleCategoryInfo(categoryRoles[0].role);

                return (
                    <Paper key={category} sx={{ mb: 3, overflow: 'hidden' }}>
                        <Box sx={{ bgcolor: color, color: 'white', px: 2, py: 1 }}>
                            <Typography variant="h6">{category}</Typography>
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell width="60">Enabled</TableCell>
                                        <TableCell width="200">Role</TableCell>
                                        <TableCell>Display Name</TableCell>
                                        <TableCell>Description</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {categoryRoles.map(role => {
                                        const isSuperAdmin = role.role === 'SUPER_ADMIN';
                                        return (
                                            <TableRow key={role.role} hover>
                                                <TableCell>
                                                    <Switch
                                                        checked={role.isEnabled}
                                                        onChange={() => handleToggleRole(role.role, role.isEnabled)}
                                                        disabled={isSuperAdmin || updateRoleMutation.isPending}
                                                        color="primary"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={role.role}
                                                        size="small"
                                                        variant={role.isEnabled ? 'filled' : 'outlined'}
                                                        color={role.isEnabled ? 'primary' : 'default'}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <EditableField
                                                        value={role.displayName}
                                                        onSave={(value) => handleUpdateDisplayName(role.role, value)}
                                                        disabled={updateRoleMutation.isPending}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {role.description || '-'}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                );
            })}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

// Editable field component for inline editing
function EditableField({
    value,
    onSave,
    disabled,
}: {
    value: string;
    onSave: (value: string) => void;
    disabled: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);

    const handleSave = () => {
        if (editValue !== value) {
            onSave(editValue);
        }
        setEditing(false);
    };

    if (editing) {
        return (
            <Box display="flex" alignItems="center" gap={1}>
                <TextField
                    size="small"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') setEditing(false);
                    }}
                    autoFocus
                    sx={{ minWidth: 200 }}
                />
                <Tooltip title="Save">
                    <IconButton size="small" onClick={handleSave} disabled={disabled}>
                        <SaveIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        );
    }

    return (
        <Typography
            variant="body2"
            onClick={() => setEditing(true)}
            sx={{
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover', borderRadius: 1, px: 1, mx: -1 },
                py: 0.5,
            }}
        >
            {value}
        </Typography>
    );
}
