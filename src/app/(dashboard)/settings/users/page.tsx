'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Container,
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
    IconButton,
    Alert,
    Snackbar,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, LockReset } from '@mui/icons-material';
import { usersService } from '@/lib/api';

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'TEACHER', 'COORDINATOR', 'RECEPTIONIST'];

export default function UserManagement() {
    const [openDialog, setOpenDialog] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        role: 'ADMIN',
        email: '',
        phone: '',
    });
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => usersService.getAll(true),
    });

    const createMutation = useMutation({
        mutationFn: usersService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            handleCloseDialog();
            setSuccessMessage('User created successfully!');
        },
        onError: (error: any) => setError(error?.response?.data?.message || 'Failed to create user'),
    });

    const handleOpenDialog = (user?: any) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                password: '',
                name: user.name,
                role: user.role,
                email: user.email || '',
                phone: user.phone || '',
            });
        } else {
            setEditingUser(null);
            setFormData({ username: '', password: '', name: '', role: 'ADMIN', email: '', phone: '' });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingUser(null);
        setFormData({ username: '', password: '', name: '', role: 'ADMIN', email: '', phone: '' });
        setError('');
    };

    const handleSubmit = () => {
        if (!formData.username || !formData.name || !formData.role) {
            setError('Please fill required fields');
            return;
        }
        if (!editingUser && !formData.password) {
            setError('Password is required for new users');
            return;
        }
        createMutation.mutate(formData);
    };

    const getRoleColor = (role: string) => {
        const colors: Record<string, 'error' | 'primary' | 'success' | 'secondary' | 'warning' | 'info'> = {
            SUPER_ADMIN: 'error',
            ADMIN: 'primary',
            ACCOUNTANT: 'success',
            TEACHER: 'secondary',
            COORDINATOR: 'warning',
            RECEPTIONIST: 'info',
        };
        return colors[role] || 'default';
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5">User Management</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                        Add New User
                    </Button>
                </Box>

                {isLoading ? (
                    <Typography>Loading...</Typography>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Username</strong></TableCell>
                                <TableCell><strong>Name</strong></TableCell>
                                <TableCell><strong>Role</strong></TableCell>
                                <TableCell><strong>Email</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell align="right"><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data?.map((user: any) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.username}</TableCell>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>
                                        <Chip label={user.role.replace('_', ' ')} color={getRoleColor(user.role)} size="small" />
                                    </TableCell>
                                    <TableCell>{user.email || '-'}</TableCell>
                                    <TableCell>
                                        <Chip label={user.active ? 'Active' : 'Inactive'} color={user.active ? 'success' : 'default'} size="small" />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" color="primary" onClick={() => handleOpenDialog(user)}>
                                            <EditIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Paper>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
                        <TextField
                            label="Username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            fullWidth
                            required
                            disabled={!!editingUser}
                        />
                        {!editingUser && (
                            <TextField
                                label="Password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                fullWidth
                                required
                            />
                        )}
                        <TextField
                            label="Full Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            fullWidth
                            required
                        />
                        <FormControl fullWidth>
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={formData.role}
                                label="Role"
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                {ROLES.map((role) => (
                                    <MenuItem key={role} value={role}>{role.replace('_', ' ')}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            fullWidth
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={createMutation.isPending}>
                        {editingUser ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!successMessage} autoHideDuration={4000} onClose={() => setSuccessMessage('')}>
                <Alert severity="success">{successMessage}</Alert>
            </Snackbar>
        </Container>
    );
}
