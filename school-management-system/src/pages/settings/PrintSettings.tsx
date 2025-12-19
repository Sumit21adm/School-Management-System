import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Container,
    Paper,
    Typography,
    Box,
    TextField,
    Button,
    Grid,
    Card,
    CardContent,
    Alert,
    Snackbar,
    CircularProgress,
    Avatar,
} from '@mui/material';
import {
    Save as SaveIcon,
    CloudUpload as UploadIcon,
    Business as BusinessIcon,
} from '@mui/icons-material';
import { printSettingsService, apiClient } from '../../lib/api';

interface PrintSettings {
    id: number | null;
    schoolName: string;
    schoolAddress: string;
    phone: string;
    email: string;
    website: string;
    logoUrl: string | null;
    tagline: string;
}

export default function PrintSettings() {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState<PrintSettings>({
        id: null,
        schoolName: '',
        schoolAddress: '',
        phone: '',
        email: '',
        website: '',
        logoUrl: null,
        tagline: '',
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // Fetch settings
    const { data: settings, isLoading } = useQuery({
        queryKey: ['printSettings'],
        queryFn: printSettingsService.get,
    });

    // Update form when settings load
    useEffect(() => {
        if (settings) {
            setFormData({
                id: settings.id,
                schoolName: settings.schoolName || '',
                schoolAddress: settings.schoolAddress || '',
                phone: settings.phone || '',
                email: settings.email || '',
                website: settings.website || '',
                logoUrl: settings.logoUrl || null,
                tagline: settings.tagline || '',
            });
        }
    }, [settings]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: printSettingsService.update,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['printSettings'] });
            setSnackbar({ open: true, message: 'Settings saved successfully!', severity: 'success' });
        },
        onError: () => {
            setSnackbar({ open: true, message: 'Failed to save settings', severity: 'error' });
        },
    });

    // Logo upload mutation
    const uploadMutation = useMutation({
        mutationFn: printSettingsService.uploadLogo,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['printSettings'] });
            setFormData(prev => ({ ...prev, logoUrl: data.logoUrl }));
            setSnackbar({ open: true, message: 'Logo uploaded successfully!', severity: 'success' });
        },
        onError: () => {
            setSnackbar({ open: true, message: 'Failed to upload logo', severity: 'error' });
        },
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        saveMutation.mutate({
            schoolName: formData.schoolName,
            schoolAddress: formData.schoolAddress,
            phone: formData.phone || undefined,
            email: formData.email || undefined,
            website: formData.website || undefined,
            tagline: formData.tagline || undefined,
        });
    };

    const handleLogoClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadMutation.mutate(file);
        }
    };

    const getLogoUrl = (url: string | null) => {
        if (!url) return null;
        // If URL starts with /, prepend the API base URL
        if (url.startsWith('/')) {
            return `${apiClient.defaults.baseURL}${url}`;
        }
        return url;
    };

    if (isLoading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Print Settings
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Configure your school's letterhead for receipts, demand bills, and reports.
            </Typography>

            <Grid container spacing={3}>
                {/* Settings Form */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            School Information
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="School Name"
                                    name="schoolName"
                                    value={formData.schoolName}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. ABC Public School"
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="School Address"
                                    name="schoolAddress"
                                    value={formData.schoolAddress}
                                    onChange={handleChange}
                                    required
                                    multiline
                                    rows={2}
                                    placeholder="e.g. 123 Main Street, City, State - 123456"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="e.g. +91 9876543210"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    type="email"
                                    placeholder="e.g. info@school.edu"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Website"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    placeholder="e.g. www.school.edu"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Tagline"
                                    name="tagline"
                                    value={formData.tagline}
                                    onChange={handleChange}
                                    placeholder="e.g. Excellence in Education"
                                />
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={handleSave}
                                disabled={saveMutation.isPending || !formData.schoolName || !formData.schoolAddress}
                            >
                                {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* Logo Upload */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            School Logo
                        </Typography>

                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 2,
                            }}
                        >
                            <Box
                                sx={{
                                    width: 150,
                                    height: 150,
                                    border: '2px dashed',
                                    borderColor: 'grey.300',
                                    borderRadius: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'grey.50',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        backgroundColor: 'primary.50',
                                    },
                                }}
                                onClick={handleLogoClick}
                            >
                                {formData.logoUrl ? (
                                    <img
                                        src={getLogoUrl(formData.logoUrl) || ''}
                                        alt="School Logo"
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            objectFit: 'contain',
                                        }}
                                    />
                                ) : (
                                    <BusinessIcon sx={{ fontSize: 60, color: 'grey.400' }} />
                                )}
                            </Box>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />

                            <Button
                                variant="outlined"
                                startIcon={uploadMutation.isPending ? <CircularProgress size={20} /> : <UploadIcon />}
                                onClick={handleLogoClick}
                                disabled={uploadMutation.isPending}
                            >
                                {uploadMutation.isPending ? 'Uploading...' : 'Upload Logo'}
                            </Button>

                            <Typography variant="caption" color="text.secondary" textAlign="center">
                                Recommended: 200x200px PNG or JPG
                                <br />
                                Max size: 5MB
                            </Typography>
                        </Box>
                    </Paper>

                    {/* Preview Card */}
                    <Card sx={{ mt: 2 }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Header Preview
                            </Typography>
                            <Box
                                sx={{
                                    p: 2,
                                    border: '1px solid',
                                    borderColor: 'grey.200',
                                    borderRadius: 1,
                                    textAlign: 'center',
                                    backgroundColor: 'white',
                                }}
                            >
                                {formData.logoUrl && (
                                    <Avatar
                                        src={getLogoUrl(formData.logoUrl) || ''}
                                        sx={{ width: 50, height: 50, mx: 'auto', mb: 1 }}
                                    />
                                )}
                                <Typography variant="subtitle1" fontWeight="bold">
                                    {formData.schoolName || 'School Name'}
                                </Typography>
                                {formData.tagline && (
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        {formData.tagline}
                                    </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary">
                                    {formData.schoolAddress || 'School Address'}
                                </Typography>
                                {(formData.phone || formData.email) && (
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        {[formData.phone, formData.email].filter(Boolean).join(' | ')}
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}
