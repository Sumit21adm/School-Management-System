import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Printer, Filter, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Stack,
  Skeleton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Menu,
  Divider,
} from '@mui/material';
import { feeService, classService } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

const filterLabels: Record<DateFilter, string> = {
  all: 'All Time',
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
  custom: 'Custom Range',
};

const getDateRange = (filter: DateFilter): { from: string; to: string } => {
  const today = new Date();
  const formatDateStr = (d: Date) => d.toISOString().split('T')[0];

  switch (filter) {
    case 'today':
      return { from: formatDateStr(today), to: formatDateStr(today) };
    case 'week': {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return { from: formatDateStr(startOfWeek), to: formatDateStr(today) };
    }
    case 'month': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: formatDateStr(startOfMonth), to: formatDateStr(today) };
    }
    case 'year': {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return { from: formatDateStr(startOfYear), to: formatDateStr(today) };
    }
    case 'all':
    case 'custom':
    default:
      return { from: '', to: '' };
  }
};

export default function FeeReports() {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);

  // New Filters State
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');

  // Calculate actual date range
  const dateRange = useMemo(() => {
    if (dateFilter === 'all' || dateFilter === 'custom') {
      return { from: customDateFrom, to: customDateTo };
    }
    return getDateRange(dateFilter);
  }, [dateFilter, customDateFrom, customDateTo]);

  const { data: allTransactions = [], isLoading } = useQuery({
    queryKey: ['fee-transactions', dateRange.from, dateRange.to, 'all', studentId, studentName, className, section],
    queryFn: async () => {
      const params: any = {};
      if (dateRange.from) params.dateFrom = dateRange.from;
      if (dateRange.to) params.dateTo = dateRange.to;

      // Add filters to params
      if (studentId) params.studentId = studentId;
      if (studentName) params.studentName = studentName;
      if (className) params.className = className;
      if (section) params.section = section;

      const response = await feeService.getTransactions(params);
      return response.data || [];
    },
  });

  // Fetch available classes
  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: classService.getAll,
  });

  // Pagination
  const totalPages = Math.ceil(allTransactions.length / pageSize);
  const paginatedTransactions = allTransactions.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const totalCollection = allTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);

  const handleFilterSelect = (filter: DateFilter) => {
    setDateFilter(filter);
    setPage(1);
    if (filter !== 'custom') {
      setFilterMenuAnchor(null);
    }
  };

  const handlePageSizeChange = (e: any) => {
    setPageSize(e.target.value);
    setPage(1);
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          Fee Receipt
        </Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<Download size={18} />}
        >
          Export Excel
        </Button>
      </Stack>

      {/* Student Filters */}
      <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
        <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
          <TextField
            size="small"
            label="Student ID"
            placeholder="Search ID..."
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            sx={{ minWidth: 150 }}
          />
          <TextField
            size="small"
            label="Student Name"
            placeholder="Search Name..."
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            sx={{ minWidth: 200, flexGrow: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Class</InputLabel>
            <InputLabel>Class</InputLabel>
            <Select
              value={className}
              label="Class"
              onChange={(e) => setClassName(e.target.value)}
            >
              <MenuItem value="">All Classes</MenuItem>
              {classes?.map((c: any) => (
                <MenuItem key={c.id} value={c.name}>
                  {c.displayName || c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Section</InputLabel>
            <Select
              value={section}
              label="Section"
              onChange={(e) => setSection(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {['A', 'B', 'C', 'D', 'E'].map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="text"
            onClick={() => {
              setStudentId('');
              setStudentName('');
              setClassName('');
              setSection('');
            }}
          >
            Clear
          </Button>
        </Stack>
      </Paper>

      {/* Stats + Filters Row */}
      <Paper elevation={2} sx={{ p: 2.5, mb: 3, borderRadius: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          {/* Left: Stats */}
          <Stack direction="row" spacing={4} alignItems="center">
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total Collection
              </Typography>
              <Typography variant="h5" fontWeight={700} color="success.main">
                {formatCurrency(totalCollection)}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total Transactions
              </Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main">
                {allTransactions.length}
              </Typography>
            </Box>
          </Stack>

          {/* Right: Filter Dropdown */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="outlined"
              startIcon={<Filter size={16} />}
              endIcon={<ChevronDown size={16} />}
              onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
              sx={{ textTransform: 'none' }}
            >
              {filterLabels[dateFilter]}
            </Button>

            <Menu
              anchorEl={filterMenuAnchor}
              open={Boolean(filterMenuAnchor)}
              onClose={() => setFilterMenuAnchor(null)}
              PaperProps={{ sx: { minWidth: 280, p: 1 } }}
            >
              {/* Quick Filter Options */}
              <MenuItem
                selected={dateFilter === 'all'}
                onClick={() => handleFilterSelect('all')}
              >
                All Time
              </MenuItem>
              <MenuItem
                selected={dateFilter === 'today'}
                onClick={() => handleFilterSelect('today')}
              >
                Today
              </MenuItem>
              <MenuItem
                selected={dateFilter === 'week'}
                onClick={() => handleFilterSelect('week')}
              >
                This Week
              </MenuItem>
              <MenuItem
                selected={dateFilter === 'month'}
                onClick={() => handleFilterSelect('month')}
              >
                This Month
              </MenuItem>
              <MenuItem
                selected={dateFilter === 'year'}
                onClick={() => handleFilterSelect('year')}
              >
                This Year
              </MenuItem>

              <Divider sx={{ my: 1 }} />

              {/* Custom Date Range */}
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Custom Range
                </Typography>
                <Stack spacing={1.5} mt={1}>
                  <TextField
                    label="From"
                    type="date"
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={customDateFrom}
                    onChange={(e) => {
                      setCustomDateFrom(e.target.value);
                      setDateFilter('custom');
                    }}
                  />
                  <TextField
                    label="To"
                    type="date"
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={customDateTo}
                    onChange={(e) => {
                      setCustomDateTo(e.target.value);
                      setDateFilter('custom');
                    }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setFilterMenuAnchor(null)}
                    disabled={!customDateFrom || !customDateTo}
                  >
                    Apply
                  </Button>
                </Stack>
              </Box>
            </Menu>

            {dateFilter !== 'all' && (
              <Chip
                label={dateFilter === 'custom'
                  ? `${customDateFrom} - ${customDateTo}`
                  : filterLabels[dateFilter]}
                onDelete={() => {
                  setDateFilter('all');
                  setCustomDateFrom('');
                  setCustomDateTo('');
                }}
                size="small"
                color="primary"
              />
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Transactions Table with Pagination Controls */}
      <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {/* Pagination Controls - Top */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}
        >
          <Typography variant="body2" color="text.secondary">
            Showing {paginatedTransactions.length} of {allTransactions.length} receipts
          </Typography>

          <Stack direction="row" alignItems="center" spacing={2}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Per Page</InputLabel>
              <Select
                value={pageSize}
                label="Per Page"
                onChange={handlePageSizeChange}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={40}>40</MenuItem>
                <MenuItem value={80}>80</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>

            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton
                size="small"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={20} />
              </IconButton>
              <Typography variant="body2">
                Page {page} of {totalPages || 1}
              </Typography>
              <IconButton
                size="small"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={20} />
              </IconButton>
            </Stack>
          </Stack>
        </Stack>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Receipt No</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Student ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Student Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Payment Mode</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Print</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                [...Array(pageSize > 10 ? 10 : pageSize)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    {allTransactions.length === 0
                      ? 'No transactions found. Adjust the date filter to see more results.'
                      : 'No transactions on this page'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((transaction: any) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell sx={{ fontWeight: 500, color: 'primary.main' }}>
                      {transaction.receiptNo}
                    </TableCell>
                    <TableCell color="text.secondary">{formatDate(transaction.date)}</TableCell>
                    <TableCell>{transaction.studentId}</TableCell>
                    <TableCell>{transaction.studentName || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.paymentMode?.toUpperCase()}
                        size="small"
                        variant="outlined"
                        color={transaction.paymentMode === 'cash' ? 'success' : 'primary'}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => feeService.openReceiptPdf(transaction.receiptNo)}
                        title="Print Receipt"
                      >
                        <Printer size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination Controls - Bottom */}
        {totalPages > 1 && (
          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            sx={{ px: 2, py: 2, borderTop: '1px solid', borderColor: 'divider' }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton
                size="small"
                disabled={page <= 1}
                onClick={() => setPage(1)}
                title="First Page"
              >
                <ChevronLeft size={20} />
                <ChevronLeft size={20} style={{ marginLeft: -12 }} />
              </IconButton>
              <IconButton
                size="small"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={20} />
              </IconButton>

              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'contained' : 'text'}
                    size="small"
                    onClick={() => setPage(pageNum)}
                    sx={{ minWidth: 36 }}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <IconButton
                size="small"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={20} />
              </IconButton>
              <IconButton
                size="small"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                title="Last Page"
              >
                <ChevronRight size={20} />
                <ChevronRight size={20} style={{ marginLeft: -12 }} />
              </IconButton>
            </Stack>
          </Stack>
        )}
      </Paper>
    </Box >
  );
}
