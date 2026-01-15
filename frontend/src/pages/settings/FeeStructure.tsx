import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Container,
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
    CloudDone as CloudDoneIcon,
    Sync as SyncIcon,
    ExpandMore as ExpandMoreIcon,
    Category as CategoryIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { useSession } from '../../contexts/SessionContext';
import { feeTypeService, feeStructureService, classService } from '../../lib/api';
import PageHeader from '../../components/PageHeader';

const FREQUENCIES = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'One-time', 'Refundable', 'Not Set'];

interface FeeItem {
    feeTypeId: number;
    feeTypeName: string;
    amount: number;
    frequency?: string;
}

export default function FeeStructure() {
    const { selectedSession } = useSession();
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

    // Check if there are unsaved changes
    const hasUnsavedChanges = unsavedIds.size > 0;

    // Helper function to get frequency color
    const getFrequencyColor = (frequency: string | undefined) => {
        switch (frequency) {
            case 'Monthly': return 'primary';
            case 'Quarterly': return 'info';
            case 'Half-Yearly': return 'success';
            case 'Yearly': return 'secondary';
            case 'One-time': return 'warning';
            case 'Refundable': return 'error';
            case 'Not Set': return 'default';
            default: return 'default';
        }
    };

    // Fetch fee types (including inactive for management)
    const { data: feeTypesData, refetch: refetchFeeTypes } = useQuery({
        queryKey: ['feeTypes'],
        queryFn: () => feeTypeService.getAll(false), // false = include inactive
    });

    // Fetch available classes
    const { data: classes } = useQuery({
        queryKey: ['classes'],
        queryFn: classService.getAll,
    });

    // Fetch fee structure
    const { data: structureData } = useQuery({
        queryKey: ['feeStructure', selectedSession?.id, selectedClass],
        queryFn: () => feeStructureService.getStructure(selectedSession!.id, selectedClass),
        enabled: !!selectedSession && !!selectedClass,
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
            // Mark all loaded items as saved (they came from database)
            setSavedIds(new Set(items.map(i => i.feeTypeId)));
            setUnsavedIds(new Set());
        } else {
            setFeeItems([]);
            setSavedIds(new Set());
        }
    }, [structureData, feeTypesData]);

    // Effect to handle Transport Fee selection (Auto-set amount to 0)
    useEffect(() => {
        if (selectedFeeType && feeTypesData?.feeTypes) {
            const type = feeTypesData.feeTypes.find((ft: any) => ft.id === selectedFeeType);
            if (type?.name?.toLowerCase().includes('transport') || type?.name?.toLowerCase().includes('van') || type?.name?.toLowerCase().includes('bus')) {
                setNewFeeAmount(0);
            }
        }
    }, [selectedFeeType, feeTypesData]);

    const handleAddFeeType = async () => {
        if (!selectedFeeType || !feeTypesData || !selectedSession) return;

        const feeType = feeTypesData.feeTypes.find((ft: any) => ft.id === selectedFeeType);
        if (!feeType) return;

        // Check if already added
        if (feeItems.some(item => item.feeTypeId === selectedFeeType)) {
            alert('This fee type is already added');
            return;
        }

        const newItem = {
            feeTypeId: feeType.id,
            feeTypeName: feeType.name,
            amount: newFeeAmount || 0,
            frequency: feeType.frequency,
        };

        // Add to local state
        const updatedItems = [...feeItems, newItem];
        setFeeItems(updatedItems);

        // Save to database immediately
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

            await feeStructureService.upsertStructure(selectedSession.id, selectedClass, {
                description: `Class ${selectedClass} fee structure`,
                items: saveItems,
            });

            // Mark as saved
            setSavedIds(prev => new Set(prev).add(feeType.id));
            queryClient.invalidateQueries({ queryKey: ['feeStructure'] });

            // Reset form
            setSelectedFeeType('');
            setNewFeeAmount(0);
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save fee. Please try again.');
            // Remove the item from local state if save failed
            setFeeItems(feeItems);
        } finally {
            setIsSaving(false);
        }
    };

    // Delete State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<FeeItem | null>(null);

    // Snackbar State
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

    const handleRemoveFeeType = (feeTypeId: number) => {
        const item = feeItems.find(i => i.feeTypeId === feeTypeId);
        if (item) {
            setItemToDelete(item);
            setDeleteDialogOpen(true);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!itemToDelete || !selectedSession) return;

        try {
            // Filter out the item to be deleted
            const updatedItems = feeItems.filter(item => item.feeTypeId !== itemToDelete.feeTypeId);

            // Prepare payload for API
            const saveItems = updatedItems
                .filter(item => item.amount > 0)
                .map(item => ({
                    feeTypeId: item.feeTypeId,
                    amount: item.amount,
                    isOptional: false,
                    frequency: item.frequency || null,
                }));

            await feeStructureService.upsertStructure(selectedSession.id, selectedClass, {
                description: `Class ${selectedClass} fee structure`,
                items: saveItems,
            });

            // Update local state
            setFeeItems(updatedItems);

            setSnackbar({
                open: true,
                message: 'Fee type removed successfully',
                severity: 'success',
            });

            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ['feeStructure'] });
        } catch (error) {
            console.error('Delete failed:', error);
            setSnackbar({
                open: true,
                message: 'Failed to delete fee type',
                severity: 'error',
            });
        } finally {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        }
    };

    const handleAmountChange = (feeTypeId: number, amount: number) => {
        setFeeItems(
            feeItems.map(item =>
                item.feeTypeId === feeTypeId ? { ...item, amount } : item
            )
        );
        // Mark as unsaved
        setUnsavedIds(prev => new Set(prev).add(feeTypeId));
        setSavedIds(prev => { const newSet = new Set(prev); newSet.delete(feeTypeId); return newSet; });
    };

    const handleFrequencyChange = (feeTypeId: number, frequency: string) => {
        console.log(`Frequency Change: FeeType ${feeTypeId} -> ${frequency}`);
        setFeeItems(
            feeItems.map(item =>
                item.feeTypeId === feeTypeId ? { ...item, frequency } : item
            )
        );
        // Mark as unsaved
        setUnsavedIds(prev => new Set(prev).add(feeTypeId));
        setSavedIds(prev => { const newSet = new Set(prev); newSet.delete(feeTypeId); return newSet; });
    };

    // Save function - called when edit is done
    // Use Ref to access latest feeItems in callbacks
    const feeItemsRef = useRef(feeItems);
    feeItemsRef.current = feeItems;

    const performSave = async (feeTypeId: number) => {
        if (!selectedSession || feeItemsRef.current.length === 0) return;

        const saveItems = feeItemsRef.current
            .filter(item => item.amount > 0)
            .map(item => ({
                feeTypeId: item.feeTypeId,
                amount: item.amount,
                isOptional: false,
                frequency: item.frequency || null,
            }));

        const payloadString = JSON.stringify(saveItems, null, 2);
        console.log('Performing Save with Payload:', payloadString);

        if (saveItems.length === 0) return;

        setIsSaving(true);
        try {
            await feeStructureService.upsertStructure(selectedSession.id, selectedClass, {
                description: `Class ${selectedClass} fee structure`,
                items: saveItems,
            });
            // Mark this item as saved
            setSavedIds(prev => new Set(prev).add(feeTypeId));
            setUnsavedIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(feeTypeId);
                return newSet;
            });
            queryClient.invalidateQueries({ queryKey: ['feeStructure'] });
        } catch (error) {
            console.error('Save failed:', error);
            alert('Save failed. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle edit toggle - save when done editing
    const handleEditToggle = async (feeTypeId: number) => {
        const isCurrentlyEditing = editingId === feeTypeId;

        if (isCurrentlyEditing) {
            // Done editing - save this item
            await performSave(feeTypeId);
            setEditingId(null);
        } else {
            // Start editing
            setEditingId(feeTypeId);
        }
    };

    // Warn before leaving with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    // Calculate total annual fee based on frequency
    const getAnnualMultiplier = (frequency: string | undefined): number => {
        switch (frequency) {
            case 'Monthly': return 12;
            case 'Quarterly': return 4;
            case 'Half-Yearly': return 2;
            case 'Yearly': return 1;
            case 'One-time': return 1;
            case 'Refundable': return 1;
            default: return 1;
        }
    };

    const totalAmount = feeItems.reduce((sum, item) => {
        const multiplier = getAnnualMultiplier(item.frequency);
        return sum + ((item.amount || 0) * multiplier);
    }, 0);

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

    const handleStartEditFeeType = (feeType: any) => {
        setEditingFeeTypeId(feeType.id);
        setEditFeeType({
            id: feeType.id,
            name: feeType.name,
            description: feeType.description || '',
            frequency: feeType.frequency || '',
        });
    };

    const handleSaveEditFeeType = async () => {
        if (!editFeeType.name.trim()) {
            setSnackbar({ open: true, message: 'Fee type name is required', severity: 'error' });
            return;
        }
        setFeeTypeSaving(true);
        try {
            await feeTypeService.update(editFeeType.id, {
                name: editFeeType.name.trim(),
                description: editFeeType.description.trim(),
                frequency: editFeeType.frequency || null,
            });
            setEditingFeeTypeId(null);
            refetchFeeTypes();
            queryClient.invalidateQueries({ queryKey: ['feeStructure'] });
            setSnackbar({ open: true, message: 'Fee type updated successfully', severity: 'success' });
        } catch (error: any) {
            setSnackbar({ open: true, message: error?.response?.data?.message || 'Failed to update fee type', severity: 'error' });
        } finally {
            setFeeTypeSaving(false);
        }
    };

    const handleCancelEditFeeType = () => {
        setEditingFeeTypeId(null);
        setEditFeeType({ id: 0, name: '', description: '', frequency: '' });
    };

    const handleDeleteFeeTypeClick = (feeType: any) => {
        setFeeTypeToDelete(feeType);
        setDeleteFeeTypeDialogOpen(true);
    };

    const handleDeleteFeeTypeConfirm = async () => {
        if (!feeTypeToDelete) return;
        setFeeTypeSaving(true);
        try {
            await feeTypeService.delete(feeTypeToDelete.id);
            refetchFeeTypes();
            setSnackbar({ open: true, message: 'Fee type deleted successfully', severity: 'success' });
        } catch (error: any) {
            setSnackbar({ open: true, message: error?.response?.data?.message || 'Failed to delete fee type. It may be in use.', severity: 'error' });
        } finally {
            setDeleteFeeTypeDialogOpen(false);
            setFeeTypeToDelete(null);
            setFeeTypeSaving(false);
        }
    };

    // Get available fee types (not already added) - only active ones for structure
    // EXCLUDING 'Transport Fee' as per user request (it is student-specific, not class-wise)
    const availableFeeTypes = feeTypesData?.feeTypes.filter(
        (ft: any) => ft.isActive !== false &&
            !feeItems.some(item => item.feeTypeId === ft.id) &&
            !ft.name.toLowerCase().includes('transport')
    ) || [];

    if (!selectedSession) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="warning">Please select a session first</Alert>
            </Container>
        );
    }

    return (
        <Box>
            <PageHeader title="Fee Structure Management" />

            <Paper sx={{ p: 3 }}>

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

                        {/* Add New Fee Type Row */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <TextField
                                label="Fee Type Name"
                                size="small"
                                value={newFeeType.name}
                                onChange={(e) => setNewFeeType({ ...newFeeType, name: e.target.value })}
                                sx={{ minWidth: 180 }}
                                placeholder="e.g. Transport Fee"
                            />
                            <TextField
                                label="Description"
                                size="small"
                                value={newFeeType.description}
                                onChange={(e) => setNewFeeType({ ...newFeeType, description: e.target.value })}
                                sx={{ minWidth: 200 }}
                                placeholder="Optional description"
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
                                startIcon={feeTypeSaving ? <SyncIcon sx={{ animation: 'spin 1s linear infinite' }} /> : <AddIcon />}
                                onClick={handleCreateFeeType}
                                disabled={feeTypeSaving || !newFeeType.name.trim()}
                            >
                                Add Fee Type
                            </Button>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {/* Fee Types Table */}
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.200' }}>
                                    <TableCell><strong>Name</strong></TableCell>
                                    <TableCell><strong>Description</strong></TableCell>
                                    <TableCell><strong>Frequency</strong></TableCell>
                                    <TableCell align="center" sx={{ width: 120 }}><strong>Actions</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {feeTypesData?.feeTypes?.map((ft: any) => (
                                    <TableRow key={ft.id} hover>
                                        <TableCell>
                                            {editingFeeTypeId === ft.id ? (
                                                <TextField
                                                    size="small"
                                                    value={editFeeType.name}
                                                    onChange={(e) => setEditFeeType({ ...editFeeType, name: e.target.value })}
                                                    sx={{ minWidth: 150 }}
                                                />
                                            ) : (
                                                ft.name
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {editingFeeTypeId === ft.id ? (
                                                <TextField
                                                    size="small"
                                                    value={editFeeType.description}
                                                    onChange={(e) => setEditFeeType({ ...editFeeType, description: e.target.value })}
                                                    sx={{ minWidth: 180 }}
                                                />
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    {ft.description || '-'}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {editingFeeTypeId === ft.id ? (
                                                <Select
                                                    size="small"
                                                    value={editFeeType.frequency}
                                                    onChange={(e) => setEditFeeType({ ...editFeeType, frequency: e.target.value })}
                                                    sx={{ minWidth: 120 }}
                                                >
                                                    <MenuItem value="">Not Set</MenuItem>
                                                    {FREQUENCIES.filter(f => f !== 'Not Set').map((freq) => (
                                                        <MenuItem key={freq} value={freq}>{freq}</MenuItem>
                                                    ))}
                                                </Select>
                                            ) : (
                                                ft.frequency ? (
                                                    <Chip
                                                        label={ft.frequency}
                                                        size="small"
                                                        color={getFrequencyColor(ft.frequency)}
                                                    />
                                                ) : (
                                                    <Chip label="Not Set" size="small" variant="outlined" />
                                                )
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            {editingFeeTypeId === ft.id ? (
                                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                    <Tooltip title="Save">
                                                        <IconButton
                                                            size="small"
                                                            color="success"
                                                            onClick={handleSaveEditFeeType}
                                                            disabled={feeTypeSaving}
                                                        >
                                                            {feeTypeSaving ? <SyncIcon sx={{ fontSize: 18 }} /> : <CheckIcon />}
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Cancel">
                                                        <IconButton
                                                            size="small"
                                                            color="default"
                                                            onClick={handleCancelEditFeeType}
                                                        >
                                                            <CloseIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            ) : (
                                                (() => {
                                                    const isProtected = ft.name.toLowerCase().includes('transport') || ft.name.toLowerCase().includes('late fee');
                                                    return (
                                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                            <Tooltip title={isProtected ? "Protected System Fee" : "Edit"}>
                                                                <span>
                                                                    <IconButton
                                                                        size="small"
                                                                        color="primary"
                                                                        onClick={() => handleStartEditFeeType(ft)}
                                                                        disabled={isProtected}
                                                                    >
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                            <Tooltip title={isProtected ? "Protected System Fee" : "Delete"}>
                                                                <span>
                                                                    <IconButton
                                                                        size="small"
                                                                        color="error"
                                                                        onClick={() => handleDeleteFeeTypeClick(ft)}
                                                                        disabled={isProtected}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                        </Box>
                                                    );
                                                })()
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </AccordionDetails>
                </Accordion>

                <Box sx={{ display: 'flex', gap: 2, my: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <Typography variant="caption" sx={{ mb: 0.5 }}>
                            Session
                        </Typography>
                        <TextField
                            value={selectedSession.name}
                            size="small"
                            disabled
                            fullWidth
                        />
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            displayEmpty
                            renderValue={(selected) => {
                                if (!selected) {
                                    return <em>Select Class</em>;
                                }
                                const selectedClassObj = classes?.find((cls: any) => cls.name === selected);
                                return selectedClassObj?.displayName || selected;
                            }}
                        >
                            {classes?.map((cls: any) => (
                                <MenuItem key={cls.id} value={cls.name}>
                                    {cls.displayName || cls.name}
                                </MenuItem>
                            ))}
                            {(!classes || classes.length === 0) && (
                                <MenuItem disabled>No classes found</MenuItem>
                            )}
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

                    {(() => {
                        const isTransport = feeTypesData?.feeTypes?.find((ft: any) => ft.id === selectedFeeType)?.name?.toLowerCase().includes('transport');
                        return (
                            <TextField
                                type="number"
                                size="small"
                                label="Amount (₹)"
                                value={newFeeAmount || ''}
                                onChange={(e) => setNewFeeAmount(parseFloat(e.target.value) || 0)}
                                disabled={!selectedClass || !selectedFeeType || isTransport}
                                sx={{ width: 150 }}
                                inputProps={{ min: 0, step: 100 }}
                                helperText={isTransport ? "Auto-calculated" : ""}
                            />
                        );
                    })()}

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddFeeType}
                        disabled={!selectedClass || !selectedFeeType || (!newFeeAmount && !feeTypesData?.feeTypes?.find((ft: any) => ft.id === selectedFeeType)?.name?.toLowerCase().includes('transport'))}
                        sx={{ height: 40 }}
                    >
                        Add Fee Type
                    </Button>

                    {/* Spacer to push total to right */}
                    <Box sx={{ flex: 1 }} />

                    {/* Auto-save status */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 2 }}>
                        {isSaving && (
                            <>
                                <SyncIcon sx={{ fontSize: 18, color: 'text.secondary', animation: 'spin 1s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
                                <Typography variant="caption" color="text.secondary">Saving...</Typography>
                            </>
                        )}
                    </Box>
                </Box>

                {feeItems.length === 0 ? (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        No fee types added yet. Select a fee type from the dropdown above to add it to this class structure.
                    </Alert>
                ) : (
                    <>
                        <Table>
                            <TableHead>
                                {/* Total Annual Fee row above header */}
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
                                                {isEditing ? (
                                                    <Select
                                                        size="small"
                                                        value={item.frequency || ''}
                                                        onChange={(e) => handleFrequencyChange(item.feeTypeId, e.target.value)}
                                                        displayEmpty
                                                        sx={{ minWidth: 140 }}
                                                    >
                                                        <MenuItem value="" disabled>
                                                            Select Frequency
                                                        </MenuItem>
                                                        {FREQUENCIES.map((freq) => (
                                                            <MenuItem key={freq} value={freq}>
                                                                {freq}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                ) : (
                                                    item.frequency ? (
                                                        <Chip
                                                            label={item.frequency}
                                                            size="small"
                                                            color={getFrequencyColor(item.frequency)}
                                                        />
                                                    ) : (
                                                        <Chip label="Not Set" size="small" variant="outlined" />
                                                    )
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                {isEditing ? (
                                                    <TextField
                                                        type="number"
                                                        size="small"
                                                        value={item.amount || ''}
                                                        onChange={(e) =>
                                                            handleAmountChange(
                                                                item.feeTypeId,
                                                                parseFloat(e.target.value) || 0
                                                            )
                                                        }
                                                        disabled={item.feeTypeName.toLowerCase().includes('transport')}
                                                        sx={{ width: 120 }}
                                                        inputProps={{ min: 0, step: 100 }}
                                                        placeholder="Amount"
                                                        helperText={item.feeTypeName.toLowerCase().includes('transport') ? "Auto" : ""}
                                                    />
                                                ) : (
                                                    <Typography>₹{item.amount?.toLocaleString() || 0}</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                    <IconButton
                                                        color={isEditing ? 'success' : 'primary'}
                                                        onClick={() => handleEditToggle(item.feeTypeId)}
                                                        size="small"
                                                        title={isEditing ? 'Save' : 'Edit'}
                                                        disabled={isSaving}
                                                    >
                                                        {isSaving && isEditing ? <SyncIcon sx={{ animation: 'spin 1s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} /> : isEditing ? <CheckIcon /> : <EditIcon />}
                                                    </IconButton>
                                                    <IconButton
                                                        color="error"
                                                        onClick={() => handleRemoveFeeType(item.feeTypeId)}
                                                        size="small"
                                                        title="Delete"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                    {/* Saved indicator - shows green when saved, faded when unsaved/editing */}
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            width: 28,
                                                            height: 28,
                                                        }}
                                                        title={isEditing || unsavedIds.has(item.feeTypeId) ? "Unsaved" : "Saved"}
                                                    >
                                                        <CloudDoneIcon
                                                            sx={{
                                                                fontSize: 22,
                                                                color: (isEditing || unsavedIds.has(item.feeTypeId)) ? 'grey.400' : 'success.main',
                                                                opacity: (isEditing || unsavedIds.has(item.feeTypeId)) ? 0.5 : 1,
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </>
                )}
            </Paper>

            {/* Delete Fee Type Confirmation Dialog */}
            <Dialog open={deleteFeeTypeDialogOpen} onClose={() => setDeleteFeeTypeDialogOpen(false)}>
                <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DeleteIcon />
                    Delete Fee Type
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete <strong>{feeTypeToDelete?.name}</strong>?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        This will permanently remove this fee type. It cannot be deleted if it's used in any fee structure.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteFeeTypeDialogOpen(false)} variant="outlined">Cancel</Button>
                    <Button
                        onClick={handleDeleteFeeTypeConfirm}
                        color="error"
                        variant="contained"
                        disabled={feeTypeSaving}
                        autoFocus
                    >
                        {feeTypeSaving ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DeleteIcon />
                    Confirm Deletion
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to remove <strong>{itemToDelete?.feeTypeName}</strong> from the fee structure?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        This action will strictly remove this fee type from the current class structure.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined">Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>
                        Confirm Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success/Error Notification */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
