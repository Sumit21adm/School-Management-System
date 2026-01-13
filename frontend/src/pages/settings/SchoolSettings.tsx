import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Paper,
    Typography,
    Box,
    TextField,
    Button,
    Grid,
    Alert,
    Snackbar,
    CircularProgress,
    Avatar,
    Divider,
    MenuItem,
} from '@mui/material';
import {
    Save as SaveIcon,
    CloudUpload as UploadIcon,
    Business as BusinessIcon,
    Badge as BadgeIcon,
    Description as DocumentIcon,
    Settings as SettingsIcon,
} from '@mui/icons-material';
import { printSettingsService, apiClient } from '../../lib/api';
import ImageCropDialog from '../../components/ImageCropDialog';
import PageHeader from '../../components/PageHeader';

interface SchoolSettingsData {
    id: number | null;
    schoolName: string;
    schoolAddress: string;
    phone: string;
    email: string;
    website: string;
    logoUrl: string | null;
    tagline: string;
    // Affiliation & Certification
    affiliationNo: string;
    affiliationNote: string;
    isoCertifiedNote: string;
    // Document Notes
    demandBillNote: string;
    feeReceiptNote: string;
    admitCardNote: string;
    transferCertNote: string;
    idCardNote: string;
    // Regional Settings
    timezone: string;
}

const defaultSettings: SchoolSettingsData = {
    id: null,
    schoolName: '',
    schoolAddress: '',
    phone: '',
    email: '',
    website: '',
    logoUrl: null,
    tagline: '',
    affiliationNo: '',
    affiliationNote: '',
    isoCertifiedNote: '',
    demandBillNote: '',
    feeReceiptNote: '',
    admitCardNote: '',
    transferCertNote: '',
    idCardNote: '',
    timezone: 'Asia/Kolkata',
};

export default function SchoolSettings() {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t, i18n } = useTranslation(['settings', 'common']);
    const [formData, setFormData] = useState<SchoolSettingsData>(defaultSettings);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [cropDialogOpen, setCropDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Fetch settings
    const { data: settings, isLoading } = useQuery({
        queryKey: ['printSettings'],
        queryFn: printSettingsService.get,
    });

    // Update form when settings load
    useEffect(() => {
        if (settings) {
            setFormData({
                id: settings.id ?? null,
                schoolName: settings.schoolName || '',
                schoolAddress: settings.schoolAddress || '',
                phone: settings.phone || '',
                email: settings.email || '',
                website: settings.website || '',
                logoUrl: settings.logoUrl || null,
                tagline: settings.tagline || '',
                affiliationNo: settings.affiliationNo || '',
                affiliationNote: settings.affiliationNote || '',
                isoCertifiedNote: settings.isoCertifiedNote || '',
                demandBillNote: settings.demandBillNote || '',
                feeReceiptNote: settings.feeReceiptNote || '',
                admitCardNote: settings.admitCardNote || '',
                transferCertNote: settings.transferCertNote || '',
                idCardNote: settings.idCardNote || '',
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
            affiliationNo: formData.affiliationNo || undefined,
            affiliationNote: formData.affiliationNote || undefined,
            isoCertifiedNote: formData.isoCertifiedNote || undefined,
            demandBillNote: formData.demandBillNote || undefined,
            feeReceiptNote: formData.feeReceiptNote || undefined,
            admitCardNote: formData.admitCardNote || undefined,
            transferCertNote: formData.transferCertNote || undefined,
            idCardNote: formData.idCardNote || undefined,
        });
    };

    const handleLogoClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Open crop dialog instead of direct upload
            setSelectedFile(file);
            setCropDialogOpen(true);
        }
        // Reset input so same file can be selected again
        if (e.target) {
            e.target.value = '';
        }
    };

    const handleCropComplete = (croppedBlob: Blob) => {
        // Convert blob to file and upload
        const croppedFile = new File([croppedBlob], selectedFile?.name || 'logo.png', {
            type: 'image/png',
        });
        uploadMutation.mutate(croppedFile);
        setCropDialogOpen(false);
        setSelectedFile(null);
    };

    const handleCropDialogClose = () => {
        setCropDialogOpen(false);
        setSelectedFile(null);
    };

    const getLogoUrl = (url: string | null) => {
        if (!url) return null;
        if (url.startsWith('/')) {
            return `${apiClient.defaults.baseURL}${url}`;
        }
        return url;
    };

    if (isLoading) {
        return (
            <Box sx={{ py: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    return (
        <Box>
            <PageHeader
                title="School Configuration"
                subtitle="Configure your school's identity, affiliations, and document notes for receipts, bills, and reports."
            />

            <Grid container spacing={3}>
                {/* Main Settings Form */}
                <Grid size={{ xs: 12, md: 8 }}>
                    {/* School Information Section */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <BusinessIcon color="primary" />
                            <Typography variant="h6">School Information</Typography>
                        </Box>

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
                    </Paper>

                    {/* Affiliations & Certifications Section */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <BadgeIcon color="primary" />
                            <Typography variant="h6">Affiliations & Certifications</Typography>
                        </Box>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Affiliation Number"
                                    name="affiliationNo"
                                    value={formData.affiliationNo}
                                    onChange={handleChange}
                                    placeholder="e.g. 3430123"
                                    helperText="CBSE/State Board affiliation number"
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="ISO Certification Note"
                                    name="isoCertifiedNote"
                                    value={formData.isoCertifiedNote}
                                    onChange={handleChange}
                                    placeholder="e.g. ISO 9001:2015 Certified"
                                />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    label="Affiliation Note"
                                    name="affiliationNote"
                                    value={formData.affiliationNote}
                                    onChange={handleChange}
                                    multiline
                                    rows={2}
                                    placeholder="e.g. Affiliated to CBSE, New Delhi (Affiliation No: 3430123)"
                                    helperText="This note appears on official documents"
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Regional Settings Section */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <SettingsIcon color="primary" />
                            <Typography variant="h6">Regional Settings</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Configure timezone and regional preferences for date/time handling
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Timezone"
                                    name="timezone"
                                    value={formData.timezone}
                                    onChange={handleChange}
                                    helperText="Used for date calculations and display"
                                >
                                    <MenuItem value="Asia/Kolkata">🇮🇳 India (IST) - Asia/Kolkata</MenuItem>
                                    <MenuItem value="Asia/Dubai">🇦🇪 UAE (GST) - Asia/Dubai</MenuItem>
                                    <MenuItem value="Asia/Singapore">🇸🇬 Singapore (SGT) - Asia/Singapore</MenuItem>
                                    <MenuItem value="Asia/Tokyo">🇯🇵 Japan (JST) - Asia/Tokyo</MenuItem>
                                    <MenuItem value="Europe/London">🇬🇧 UK (GMT/BST) - Europe/London</MenuItem>
                                    <MenuItem value="America/New_York">🇺🇸 US East (EST) - America/New_York</MenuItem>
                                    <MenuItem value="America/Los_Angeles">🇺🇸 US West (PST) - America/Los_Angeles</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    select
                                    label={t('settings:language')}
                                    value={i18n.language}
                                    onChange={(e) => i18n.changeLanguage(e.target.value)}
                                    helperText="Select application language"
                                >
                                    <MenuItem value="en">🇺🇸 English</MenuItem>
                                    <MenuItem value="hi">🇮🇳 हिंदी (Hindi)</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Document Notes Section */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <DocumentIcon color="primary" />
                            <Typography variant="h6">Print Notes</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Custom notes that will appear on respective documents
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Demand Bill Note"
                                    name="demandBillNote"
                                    value={formData.demandBillNote}
                                    onChange={handleChange}
                                    multiline
                                    rows={3}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Fee Receipt Note"
                                    name="feeReceiptNote"
                                    value={formData.feeReceiptNote}
                                    onChange={handleChange}
                                    multiline
                                    rows={3}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Admit Card Note"
                                    name="admitCardNote"
                                    value={formData.admitCardNote}
                                    onChange={handleChange}
                                    multiline
                                    rows={3}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Transfer Certificate Note"
                                    name="transferCertNote"
                                    value={formData.transferCertNote}
                                    onChange={handleChange}
                                    multiline
                                    rows={3}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    fullWidth
                                    label="ID Card Note"
                                    name="idCardNote"
                                    value={formData.idCardNote}
                                    onChange={handleChange}
                                    multiline
                                    rows={3}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Save Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<SaveIcon />}
                            onClick={handleSave}
                            disabled={saveMutation.isPending || !formData.schoolName || !formData.schoolAddress}
                        >
                            {saveMutation.isPending ? 'Saving...' : 'Save All Settings'}
                        </Button>
                    </Box>
                </Grid>

                {/* Logo Upload Sidebar */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
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

                        <Divider sx={{ my: 3 }} />

                        {/* Preview Card - Matching Demand Bill PDF Header Design */}
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Header Preview
                        </Typography>
                        <Box
                            sx={{
                                border: '1px solid #ccc',
                                borderRadius: 1,
                                backgroundColor: 'white',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Main Header Section - Logo & School Info */}
                            <Box sx={{ p: 1.5, pb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                    {/* Logo */}
                                    <Box sx={{ flexShrink: 0 }}>
                                        {formData.logoUrl ? (
                                            <Avatar
                                                src={getLogoUrl(formData.logoUrl) || ''}
                                                sx={{ width: 50, height: 50 }}
                                                variant="rounded"
                                            />
                                        ) : (
                                            <Avatar sx={{ width: 50, height: 50, bgcolor: 'grey.200' }} variant="rounded">
                                                <BusinessIcon sx={{ color: 'grey.400' }} />
                                            </Avatar>
                                        )}
                                    </Box>

                                    {/* School Name & Details */}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight="bold"
                                            sx={{
                                                fontSize: '0.9rem',
                                                color: '#000', // Black text
                                                lineHeight: 1.2,
                                            }}
                                        >
                                            {formData.schoolName || 'School Name'}
                                        </Typography>
                                        {formData.tagline && (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    display: 'block',
                                                    color: 'text.secondary',
                                                    fontSize: '0.6rem',
                                                    lineHeight: 1.3,
                                                }}
                                            >
                                                {formData.tagline}
                                            </Typography>
                                        )}
                                        {formData.affiliationNote && (
                                            <Typography
                                                variant="caption"
                                                fontWeight="bold"
                                                sx={{
                                                    display: 'block',
                                                    color: '#333',
                                                    fontSize: '0.55rem',
                                                    mt: 0.25,
                                                }}
                                            >
                                                {formData.affiliationNote}
                                            </Typography>
                                        )}
                                        {formData.affiliationNo && (
                                            <Typography
                                                variant="caption"
                                                fontWeight="bold"
                                                sx={{
                                                    display: 'block',
                                                    color: '#333',
                                                    fontSize: '0.5rem',
                                                }}
                                            >
                                                Affiliation No: {formData.affiliationNo}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Box>

                            {/* Address Bar - Light Gray Background */}
                            {formData.schoolAddress && (
                                <Box
                                    sx={{
                                        px: 1,
                                        py: 0.5,
                                        backgroundColor: '#f5f5f5', // Light gray
                                        borderTop: '1px solid #e0e0e0',
                                        borderBottom: '1px solid #e0e0e0',
                                        textAlign: 'center',
                                    }}
                                >
                                    <Typography variant="caption" sx={{ color: '#333', fontSize: '0.55rem' }}>
                                        {formData.schoolAddress}
                                    </Typography>
                                </Box>
                            )}

                            {/* Phone, Email, Website Row */}
                            <Box
                                sx={{
                                    px: 1,
                                    py: 0.4,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    gap: 1,
                                    flexWrap: 'wrap',
                                }}
                            >
                                {formData.phone && (
                                    <Typography variant="caption" sx={{ fontSize: '0.5rem', color: '#333' }}>
                                        Ph: {formData.phone}
                                    </Typography>
                                )}
                                {formData.phone && formData.email && (
                                    <Typography variant="caption" sx={{ fontSize: '0.5rem', color: '#999' }}>|</Typography>
                                )}
                                {formData.email && (
                                    <Typography variant="caption" sx={{ fontSize: '0.5rem', color: '#333' }}>
                                        Email: {formData.email}
                                    </Typography>
                                )}
                                {formData.email && formData.website && (
                                    <Typography variant="caption" sx={{ fontSize: '0.5rem', color: '#999' }}>|</Typography>
                                )}
                                {formData.website && (
                                    <Typography variant="caption" sx={{ fontSize: '0.5rem', color: '#333' }}>
                                        Web: {formData.website}
                                    </Typography>
                                )}
                            </Box>

                            {/* Affiliation No & ISO Note - Below Contact */}
                            {(formData.affiliationNo || formData.isoCertifiedNote) && (
                                <Box sx={{ py: 0.3, textAlign: 'center' }}>
                                    {formData.isoCertifiedNote && (
                                        <Typography variant="caption" fontWeight="bold" sx={{ color: '#333', fontSize: '0.55rem' }}>
                                            {formData.isoCertifiedNote}
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </Paper>
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

            {/* Image Crop Dialog */}
            <ImageCropDialog
                open={cropDialogOpen}
                imageFile={selectedFile}
                onClose={handleCropDialogClose}
                onCropComplete={handleCropComplete}
                aspectRatio={1}
                title="Crop School Logo"
            />
        </Box>
    );
}
