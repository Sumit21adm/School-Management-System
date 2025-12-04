import { useState } from 'react';
import { Plus, Edit, FileText } from 'lucide-react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Stack
} from '@mui/material';

export default function ExamManagement() {
  const [exams] = useState([
    { id: 1, name: 'Mid-Term Exam', class: 'Class 10', date: '2024-01-15', status: 'Scheduled' },
    { id: 2, name: 'Final Exam', class: 'Class 9', date: '2024-03-20', status: 'Scheduled' },
  ]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'scheduled': return 'primary';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          Exam Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
        >
          Create Exam
        </Button>
      </Stack>

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Exam Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {exams.map((exam) => (
              <TableRow key={exam.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{exam.name}</TableCell>
                <TableCell color="text.secondary">{exam.class}</TableCell>
                <TableCell color="text.secondary">{exam.date}</TableCell>
                <TableCell>
                  <Chip
                    label={exam.status}
                    color={getStatusColor(exam.status) as any}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton color="primary" size="small">
                      <Edit size={18} />
                    </IconButton>
                    <IconButton color="success" size="small">
                      <FileText size={18} />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
