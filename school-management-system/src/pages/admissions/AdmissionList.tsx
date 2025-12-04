import { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Typography,
  InputAdornment,
  Skeleton,
  Card,
  CardContent,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Tabs,
  Tab,
  Avatar,
  TablePagination,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { admissionService } from '../../lib/api';
import { db } from '../../lib/db';

export default function AdmissionList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Export State
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportClass, setExportClass] = useState('');
  const [exportSection, setExportSection] = useState('');
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');
  const [exportLoading, setExportLoading] = useState(false);

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<any | null>(null);

  // Import State
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  // Fetch available sections for selected class
  const { data: availableSections = [] } = useQuery({
    queryKey: ['availableSections', classFilter],
    queryFn: async () => {
      if (!classFilter) return [];
      const response = await admissionService.getAvailableSections(classFilter);
      return response.data;
    },
    enabled: !!classFilter,
  });

  const handleViewStudent = (student: any) => {
    setSelectedStudent(student);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStudent(null);
    setTabValue(0);
  };

  // Reset section filter when class changes
  useEffect(() => {
    setSectionFilter('');
  }, [classFilter]);

  // Try to fetch from API, fallback to IndexedDB if offline
  const { data: response = { data: [], meta: { total: 0 } }, isLoading, refetch } = useQuery({
    queryKey: ['students', searchTerm, classFilter, sectionFilter, statusFilter, page, rowsPerPage],
    queryFn: async () => {
      if (navigator.onLine) {
        const response = await admissionService.getStudents({
          search: searchTerm,
          class: classFilter,
          section: sectionFilter,
          status: statusFilter,
          page: page + 1, // API is 1-indexed
          limit: rowsPerPage
        });
        return response.data;
      } else {
        // Fallback to local database
        let query = db.students.where('status').equals('active');
        if (searchTerm) {
          const results = await query.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.studentId.includes(searchTerm)
          ).toArray();
          return { data: results, meta: { total: results.length } };
        }
        const results = await query.toArray();
        return { data: results, meta: { total: results.length } };
      }
    },
  });

  const students = response.data || [];
  const totalStudents = response.meta?.total || 0;

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await admissionService.exportStudents({
        class: exportClass,
        section: exportSection,
        format: exportFormat,
      });

      console.log('Export response status:', response.status);
      console.log('Export response headers:', response.headers);
      console.log('Export response data type:', typeof response.data);
      console.log('Export response data size:', response.data.size);

      if (response.data.type === 'application/json') {
        // If the response is JSON, it's likely an error message
        const text = await response.data.text();
        console.error('Export returned JSON (likely error):', text);
        alert('Export failed: ' + text);
        return;
      }

      const blob = new Blob([response.data], {
        type: exportFormat === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf'
      });

      if (blob.size === 0) {
        console.error('Export blob is empty');
        alert('Export failed: Server returned empty file.');
        return;
      }

      saveAs(blob, `students.${exportFormat === 'excel' ? 'xlsx' : 'pdf'}`);

      setExportDialogOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Check console for details.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteClick = (student: any) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;

    try {
      await admissionService.deleteStudent(studentToDelete.id);
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
      // Invalidate queries to refresh the list
      // Since we don't have direct access to queryClient here, we can rely on the user refreshing or
      // ideally we should use useMutation with onSuccess to invalidate queries.
      // For now, let's just reload the page or trigger a refetch if possible.
      // A better way with useQuery is to use the refetch function returned by useQuery.
      refetch();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await admissionService.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'student_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download template:', error);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setImportLoading(true);
    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const response = await admissionService.importStudents(formData);
      if (response.data.success) {
        alert(`Successfully imported ${response.data.imported} students!`);
        setImportDialogOpen(false);
        setImportFile(null);
        refetch();
      } else {
        alert('Import failed:\n' + response.data.errors.join('\n'));
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import students. Please check the file format.');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} mb={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
            Student Admissions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage student admissions and records
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setImportDialogOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Import
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => setExportDialogOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Export
          </Button>
          <Button
            component={Link}
            to="/admissions/new"
            variant="contained"
            startIcon={<AddIcon />}
            size="large"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
          >
            New Admission
          </Button>
        </Stack>
      </Stack>

      {/* Filters */}
      <Card elevation={2} sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 2 }}
            />

            <FormControl fullWidth sx={{ flex: 1 }}>
              <InputLabel>Class</InputLabel>
              <Select
                value={classFilter}
                label="Class"
                onChange={(e) => setClassFilter(e.target.value as string)}
              >
                <MenuItem value="">All Classes</MenuItem>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                  <MenuItem key={num} value={num.toString()}>
                    Class {num}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ flex: 1 }}>
              <InputLabel>Section</InputLabel>
              <Select
                value={sectionFilter}
                label="Section"
                onChange={(e) => setSectionFilter(e.target.value as string)}
                disabled={!classFilter}
              >
                <MenuItem value="">All Sections</MenuItem>
                {(classFilter ? availableSections : ['A', 'B', 'C', 'D']).map((sec: string) => (
                  <MenuItem key={sec} value={sec}>
                    Section {sec}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Photo</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', display: { xs: 'none', md: 'table-cell' } }}>Student ID</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', display: { xs: 'none', md: 'table-cell' } }}>Date of Birth</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Class</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', display: { xs: 'none', md: 'table-cell' } }}>Father's Name</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', display: { xs: 'none', md: 'table-cell' } }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Skeleton width={60} /></TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                  </TableRow>
                ))
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No students found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student: any) => (
                  <TableRow
                    key={student.id}
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell>
                      <Avatar
                        src={student.photoUrl ? `http://localhost:3001${student.photoUrl}` : undefined}
                        alt={student.name}
                        sx={{ width: 40, height: 40 }}
                      >
                        {student.name.charAt(0)}
                      </Avatar>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Typography variant="body2" fontWeight={500}>
                        {student.studentId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{student.name}</Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Typography variant="body2">
                        {new Date(student.dob).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {student.className}-{student.section}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Typography variant="body2" color="text.secondary">
                        {student.fatherName}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Typography variant="body2" color="text.secondary">
                        {student.phone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={student.status}
                        size="small"
                        color={student.status === 'active' ? 'success' : 'error'}
                        sx={{ fontWeight: 500, textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <IconButton
                          component={Link}
                          to={`/admissions/${student.id}/edit`}
                          size="small"
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="default"
                          onClick={() => handleViewStudent(student)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(student)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalStudents}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Student Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Student Details</Typography>
          <Chip
            label={selectedStudent?.status}
            color={selectedStudent?.status === 'active' ? 'success' : 'error'}
            size="small"
          />
        </DialogTitle>
        <DialogContent dividers>
          {selectedStudent && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 3 }}>
                <Avatar
                  src={selectedStudent.photoUrl ? `http://localhost:3001${selectedStudent.photoUrl}` : undefined}
                  sx={{ width: 100, height: 100, border: '3px solid white', boxShadow: 2 }}
                />
                <Box>
                  <Typography variant="h5" fontWeight={600}>{selectedStudent.name}</Typography>
                  <Typography color="text.secondary" gutterBottom>ID: {selectedStudent.studentId}</Typography>
                  <Typography variant="body2" sx={{ bgcolor: 'primary.main', color: 'white', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                    Class {selectedStudent.className} - {selectedStudent.section}
                  </Typography>
                </Box>
              </Box>

              <Tabs value={tabValue} onChange={(_e, val) => setTabValue(val)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Personal Details" />
                <Tab label="Academic Records" />
                <Tab label="Fee Status" />
              </Tabs>

              {tabValue === 0 && (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">Date of Birth</Typography>
                    <Typography variant="body1" gutterBottom>{new Date(selectedStudent.dob).toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">Gender</Typography>
                    <Typography variant="body1" gutterBottom sx={{ textTransform: 'capitalize' }}>{selectedStudent.gender}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">Father's Name</Typography>
                    <Typography variant="body1" gutterBottom>{selectedStudent.fatherName}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">Mother's Name</Typography>
                    <Typography variant="body1" gutterBottom>{selectedStudent.motherName}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1" gutterBottom>{selectedStudent.phone}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    <Typography variant="body1" gutterBottom>{selectedStudent.email || 'N/A'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                    <Typography variant="body1" gutterBottom>{selectedStudent.address}</Typography>
                  </Grid>
                </Grid>
              )}

              {tabValue === 1 && (
                <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography>Academic records will be displayed here.</Typography>
                </Box>
              )}

              {tabValue === 2 && (
                <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography>Fee payment history will be displayed here.</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          <Button
            component={Link}
            to={`/admissions/${selectedStudent?.id}/edit`}
            variant="contained"
            startIcon={<EditIcon />}
          >
            Edit Student
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export Student Data</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Class</InputLabel>
              <Select
                value={exportClass}
                label="Class"
                onChange={(e) => setExportClass(e.target.value)}
              >
                <MenuItem value="">All Classes</MenuItem>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                  <MenuItem key={num} value={num.toString()}>
                    Class {num}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Section</InputLabel>
              <Select
                value={exportSection}
                label="Section"
                onChange={(e) => setExportSection(e.target.value)}
              >
                <MenuItem value="">All Sections</MenuItem>
                {['A', 'B', 'C', 'D'].map((sec) => (
                  <MenuItem key={sec} value={sec}>
                    Section {sec}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Export Format</FormLabel>
              <RadioGroup
                row
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'excel' | 'pdf')}
              >
                <FormControlLabel value="excel" control={<Radio />} label="Excel" />
                <FormControlLabel value="pdf" control={<Radio />} label="PDF" />
              </RadioGroup>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={exportLoading}
            startIcon={exportLoading ? undefined : <DownloadIcon />}
          >
            {exportLoading ? 'Exporting...' : 'Download'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete student <strong>{studentToDelete?.name}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Students</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Upload an Excel file to bulk import students. Please use the template to ensure correct formatting.
            </Typography>

            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleDownloadTemplate}
            >
              Download Template
            </Button>

            <Box
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main' }
              }}
              onClick={() => document.getElementById('import-file-input')?.click()}
            >
              <input
                type="file"
                id="import-file-input"
                hidden
                accept=".xlsx, .xls, .csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
              <UploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography>
                {importFile ? importFile.name : 'Click to upload Excel file'}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={!importFile || importLoading}
          >
            {importLoading ? 'Importing...' : 'Import'}
          </Button>
        </DialogActions>
      </Dialog >
    </Box >
  );
}
