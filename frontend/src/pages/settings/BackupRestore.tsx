import React, { useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Divider,
    Grid,
    IconButton,
    LinearProgress,
    Paper,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Alert,
    Tooltip,
    TextField,
    InputAdornment,
    Switch,
    FormControlLabel,
} from '@mui/material';
import {
    CloudUpload,
    Restore,
    Download,
    History,
    Settings,
    Storage,
    Description,
    CheckCircle,
    Warning,
    CloudQueue,
    Save,
} from '@mui/icons-material';
import PageHeader from '../../components/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backupService, type BackupFile } from '../../lib/backup-service';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

export default function BackupRestore() {
    const [tabValue, setTabValue] = useState(0);
    const [creatingBackup, setCreatingBackup] = useState(false);
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();

    // Fetch backups
    const { data: backups, isLoading, refetch } = useQuery({
        queryKey: ['backups'],
        queryFn: backupService.list,
    });

    // Create backup mutation
    const createBackupMutation = useMutation({
        mutationFn: backupService.create,
        onMutate: () => setCreatingBackup(true),
        onSuccess: (data) => {
            enqueueSnackbar(data.message || 'Backup created successfully', { variant: 'success' });
            refetch();
        },
        onError: (error: any) => {
            enqueueSnackbar(error.message || 'Failed to create backup', { variant: 'error' });
        },
        onSettled: () => setCreatingBackup(false),
    });

    // Restore mutation
    const restoreMutation = useMutation({
        mutationFn: (data: { filename: string; type: 'database' | 'files' }) =>
            backupService.restore(data.filename, data.type),
        onSuccess: () => {
            enqueueSnackbar('Restore process started. Check logs for progress.', { variant: 'info' });
        },
        onError: (error: any) => {
            enqueueSnackbar(error.message || 'Failed to start restore', { variant: 'error' });
        },
    });

    const handleCreateBackup = () => {
        createBackupMutation.mutate();
    };

    const handleRestore = (filename: string, type: 'database' | 'files') => {
        if (window.confirm(`Are you sure you want to restore ${filename}? This will OVERWRITE current data!`)) {
            restoreMutation.mutate({ filename, type });
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const renderBackupTable = (files: BackupFile[] | undefined, type: 'database' | 'files') => {
        if (!files || files.length === 0) {
            return (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    <Typography>No backups found.</Typography>
                </Box>
            );
        }

        return (
            <TableContainer component={Paper} variant="outlined">
                <Table size="medium">
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                        <TableRow>
                            <TableCell>Filename</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Size</TableCell>
                            <TableCell align="center">Cloud</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {files.map((file) => (
                            <TableRow key={file.name} hover>
                                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                                    {file.name}
                                </TableCell>
                                <TableCell>
                                    {format(new Date(file.date), 'PP pp')}
                                </TableCell>
                                <TableCell>
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </TableCell>
                                <TableCell align="center">
                                    <Tooltip title="Synced to Google Drive">
                                        <CloudQueue color="action" fontSize="small" />
                                    </Tooltip>
                                </TableCell>
                                <TableCell align="right">
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                        <Tooltip title="Download">
                                            <IconButton
                                                component="a"
                                                href={backupService.downloadUrl(type, file.name)}
                                                size="small"
                                                color="primary"
                                            >
                                                <Download fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="Restore">
                                            <IconButton
                                                size="small"
                                                color="warning"
                                                onClick={() => handleRestore(file.name, type)}
                                            >
                                                <Restore fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <PageHeader
                title="Backup & Restore"
                subtitle="Manage database and file backups, disaster recovery, and settings."
                icon={<History fontSize="large" color="primary" />}
                action={
                    <Button
                        variant="contained"
                        startIcon={<CloudUpload />}
                        onClick={handleCreateBackup}
                        disabled={creatingBackup}
                    >
                        {creatingBackup ? 'Creating...' : 'Create New Backup'}
                    </Button>
                }
            />

            {creatingBackup && (
                <Box sx={{ mb: 3 }}>
                    <LinearProgress />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                        Creating database and file backups... This may take a moment.
                    </Typography>
                </Box>
            )}

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ mb: 3 }}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            variant="fullWidth"
                            indicatorColor="primary"
                            textColor="primary"
                            sx={{ borderBottom: 1, borderColor: 'divider' }}
                        >
                            <Tab icon={<Storage />} label="Database Backups" />
                            <Tab icon={<Description />} label="File Backups" />
                            <Tab icon={<Settings />} label="Settings" />
                        </Tabs>

                        <CustomTabPanel value={tabValue} index={0}>
                            <Box sx={{ px: 3 }}>
                                <Alert severity="info" sx={{ mb: 3 }}>
                                    Database backups include all student records, fees, examination results, and configuration.
                                    Restoring a database will <b>replace all current data</b> with the backup data.
                                </Alert>
                                {isLoading ? <LinearProgress /> : renderBackupTable(backups?.database, 'database')}
                            </Box>
                        </CustomTabPanel>

                        <CustomTabPanel value={tabValue} index={1}>
                            <Box sx={{ px: 3 }}>
                                <Alert severity="info" sx={{ mb: 3 }}>
                                    File backups include student photos, documents, and school logos stored in the <code>uploads/</code> directory.
                                </Alert>
                                {isLoading ? <LinearProgress /> : renderBackupTable(backups?.files, 'files')}
                            </Box>
                        </CustomTabPanel>

                        <CustomTabPanel value={tabValue} index={2}>
                            <Box sx={{ px: 3, maxWidth: 600, mx: 'auto' }}>
                                <Typography variant="h6" gutterBottom>Auto-Backup Configuration</Typography>
                                <Divider sx={{ mb: 3 }} />

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <FormControlLabel
                                        control={<Switch defaultChecked />}
                                        label={
                                            <Box>
                                                <Typography variant="subtitle2">Enable Daily Backups</Typography>
                                                <Typography variant="caption" color="text.secondary">Automatically backup at 2:00 AM daily</Typography>
                                            </Box>
                                        }
                                    />

                                    <FormControlLabel
                                        control={<Switch defaultChecked />}
                                        label={
                                            <Box>
                                                <Typography variant="subtitle2">Sync to Google Drive</Typography>
                                                <Typography variant="caption" color="text.secondary">Upload backups to cloud storage for disaster recovery</Typography>
                                            </Box>
                                        }
                                    />

                                    <TextField
                                        label="Backup Retention (Days)"
                                        type="number"
                                        defaultValue={30}
                                        helperText="Backups older than this will be automatically deleted"
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">Days</InputAdornment>,
                                        }}
                                    />

                                    <Button variant="contained" startIcon={<Save />} size="large">
                                        Save Settings
                                    </Button>

                                    <Alert severity="warning" icon={<Warning />}>
                                        <b>Note:</b> These settings affect the backend automation service. Changes may take up to 24 hours to apply if not restarted.
                                    </Alert>
                                </Box>
                            </Box>
                        </CustomTabPanel>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined" sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                                <CheckCircle color="success" fontSize="small" /> System Status
                            </Typography>
                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">Last Backup:</Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {backups?.database?.[0] ? format(new Date(backups.database[0].date), 'PP p') : 'Never'}
                                    </Typography>
                                </Box>

                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">Total Backups:</Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {(backups?.database?.length || 0) + (backups?.files?.length || 0)} Files
                                    </Typography>
                                </Box>

                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">Cloud Storage:</Typography>
                                    <Chip size="small" label="Connected" color="success" variant="outlined" />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ bgcolor: 'info.lighter', borderColor: 'info.light' }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="info.main" gutterBottom>
                                Need Help?
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                For critical data recovery or if the system is inaccessible, use the command-line tools on the server:
                            </Typography>
                            <Box component="pre" sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1, fontSize: '0.75rem', overflowX: 'auto' }}>
                                ./scripts/restore-database.sh
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
}
