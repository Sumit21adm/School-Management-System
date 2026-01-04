'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Paper,
    Typography,
    Box,
    FormControl,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Button,
    Alert,
    IconButton,
    InputLabel,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Check as CheckIcon,
    Sync as SyncIcon,
    ExpandMore as ExpandMoreIcon,
    Category as CategoryIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { feeTypeService, feeStructureService, classService, sessionService } from '@/lib/api';

const FREQUENCIES = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'One-time', 'Refundable', 'Not Set'];

interface FeeItem {
    feeTypeId: number;
    feeTypeName: string;
    amount: number;
    frequency?: string;
}

export default function FeeStructure() {
    const [selectedSessionId, setSelectedSessionId] = useState<number>(0);
    const [selectedClass, setSelectedClass] = useState('');
    const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
    const [selectedFeeType, setSelectedFeeType] = useState<number | ''>('');
    const [newFeeAmount, setNewFeeAmount] = useState<number>(0);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
    const [unsavedIds, setUnsavedIds] = useState<Set<number>>(new Set());
    const queryClient = useQueryClient();

    // Fee Types Management State
    const [feeTypesExpanded, setFeeTypesExpanded] = useState(false);
    const [editingFeeTypeId, setEditingFeeTypeId] = useState<number | null>(null);
    const [newFeeType, setNewFeeType] = useState({ name: '', description: '', frequency: '' });
    const [editFeeType, setEditFeeType] = useState({ id: 0, name: '', description: '', frequency: '' });
    const [deleteFeeTypeDialogOpen, setDeleteFeeTypeDialogOpen] = useState(false);
    const [feeTypeToDelete, setFeeTypeToDelete] = useState<any>(null);
    const [feeTypeSaving, setFeeTypeSaving] = useState(false);

    // Delete State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<FeeItem | null>(null);

    // Snackbar State
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    // Fetch sessions
    const { data: sessionsData } = useQuery({
        queryKey: ['sessions'],
        queryFn: () => sessionService.getAll(true),
    });
    const sessions = sessionsData?.sessions || [];

    // Auto-select active session
    useEffect(() => {
        if (sessions.length > 0 && selectedSessionId === 0) {
            const activeSession = sessions.find((s: any) => s.isActive);
            if (activeSession) setSelectedSessionId(activeSession.id);
        }
    }, [sessions, selectedSessionId]);

    // Fetch fee types
    const { data: feeTypesData, refetch: refetchFeeTypes } = useQuery({
        queryKey: ['feeTypes'],
        queryFn: () => feeTypeService.getAll(false),
    });

    // Fetch available classes
    const { data: classes } = useQuery({
        queryKey: ['classes'],
        queryFn: classService.getAll,
    });

    // Fetch fee structure
    const { data: structureData } = useQuery({
        queryKey: ['feeStructure', selectedSessionId, selectedClass],
        queryFn: () => feeStructureService.getStructure(selectedSessionId, selectedClass),
        enabled: !!selectedSessionId && !!selectedClass,
    });

    // Initialize fee items when structure loads
    useEffect(() => {
        if (structureData?.items && feeTypesData?.feeTypes) {
            const items: FeeItem[] = structureData.items.map((item: any) => {
                const feeType = feeTypesData.feeTypes.find((ft: any) => ft.id === item.feeTypeId);
                return {
                    feeTypeId: item.feeTypeId,
                    feeTypeName: feeType?.name || 'Unknown',
                    amount: item.amount,
                    frequency: item.frequency || feeType?.frequency,
                };
            });
            setFeeItems(items);
            setSavedIds(new Set(items.map(i => i.feeTypeId)));
            setUnsavedIds(new Set());
        } else {
            setFeeItems([]);
            setSavedIds(new Set());
        }
    }, [structureData, feeTypesData]);

    const getFrequencyColor = (frequency: string | undefined) => {
        switch (frequency) {
            case 'Monthly': return 'primary';
            case 'Quarterly': return 'info';
            case 'Half-Yearly': return 'success';
            case 'Yearly': return 'secondary';
            case 'One-time': return 'warning';
            case 'Refundable': return 'error';
            default: return 'default';
        }
    };

    const getAnnualMultiplier = (frequency: string | undefined): number => {
        switch (frequency) {
            case 'Monthly': return 12;
            case 'Quarterly': return 4;
            case 'Half-Yearly': return 2;
            default: return 1;
        }
    };

    const totalAmount = feeItems.reduce((sum, item) => {
        const multiplier = getAnnualMultiplier(item.frequency);
        return sum + ((item.amount || 0) * multiplier);
    }, 0);

    const handleAddFeeType = async () => {
        if (!selectedFeeType || !feeTypesData || !selectedSessionId) return;

        const feeType = feeTypesData.feeTypes.find((ft: any) => ft.id === selectedFeeType);
        if (!feeType) return;

        if (feeItems.some(item => item.feeTypeId === selectedFeeType)) {
            setSnackbar({ open: true, message: 'This fee type is already added', severity: 'error' });
            return;
        }

        const newItem = {
            feeTypeId: feeType.id,
            feeTypeName: feeType.name,
            amount: newFeeAmount || 0,
            frequency: feeType.frequency,
        };

        const updatedItems = [...feeItems, newItem];
        setFeeItems(updatedItems);

        try {
            setIsSaving(true);
            const saveItems = updatedItems
                .filter(item => item.amount > 0)
                .map(item => ({
                    feeTypeId: item.feeTypeId,
                    amount: item.amount,
                    isOptional: false,
                    frequency: item.frequency || null,
                }));

            await feeStructureService.upsertStructure(selectedSessionId, selectedClass, {
                description: `Class ${selectedClass} fee structure`,
                items: saveItems,
            });

            setSavedIds(prev => new Set(prev).add(feeType.id));
            queryClient.invalidateQueries({ queryKey: ['feeStructure'] });
            setSelectedFeeType('');
            setNewFeeAmount(0);
            setSnackbar({ open: true, message: 'Fee type added successfully', severity: 'success' });
        } catch (error) {
            console.error('Save failed:', error);
            setSnackbar({ open: true, message: 'Failed to save fee', severity: 'error' });
            setFeeItems(feeItems);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveFeeType = (feeTypeId: number) => {
        const item = feeItems.find(i => i.feeTypeId === feeTypeId);
        if (item) {
            setItemToDelete(item);
            setDeleteDialogOpen(true);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!itemToDelete || !selectedSessionId) return;

        try {
            const updatedItems = feeItems.filter(item => item.feeTypeId !== itemToDelete.feeTypeId);
            const saveItems = updatedItems
                .filter(item => item.amount > 0)
                .map(item => ({
                    feeTypeId: item.feeTypeId,
                    amount: item.amount,
                    isOptional: false,
                    frequency: item.frequency || null,
                }));

            await feeStructureService.upsertStructure(selectedSessionId, selectedClass, {
                description: `Class ${selectedClass} fee structure`,
                items: saveItems,
            });

            setFeeItems(updatedItems);
            setSnackbar({ open: true, message: 'Fee type removed successfully', severity: 'success' });
            queryClient.invalidateQueries({ queryKey: ['feeStructure'] });
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to delete fee type', severity: 'error' });
        } finally {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        }
    };

    const handleAmountChange = (feeTypeId: number, amount: number) => {
        setFeeItems(feeItems.map(item => item.feeTypeId === feeTypeId ? { ...item, amount } : item));
        setUnsavedIds(prev => new Set(prev).add(feeTypeId));
        setSavedIds(prev => { const newSet = new Set(prev); newSet.delete(feeTypeId); return newSet; });
    };

    const feeItemsRef = useRef(feeItems);
    feeItemsRef.current = feeItems;

    const performSave = async (feeTypeId: number) => {
        if (!selectedSessionId || feeItemsRef.current.length === 0) return;

        const saveItems = feeItemsRef.current
            .filter(item => item.amount > 0)
            .map(item => ({
                feeTypeId: item.feeTypeId,
                amount: item.amount,
                isOptional: false,
                frequency: item.frequency || null,
            }));

        if (saveItems.length === 0) return;

        setIsSaving(true);
        try {
            await feeStructureService.upsertStructure(selectedSessionId, selectedClass, {
                description: `Class ${selectedClass} fee structure`,
                items: saveItems,
            });
            setSavedIds(prev => new Set(prev).add(feeTypeId));
            setUnsavedIds(prev => { const newSet = new Set(prev); newSet.delete(feeTypeId); return newSet; });
            queryClient.invalidateQueries({ queryKey: ['feeStructure'] });
        } catch (error) {
            console.error('Save failed:', error);
            setSnackbar({ open: true, message: 'Save failed', severity: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditToggle = async (feeTypeId: number) => {
        const isCurrentlyEditing = editingId === feeTypeId;
        if (isCurrentlyEditing) {
            await performSave(feeTypeId);
            setEditingId(null);
        } else {
            setEditingId(feeTypeId);
        }
    };

    // Fee Types Management Handlers
    const handleCreateFeeType = async () => {
        if (!newFeeType.name.trim()) {
            setSnackbar({ open: true, message: 'Fee type name is required', severity: 'error' });
            return;
        }
        setFeeTypeSaving(true);
        try {
            await feeTypeService.create({
                name: newFeeType.name.trim(),
                description: newFeeType.description.trim(),
                frequency: newFeeType.frequency || null,
            });
            setNewFeeType({ name: '', description: '', frequency: '' });
            refetchFeeTypes();
            setSnackbar({ open: true, message: 'Fee type created successfully', severity: 'success' });
        } catch (error: any) {
            setSnackbar({ open: true, message: error?.response?.data?.message || 'Failed to create fee type', severity: 'error' });
        } finally {
            setFeeTypeSaving(false);
        }
    };

    const handleDeleteFeeTypeConfirm = async () => {
        if (!feeTypeToDelete) return;
        setFeeTypeSaving(true);
        try {
            await feeTypeService.delete(feeTypeToDelete.id);
            refetchFeeTypes();
            setSnackbar({ open: true, message: 'Fee type deleted successfully', severity: 'success' });
        } catch (error: any) {
            setSnackbar({ open: true, message: error?.response?.data?.message || 'Failed to delete fee type', severity: 'error' });
        } finally {
            setDeleteFeeTypeDialogOpen(false);
            setFeeTypeToDelete(null);
            setFeeTypeSaving(false);
        }
    };

    const availableFeeTypes = feeTypesData?.feeTypes?.filter(
        (ft: any) => ft.isActive !== false && !feeItems.some(item => item.feeTypeId === ft.id)
    ) || [];

    return (
        <Box>
            <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
                Fee Structure Management
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                {/* Fee Types Management Accordion */}
                <Accordion
                    expanded={feeTypesExpanded}
                    onChange={() => setFeeTypesExpanded(!feeTypesExpanded)}
                    sx={{ mb: 3, bgcolor: 'grey.50', '&:before': { display: 'none' } }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CategoryIcon color="primary" />
                            <Typography fontWeight={600}>Manage Fee Types</Typography>
                            <Chip
                                label={`${feeTypesData?.feeTypes?.length || 0} types`}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <TextField
                                label="Fee Type Name"
                                size="small"
                                value={newFeeType.name}
                                onChange={(e) => setNewFeeType({ ...newFeeType, name: e.target.value })}
                                sx={{ minWidth: 180 }}
                            />
                            <TextField
                                label="Description"
                                size="small"
                                value={newFeeType.description}
                                onChange={(e) => setNewFeeType({ ...newFeeType, description: e.target.value })}
                                sx={{ minWidth: 200 }}
                            />
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel>Frequency</InputLabel>
                                <Select
                                    value={newFeeType.frequency}
                                    label="Frequency"
                                    onChange={(e) => setNewFeeType({ ...newFeeType, frequency: e.target.value })}
                                >
                                    <MenuItem value="">Not Set</MenuItem>
                                    {FREQUENCIES.filter(f => f !== 'Not Set').map((freq) => (
                                        <MenuItem key={freq} value={freq}>{freq}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleCreateFeeType}
                                disabled={feeTypeSaving || !newFeeType.name.trim()}
                            >
                                Add Fee Type
                            </Button>
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.200' }}>
                                    <TableCell><strong>Name</strong></TableCell>
                                    <TableCell><strong>Description</strong></TableCell>
                                    <TableCell><strong>Frequency</strong></TableCell>
                                    <TableCell align="center"><strong>Actions</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {feeTypesData?.feeTypes?.map((ft: any) => (
                                    <TableRow key={ft.id} hover>
                                        <TableCell>{ft.name}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">{ft.description || '-'}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            {ft.frequency ? (
                                                <Chip label={ft.frequency} size="small" color={getFrequencyColor(ft.frequency) as any} />
                                            ) : (
                                                <Chip label="Not Set" size="small" variant="outlined" />
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => { setFeeTypeToDelete(ft); setDeleteFeeTypeDialogOpen(true); }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </AccordionDetails>
                </Accordion>

                {/* Class Selection and Fee Structure */}
                <Box sx={{ display: 'flex', gap: 2, my: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Session</InputLabel>
                        <Select
                            value={selectedSessionId}
                            label="Session"
                            onChange={(e) => setSelectedSessionId(Number(e.target.value))}
                        >
                            {sessions.map((s: any) => (
                                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Class</InputLabel>
                        <Select
                            value={selectedClass}
                            label="Class"
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            {(classes || []).map((cls: any) => (
                                <MenuItem key={cls.id} value={cls.name}>{cls.displayName || cls.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 250 }}>
                        <InputLabel>Select Fee Type to Add</InputLabel>
                        <Select
                            value={selectedFeeType}
                            onChange={(e) => setSelectedFeeType(e.target.value as number)}
                            label="Select Fee Type to Add"
                            disabled={!selectedClass}
                        >
                            {availableFeeTypes.map((ft: any) => (
                                <MenuItem key={ft.id} value={ft.id}>
                                    {ft.name} {ft.frequency && `(${ft.frequency})`}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        type="number"
                        size="small"
                        label="Amount (₹)"
                        value={newFeeAmount || ''}
                        onChange={(e) => setNewFeeAmount(parseFloat(e.target.value) || 0)}
                        disabled={!selectedClass || !selectedFeeType}
                        sx={{ width: 150 }}
                    />

                    <Button
                        variant="contained"
                        startIcon={isSaving ? <SyncIcon /> : <AddIcon />}
                        onClick={handleAddFeeType}
                        disabled={!selectedClass || !selectedFeeType || !newFeeAmount || isSaving}
                    >
                        Add Fee Type
                    </Button>
                </Box>

                {!selectedClass && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Please select a class to view or manage fee structure.
                    </Alert>
                )}

                {selectedClass && feeItems.length === 0 && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        No fee types added yet. Select a fee type from the dropdown above to add it to this class structure.
                    </Alert>
                )}

                {feeItems.length > 0 && (
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell colSpan={2}>
                                    <Typography variant="subtitle2" fontWeight="bold">Total Annual Fee</Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="h6" color="primary" fontWeight="bold">
                                        ₹{totalAmount.toLocaleString()}
                                    </Typography>
                                </TableCell>
                                <TableCell />
                            </TableRow>
                            <TableRow sx={{ bgcolor: 'grey.200' }}>
                                <TableCell><strong>Fee Type</strong></TableCell>
                                <TableCell><strong>Frequency</strong></TableCell>
                                <TableCell align="right"><strong>Amount (₹)</strong></TableCell>
                                <TableCell align="center"><strong>Action</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {feeItems.map((item) => {
                                const isEditing = editingId === item.feeTypeId;
                                return (
                                    <TableRow key={item.feeTypeId}>
                                        <TableCell>{item.feeTypeName}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={item.frequency || 'Not Set'}
                                                size="small"
                                                color={getFrequencyColor(item.frequency) as any}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            {isEditing ? (
                                                <TextField
                                                    type="number"
                                                    size="small"
                                                    value={item.amount}
                                                    onChange={(e) => handleAmountChange(item.feeTypeId, parseFloat(e.target.value) || 0)}
                                                    sx={{ width: 120 }}
                                                />
                                            ) : (
                                                <Typography fontWeight={600}>₹{item.amount.toLocaleString()}</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title={isEditing ? 'Save' : 'Edit'}>
                                                <IconButton
                                                    size="small"
                                                    color={isEditing ? 'success' : 'primary'}
                                                    onClick={() => handleEditToggle(item.feeTypeId)}
                                                >
                                                    {isEditing ? <CheckIcon /> : <EditIcon />}
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleRemoveFeeType(item.feeTypeId)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </Paper>

            {/* Delete Fee Item Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    Are you sure you want to remove <strong>{itemToDelete?.feeTypeName}</strong> from this class fee structure?
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Fee Type Dialog */}
            <Dialog open={deleteFeeTypeDialogOpen} onClose={() => setDeleteFeeTypeDialogOpen(false)}>
                <DialogTitle>Confirm Delete Fee Type</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete <strong>{feeTypeToDelete?.name}</strong>? This may affect existing fee structures.
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteFeeTypeDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteFeeTypeConfirm} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}
