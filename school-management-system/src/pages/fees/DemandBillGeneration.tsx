import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
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
  Card,
  CardContent,
  Stack,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { FileText, Download, Send } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const demandBillSchema = z.object({
  generationType: z.enum(['single', 'class', 'all']),
  studentId: z.string().optional(),
  className: z.string().optional(),
  section: z.string().optional(),
  sessionId: z.number().min(1),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  dueDate: z.string(),
});

type DemandBillFormData = z.infer<typeof demandBillSchema>;

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const CLASSES = Array.from({ length: 12 }, (_, i) => `${i + 1}`);
const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

export default function DemandBillGeneration() {
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [error, setError] = useState('');

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { control, handleSubmit, watch, formState: { errors } } = useForm<DemandBillFormData>({
    resolver: zodResolver(demandBillSchema),
    defaultValues: {
      generationType: 'single',
      studentId: '',
      className: '',
      section: '',
      sessionId: 1,
      month: currentMonth,
      year: currentYear,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const generationType = watch('generationType');

  const generateBillsMutation = useMutation({
    mutationFn: async (data: DemandBillFormData) => {
      const payload: any = {
        sessionId: data.sessionId,
        month: data.month,
        year: data.year,
        dueDate: data.dueDate,
      };

      if (data.generationType === 'single' && data.studentId) {
        payload.studentId = data.studentId;
      } else if (data.generationType === 'class') {
        payload.className = data.className;
        payload.section = data.section;
      }

      const response = await axios.post(`${API_URL}/fees/demand-bills/generate`, payload);
      return response.data;
    },
    onSuccess: (data) => {
      setGenerationResult(data);
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to generate bills');
      setGenerationResult(null);
    },
  });

  const onSubmit = (data: DemandBillFormData) => {
    generateBillsMutation.mutate(data);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
        Demand Bill Generation
      </Typography>

      <Grid container spacing={3}>
        {/* Generation Form */}
        <Grid item xs={12} lg={7}>
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <Stack spacing={3}>
                {/* Generation Type */}
                <Controller
                  name="generationType"
                  control={control}
                  render={({ field }) => (
                    <FormControl component="fieldset">
                      <FormLabel component="legend">
                        <Typography variant="subtitle1" fontWeight={600}>
                          Bill Generation Type
                        </Typography>
                      </FormLabel>
                      <RadioGroup {...field} row>
                        <FormControlLabel value="single" control={<Radio />} label="Single Student" />
                        <FormControlLabel value="class" control={<Radio />} label="Entire Class" />
                        <FormControlLabel value="all" control={<Radio />} label="All Students" />
                      </RadioGroup>
                    </FormControl>
                  )}
                />

                {/* Conditional Fields */}
                {generationType === 'single' && (
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
                        placeholder="Enter student ID"
                      />
                    )}
                  />
                )}

                {generationType === 'class' && (
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Controller
                        name="className"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth required error={!!errors.className}>
                            <InputLabel>Class</InputLabel>
                            <Select {...field} label="Class">
                              <MenuItem value="">Select Class</MenuItem>
                              {CLASSES.map((cls) => (
                                <MenuItem key={cls} value={cls}>
                                  Class {cls}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Controller
                        name="section"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>Section (Optional)</InputLabel>
                            <Select {...field} label="Section (Optional)">
                              <MenuItem value="">All Sections</MenuItem>
                              {SECTIONS.map((sec) => (
                                <MenuItem key={sec} value={sec}>
                                  Section {sec}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                  </Grid>
                )}

                {/* Session and Period */}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="sessionId"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Session ID"
                          type="number"
                          fullWidth
                          required
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="month"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth required>
                          <InputLabel>Month</InputLabel>
                          <Select {...field} label="Month">
                            {MONTHS.map((month, index) => (
                              <MenuItem key={month} value={index + 1}>
                                {month}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="year"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Year"
                          type="number"
                          fullWidth
                          required
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                {/* Due Date */}
                <Controller
                  name="dueDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Due Date"
                      type="date"
                      fullWidth
                      required
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.dueDate}
                      helperText={errors.dueDate?.message || 'Payment deadline for this bill'}
                    />
                  )}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={generateBillsMutation.isPending}
                  startIcon={
                    generateBillsMutation.isPending ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <FileText size={20} />
                    )
                  }
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  {generateBillsMutation.isPending ? 'Generating Bills...' : 'Generate Demand Bills'}
                </Button>
              </Stack>
            </form>
          </Paper>

          {/* Generation Result */}
          {generationResult && (
            <Paper elevation={2} sx={{ p: 4, borderRadius: 3, mt: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Generation Summary
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Total
                      </Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {generationResult.total}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined" sx={{ bgcolor: 'success.light' }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Generated
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="success.dark">
                        {generationResult.generated}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined" sx={{ bgcolor: 'warning.light' }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Skipped
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="warning.dark">
                        {generationResult.skipped}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined" sx={{ bgcolor: 'error.light' }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        Failed
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="error.dark">
                        {generationResult.failed}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Details Table */}
              {generationResult.results && generationResult.results.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Bill Details
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Student ID</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Bill No</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            Amount
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>
                            Status
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {generationResult.results.map((result: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{result.studentId}</TableCell>
                            <TableCell>{result.billNo || '-'}</TableCell>
                            <TableCell align="right">
                              {result.amount ? `₹${result.amount.toLocaleString()}` : '-'}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={result.status}
                                color={
                                  result.status === 'success'
                                    ? 'success'
                                    : result.status === 'skipped'
                                      ? 'warning'
                                      : 'error'
                                }
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                <Button variant="outlined" startIcon={<Download size={18} />} fullWidth>
                  Download All Bills (PDF)
                </Button>
                <Button variant="contained" startIcon={<Send size={18} />} fullWidth>
                  Send via Email/SMS
                </Button>
              </Stack>
            </Paper>
          )}
        </Grid>

        {/* Sidebar - Info */}
        <Grid item xs={12} lg={5}>
          <Stack spacing={3}>
            <Card elevation={2} sx={{ borderRadius: 3, bgcolor: 'info.light' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  About Demand Bills
                </Typography>
                <Typography variant="body2" paragraph>
                  Demand bills are monthly fee invoices generated for students. They include:
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">✓ Current month's fee structure</Typography>
                  <Typography variant="body2">✓ Previous month's outstanding dues</Typography>
                  <Typography variant="body2">✓ Applicable discounts</Typography>
                  <Typography variant="body2">✓ Late fees (if any)</Typography>
                  <Typography variant="body2">✓ Due date for payment</Typography>
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Generation Options
                </Typography>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Single Student
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Generate bill for one student by entering their ID
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Entire Class
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Generate bills for all students in a specific class and section
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      All Students
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Generate bills for all active students in the session
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={2} sx={{ borderRadius: 3, bgcolor: 'warning.light' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom color="warning.dark">
                  Important Notes
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    • Bills are generated based on the fee structure set for each class
                  </Typography>
                  <Typography variant="body2">
                    • Existing bills for the same month will be skipped
                  </Typography>
                  <Typography variant="body2">• Previous dues are automatically carried forward</Typography>
                  <Typography variant="body2">
                    • Student-specific discounts are applied automatically
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
