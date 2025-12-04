import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Paper,
    Typography,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Checkbox,
    Alert,
    Snackbar,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
} from '@mui/material';
import { promotionService } from '../../lib/api';
import { useSession } from '../../contexts/SessionContext';

export default function StudentPromotions() {
    const { allSessions } = useSession();
    const queryClient = useQueryClient();

    // Filters
    const [currentSessionId, setCurrentSessionId] = useState<number>(0);
    const [className, setClassName] = useState('');
    const [section, setSection] = useState('');

    // Selection
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

    // Next class/section
    const [nextSessionId, setNextSessionId] = useState<number>(0);
    const [nextSection, setNextSection] = useState('');

    // UI state
    const [isPassoutMode, setIsPassoutMode] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    // Preview query
    const { data: previewData, isLoading } = useQuery({
        queryKey: ['promotion-preview', currentSessionId, className, section],
        queryFn: () =>
            promotionService.preview({
                currentSessionId,
                className,
                section,
            }),
        enabled: !!currentSessionId && !!className && !!section,
    });

    // Promotion mutation
    const promoteMutation = useMutation({
        mutationFn: promotionService.execute,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['promotion-preview'] });
            queryClient.invalidateQueries({ queryKey: ['students'] });
            setSuccessMessage(
                `Successfully promoted ${data.promoted} students!${data.failed > 0 ? ` (${data.failed} failed)` : ''
                }`
            );
            setSelectedStudents([]);
            setConfirmOpen(false);
        },
        onError: (error: any) => {
            setError(error?.response?.data?.message || 'Failed to promote students');
            setConfirmOpen(false);
        },
    });

    const handleSelectAll = () => {
        if (!previewData?.students) return;
        const eligibleIds = previewData.students
            .filter((s: any) => s.status === 'active')
            .map((s: any) => s.id);
        setSelectedStudents(eligibleIds);
    };

    const handleDeselectAll = () => {
        setSelectedStudents([]);
    };

    const handleToggleStudent = (studentId: number) => {
        setSelectedStudents((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handlePromote = () => {
        if (selectedStudents.length === 0) {
            setError('Please select at least one student');
            return;
        }

        if (!isPassoutMode && (!nextSessionId || !nextSection)) {
            setError('Please select next session and section');
            return;
        }

        setConfirmOpen(true);
    };

    const confirmPromotion = () => {
        const nextClass = previewData?.meta?.nextClass || className;

        promoteMutation.mutate({
            studentIds: selectedStudents,
            currentSessionId,
            nextSessionId: isPassoutMode ? currentSessionId : nextSessionId,
            nextClass: isPassoutMode ? className : nextClass,
            nextSection: isPassoutMode ? section : nextSection,
            markAsPassout: isPassoutMode,
        });
    };

    const students = previewData?.students || [];
    const meta = previewData?.meta;
    const canMarkPassout = meta?.isPassoutClass;

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Student Promotions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Promote students to the next class or mark them as passed out (Class 10 & 12 only)
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Step 1: Select Class & Section
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Current Session</InputLabel>
                        <Select
                            value={currentSessionId}
                            onChange={(e) => setCurrentSessionId(Number(e.target.value))}
                            label="Current Session"
                        >
                            {allSessions.map((session) => (
                                <MenuItem key={session.id} value={session.id}>
                                    {session.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 150 }}>
                        <InputLabel>Class</InputLabel>
                        <Select
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            label="Class"
                        >
                            {[...Array(12)].map((_, i) => (
                                <MenuItem key={i + 1} value={String(i + 1)}>
                                    Class {i + 1}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 150 }}>
                        <InputLabel>Section</InputLabel>
                        <Select
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                            label="Section"
                        >
                            {['A', 'B', 'C', 'D'].map((sec) => (
                                <MenuItem key={sec} value={sec}>
                                    Section {sec}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {meta && students.length > 0 && (
                <>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                Step 2: Select Students ({selectedStudents.length} selected)
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button onClick={handleSelectAll} size="small">
                                    Select All Active
                                </Button>
                                <Button onClick={handleDeselectAll} size="small">
                                    Deselect All
                                </Button>
                            </Box>
                        </Box>

                        <Alert severity="info" sx={{ mb: 2 }}>
                            Promoting from <strong>Class {meta.currentClass}-{section}</strong> to{' '}
                            <strong>Class {meta.nextClass || 'Passout'}</strong> | {meta.eligible} eligible of {meta.total} total
                        </Alert>

                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">Select</TableCell>
                                    <TableCell>Student ID</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {students.map((student: any) => (
                                    <TableRow key={student.id}>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedStudents.includes(student.id)}
                                                onChange={() => handleToggleStudent(student.id)}
                                                disabled={student.status !== 'active'}
                                            />
                                        </TableCell>
                                        <TableCell>{student.studentId}</TableCell>
                                        <TableCell>{student.name}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={student.status}
                                                size="small"
                                                color={student.status === 'active' ? 'success' : 'default'}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>

                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Step 3: Set Promotion Details
                        </Typography>

                        {!isPassoutMode && (
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <FormControl sx={{ minWidth: 200 }}>
                                    <InputLabel>Next Session</InputLabel>
                                    <Select
                                        value={nextSessionId}
                                        onChange={(e) => setNextSessionId(Number(e.target.value))}
                                        label="Next Session"
                                    >
                                        {allSessions.map((session) => (
                                            <MenuItem key={session.id} value={session.id}>
                                                {session.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl sx={{ minWidth: 150 }}>
                                    <InputLabel>Next Section</InputLabel>
                                    <Select
                                        value={nextSection}
                                        onChange={(e) => setNextSection(e.target.value)}
                                        label="Next Section"
                                    >
                                        {['A', 'B', 'C', 'D'].map((sec) => (
                                            <MenuItem key={sec} value={sec}>
                                                Section {sec}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    setIsPassoutMode(false);
                                    handlePromote();
                                }}
                                disabled={promoteMutation.isPending}
                            >
                                Promote to Class {meta.nextClass}
                            </Button>

                            {canMarkPassout && (
                                <Button
                                    variant="outlined"
                                    color="warning"
                                    onClick={() => {
                                        setIsPassoutMode(true);
                                        handlePromote();
                                    }}
                                    disabled={promoteMutation.isPending}
                                >
                                    Mark as Passout
                                </Button>
                            )}
                        </Box>
                    </Paper>
                </>
            )}

            {meta && students.length === 0 && (
                <Alert severity="warning">
                    No students found in Class {className}-{section} for the selected session.
                </Alert>
            )}

            {/* Confirmation Dialog */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Confirm {isPassoutMode ? 'Passout' : 'Promotion'}</DialogTitle>
                <DialogContent>
                    <Typography>
                        You are about to {isPassoutMode ? 'mark' : 'promote'} <strong>{selectedStudents.length}</strong> students.
                    </Typography>
                    <Typography sx={{ mt: 2 }}>
                        {isPassoutMode
                            ? `Students will be marked as "Passed" and cannot be promoted further.`
                            : `Students will be moved to Class ${meta?.nextClass}-${nextSection} in the next session.`}
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        This action cannot be easily undone. Please confirm.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={confirmPromotion} variant="contained" color={isPassoutMode ? 'warning' : 'primary'}>
                        Confirm
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
                <Alert onClose={() => setSuccessMessage('')} severity="success">
                    {successMessage}
                </Alert>
            </Snackbar>

            {/* Error Snackbar */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setError('')} severity="error">
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
}
