'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Container,
    Paper,
    Typography,
    Box,
    TextField,
    Button,
    Alert,
    Snackbar,
    Divider,
    Stack,
    Avatar,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Card,
    CardContent,
    CircularProgress,
} from '@mui/material';
import {
    Save as SaveIcon,
    Upload as UploadIcon,
    Delete as DeleteIcon,
    ExpandMore as ExpandMoreIcon,
    School as SchoolIcon,
    Phone as PhoneIcon,
    Email as EmailIcon,
    Language as WebsiteIcon,
} from '@mui/icons-material';
import { printSettingsService } from '@/lib/api';
import ImageCropper from '@/components/common/ImageCropper';

// Header Preview Component
function HeaderPreview({ settings }: { settings: any }) {
    return (
        <Card variant="outlined" sx={{ mb: 3, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 0.5, px: 2, fontSize: '0.75rem' }}>
                Preview - How your letterhead will appear on documents
            </Box>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {/* Logo */}
                    <Avatar
                        src={settings.logoUrl || undefined}
                        sx={{ width: 80, height: 80, bgcolor: 'grey.200' }}
                    >
                        {!settings.logoUrl && <SchoolIcon sx={{ fontSize: 40, color: 'grey.400' }} />}
                    </Avatar>

                    {/* School Info */}
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" fontWeight="bold" color="primary.main">
                            {settings.schoolName || 'School Name'}
                        </Typography>
                        {settings.tagline && (
                            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                {settings.tagline}
                            </Typography>
                        )}
                        {settings.affiliationNote && (
                            <Typography variant="caption" color="text.secondary" display="block">
                                {settings.affiliationNote}
                                {settings.affiliationNo && ` (${settings.affiliationNo})`}
                            </Typography>
                        )}
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {settings.schoolAddress || 'School Address'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
                            {settings.phone && (
                                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <PhoneIcon sx={{ fontSize: 14 }} /> {settings.phone}
                                </Typography>
                            )}
                            {settings.email && (
                                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <EmailIcon sx={{ fontSize: 14 }} /> {settings.email}
                                </Typography>
                            )}
                            {settings.website && (
                                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <WebsiteIcon sx={{ fontSize: 14 }} /> {settings.website}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

export default function SchoolSettings() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        schoolName: '',
        schoolAddress: '',
        phone: '',
        email: '',
        website: '',
        tagline: '',
        affiliationNo: '',
        affiliationNote: '',
        isoCertifiedNote: '',
        feeReceiptNote: '',
        demandBillNote: '',
        admitCardNote: '',
        transferCertNote: '',
        idCardNote: '',
        logoUrl: '',
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [cropperOpen, setCropperOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['printSettings'],
        queryFn: printSettingsService.get,
    });

    useEffect(() => {
        if (data) {
            setFormData({
                schoolName: data.schoolName || '',
                schoolAddress: data.schoolAddress || '',
                phone: data.phone || '',
                email: data.email || '',
                website: data.website || '',
                tagline: data.tagline || '',
                affiliationNo: data.affiliationNo || '',
                affiliationNote: data.affiliationNote || '',
                isoCertifiedNote: data.isoCertifiedNote || '',
                feeReceiptNote: data.feeReceiptNote || '',
                demandBillNote: data.demandBillNote || '',
                admitCardNote: data.admitCardNote || '',
                transferCertNote: data.transferCertNote || '',
                idCardNote: data.idCardNote || '',
                logoUrl: data.logoUrl || '',
            });
        }
    }, [data]);

    const updateMutation = useMutation({
        mutationFn: printSettingsService.update,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['printSettings'] });
            setSuccessMessage('Settings saved successfully!');
        },
        onError: (error: any) => setError(error?.response?.data?.message || 'Failed to save settings'),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { logoUrl, ...dataToSubmit } = formData;
        updateMutation.mutate(dataToSubmit);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create object URL for cropper
        const imageUrl = URL.createObjectURL(file);
        setSelectedImage(imageUrl);
        setCropperOpen(true);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        setUploading(true);
        setCropperOpen(false);

        try {
            // Convert blob to file
            const file = new File([croppedBlob], 'logo.jpg', { type: 'image/jpeg' });
            const result = await printSettingsService.uploadLogo(file);
            setFormData(prev => ({ ...prev, logoUrl: result.logoUrl }));
            setSuccessMessage('Logo uploaded successfully!');
            queryClient.invalidateQueries({ queryKey: ['printSettings'] });
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to upload logo');
        } finally {
            setUploading(false);
            if (selectedImage) {
                URL.revokeObjectURL(selectedImage);
                setSelectedImage(null);
            }
        }
    };

    const handleLogoDelete = async () => {
        try {
            await printSettingsService.deleteLogo();
            setFormData(prev => ({ ...prev, logoUrl: '' }));
            setSuccessMessage('Logo removed successfully!');
            queryClient.invalidateQueries({ queryKey: ['printSettings'] });
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Failed to remove logo');
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>School Settings</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Configure your school&apos;s basic information for receipts and documents.
                </Typography>

                {/* Header Preview */}
                <HeaderPreview settings={formData} />

                <form onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                        {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

                        {/* Logo & Branding Section */}
                        <Typography variant="h6">Logo & Branding</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                            <Avatar
                                src={formData.logoUrl || undefined}
                                sx={{ width: 100, height: 100, bgcolor: 'grey.100' }}
                            >
                                {!formData.logoUrl && <SchoolIcon sx={{ fontSize: 50, color: 'grey.400' }} />}
                            </Avatar>
                            <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    Upload your school logo (JPEG, PNG, WebP - Max 5MB)
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />}
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                    >
                                        {uploading ? 'Uploading...' : 'Upload Logo'}
                                    </Button>
                                    {formData.logoUrl && (
                                        <IconButton color="error" size="small" onClick={handleLogoDelete} title="Remove Logo">
                                            <DeleteIcon />
                                        </IconButton>
                                    )}
                                </Box>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    hidden
                                    onChange={handleFileSelect}
                                />
                            </Box>
                        </Box>

                        <Divider />

                        {/* Basic Information */}
                        <Typography variant="h6">Basic Information</Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <TextField
                                label="School Name"
                                value={formData.schoolName}
                                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                                sx={{ flex: '1 1 300px' }}
                                required
                            />
                            <TextField
                                label="Tagline"
                                value={formData.tagline}
                                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                                sx={{ flex: '1 1 300px' }}
                                placeholder="E.g., Excellence in Education"
                            />
                        </Box>

                        <TextField
                            label="School Address"
                            value={formData.schoolAddress}
                            onChange={(e) => setFormData({ ...formData, schoolAddress: e.target.value })}
                            fullWidth
                            multiline
                            rows={2}
                            required
                        />

                        <Divider />

                        {/* Contact Information */}
                        <Typography variant="h6">Contact Information</Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <TextField
                                label="Phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                sx={{ flex: '1 1 200px' }}
                            />
                            <TextField
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                sx={{ flex: '1 1 200px' }}
                            />
                            <TextField
                                label="Website"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                sx={{ flex: '1 1 200px' }}
                            />
                        </Box>

                        <Divider />

                        {/* Affiliation & Certification */}
                        <Typography variant="h6">Affiliation & Certification</Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <TextField
                                label="Affiliation Number"
                                value={formData.affiliationNo}
                                onChange={(e) => setFormData({ ...formData, affiliationNo: e.target.value })}
                                sx={{ flex: '1 1 200px' }}
                            />
                            <TextField
                                label="Affiliation Note"
                                value={formData.affiliationNote}
                                onChange={(e) => setFormData({ ...formData, affiliationNote: e.target.value })}
                                sx={{ flex: '1 1 300px' }}
                                placeholder="E.g., Affiliated to CBSE, New Delhi"
                            />
                        </Box>
                        <TextField
                            label="ISO Certification Note"
                            value={formData.isoCertifiedNote}
                            onChange={(e) => setFormData({ ...formData, isoCertifiedNote: e.target.value })}
                            fullWidth
                            placeholder="E.g., ISO 9001:2015 Certified"
                        />

                        <Divider />

                        {/* Document Notes - Collapsible */}
                        <Accordion defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6">Document Notes</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Stack spacing={2}>
                                    <TextField
                                        label="Fee Receipt Note"
                                        value={formData.feeReceiptNote}
                                        onChange={(e) => setFormData({ ...formData, feeReceiptNote: e.target.value })}
                                        fullWidth
                                        multiline
                                        rows={2}
                                        placeholder="Note to display on fee receipts"
                                    />
                                    <TextField
                                        label="Demand Bill Note"
                                        value={formData.demandBillNote}
                                        onChange={(e) => setFormData({ ...formData, demandBillNote: e.target.value })}
                                        fullWidth
                                        multiline
                                        rows={2}
                                        placeholder="Note to display on demand bills"
                                    />
                                    <TextField
                                        label="Admit Card Note"
                                        value={formData.admitCardNote}
                                        onChange={(e) => setFormData({ ...formData, admitCardNote: e.target.value })}
                                        fullWidth
                                        multiline
                                        rows={2}
                                        placeholder="Note to display on admit cards"
                                    />
                                    <TextField
                                        label="Transfer Certificate Note"
                                        value={formData.transferCertNote}
                                        onChange={(e) => setFormData({ ...formData, transferCertNote: e.target.value })}
                                        fullWidth
                                        multiline
                                        rows={2}
                                        placeholder="Note to display on transfer certificates"
                                    />
                                    <TextField
                                        label="ID Card Note"
                                        value={formData.idCardNote}
                                        onChange={(e) => setFormData({ ...formData, idCardNote: e.target.value })}
                                        fullWidth
                                        multiline
                                        rows={2}
                                        placeholder="Note to display on ID cards"
                                    />
                                </Stack>
                            </AccordionDetails>
                        </Accordion>

                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={<SaveIcon />}
                            disabled={updateMutation.isPending}
                            sx={{ alignSelf: 'flex-start', mt: 2 }}
                        >
                            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </Stack>
                </form>
            </Paper>

            <Snackbar open={!!successMessage} autoHideDuration={4000} onClose={() => setSuccessMessage('')}>
                <Alert severity="success">{successMessage}</Alert>
            </Snackbar>

            {/* Image Cropper Dialog */}
            <ImageCropper
                open={cropperOpen}
                imageSrc={selectedImage}
                onClose={() => {
                    setCropperOpen(false);
                    if (selectedImage) {
                        URL.revokeObjectURL(selectedImage);
                        setSelectedImage(null);
                    }
                }}
                onCropComplete={handleCropComplete}
            />
        </Container>
    );
}
