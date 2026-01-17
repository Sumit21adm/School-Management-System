import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, User, School, Phone, Upload, FileText, Users as UsersIcon, Bus } from 'lucide-react';
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
  Grid,
  Stack,
  FormHelperText,
  Divider,
  Avatar,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import StudentDiscounts from '../../components/StudentDiscounts';
import { admissionService } from '../../lib/api';
import { transportService } from '../../lib/api/transport';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
} from '@mui/material';

const admissionSchema = z.object({
  studentId: z.string()
    .min(1, 'Student ID is required')
    .regex(/^[A-Z0-9-]+$/, 'Student ID can only contain uppercase letters, numbers, and hyphens'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  fatherName: z.string().min(2, 'Father name is required'),
  fatherOccupation: z.string().optional(),
  motherName: z.string().min(2, 'Mother name is required'),
  motherOccupation: z.string().optional(),
  dob: z.string()
    .min(1, 'Date of birth is required')
    .refine((dateStr) => {
      const date = new Date(dateStr);
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate()) ? age - 1 : age;
      return date < today && adjustedAge >= 3 && adjustedAge <= 25;
    }, {
      message: 'Student must be between 3 and 25 years old'
    }),
  gender: z.enum(['male', 'female', 'other']),
  category: z.string().min(1, 'Category is required'),
  religion: z.string().optional(),
  apaarId: z.string().optional(), // 12 digit appar id often? Let's leave optional text for now

  // Parent Docs
  fatherAadharNo: z.string().optional().refine((val) => !val || val === '' || /^[0-9]{12}$/.test(val), { message: 'Must be 12 digits' }),
  fatherPanNo: z.string().optional().refine((val) => !val || val === '' || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val), { message: 'Invalid PAN format' }),
  motherAadharNo: z.string().optional().refine((val) => !val || val === '' || /^[0-9]{12}$/.test(val), { message: 'Must be 12 digits' }),
  motherPanNo: z.string().optional().refine((val) => !val || val === '' || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val), { message: 'Invalid PAN format' }),

  // Guardian
  guardianRelation: z.string().optional(),
  guardianName: z.string().optional(),
  guardianOccupation: z.string().optional(),
  guardianPhone: z.string().optional().refine((val) => !val || val === '' || /^[0-9]{10,15}$/.test(val), { message: 'Invalid phone' }),
  guardianEmail: z.string().optional().refine((val) => !val || val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), { message: 'Invalid email' }),
  guardianAadharNo: z.string().optional().refine((val) => !val || val === '' || /^[0-9]{12}$/.test(val), { message: 'Must be 12 digits' }),
  guardianPanNo: z.string().optional().refine((val) => !val || val === '' || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val), { message: 'Invalid PAN format' }),
  guardianAddress: z.string().optional(),

  aadharCardNo: z.string()
    .optional()
    .refine((val) => !val || val === '' || /^[0-9]{12}$/.test(val), {
      message: 'Aadhar card must be exactly 12 digits'
    }),
  className: z.string().min(1, 'Class is required'),
  section: z.string().min(1, 'Section is required'),
  subjects: z.string().optional(),
  admissionDate: z.string()
    .min(1, 'Admission date is required')
    .refine((dateStr) => {
      const date = new Date(dateStr);
      const today = new Date();
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(today.getFullYear() - 2);
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(today.getFullYear() + 1);
      return date >= twoYearsAgo && date <= oneYearFromNow;
    }, {
      message: 'Admission date must be within the past 2 years or upcoming year'
    }),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  phone: z.string()
    .min(1, 'Phone number is required')
    .regex(/^[0-9]{10,15}$/, 'Phone number must contain only digits (10-15 digits)'),
  whatsAppNo: z.string()
    .optional()
    .refine((val) => !val || val === '' || /^[0-9]{10,15}$/.test(val), {
      message: 'WhatsApp number must contain only digits (10-15 digits)'
    }),
  email: z.string()
    .optional()
    .refine((val) => !val || val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: 'Please enter a valid email address'
    }),

  // Transport
  hasTransport: z.boolean().optional(),
  routeId: z.string().optional(), // Using string for Select compatibility, convert to number on submit
  pickupStopId: z.string().optional(),
  dropStopId: z.string().optional(),
  transportType: z.enum(['pickup', 'drop', 'both']).optional(),
});

type AdmissionFormData = z.infer<typeof admissionSchema>;

import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

// ... (other imports)

export default function AdmissionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Crop state
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [tempPhotoUrl, setTempPhotoUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Fetch classes
  const fetchClasses = async () => {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/classes`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    return response.data;
  };

  const { data: classOptions = [] } = useQuery({ queryKey: ['classes'], queryFn: fetchClasses });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes', 'active'],
    queryFn: () => transportService.getRoutes('active')
  });

  const { control, handleSubmit, watch, reset,
    formState: { errors },
  } = useForm<AdmissionFormData>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      gender: 'male',
      // ... (rest of default values)
      category: '',
      religion: '',
      apaarId: '',
      fatherAadharNo: '',
      fatherPanNo: '',
      motherAadharNo: '',
      motherPanNo: '',
      guardianRelation: 'Father',
      guardianName: '',
      guardianOccupation: '',
      guardianPhone: '',
      guardianEmail: '',
      guardianAadharNo: '',
      guardianPanNo: '',
      guardianAddress: '',
      admissionDate: new Date().toISOString().split('T')[0],
      email: '',
      section: 'A',
      className: '',
      fatherOccupation: '',
      motherOccupation: '',
      aadharCardNo: '',
      whatsAppNo: '',
      subjects: '',
      hasTransport: false,
      routeId: '',
      pickupStopId: '',
      dropStopId: '',
      transportType: 'both',
    },
  });

  // Watch guardian relation to conditionally show fields
  const guardianRelation = watch('guardianRelation');

  // Fetch student data if editing
  useEffect(() => {
    if (id) {
      const fetchStudent = async () => {
        try {
          setLoading(true);
          const response = await admissionService.getStudent(id);
          const student = response.data;

          // Format dates for form and handle nulls
          const formattedData = {
            ...student,
            dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
            admissionDate: student.admissionDate ? new Date(student.admissionDate).toISOString().split('T')[0] : '',
            // Ensure no null values for text fields
            fatherOccupation: student.fatherOccupation || '',
            motherOccupation: student.motherOccupation || '',
            aadharCardNo: student.aadharCardNo || '',
            whatsAppNo: student.whatsAppNo || '',
            email: student.email || '',
            subjects: student.subjects || '',
            category: student.category || 'NA',
            religion: student.religion || '',
            apaarId: student.apaarId || '',
            fatherAadharNo: student.fatherAadharNo || '',
            fatherPanNo: student.fatherPanNo || '',
            motherAadharNo: student.motherAadharNo || '',
            motherPanNo: student.motherPanNo || '',
            guardianRelation: student.guardianRelation || 'Father',
            guardianName: student.guardianName || '',
            guardianOccupation: student.guardianOccupation || '',
            guardianPhone: student.guardianPhone || '',
            guardianEmail: student.guardianEmail || '',
            guardianAadharNo: student.guardianAadharNo || '',
            guardianPanNo: student.guardianPanNo || '',
            guardianAddress: student.guardianAddress || '',
          };

          // Set photo preview if exists
          if (student.photoUrl) {
            setPhotoPreview(`http://localhost:3001${student.photoUrl}`);
          }

          reset(formattedData);
        } catch (err) {
          console.error('Error fetching student:', err);
          setError('Failed to load student details');
        } finally {
          setLoading(false);
        }
      };

      fetchStudent();
    }
  }, [id, reset]);

  const selectedClass = watch('className');
  const isSeniorSecondary = selectedClass === '11' || selectedClass === '12';

  const hasTransport = watch('hasTransport');
  const selectedRouteId = watch('routeId');
  const selectedRoute = routes.find((r: any) => r.id === Number(selectedRouteId));
  const stops = selectedRoute?.stops || [];

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const url = URL.createObjectURL(file);
      setTempPhotoUrl(url);
      setIsCropDialogOpen(true);
      // Reset crop state
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  };

  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    if (tempPhotoUrl && croppedAreaPixels) {
      try {
        const croppedImageBlob = await getCroppedImg(
          tempPhotoUrl,
          croppedAreaPixels
        );

        if (croppedImageBlob) {
          const file = new File([croppedImageBlob], "profile_photo.jpg", { type: "image/jpeg" });
          setPhoto(file);
          setPhotoPreview(URL.createObjectURL(file));
          setIsCropDialogOpen(false);
        }
      } catch (e) {
        console.error(e);
        setError('Failed to crop image');
      }
    }
  };

  const handleCropCancel = () => {
    setIsCropDialogOpen(false);
    setTempPhotoUrl(null);
  };

  const handleStudentIdBlur = async (studentId: string) => {
    if (!studentId || studentId.trim() === '') return;

    try {
      const response = await admissionService.getStudents({ search: studentId });
      const students = response.data.data || [];
      const exactMatch = students.find((s: any) => s.studentId.toLowerCase() === studentId.toLowerCase());

      if (exactMatch) {
        // If in edit mode and matches current student, ignore
        if (id && Number(exactMatch.id) === Number(id)) {
          return;
        }
        setError(`Student ID '${studentId}' already exists.`);
      }
    } catch (err) {
      console.error('Error checking student ID:', err);
    }
  };

  const onSubmit = async (data: AdmissionFormData) => {
    setLoading(true);
    setError('');

    try {
      // Create FormData object for file upload
      const formData = new FormData();

      // Append all text fields
      const excludedFields = ['hasTransport', 'routeId', 'pickupStopId', 'dropStopId', 'transportType'];

      // Append all text fields
      Object.keys(data).forEach(key => {
        if (excludedFields.includes(key)) return; // Skip transport fields

        const value = data[key as keyof AdmissionFormData];
        if (value !== undefined && value !== null) {
          // Handle dates specifically if needed, but string format is usually fine
          if (key === 'dob' || key === 'admissionDate') {
            formData.append(key, new Date(value as string).toISOString());
          } else {
            formData.append(key, value as string);
          }
        }
      });

      // Append photo if selected
      if (photo) {
        formData.append('photo', photo);
      }

      // Add default status
      formData.append('status', 'active');

      if (navigator.onLine) {
        // Submit to API
        if (id) {
          await admissionService.updateStudent(id, formData); // Ensure API supports FormData for update
          alert('Student updated successfully!');
          navigate('/admissions');
        } else {
          const response = await admissionService.createStudent(formData);
          const newStudentId = response.data.studentId; // Get the created student's ID

          // Assign Transport if selected
          if (data.hasTransport && data.routeId) {
            try {
              await transportService.assignTransport({
                studentId: newStudentId,
                routeId: Number(data.routeId),
                pickupStopId: data.pickupStopId ? Number(data.pickupStopId) : undefined,
                dropStopId: data.dropStopId ? Number(data.dropStopId) : undefined,
                transportType: data.transportType
              });
            } catch (err: any) {
              console.error('Transport assignment failed:', err);
              alert('Student created, but Transport assignment failed: ' + (err.response?.data?.message || err.message));
            }
          }

          alert('Student created successfully! You can now add fee discounts below.');
          // Redirect to edit mode so user can add discounts
          navigate(`/admissions/${newStudentId}/edit`, { replace: true });
        }
      } else {
        // Offline handling (simplified - might not support file upload offline easily without IndexedDB blob storage)
        setError("Offline submission with file upload is not fully supported yet. Please connect to internet.");
        setLoading(false);
        return;
      }
      navigate('/admissions');
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.response?.data?.message || 'Failed to save admission. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 1 }}>
      <Icon size={20} className="text-blue-600" />
      <Typography variant="h6" color="primary" fontWeight={600}>
        {title}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
            <Typography variant="h4" component="h1" fontWeight={700} color="text.primary">
              {id ? 'Edit Admission' : 'New Admission'}
            </Typography>
          </Stack>

          <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
            <form onSubmit={handleSubmit(onSubmit)}>


              {/* Personal Details Section */}
              <SectionHeader icon={User} title="Personal Details" />
              <Grid container spacing={4} sx={{ mb: 4 }}>
                {/* Left Column: Photo Upload */}
                <Grid size={{ xs: 12, md: 3 }} display="flex" flexDirection="column" alignItems="center">
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
                      width: '100%'
                    }}
                  >
                    <Avatar
                      src={photoPreview || undefined}
                      sx={{ width: 120, height: 120, bgcolor: 'grey.100', mb: 2 }}
                    >
                      {!photoPreview && <User size={48} color="#9ca3af" />}
                    </Avatar>
                    <Button
                      component="label"
                      variant="outlined"
                      size="small"
                      startIcon={<Upload size={16} />}
                      fullWidth
                    >
                      Upload Photo
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handlePhotoChange}
                      />
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                      Allowed *.jpeg, *.jpg, *.png
                    </Typography>
                  </Paper>
                </Grid>

                {/* Right Column: Personal Details Fields */}
                <Grid size={{ xs: 12, md: 9 }}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Controller
                        name="studentId"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Student ID"
                            fullWidth
                            required
                            error={!!errors.studentId}
                            helperText={errors.studentId?.message}
                            placeholder="e.g. STU2024001"
                            InputLabelProps={{ shrink: true }}
                            onBlur={(e) => {
                              field.onBlur();
                              handleStudentIdBlur(e.target.value);
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Student Name"
                            fullWidth
                            required
                            error={!!errors.name}
                            helperText={errors.name?.message}
                            InputLabelProps={{ shrink: true }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Controller
                        name="gender"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth error={!!errors.gender}>
                            <InputLabel id="gender-label" shrink>Gender *</InputLabel>
                            <Select
                              {...field}
                              labelId="gender-label"
                              label="Gender *"
                              displayEmpty
                              renderValue={(selected) => {
                                // Capitalize first letter
                                return (selected as string).charAt(0).toUpperCase() + (selected as string).slice(1);
                              }}
                            >
                              <MenuItem value="male">Male</MenuItem>
                              <MenuItem value="female">Female</MenuItem>
                              <MenuItem value="other">Other</MenuItem>
                            </Select>
                            {errors.gender && <FormHelperText>{errors.gender.message}</FormHelperText>}
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Controller
                        name="dob"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            label="Date of Birth"
                            value={field.value ? new Date(field.value) : null}
                            onChange={(date) => field.onChange(date?.toISOString().split('T')[0])}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                required: true,
                                error: !!errors.dob,
                                helperText: errors.dob?.message,
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              {/* Religion & Category Section */}
              <SectionHeader icon={UsersIcon} title="Religion & Category" />
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="religion"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.religion}>
                        <InputLabel id="religion-label" shrink>Religion</InputLabel>
                        <Select
                          {...field}
                          labelId="religion-label"
                          label="Religion"
                          displayEmpty
                          renderValue={(selected) => {
                            if (!selected) {
                              return <Typography color="text.secondary">Select Religion</Typography>;
                            }
                            return selected as string;
                          }}
                        >
                          <MenuItem value="" disabled>Select Religion</MenuItem>
                          <MenuItem value="Hindu">Hindu</MenuItem>
                          <MenuItem value="Muslim">Muslim</MenuItem>
                          <MenuItem value="Christian">Christian</MenuItem>
                          <MenuItem value="Sikh">Sikh</MenuItem>
                          <MenuItem value="Buddhist">Buddhist</MenuItem>
                          <MenuItem value="Jain">Jain</MenuItem>
                          <MenuItem value="Other">Other</MenuItem>
                        </Select>
                        {errors.religion && <FormHelperText>{errors.religion.message}</FormHelperText>}
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.category}>
                        <InputLabel id="category-label" shrink>Category *</InputLabel>
                        <Select
                          {...field}
                          labelId="category-label"
                          label="Category *"
                          displayEmpty
                          renderValue={(selected) => {
                            if (!selected) {
                              return <Typography color="text.secondary">Select Category</Typography>;
                            }
                            return selected as string;
                          }}
                        >
                          <MenuItem value="" disabled>Select Category</MenuItem>
                          <MenuItem value="General">General</MenuItem>
                          <MenuItem value="OBC">OBC</MenuItem>
                          <MenuItem value="SC/ST">SC/ST</MenuItem>
                          <MenuItem value="Others">Others</MenuItem>
                          <MenuItem value="Don't want to disclose">Don't want to disclose</MenuItem>
                        </Select>
                        {errors.category && <FormHelperText>{errors.category.message}</FormHelperText>}
                      </FormControl>
                    )}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              {/* Government Identification Section */}
              <SectionHeader icon={FileText} title="Government Identification" />
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="aadharCardNo"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Student Aadhar Card No"
                        fullWidth
                        placeholder="12 digits"
                        error={!!errors.aadharCardNo}
                        helperText={errors.aadharCardNo?.message}
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="apaarId"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="APAAR ID"
                        fullWidth
                        placeholder="e.g. 123456789012"
                        error={!!errors.apaarId}
                        helperText={errors.apaarId?.message}
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              {/* Parents Details Section */}
              <SectionHeader icon={User} title="Parents Details" />
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Father */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.secondary' }}>Father's Details</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="fatherName"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Father's Name"
                        fullWidth
                        required
                        error={!!errors.fatherName}
                        helperText={errors.fatherName?.message}
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="fatherOccupation"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.fatherOccupation}>
                        <InputLabel id="father-occupation-label" shrink>Occupation</InputLabel>
                        <Select
                          {...field}
                          labelId="father-occupation-label"
                          label="Occupation"
                          displayEmpty
                          renderValue={(selected) => {
                            if (!selected) {
                              return <Typography color="text.secondary">Select Occupation</Typography>;
                            }
                            return selected as string;
                          }}
                        >
                          <MenuItem value="" disabled>Select Occupation</MenuItem>
                          <MenuItem value="State Govt">State Govt</MenuItem>
                          <MenuItem value="Central Govt">Central Govt</MenuItem>
                          <MenuItem value="Defence/ Army Personnel">Defence/ Army Personnel</MenuItem>
                          <MenuItem value="Farming">Farming</MenuItem>
                          <MenuItem value="Businessman">Businessman</MenuItem>
                          <MenuItem value="Private Job">Private Job</MenuItem>
                          <MenuItem value="House Maker">House Maker</MenuItem>
                          <MenuItem value="Engineer">Engineer</MenuItem>
                          <MenuItem value="Doctor">Doctor</MenuItem>
                          <MenuItem value="Other">Other</MenuItem>
                        </Select>
                        {errors.fatherOccupation && <FormHelperText>{errors.fatherOccupation.message}</FormHelperText>}
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="fatherAadharNo"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Aadhar No"
                        fullWidth
                        placeholder="12 digits"
                        error={!!errors.fatherAadharNo}
                        helperText={errors.fatherAadharNo?.message}
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="fatherPanNo"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="PAN No"
                        fullWidth
                        placeholder="e.g. ABCDE1234F"
                        error={!!errors.fatherPanNo}
                        helperText={errors.fatherPanNo?.message}
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Grid>

                {/* Mother */}
                <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'text.secondary' }}>Mother's Details</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="motherName"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Mother's Name"
                        fullWidth
                        required
                        error={!!errors.motherName}
                        helperText={errors.motherName?.message}
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="motherOccupation"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.motherOccupation}>
                        <InputLabel id="mother-occupation-label" shrink>Occupation</InputLabel>
                        <Select
                          {...field}
                          labelId="mother-occupation-label"
                          label="Occupation"
                          displayEmpty
                          renderValue={(selected) => {
                            if (!selected) {
                              return <Typography color="text.secondary">Select Occupation</Typography>;
                            }
                            return selected as string;
                          }}
                        >
                          <MenuItem value="" disabled>Select Occupation</MenuItem>
                          <MenuItem value="State Govt">State Govt</MenuItem>
                          <MenuItem value="Central Govt">Central Govt</MenuItem>
                          <MenuItem value="Defence/ Army Personnel">Defence/ Army Personnel</MenuItem>
                          <MenuItem value="Farming">Farming</MenuItem>
                          <MenuItem value="Businessman">Businessman</MenuItem>
                          <MenuItem value="Private Job">Private Job</MenuItem>
                          <MenuItem value="House Maker">House Maker</MenuItem>
                          <MenuItem value="Engineer">Engineer</MenuItem>
                          <MenuItem value="Doctor">Doctor</MenuItem>
                          <MenuItem value="Other">Other</MenuItem>
                        </Select>
                        {errors.motherOccupation && <FormHelperText>{errors.motherOccupation.message}</FormHelperText>}
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="motherAadharNo"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Aadhar No"
                        fullWidth
                        placeholder="12 digits"
                        error={!!errors.motherAadharNo}
                        helperText={errors.motherAadharNo?.message}
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="motherPanNo"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="PAN No"
                        fullWidth
                        placeholder="e.g. ABCDE1234F"
                        error={!!errors.motherPanNo}
                        helperText={errors.motherPanNo?.message}
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              {/* Guardian Information Section */}
              <SectionHeader icon={UsersIcon} title="Guardian Information" />
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl component="fieldset">
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
                  </FormControl>
                </Grid>

                {guardianRelation === 'Other' && (
                  <>
                    <Grid size={{ xs: 12 }}><Divider sx={{ borderStyle: 'dashed' }} /></Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Controller
                        name="guardianName"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Guardian Name"
                            fullWidth
                            error={!!errors.guardianName}
                            helperText={errors.guardianName?.message}
                            InputLabelProps={{ shrink: true }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Controller
                        name="guardianPhone"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Guardian Phone"
                            fullWidth
                            placeholder="Digits only"
                            error={!!errors.guardianPhone}
                            helperText={errors.guardianPhone?.message}
                            InputLabelProps={{ shrink: true }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Controller
                        name="guardianOccupation"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth error={!!errors.guardianOccupation}>
                            <InputLabel id="guardian-occupation-label" shrink>Guardian Occupation</InputLabel>
                            <Select
                              {...field}
                              labelId="guardian-occupation-label"
                              label="Guardian Occupation"
                              displayEmpty
                              renderValue={(selected) => {
                                if (!selected) {
                                  return <Typography color="text.secondary">Select Occupation</Typography>;
                                }
                                return selected as string;
                              }}
                            >
                              <MenuItem value="" disabled>Select Occupation</MenuItem>
                              <MenuItem value="State Govt">State Govt</MenuItem>
                              <MenuItem value="Central Govt">Central Govt</MenuItem>
                              <MenuItem value="Defence/ Army Personnel">Defence/ Army Personnel</MenuItem>
                              <MenuItem value="Farming">Farming</MenuItem>
                              <MenuItem value="Businessman">Businessman</MenuItem>
                              <MenuItem value="Private Job">Private Job</MenuItem>
                              <MenuItem value="House Maker">House Maker</MenuItem>
                              <MenuItem value="Engineer">Engineer</MenuItem>
                              <MenuItem value="Doctor">Doctor</MenuItem>
                              <MenuItem value="Other">Other</MenuItem>
                            </Select>
                            {errors.guardianOccupation && <FormHelperText>{errors.guardianOccupation.message}</FormHelperText>}
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Controller
                        name="guardianEmail"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Guardian Email"
                            fullWidth
                            error={!!errors.guardianEmail}
                            helperText={errors.guardianEmail?.message}
                            InputLabelProps={{ shrink: true }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Controller
                        name="guardianAadharNo"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Guardian Aadhar No"
                            fullWidth
                            placeholder="12 digits"
                            error={!!errors.guardianAadharNo}
                            helperText={errors.guardianAadharNo?.message}
                            InputLabelProps={{ shrink: true }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Controller
                        name="guardianPanNo"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Guardian PAN No"
                            fullWidth
                            placeholder="e.g. ABCDE1234F"
                            error={!!errors.guardianPanNo}
                            helperText={errors.guardianPanNo?.message}
                            InputLabelProps={{ shrink: true }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Controller
                        name="guardianAddress"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Guardian Address"
                            multiline
                            rows={3}
                            fullWidth
                            error={!!errors.guardianAddress}
                            helperText={errors.guardianAddress?.message}
                            InputLabelProps={{ shrink: true }}
                          />
                        )}
                      />
                    </Grid>
                  </>
                )}
              </Grid>

              <Divider sx={{ my: 4 }} />

              {/* Academic Details Section */}
              <SectionHeader icon={School} title="Academic Details" />
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="admissionDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Admission Date"
                        value={field.value ? new Date(field.value) : null}
                        onChange={(date) => field.onChange(date?.toISOString().split('T')[0])}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            error: !!errors.admissionDate,
                            helperText: errors.admissionDate?.message,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Controller
                    name="className"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.className}>
                        <InputLabel id="class-label" shrink>Class *</InputLabel>
                        <Select
                          {...field}
                          labelId="class-label"
                          label="Class *"
                          displayEmpty
                          renderValue={(selected) => {
                            if (selected === '') {
                              return <Typography color="text.secondary">Select Class</Typography>;
                            }
                            return classOptions.find((c: any) => c.name === selected)?.displayName || selected;
                          }}
                        >
                          <MenuItem value="" disabled>
                            Select Class
                          </MenuItem>
                          {classOptions.map((cls: any) => (
                            <MenuItem key={cls.id} value={cls.name}>
                              {cls.displayName}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.className && <FormHelperText>{errors.className.message}</FormHelperText>}
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Controller
                    name="section"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.section}>
                        <InputLabel id="section-label" shrink>Section *</InputLabel>
                        <Select
                          {...field}
                          labelId="section-label"
                          label="Section *"
                          displayEmpty
                          renderValue={(selected) => {
                            if (!selected) {
                              return <Typography color="text.secondary">Select Section</Typography>;
                            }
                            return `Section ${selected}`;
                          }}
                        >
                          <MenuItem value="A">Section A</MenuItem>
                          <MenuItem value="B">Section B</MenuItem>
                          <MenuItem value="C">Section C</MenuItem>
                          <MenuItem value="D">Section D</MenuItem>
                        </Select>
                        {errors.section && <FormHelperText>{errors.section.message}</FormHelperText>}
                      </FormControl>
                    )}
                  />
                </Grid>
                {/* Conditional Subjects Field */}
                {isSeniorSecondary && (
                  <Grid size={{ xs: 12 }}>
                    <Controller
                      name="subjects"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Subjects / Courses"
                          fullWidth
                          placeholder="e.g. Physics, Chemistry, Maths"
                          error={!!errors.subjects}
                          helperText={errors.subjects?.message}
                          InputLabelProps={{ shrink: true }}
                        />
                      )}
                    />
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 4 }} />

              {/* Contact Details Section */}
              <SectionHeader icon={Phone} title="Contact Details" />
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Email Address"
                        type="email"
                        fullWidth
                        placeholder="e.g. student@example.com"
                        error={!!errors.email}
                        helperText={errors.email?.message}
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Phone Number"
                        fullWidth
                        required
                        placeholder="e.g. 9876543210 (10-15 digits)"
                        error={!!errors.phone}
                        helperText={errors.phone?.message}
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="whatsAppNo"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="WhatsApp Number"
                        fullWidth
                        placeholder="e.g. 9876543210 (10-15 digits)"
                        error={!!errors.whatsAppNo}
                        helperText={errors.whatsAppNo?.message}
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="address"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Address"
                        multiline
                        rows={3}
                        fullWidth
                        required
                        error={!!errors.address}
                        helperText={errors.address?.message}
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              {/* Transport Assignment Section */}
              {!id && (
                <>
                  <SectionHeader icon={Bus} title="Transport Assignment" />
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12 }}>
                      <FormControlLabel
                        control={
                          <Controller
                            name="hasTransport"
                            control={control}
                            render={({ field }) => (
                              <Checkbox {...field} checked={field.value} />
                            )}
                          />
                        }
                        label="Assign School Transport"
                      />
                    </Grid>

                    {hasTransport && (
                      <>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Controller
                            name="routeId"
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth>
                                <InputLabel id="route-label">Select Route *</InputLabel>
                                <Select
                                  {...field}
                                  labelId="route-label"
                                  label="Select Route *"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    // Reset stops when route changes
                                    control._reset({ ...watch(), pickupStopId: '', dropStopId: '' });
                                  }}
                                >
                                  {routes.map((route: any) => (
                                    <MenuItem key={route.id} value={String(route.id)}>
                                      {route.routeName} ({route.routeCode}) - ₹{route.monthlyFee}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <Controller
                            name="transportType"
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth>
                                <InputLabel id="type-label">Transport Type</InputLabel>
                                <Select {...field} labelId="type-label" label="Transport Type">
                                  <MenuItem value="both">Both Pickup & Drop</MenuItem>
                                  <MenuItem value="pickup">Pickup Only</MenuItem>
                                  <MenuItem value="drop">Drop Only</MenuItem>
                                </Select>
                              </FormControl>
                            )}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <Controller
                            name="pickupStopId"
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth disabled={!selectedRouteId}>
                                <InputLabel id="pickup-label">Pickup Point</InputLabel>
                                <Select {...field} labelId="pickup-label" label="Pickup Point">
                                  {stops.map((stop: any) => (
                                    <MenuItem key={stop.id} value={String(stop.id)}>
                                      {stop.stopName} {stop.pickupTime ? `(${stop.pickupTime})` : ''}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <Controller
                            name="dropStopId"
                            control={control}
                            render={({ field }) => (
                              <FormControl fullWidth disabled={!selectedRouteId}>
                                <InputLabel id="drop-label">Drop Point</InputLabel>
                                <Select {...field} labelId="drop-label" label="Drop Point">
                                  {stops.map((stop: any) => (
                                    <MenuItem key={stop.id} value={String(stop.id)}>
                                      {stop.stopName} {stop.dropTime ? `(${stop.dropTime})` : ''}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </>
              )}

              {/* Fee Discounts Section */}
              <Divider sx={{ my: 4 }} />
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <School size={24} />
                  Fee Discounts
                </Typography>
                {id ? (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Manage special fee discounts for this student (scholarships, sibling discounts, etc.)
                    </Typography>
                    <StudentDiscounts studentId={watch('studentId')} />
                  </>
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    💡 <strong>Tip:</strong> Save the student details first, then you can add fee discounts on the next screen.
                  </Alert>
                )}
              </Box>

              <Box sx={{ mt: 5, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/admissions')}
                  sx={{ px: 4 }}
                >
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
          </Paper>

          {/* Crop Dialog */}
          <Dialog
            open={isCropDialogOpen}
            onClose={handleCropCancel}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Crop Photo</DialogTitle>
            <DialogContent>
              <Box sx={{ position: 'relative', width: '100%', height: 400, bgcolor: '#333', mb: 2 }}>
                <Cropper
                  image={tempPhotoUrl || ''}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </Box>
              <Box sx={{ px: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="body2">Zoom</Typography>
                <Slider
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(_, zoom) => setZoom(Number(zoom))}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCropCancel}>Cancel</Button>
              <Button onClick={handleCropSave} variant="contained">
                Save
              </Button>
            </DialogActions>
          </Dialog>
        </Paper>

        <Dialog open={!!error} onClose={() => setError(null)}>
          <DialogTitle color="error">Error</DialogTitle>
          <DialogContent>
            <Typography>{error}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setError(null)} color="primary" autoFocus>OK</Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
    </Box>
  );
}
