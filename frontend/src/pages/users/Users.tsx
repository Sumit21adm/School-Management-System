import React, { useEffect, useState } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Typography, Chip, IconButton, FormControl, InputLabel, Select, MenuItem, Stack,
    Tooltip, CircularProgress, TablePagination
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    RestoreFromTrash as RestoreIcon
} from '@mui/icons-material';
import { staffService, type Staff } from '../../lib/api/staff';
import { roleSettingsService, type EnabledRole } from '../../lib/api/roleSettings';
import AddUserDialog from './AddUserDialog';
import DeleteConfirmDialog from '../../components/DeleteConfirmDialog';
import { useSnackbar } from 'notistack';

const Users = () => {
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [filterRole, setFilterRole] = useState<string>('ALL');
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [viewOnlyMode, setViewOnlyMode] = useState(false);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const { enqueueSnackbar } = useSnackbar();

    // Delete Confirmation State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{ id: number; name: string } | null>(null);

    // Enabled roles from API
    const [enabledRoles, setEnabledRoles] = useState<EnabledRole[]>([]);

    // Pagination State
    const [page, setPage] = useState(0); // MUI uses 0-based index
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [totalCount, setTotalCount] = useState(0);

    const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE');

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

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const role = filterRole === 'ALL' ? undefined : filterRole;
            // page + 1 because backend expects 1-based index
            // Convert status filter to backend parameters
            const includeInactive = statusFilter !== 'ACTIVE';
            const onlyInactive = statusFilter === 'INACTIVE';
            const response = await staffService.getAll(role, undefined, page + 1, rowsPerPage, includeInactive, onlyInactive);

            setStaffList(response.data);
            setTotalCount(response.total);
        } catch (error) {
            console.error(error);
            enqueueSnackbar('Failed to fetch staff list', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, [filterRole, page, rowsPerPage, statusFilter]);

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleDeleteClick = (staff: Staff) => {
        setUserToDelete({ id: staff.id, name: staff.name });
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async (permanent: boolean) => {
        if (userToDelete !== null) {
            try {
                await staffService.delete(userToDelete.id, permanent);
                enqueueSnackbar(
                    permanent ? 'User permanently deleted' : 'User deleted successfully',
                    { variant: 'success' }
                );
                setDeleteDialogOpen(false);
                setUserToDelete(null);
                fetchStaff();
            } catch (error: any) {
                const errorMessage = error.response?.data?.message || 'Failed to delete user';
                enqueueSnackbar(errorMessage, { variant: 'error' });
                setDeleteDialogOpen(false);
                setUserToDelete(null);
            }
        }
    };
    // ... (rest of methods)

    const handleEdit = (staff: Staff, e?: React.MouseEvent) => {
        e?.stopPropagation(); // Prevent row click
        setSelectedStaff(staff);
        setViewOnlyMode(false);
        setOpenAddDialog(true);
    };

    const handleView = (staff: Staff) => {
        setSelectedStaff(staff);
        setViewOnlyMode(true);
        setOpenAddDialog(true);
    };

    const handleAdd = () => {
        setSelectedStaff(null);
        setViewOnlyMode(false);
        setOpenAddDialog(true);
    };

    const handleRestore = async (staff: Staff, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            await staffService.update(staff.id, { active: true });
            enqueueSnackbar('User restored successfully', { variant: 'success' });
            fetchStaff();
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.message || 'Failed to restore user', { variant: 'error' });
        }
    };

    const handleCloseDialog = (refresh?: boolean) => {
        setOpenAddDialog(false);
        if (refresh) fetchStaff();
    };

    return (
        <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h1">
                    User Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAdd}
                >
                    Add User
                </Button>
            </Stack>

            <Paper sx={{ mb: 3, p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Filter by Role</InputLabel>
                        <Select
                            value={filterRole}
                            label="Filter by Role"
                            onChange={(e) => {
                                setFilterRole(e.target.value);
                                setPage(0); // Reset page on filter change
                            }}
                        >
                            <MenuItem value="ALL">All Users</MenuItem>
                            {enabledRoles.map((role) => (
                                <MenuItem key={role.role} value={role.role}>
                                    {role.displayName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Status"
                            onChange={(e) => {
                                setStatusFilter(e.target.value as 'ACTIVE' | 'INACTIVE' | 'ALL');
                                setPage(0); // Reset page on filter change
                            }}
                        >
                            <MenuItem value="ACTIVE">Active Only</MenuItem>
                            <MenuItem value="INACTIVE">Inactive Only</MenuItem>
                            <MenuItem value="ALL">All Users</MenuItem>
                        </Select>
                    </FormControl>
                    <IconButton onClick={fetchStaff} title="Refresh">
                        <RefreshIcon />
                    </IconButton>
                </Stack>
            </Paper>

            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name / Username</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Designation</TableCell>
                                <TableCell>Contact</TableCell>
                                <TableCell>Joining Date</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : staffList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        No staff found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                staffList.map((staff) => (
                                    <TableRow
                                        key={staff.id}
                                        hover
                                        onClick={() => handleView(staff)}
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">{staff.name}</Typography>
                                            <Typography variant="caption" color="textSecondary">{staff.username}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={staff.role} size="small" color="primary" variant="outlined" />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{staff.staffDetails?.designation || '-'}</Typography>
                                            <Typography variant="caption" color="textSecondary">{staff.staffDetails?.department}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{staff.phone || '-'}</Typography>
                                            <Typography variant="caption" color="textSecondary">{staff.email}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            {staff.staffDetails?.joiningDate ? new Date(staff.staffDetails.joiningDate).toLocaleDateString() : '-'}
                                        </TableCell>
                                        <TableCell align="right">
                                            {!staff.active ? (
                                                <Tooltip title="Restore">
                                                    <IconButton size="small" color="success" onClick={(e) => handleRestore(staff, e)}>
                                                        <RestoreIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : (
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" onClick={(e) => handleEdit(staff, e)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteClick(staff);
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[25, 50, 100]}
                    component="div"
                    count={totalCount}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>

            {openAddDialog && (
                <AddUserDialog
                    open={openAddDialog}
                    onClose={handleCloseDialog}
                    staffToEdit={selectedStaff}
                    viewOnly={viewOnlyMode}
                />
            )}

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                userName={userToDelete?.name || ''}
            />
        </Box>
    );
};

export default Users;
