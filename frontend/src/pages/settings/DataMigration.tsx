import { useState, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Alert,
    AlertTitle,
    Card,
    CardContent,
    CardActions,
    Collapse, // Added
    Stepper,
    Step,
    StepLabel,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    FormControlLabel,
    Checkbox,
    Stack,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    Download,
    Upload,
    CheckCircle,
    Error as ErrorIcon,
    Warning,
    CloudUpload,
    People,
    Receipt,
    Description,
    Discount,
    Info,
    HistoryEdu,
    KeyboardArrowDown,
    KeyboardArrowUp,
} from '@mui/icons-material';
import PageHeader from '../../components/PageHeader';
import { dataMigrationService } from '../../lib/api/data-migration';
import type { ValidationResult, ImportResult } from '../../lib/api/data-migration';

type ImportType = 'students' | 'fee-receipts' | 'demand-bills' | 'discounts' | 'academic-history';

const importTypeConfig: Record<ImportType, { label: string; icon: React.ReactNode; color: string }> = {
    students: { label: 'Students', icon: <People />, color: '#9C27B0' },
    'fee-receipts': { label: 'Fee Receipts', icon: <Receipt />, color: '#FF9800' },
    'demand-bills': { label: 'Demand Bills', icon: <Description />, color: '#3F51B5' },
    discounts: { label: 'Discounts', icon: <Discount />, color: '#009688' },
    'academic-history': { label: 'Academic History', icon: <HistoryEdu />, color: '#795548' },
};

export default function DataMigration() {
    const [downloading, setDownloading] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [selectedType, setSelectedType] = useState<ImportType | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [validating, setValidating] = useState(false);
    const [importing, setImporting] = useState(false);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [skipOnError, setSkipOnError] = useState(false);
    const [showDetails, setShowDetails] = useState(false); // Added for toggle
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const steps = ['Select Data Type', 'Upload File', 'Validate', 'Import'];

    const handleDownloadTemplate = async () => {
        setDownloading(true);
        setError(null);
        try {
            await dataMigrationService.downloadTemplate();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to download template');
        } finally {
            setDownloading(false);
        }
    };

    const handleSelectType = (type: ImportType) => {
        setSelectedType(type);
        setActiveStep(1);
        resetState();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setActiveStep(2);
            setValidationResult(null);
            setImportResult(null);
        }
    };

    const resetState = () => {
        setFile(null);
        setValidationResult(null);
        setImportResult(null);
        setError(null);
    };

    const handleValidate = async () => {
        if (!file || !selectedType) return;

        setValidating(true);
        setError(null);
        try {
            // Currently only students validation is implemented
            if (selectedType === 'students') {
                const result = await dataMigrationService.validateStudents(file);
                setValidationResult(result);
                if (result.isValid) {
                    setActiveStep(3);
                }
            } else {
                // Skip validation for other types, go directly to import
                setActiveStep(3);
                setValidationResult({ isValid: true, totalRows: 0, validRows: 0, errorCount: 0, errors: [], warnings: [] });
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Validation failed');
        } finally {
            setValidating(false);
        }
    };

    const handleImport = async () => {
        if (!file || !selectedType) return;

        setImporting(true);
        setError(null);
        try {
            let result: ImportResult;
            const options = { skipOnError };

            switch (selectedType) {
                case 'students':
                    result = await dataMigrationService.importStudents(file, options);
                    break;
                case 'fee-receipts':
                    result = await dataMigrationService.importFeeReceipts(file, options);
                    break;
                case 'demand-bills':
                    result = await dataMigrationService.importDemandBills(file, options);
                    break;
                case 'discounts':
                    result = await dataMigrationService.importDiscounts(file, options);
                    break;
                case 'academic-history':
                    result = await dataMigrationService.importAcademicHistory(file, options);
                    break;
            }

            setImportResult(result);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Import failed');
        } finally {
            setImporting(false);
        }
    };

    const handleReset = () => {
        setActiveStep(0);
        setSelectedType(null);
        resetState();
    };

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
            <PageHeader
                title="Data Migration"
                subtitle="Import student and fee data from legacy systems using Excel templates"
            />

            {/* Template Download Section */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Step 1: Download Template
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Download the Excel template with Instructions, Reference Data, and data sheets for Students, Fee Receipts, Demand Bills, and Discounts.
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Download />}
                        onClick={handleDownloadTemplate}
                        disabled={downloading}
                        size="large"
                    >
                        {downloading ? 'Downloading...' : 'Download Template'}
                    </Button>
                </Stack>
            </Paper>

            {/* Prerequisites Alert */}
            <Alert severity="info" sx={{ mb: 4 }} icon={<Info />}>
                <AlertTitle>Before importing, ensure you have:</AlertTitle>
                <List dense disablePadding>
                    <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 32 }}><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                        <ListItemText primary="Created all Classes and Sections in the system" />
                    </ListItem>
                    <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 32 }}><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                        <ListItemText primary="Created all Fee Types (Tuition, Transport, etc.) in Settings" />
                    </ListItem>
                    <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 32 }}><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                        <ListItemText primary="Set up Transport Routes and Stops (if importing transport)" />
                    </ListItem>
                    <ListItem disableGutters>
                        <ListItemIcon sx={{ minWidth: 32 }}><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                        <ListItemText primary="Activated an Academic Session" />
                    </ListItem>
                </List>
            </Alert>

            {/* Import Wizard */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Step 2: Import Data
                </Typography>

                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Step 0: Select Data Type */}
                {activeStep === 0 && (
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Select the type of data you want to import. Import order matters: Students first, then Fee Records.
                        </Typography>
                        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                            {(Object.keys(importTypeConfig) as ImportType[]).map((type) => {
                                const config = importTypeConfig[type];
                                return (
                                    <Card
                                        key={type}
                                        sx={{
                                            width: 200,
                                            cursor: 'pointer',
                                            border: '2px solid transparent',
                                            '&:hover': { borderColor: config.color },
                                            transition: 'border-color 0.2s',
                                        }}
                                        onClick={() => handleSelectType(type)}
                                    >
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <Box sx={{ color: config.color, mb: 1 }}>{config.icon}</Box>
                                            <Typography variant="h6">{config.label}</Typography>
                                        </CardContent>
                                        <CardActions sx={{ justifyContent: 'center', pt: 0 }}>
                                            <Button size="small" sx={{ color: config.color }}>
                                                Select
                                            </Button>
                                        </CardActions>
                                    </Card>
                                );
                            })}
                        </Stack>
                    </Box>
                )}

                {/* Step 1: Upload File */}
                {activeStep === 1 && selectedType && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            hidden
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <Box
                            sx={{
                                border: '2px dashed',
                                borderColor: 'divider',
                                borderRadius: 2,
                                p: 6,
                                cursor: 'pointer',
                                '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                            }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <CloudUpload sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" gutterBottom>
                                Click to upload or drag and drop
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Upload the filled Excel template (*.xlsx)
                            </Typography>
                        </Box>
                        <Button onClick={handleReset} sx={{ mt: 2 }}>
                            Back to Type Selection
                        </Button>
                    </Box>
                )}

                {/* Step 2: Validate */}
                {activeStep === 2 && file && (
                    <Box>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            File selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
                        </Alert>

                        {validating && <LinearProgress sx={{ mb: 2 }} />}

                        {validationResult && !validationResult.isValid && (
                            <Box sx={{ mb: 3 }}>
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    <AlertTitle>Validation Failed - {validationResult.errorCount} errors found</AlertTitle>
                                    Fix the errors below and re-upload the file.
                                </Alert>

                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Row</TableCell>
                                                <TableCell>Field</TableCell>
                                                <TableCell>Value</TableCell>
                                                <TableCell>Error</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {validationResult.errors.slice(0, 20).map((err, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>{err.row}</TableCell>
                                                    <TableCell>{err.field}</TableCell>
                                                    <TableCell>{err.value || '-'}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="error">
                                                            {err.message}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                {validationResult.errors.length > 20 && (
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                        Showing first 20 errors of {validationResult.errors.length} total
                                    </Typography>
                                )}
                            </Box>
                        )}

                        {validationResult && validationResult.isValid && (
                            <Alert severity="success" sx={{ mb: 3 }}>
                                <AlertTitle>Validation Passed!</AlertTitle>
                                {validationResult.totalRows} rows are valid and ready for import.
                            </Alert>
                        )}

                        <Stack direction="row" spacing={2}>
                            <Button variant="outlined" onClick={() => { setActiveStep(1); resetState(); }}>
                                Upload Different File
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleValidate}
                                disabled={validating}
                            >
                                {validating ? 'Validating...' : 'Validate Data'}
                            </Button>
                        </Stack>
                    </Box>
                )}

                {/* Step 3: Import */}
                {activeStep === 3 && (
                    <Box>
                        {!importResult && (
                            <>
                                <Alert severity="warning" sx={{ mb: 3 }}>
                                    <AlertTitle>Ready to Import</AlertTitle>
                                    Data from <strong>{file?.name}</strong> will be imported into the system.
                                    This action cannot be undone easily.
                                </Alert>

                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={skipOnError}
                                            onChange={(e) => setSkipOnError(e.target.checked)}
                                        />
                                    }
                                    label="Skip rows with errors and continue importing valid rows"
                                    sx={{ mb: 3, display: 'block' }}
                                />

                                {importing && <LinearProgress sx={{ mb: 2 }} />}

                                <Stack direction="row" spacing={2}>
                                    <Button variant="outlined" onClick={() => setActiveStep(2)} disabled={importing}>
                                        Back to Validation
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        startIcon={<Upload />}
                                        onClick={handleImport}
                                        disabled={importing}
                                    >
                                        {importing ? 'Importing...' : 'Start Import'}
                                    </Button>
                                </Stack>
                            </>
                        )}

                        {importResult && (
                            <Box>
                                <Alert
                                    severity={importResult.success ? 'success' : 'warning'}
                                    sx={{ mb: 3 }}
                                >
                                    <AlertTitle>
                                        {importResult.success ? 'Import Successful!' : 'Import Completed with Issues'}
                                    </AlertTitle>
                                    <Stack direction="row" spacing={3}>
                                        <Chip
                                            icon={<CheckCircle />}
                                            label={`${importResult.imported} Imported`}
                                            color="success"
                                            variant="outlined"
                                        />
                                        {importResult.skipped > 0 && (
                                            <Chip
                                                icon={<Warning />}
                                                label={`${importResult.skipped} Skipped`}
                                                color="warning"
                                                variant="outlined"
                                            />
                                        )}
                                        {importResult.errors.length > 0 && (
                                            <Chip
                                                icon={<ErrorIcon />}
                                                label={`${importResult.errors.length} Errors`}
                                                color="error"
                                                variant="outlined"
                                            />
                                        )}
                                    </Stack>
                                </Alert>

                                {importResult.errors.length > 0 && (
                                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Row</TableCell>
                                                    <TableCell>Field</TableCell>
                                                    <TableCell>Error</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {importResult.errors.slice(0, 10).map((err, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell>{err.row}</TableCell>
                                                        <TableCell>{err.field}</TableCell>
                                                        <TableCell>{err.message}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}

                                <Button variant="contained" onClick={handleReset}>
                                    Import More Data
                                </Button>

                                {/* Detailed Report Section */}
                                {importResult.details && importResult.details.some(d => d.status !== 'imported') && (
                                    <Box sx={{ mt: 3 }}>
                                        <Button
                                            onClick={() => setShowDetails(!showDetails)}
                                            endIcon={showDetails ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                                            sx={{ mb: 2 }}
                                        >
                                            {showDetails ? 'Hide' : 'Show'} Detailed Report ({importResult.details.filter(d => d.status !== 'imported').length} issues)
                                        </Button>

                                        <Collapse in={showDetails}>
                                            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>Row</TableCell>
                                                            <TableCell>Status</TableCell>
                                                            <TableCell>Student ID</TableCell>
                                                            <TableCell>Reason</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {importResult.details
                                                            .filter(d => d.status !== 'imported')
                                                            .map((item, idx) => (
                                                                <TableRow key={idx} hover>
                                                                    <TableCell>{item.row}</TableCell>
                                                                    <TableCell>
                                                                        <Chip
                                                                            label={item.status.toUpperCase()}
                                                                            color={item.status === 'failed' ? 'error' : 'warning'}
                                                                            size="small"
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>{item.studentId || '-'}</TableCell>
                                                                    <TableCell>{item.reason}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Collapse>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                )}
            </Paper>
        </Box>
    );
}
