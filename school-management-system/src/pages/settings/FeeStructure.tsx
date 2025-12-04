import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    CircularProgress,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useSession } from '../../contexts/SessionContext';
import { feeTypeService, feeStructureService } from '../../lib/api';

const CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export default function FeeStructure() {
    const { selectedSession } = useSession();
    const [selectedClass, setSelectedClass] = useState('1');
    const queryClient = useQueryClient();

    // Fetch fee types
    const { data: feeTypesData } = useQuery({
        queryKey: ['feeTypes'],
        queryFn: () => feeTypeService.getAll(true),
    });

    // Fetch fee structure
    const { data: structureData, isLoading } = useQuery({
        queryKey: ['feeStructure', selectedSession?.id, selectedClass],
        queryFn: () => feeStructureService.getStructure(selectedSession!.id, selectedClass),
        enabled: !!selectedSession,
    });

    const [amounts, setAmounts] = useState<Record<number, number>>({});

    // Initialize amounts when structure loads
    useState(() => {
        if (structureData?.items) {
            const newAmounts: Record<number, number> = {};
            structureData.items.forEach((item: any) => {
                newAmounts[item.feeTypeId] = item.amount;
            });
            setAmounts(newAmounts);
        }
    });

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: (data: any) =>
            feeStructureService.upsertStructure(selectedSession!.id, selectedClass, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feeStructure'] });
            alert('Fee structure saved successfully!');
        },
    });

    const handleSave = () => {
        const items = Object.entries(amounts)
            .filter(([, amount]) => amount > 0)
            .map(([feeTypeId, amount]) => ({
                feeTypeId: parseInt(feeTypeId),
                amount,
                isOptional: false,
            }));

        if (items.length === 0) {
            alert('Please add at least one fee type');
            return;
        }

        saveMutation.mutate({
            description: `Class ${selectedClass} fee structure`,
            items,
        });
    };

    const totalAmount = Object.values(amounts).reduce((sum, amt) => sum + (amt || 0), 0);

    if (!selectedSession) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="warning">Please select a session first</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Fee Structure Management
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, my: 3 }}>
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
                        <Typography variant="caption" sx={{ mb: 0.5 }}>
                            Class
                        </Typography>
                        <Select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            {CLASSES.map((cls) => (
                                <MenuItem key={cls} value={cls}>
                                    Class {cls}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Fee Type</strong></TableCell>
                                    <TableCell align="right"><strong>Amount (₹)</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {feeTypesData?.feeTypes.map((feeType: any) => (
                                    <TableRow key={feeType.id}>
                                        <TableCell>{feeType.name}</TableCell>
                                        <TableCell align="right">
                                            <TextField
                                                type="number"
                                                size="small"
                                                value={amounts[feeType.id] || ''}
                                                onChange={(e) =>
                                                    setAmounts({
                                                        ...amounts,
                                                        [feeType.id]: parseFloat(e.target.value) || 0,
                                                    })
                                                }
                                                sx={{ width: 150 }}
                                                inputProps={{ min: 0, step: 100 }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell><strong>Total Annual Fee</strong></TableCell>
                                    <TableCell align="right">
                                        <Typography variant="h6" color="primary">
                                            ₹{totalAmount.toLocaleString()}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={handleSave}
                                disabled={saveMutation.isPending}
                            >
                                {saveMutation.isPending ? 'Saving...' : 'Save Fee Structure'}
                            </Button>
                        </Box>
                    </>
                )}
            </Paper>
        </Container>
    );
}
