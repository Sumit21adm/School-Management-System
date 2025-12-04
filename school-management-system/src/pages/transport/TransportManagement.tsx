import { useState } from 'react';
import { Plus, Edit } from 'lucide-react';
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
  IconButton,
  Stack
} from '@mui/material';

export default function TransportManagement() {
  const [routes] = useState([
    { id: 1, routeName: 'Route A', vehicleNo: 'DL-1234', driver: 'Ramesh Kumar', phone: '9876543210', students: 45 },
    { id: 2, routeName: 'Route B', vehicleNo: 'DL-5678', driver: 'Suresh Singh', phone: '9876543211', students: 38 },
  ]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          Transport Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
        >
          Add Route
        </Button>
      </Stack>

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Route Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Vehicle No</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Driver</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Students</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {routes.map((route) => (
              <TableRow key={route.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{route.routeName}</TableCell>
                <TableCell color="text.secondary">{route.vehicleNo}</TableCell>
                <TableCell>{route.driver}</TableCell>
                <TableCell>{route.phone}</TableCell>
                <TableCell align="right">{route.students}</TableCell>
                <TableCell align="right">
                  <IconButton color="primary" size="small">
                    <Edit size={18} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
