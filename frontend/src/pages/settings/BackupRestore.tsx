import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,

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
    CircularProgress,
    Collapse,
} from '@mui/material';
import {
    CloudUpload,
    Restore,
    Download,
    Settings,
    Storage,
    Description,
    CheckCircle,
    Warning,
    CloudQueue,
    CloudDone,
    CloudOff,
    Save,
    Link as LinkIcon,
    LinkOff,
    ExpandMore,
    ExpandLess,
    Key,
    Visibility,
    VisibilityOff,
    Delete,
} from '@mui/icons-material';
import PageHeader from '../../components/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backupService, type BackupFile, type BackupSettingsData, type CloudCredentials } from '../../lib/backup-service';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import { useSearchParams } from 'react-router-dom';

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
    const [syncingFile, setSyncingFile] = useState<string | null>(null);
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();

    // Settings form state
    const [formSettings, setFormSettings] = useState<Partial<BackupSettingsData>>({
        autoBackup: false,
        backupTime: '02:00',
        retentionDays: 30,
    });

    // Credentials form state
    const [showCredentialsForm, setShowCredentialsForm] = useState(false);
    const [showSecret, setShowSecret] = useState(false);
    const [credentialsForm, setCredentialsForm] = useState({
        clientId: '',
        clientSecret: '',
        redirectUri: '',
    });

    // Show connection result from OAuth callback
    useEffect(() => {
        if (searchParams.get('connected') === 'true') {
            enqueueSnackbar('Google Drive connected successfully!', { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['cloudStatus'] });
            queryClient.invalidateQueries({ queryKey: ['backups'] });
        }
        if (searchParams.get('error')) {
            enqueueSnackbar(`Connection failed: ${searchParams.get('error')}`, { variant: 'error' });
        }
    }, [searchParams, enqueueSnackbar, queryClient]);

    // Fetch backups
    const { data: backups, isLoading, refetch } = useQuery({
        queryKey: ['backups'],
        queryFn: backupService.list,
    });

    // Fetch cloud status
    const { data: cloudStatus, isLoading: cloudStatusLoading } = useQuery({
        queryKey: ['cloudStatus'],
        queryFn: backupService.getCloudStatus,
    });

    // Fetch credentials info
    const { data: credentials, isLoading: credentialsLoading } = useQuery<CloudCredentials>({
        queryKey: ['cloudCredentials'],
        queryFn: backupService.getCredentials,
    });

    // Fetch settings
    const { data: settings } = useQuery({
        queryKey: ['backupSettings'],
        queryFn: backupService.getSettings,
    });

    // Update form when settings load
    useEffect(() => {
        if (settings) {
            setFormSettings({
                autoBackup: settings.autoBackup,
                backupTime: settings.backupTime,
                retentionDays: settings.retentionDays,
            });
        }
    }, [settings]);

    // Update credentials form when credentials load
    useEffect(() => {
        if (credentials?.clientId) {
            setCredentialsForm(prev => ({
                ...prev,
                clientId: credentials.clientId || '',
                redirectUri: credentials.redirectUri || '',
            }));
        }
    }, [credentials]);

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

    // Sync to cloud mutation
    const syncMutation = useMutation({
        mutationFn: ({ filename, type }: { filename: string; type: 'database' | 'files' }) =>
            backupService.syncToCloud(filename, type),
        onMutate: ({ filename }) => setSyncingFile(filename),
        onSuccess: () => {
            enqueueSnackbar('Synced to Google Drive!', { variant: 'success' });
            refetch();
        },
        onError: (error: any) => {
            enqueueSnackbar(error.message || 'Sync failed', { variant: 'error' });
        },
        onSettled: () => setSyncingFile(null),
    });

    // Disconnect mutation
    const disconnectMutation = useMutation({
        mutationFn: backupService.disconnectCloud,
        onSuccess: () => {
            enqueueSnackbar('Google Drive disconnected', { variant: 'info' });
            queryClient.invalidateQueries({ queryKey: ['cloudStatus'] });
        },
        onError: (error: any) => {
            enqueueSnackbar(error.message || 'Disconnect failed', { variant: 'error' });
        },
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

    // Delete backup mutation
    const deleteMutation = useMutation({
        mutationFn: (data: { filename: string; type: 'database' | 'files' }) =>
            backupService.delete(data.filename, data.type),
        onSuccess: () => {
            enqueueSnackbar('Backup deleted successfully', { variant: 'success' });
            refetch();
        },
        onError: (error: any) => {
            enqueueSnackbar(error.message || 'Failed to delete backup', { variant: 'error' });
        },
    });

    // Save settings mutation
    const saveSettingsMutation = useMutation({
        mutationFn: backupService.updateSettings,
        onSuccess: () => {
            enqueueSnackbar('Settings saved!', { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['backupSettings'] });
        },
        onError: (error: any) => {
            enqueueSnackbar(error.message || 'Failed to save settings', { variant: 'error' });
        },
    });

    // Save credentials mutation
    const saveCredentialsMutation = useMutation({
        mutationFn: backupService.saveCredentials,
        onSuccess: () => {
            enqueueSnackbar('Google OAuth credentials saved (encrypted)', { variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['cloudCredentials'] });
            queryClient.invalidateQueries({ queryKey: ['cloudStatus'] });
            setShowCredentialsForm(false);
            setCredentialsForm(prev => ({ ...prev, clientSecret: '' }));
        },
        onError: (error: any) => {
            enqueueSnackbar(error.response?.data?.message || 'Failed to save credentials', { variant: 'error' });
        },
    });

    // Clear credentials mutation
    const clearCredentialsMutation = useMutation({
        mutationFn: backupService.clearCredentials,
        onSuccess: () => {
            enqueueSnackbar('Google OAuth credentials cleared', { variant: 'info' });
            queryClient.invalidateQueries({ queryKey: ['cloudCredentials'] });
            queryClient.invalidateQueries({ queryKey: ['cloudStatus'] });
            setCredentialsForm({ clientId: '', clientSecret: '', redirectUri: '' });
        },
        onError: (error: any) => {
            enqueueSnackbar(error.message || 'Failed to clear credentials', { variant: 'error' });
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

    const handleSync = (filename: string, type: 'database' | 'files') => {
        syncMutation.mutate({ filename, type });
    };

    const handleDelete = (filename: string, type: 'database' | 'files') => {
        if (window.confirm(`Are you sure you want to delete ${filename}? This cannot be undone!`)) {
            deleteMutation.mutate({ filename, type });
        }
    };

    const handleConnect = async () => {
        try {
            const url = await backupService.getAuthUrl();
            window.location.href = url;
        } catch (error: any) {
            enqueueSnackbar(error.response?.data?.message || 'Failed to get auth URL', { variant: 'error' });
        }
    };

    const handleDisconnect = () => {
        if (window.confirm('Are you sure you want to disconnect Google Drive?')) {
            disconnectMutation.mutate();
        }
    };

    const handleSaveSettings = () => {
        saveSettingsMutation.mutate(formSettings);
    };

    const handleSaveCredentials = () => {
        if (!credentialsForm.clientId || !credentialsForm.clientSecret) {
            enqueueSnackbar('Client ID and Client Secret are required', { variant: 'warning' });
            return;
        }
        saveCredentialsMutation.mutate({
            clientId: credentialsForm.clientId,
            clientSecret: credentialsForm.clientSecret,
            redirectUri: credentialsForm.redirectUri || undefined,
        });
    };

    const handleClearCredentials = () => {
        if (window.confirm('Are you sure you want to clear stored Google OAuth credentials?')) {
            clearCredentialsMutation.mutate();
        }
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
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
                                    {syncingFile === file.name ? (
                                        <CircularProgress size={20} />
                                    ) : file.synced ? (
                                        <Tooltip title="Synced to Google Drive">
                                            <CloudDone color="success" fontSize="small" />
                                        </Tooltip>
                                    ) : cloudStatus?.connected ? (
                                        <Tooltip title="Click to sync to Google Drive">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleSync(file.name, type)}
                                            >
                                                <CloudQueue color="action" fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    ) : (
                                        <Tooltip title="Connect Google Drive to sync">
                                            <CloudOff color="disabled" fontSize="small" />
                                        </Tooltip>
                                    )}
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

                                        <Tooltip title="Delete">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(file.name, type)}
                                            >
                                                <Delete fontSize="small" />
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

    const renderCredentialsSection = () => {
        const hasCredentials = credentials?.hasSecret && credentials?.clientId;

        return (
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
                <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
                    onClick={() => setShowCredentialsForm(!showCredentialsForm)}
                >
                    <Key color="action" />
                    <Typography variant="subtitle2" sx={{ flex: 1 }}>
                        Google OAuth Credentials
                    </Typography>
                    {hasCredentials && (
                        <Chip size="small" label="Configured" color="success" variant="outlined" />
                    )}
                    {showCredentialsForm ? <ExpandLess /> : <ExpandMore />}
                </Box>

                <Collapse in={showCredentialsForm}>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Alert severity="info" sx={{ mb: 1 }}>
                            Get credentials from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">Google Cloud Console</a>.
                            Create an <b>OAuth 2.0 Client ID</b> (Web application type). The Client Secret will be encrypted before storage.
                        </Alert>

                        <TextField
                            label="Client ID"
                            value={credentialsForm.clientId}
                            onChange={(e) => setCredentialsForm({ ...credentialsForm, clientId: e.target.value })}
                            placeholder="xxxx.apps.googleusercontent.com"
                            size="small"
                            fullWidth
                        />

                        <TextField
                            label="Client Secret"
                            type={showSecret ? 'text' : 'password'}
                            value={credentialsForm.clientSecret}
                            onChange={(e) => setCredentialsForm({ ...credentialsForm, clientSecret: e.target.value })}
                            placeholder={hasCredentials ? '(encrypted - enter new value to change)' : 'Enter client secret'}
                            size="small"
                            fullWidth
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={() => setShowSecret(!showSecret)}
                                        >
                                            {showSecret ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            label="Redirect URI (optional)"
                            value={credentialsForm.redirectUri}
                            onChange={(e) => setCredentialsForm({ ...credentialsForm, redirectUri: e.target.value })}
                            placeholder="http://localhost:3001/backup/cloud/callback"
                            helperText="Leave empty to use default. Add this URI to Google Cloud Console's Authorized redirect URIs."
                            size="small"
                            fullWidth
                        />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<Save />}
                                onClick={handleSaveCredentials}
                                disabled={saveCredentialsMutation.isPending}
                            >
                                {saveCredentialsMutation.isPending ? 'Saving...' : 'Save Credentials'}
                            </Button>

                            {hasCredentials && (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    startIcon={<Delete />}
                                    onClick={handleClearCredentials}
                                    disabled={clearCredentialsMutation.isPending}
                                >
                                    Clear
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Collapse>
            </Box>
        );
    };

    return (
        <Box>
            <PageHeader
                title="Backup & Restore"
                subtitle="Manage database and file backups, disaster recovery, and settings."
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
                                        control={
                                            <Switch
                                                checked={formSettings.autoBackup ?? false}
                                                onChange={(e) => setFormSettings({ ...formSettings, autoBackup: e.target.checked })}
                                            />
                                        }
                                        label={
                                            <Box>
                                                <Typography variant="subtitle2">Enable Daily Backups</Typography>
                                                <Typography variant="caption" color="text.secondary">Automatically backup at specified time daily</Typography>
                                            </Box>
                                        }
                                    />

                                    <TextField
                                        label="Backup Time"
                                        type="time"
                                        value={formSettings.backupTime ?? '02:00'}
                                        onChange={(e) => setFormSettings({ ...formSettings, backupTime: e.target.value })}
                                        helperText="Time to run daily backup (24-hour format)"
                                        disabled={!formSettings.autoBackup}
                                    />

                                    <TextField
                                        label="Backup Retention (Days)"
                                        type="number"
                                        value={formSettings.retentionDays ?? 30}
                                        onChange={(e) => setFormSettings({ ...formSettings, retentionDays: parseInt(e.target.value) || 30 })}
                                        helperText="Backups older than this will be automatically deleted"
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">Days</InputAdornment>,
                                        }}
                                    />

                                    <Divider />

                                    <Typography variant="h6" gutterBottom>Google Drive Integration</Typography>

                                    {/* Credentials Configuration Section */}
                                    {credentialsLoading ? (
                                        <LinearProgress />
                                    ) : (
                                        renderCredentialsSection()
                                    )}

                                    {/* Connection Status Section */}
                                    {cloudStatusLoading ? (
                                        <LinearProgress />
                                    ) : !cloudStatus?.configured ? (
                                        <Alert severity="warning">
                                            Configure Google OAuth credentials above, or set <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> environment variables on the server.
                                        </Alert>
                                    ) : cloudStatus?.connected ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <CheckCircle color="success" />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle2">Connected to Google Drive</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {cloudStatus.email}
                                                    {cloudStatus.credentialsSource === 'database' && (
                                                        <Chip size="small" label="via Settings" sx={{ ml: 1 }} />
                                                    )}
                                                </Typography>
                                            </Box>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                startIcon={<LinkOff />}
                                                onClick={handleDisconnect}
                                            >
                                                Disconnect
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <CloudOff color="disabled" />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle2">Not Connected</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Connect to automatically sync backups to cloud
                                                </Typography>
                                            </Box>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<LinkIcon />}
                                                onClick={handleConnect}
                                            >
                                                Connect Google Drive
                                            </Button>
                                        </Box>
                                    )}

                                    <Divider />

                                    <Button
                                        variant="contained"
                                        startIcon={<Save />}
                                        size="large"
                                        onClick={handleSaveSettings}
                                        disabled={saveSettingsMutation.isPending}
                                    >
                                        {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                                    </Button>

                                    <Alert severity="info" icon={<CheckCircle />}>
                                        <b>Note:</b> Auto-backup is active and managed by the system. No external cron job is required.
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
                                    {cloudStatusLoading ? (
                                        <CircularProgress size={16} />
                                    ) : cloudStatus?.connected ? (
                                        <Chip size="small" label="Connected" color="success" variant="outlined" />
                                    ) : (
                                        <Chip size="small" label="Disconnected" color="default" variant="outlined" />
                                    )}
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
        </Box>
    );
}
