'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, User, School, Phone, Upload, FileText, Users as UsersIcon } from 'lucide-react';
import {
    Box,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper,
    Typography,
    Alert,
    CircularProgress,
    Stack,
    FormHelperText,
    Divider,
    Avatar,
    RadioGroup,
    FormControlLabel,
    Radio,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { admissionService, classService } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useSessionContext } from '@/contexts/SessionContext';

const admissionSchema = z.object({
    studentId: z.string()
        .min(1, 'Student ID is required')
        .regex(/^[A-Z0-9-]+$/, 'Student ID can only contain uppercase letters, numbers, and hyphens'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    fatherName: z.string().min(2, 'Father name is required'),
    fatherOccupation: z.string().optional(),
    motherName: z.string().min(2, 'Mother name is required'),
    motherOccupation: z.string().optional(),
    dob: z.string().min(1, 'Date of birth is required'),
    gender: z.enum(['male', 'female', 'other']),
    category: z.string().min(1, 'Category is required'),
    religion: z.string().optional(),
    apaarId: z.string().optional(),
    fatherAadharNo: z.string().optional(),
    fatherPanNo: z.string().optional(),
    motherAadharNo: z.string().optional(),
    motherPanNo: z.string().optional(),
    guardianRelation: z.string().optional(),
    guardianName: z.string().optional(),
    guardianOccupation: z.string().optional(),
    guardianPhone: z.string().optional(),
    guardianEmail: z.string().optional(),
    guardianAadharNo: z.string().optional(),
    guardianPanNo: z.string().optional(),
    guardianAddress: z.string().optional(),
    aadharCardNo: z.string().optional(),
    className: z.string().min(1, 'Class is required'),
    section: z.string().min(1, 'Section is required'),
    subjects: z.string().optional(),
    admissionDate: z.string().min(1, 'Admission date is required'),
    address: z.string().min(5, 'Address must be at least 5 characters'),
    phone: z.string()
        .min(1, 'Phone number is required')
        .regex(/^[0-9]{10,15}$/, 'Phone number must contain only digits (10-15 digits)'),
    whatsAppNo: z.string().optional(),
    email: z.string().optional(),
});

type AdmissionFormData = z.infer<typeof admissionSchema>;

import ImageCropper from '@/components/common/ImageCropper';

// ... (previous code)

const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Icon size={20} color="#6b7280" />
        <Typography variant="h6" color="text.primary" fontWeight={600}>
            {title}
        </Typography>
    </Box>
);

export default function NewAdmission() {
    const router = useRouter();
    const { selectedSessionId } = useSessionContext();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [photo, setPhoto] = useState<Blob | null>(null); // Changed to Blob
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    // Cropper State
    const [cropperOpen, setCropperOpen] = useState(false);
    const [selectedImg, setSelectedImg] = useState<string | null>(null);

    const { control, handleSubmit, formState: { errors }, watch, reset } = useForm<AdmissionFormData>({
        resolver: zodResolver(admissionSchema),
        defaultValues: {
            gender: '' as any,
            category: '',
            religion: '',
            fatherOccupation: '',
            motherOccupation: '',
            guardianOccupation: '',
            className: '',
            section: '',
        }
    });

    const { data: classesData } = useQuery({
        queryKey: ['classes'],
        queryFn: async () => await classService.getAll()
    });

    const classOptions = Array.isArray(classesData) ? classesData : (classesData as any)?.classes || [];
    const className = watch('className');
    const isSeniorSecondary = className ? (parseInt(className.match(/\d+/)?.[0] || '0') > 10) : false;
    const guardianRelation = watch('guardianRelation');

    const occupationOptions = ['Service', 'Business', 'Farming', 'Self Employed', 'Other'];

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                setSelectedImg(reader.result as string);
                setCropperOpen(true);
            };
            reader.readAsDataURL(file);
        }
        // Reset input value to allow re-selection of same file
        event.target.value = '';
    };

    const handleCropComplete = (croppedBlob: Blob) => {
        setPhoto(croppedBlob);
        setPhotoPreview(URL.createObjectURL(croppedBlob));
    };

    const onSubmit = async (data: AdmissionFormData) => {
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();

            // Append all text fields
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    formData.append(key, value as string);
                }
            });

            // Append photo if exists
            if (photo) {
                formData.append('photo', photo, 'student-photo.jpg');
            }

            // Append sessionId from context
            if (selectedSessionId) {
                formData.append('sessionId', String(selectedSessionId));
            }

            await admissionService.createStudent(formData);
            router.push('/admissions');
        } catch (err: any) {
            console.error('Admission creation failed:', err);
            setError(err.response?.data?.message || err.message || 'Failed to create admission');
        } finally {
            setLoading(false);
        }
    };

    // ...

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
            <ImageCropper
                open={cropperOpen}
                imageSrc={selectedImg}
                onClose={() => setCropperOpen(false)}
                onCropComplete={handleCropComplete}
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* ... */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            border: '1px dashed',
                            borderColor: 'divider',
                            borderRadius: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            mb: 4
                        }}
                    >
                        <Avatar
                            src={photoPreview || undefined}
                            sx={{ width: 120, height: 120, bgcolor: 'grey.100', mb: 2 }}
                        >
                            {!photoPreview && <User size={48} color="#9ca3af" />}
                        </Avatar>
                        <Button component="label" variant="outlined" size="small" startIcon={<Upload size={16} />} fullWidth>
                            Upload Photo
                            <input type="file" hidden accept="image/*" onChange={handlePhotoChange} />
                        </Button>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                            Allowed *.jpeg, *.jpg, *.png
                        </Typography>
                    </Paper>
                    {/* ... */}

                    {/* Personal Fields */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                        <Controller
                            name="studentId"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} label="Student ID" fullWidth required error={!!errors.studentId} helperText={errors.studentId?.message} placeholder="e.g. STU2024001" InputLabelProps={{ shrink: true }} />
                            )}
                        />
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} label="Student Name" fullWidth required error={!!errors.name} helperText={errors.name?.message} InputLabelProps={{ shrink: true }} />
                            )}
                        />
                        <Controller
                            name="gender"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth error={!!errors.gender}>
                                    <InputLabel id="gender-label" shrink>Gender *</InputLabel>
                                    <Select {...field} labelId="gender-label" label="Gender *" displayEmpty>
                                        <MenuItem value="">
                                            <em style={{ fontStyle: 'normal', color: '#9ca3af' }}>Select Gender</em>
                                        </MenuItem>
                                        <MenuItem value="male">Male</MenuItem>
                                        <MenuItem value="female">Female</MenuItem>
                                        <MenuItem value="other">Other</MenuItem>
                                    </Select>
                                    {errors.gender && <FormHelperText>{errors.gender.message}</FormHelperText>}
                                </FormControl>
                            )}
                        />
                        <Controller
                            name="dob"
                            control={control}
                            render={({ field }) => (
                                <DatePicker
                                    label="Date of Birth"
                                    format="dd/MM/yyyy"
                                    value={field.value ? new Date(field.value) : null}
                                    onChange={(date) => field.onChange(date?.toISOString().split('T')[0])}
                                    slotProps={{
                                        textField: { fullWidth: true, required: true, error: !!errors.dob, helperText: errors.dob?.message },
                                    }}
                                />
                            )}
                        />
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* Religion & Category Section */}
                    <SectionHeader icon={UsersIcon} title="Religion & Category" />
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 4 }}>
                        <Controller
                            name="religion"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth>
                                    <InputLabel id="religion-label" shrink>Religion</InputLabel>
                                    <Select {...field} labelId="religion-label" label="Religion" displayEmpty>
                                        <MenuItem value="">
                                            <em style={{ fontStyle: 'normal', color: '#9ca3af' }}>Select Religion</em>
                                        </MenuItem>
                                        {['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other'].map(r => (
                                            <MenuItem key={r} value={r}>{r}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        />
                        <Controller
                            name="category"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth error={!!errors.category}>
                                    <InputLabel id="category-label" shrink>Category *</InputLabel>
                                    <Select {...field} labelId="category-label" label="Category *" displayEmpty>
                                        <MenuItem value="">
                                            <em style={{ fontStyle: 'normal', color: '#9ca3af' }}>Select Category</em>
                                        </MenuItem>
                                        {['General', 'OBC', 'SC/ST', 'Others', "Don't want to disclose"].map(c => (
                                            <MenuItem key={c} value={c}>{c}</MenuItem>
                                        ))}
                                    </Select>
                                    {errors.category && <FormHelperText>{errors.category.message}</FormHelperText>}
                                </FormControl>
                            )}
                        />
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* Government Identification */}
                    <SectionHeader icon={FileText} title="Government Identification" />
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 4 }}>
                        <Controller name="aadharCardNo" control={control} render={({ field }) => (<TextField {...field} label="Student Aadhar Card No" fullWidth placeholder="12 digits" InputLabelProps={{ shrink: true }} />)} />
                        <Controller name="apaarId" control={control} render={({ field }) => (<TextField {...field} label="APAAR ID" fullWidth InputLabelProps={{ shrink: true }} />)} />
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* Parents Details */}
                    <SectionHeader icon={User} title="Parents Details" />
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.secondary' }}>Father&apos;s Details</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 3 }}>
                        <Controller name="fatherName" control={control} render={({ field }) => (<TextField {...field} label="Father's Name" fullWidth required error={!!errors.fatherName} helperText={errors.fatherName?.message} InputLabelProps={{ shrink: true }} />)} />
                        <Controller
                            name="fatherOccupation"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth>
                                    <InputLabel id="father-occupation-select-label" shrink>Occupation</InputLabel>
                                    <Select {...field} labelId="father-occupation-select-label" label="Occupation" displayEmpty>
                                        <MenuItem value="">
                                            <em style={{ fontStyle: 'normal', color: '#9ca3af' }}>Select Occupation</em>
                                        </MenuItem>
                                        {occupationOptions.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            )}
                        />
                        <Controller name="fatherAadharNo" control={control} render={({ field }) => (<TextField {...field} label="Aadhar No" fullWidth placeholder="12 digits" InputLabelProps={{ shrink: true }} />)} />
                        <Controller name="fatherPanNo" control={control} render={({ field }) => (<TextField {...field} label="PAN No" fullWidth placeholder="e.g. ABCDE1234F" InputLabelProps={{ shrink: true }} />)} />
                    </Box>

                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, mt: 3, color: 'text.secondary' }}>Mother&apos;s Details</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 4 }}>
                        <Controller name="motherName" control={control} render={({ field }) => (<TextField {...field} label="Mother's Name" fullWidth required error={!!errors.motherName} helperText={errors.motherName?.message} InputLabelProps={{ shrink: true }} />)} />
                        <Controller
                            name="motherOccupation"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth>
                                    <InputLabel id="mother-occupation-label" shrink>Occupation</InputLabel>
                                    <Select {...field} labelId="mother-occupation-label" label="Occupation" displayEmpty>
                                        <MenuItem value="">
                                            <em style={{ fontStyle: 'normal', color: '#9ca3af' }}>Select Occupation</em>
                                        </MenuItem>
                                        {occupationOptions.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            )}
                        />
                        <Controller name="motherAadharNo" control={control} render={({ field }) => (<TextField {...field} label="Aadhar No" fullWidth placeholder="12 digits" InputLabelProps={{ shrink: true }} />)} />
                        <Controller name="motherPanNo" control={control} render={({ field }) => (<TextField {...field} label="PAN No" fullWidth placeholder="e.g. ABCDE1234F" InputLabelProps={{ shrink: true }} />)} />
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* Guardian Information */}
                    <SectionHeader icon={UsersIcon} title="Guardian Information" />
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>First Contact Person / Guardian</Typography>
                        <Controller
                            name="guardianRelation"
                            control={control}
                            render={({ field }) => (
                                <RadioGroup row {...field}>
                                    <FormControlLabel value="Father" control={<Radio />} label="Father" />
                                    <FormControlLabel value="Mother" control={<Radio />} label="Mother" />
                                    <FormControlLabel value="Other" control={<Radio />} label="Other" />
                                </RadioGroup>
                            )}
                        />
                    </Box>

                    {
                        guardianRelation === 'Other' && (
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 4 }}>
                                <Controller name="guardianName" control={control} render={({ field }) => (<TextField {...field} label="Guardian Name" fullWidth InputLabelProps={{ shrink: true }} />)} />
                                <Controller name="guardianPhone" control={control} render={({ field }) => (<TextField {...field} label="Guardian Phone" fullWidth InputLabelProps={{ shrink: true }} />)} />
                                <Controller
                                    name="guardianOccupation"
                                    control={control}
                                    render={({ field }) => (
                                        <FormControl fullWidth>
                                            <InputLabel id="guardian-occupation-label" shrink>Guardian Occupation</InputLabel>
                                            <Select {...field} labelId="guardian-occupation-label" label="Guardian Occupation" displayEmpty>
                                                <MenuItem value="">
                                                    <em style={{ fontStyle: 'normal', color: '#9ca3af' }}>Select Occupation</em>
                                                </MenuItem>
                                                {occupationOptions.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                                            </Select>
                                        </FormControl>
                                    )}
                                />
                                <Controller name="guardianEmail" control={control} render={({ field }) => (<TextField {...field} label="Guardian Email" fullWidth InputLabelProps={{ shrink: true }} />)} />
                                <Controller name="guardianAadharNo" control={control} render={({ field }) => (<TextField {...field} label="Guardian Aadhar No" fullWidth placeholder="12 digits" InputLabelProps={{ shrink: true }} />)} />
                                <Controller name="guardianPanNo" control={control} render={({ field }) => (<TextField {...field} label="Guardian PAN No" fullWidth placeholder="e.g. ABCDE1234F" InputLabelProps={{ shrink: true }} />)} />
                                <Box sx={{ gridColumn: '1 / -1' }}>
                                    <Controller name="guardianAddress" control={control} render={({ field }) => (<TextField {...field} label="Guardian Address" multiline rows={3} fullWidth InputLabelProps={{ shrink: true }} />)} />
                                </Box>
                            </Box>
                        )
                    }

                    <Divider sx={{ my: 4 }} />

                    {/* Academic Details */}
                    <SectionHeader icon={School} title="Academic Details" />
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
                        <Controller
                            name="admissionDate"
                            control={control}
                            render={({ field }) => (
                                <DatePicker
                                    label="Admission Date"
                                    format="dd/MM/yyyy"
                                    value={field.value ? new Date(field.value) : null}
                                    onChange={(date) => field.onChange(date?.toISOString().split('T')[0])}
                                    slotProps={{
                                        textField: { fullWidth: true, required: true, error: !!errors.admissionDate, helperText: errors.admissionDate?.message },
                                    }}
                                />
                            )}
                        />
                        <Controller
                            name="className"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth error={!!errors.className}>
                                    <InputLabel id="class-label" shrink>Class *</InputLabel>
                                    <Select {...field} labelId="class-label" label="Class *" displayEmpty>
                                        <MenuItem value="">
                                            <em style={{ fontStyle: 'normal', color: '#9ca3af' }}>Select Class</em>
                                        </MenuItem>
                                        {(classOptions || []).map((cls: any) => (
                                            <MenuItem key={cls.id} value={cls.name}>{cls.displayName || cls.name}</MenuItem>
                                        ))}
                                    </Select>
                                    {errors.className && <FormHelperText>{errors.className.message}</FormHelperText>}
                                </FormControl>
                            )}
                        />
                        <Controller
                            name="section"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth error={!!errors.section}>
                                    <InputLabel id="section-label" shrink>Section *</InputLabel>
                                    <Select {...field} labelId="section-label" label="Section *" displayEmpty>
                                        <MenuItem value="">
                                            <em style={{ fontStyle: 'normal', color: '#9ca3af' }}>Select Section</em>
                                        </MenuItem>
                                        {['A', 'B', 'C', 'D'].map(s => <MenuItem key={s} value={s}>Section {s}</MenuItem>)}
                                    </Select>
                                    {errors.section && <FormHelperText>{errors.section.message}</FormHelperText>}
                                </FormControl>
                            )}
                        />
                        {isSeniorSecondary && (
                            <Box sx={{ gridColumn: '1 / -1' }}>
                                <Controller name="subjects" control={control} render={({ field }) => (<TextField {...field} label="Subjects / Courses" fullWidth placeholder="e.g. Physics, Chemistry, Maths" InputLabelProps={{ shrink: true }} />)} />
                            </Box>
                        )}
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* Contact Details */}
                    <SectionHeader icon={Phone} title="Contact Details" />
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                        <Controller name="email" control={control} render={({ field }) => (<TextField {...field} label="Email Address" type="email" fullWidth placeholder="e.g. student@example.com" InputLabelProps={{ shrink: true }} />)} />
                        <Controller name="phone" control={control} render={({ field }) => (<TextField {...field} label="Phone Number" fullWidth required placeholder="e.g. 9876543210" error={!!errors.phone} helperText={errors.phone?.message} InputLabelProps={{ shrink: true }} />)} />
                        <Controller name="whatsAppNo" control={control} render={({ field }) => (<TextField {...field} label="WhatsApp Number" fullWidth placeholder="e.g. 9876543210" InputLabelProps={{ shrink: true }} />)} />
                        <Box sx={{ gridColumn: '1 / -1' }}>
                            <Controller name="address" control={control} render={({ field }) => (<TextField {...field} label="Address" multiline rows={3} fullWidth required error={!!errors.address} helperText={errors.address?.message} InputLabelProps={{ shrink: true }} />)} />
                        </Box>
                    </Box>

                    <Box sx={{ mt: 5, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button variant="outlined" size="large" onClick={() => router.push('/admissions')} sx={{ px: 4 }}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
                            sx={{ px: 5 }}
                        >
                            {loading ? 'Saving...' : 'Save Admission'}
                        </Button>
                    </Box>
                </form>
            </LocalizationProvider>
        </Box >
    );
}
