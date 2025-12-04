import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  CurrencyRupee as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  PersonAdd as PersonAddIcon,
  FiberManualRecord as DotIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../lib/api';
import { format } from 'date-fns';

interface DashboardStats {
  students: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  fees: {
    todayCollection: number;
    monthCollection: number;
  };
  recentAdmissions: Array<{
    id: number;
    studentId: string;
    name: string;
    className: string;
    section: string;
    createdAt: string;
  }>;
  recentFees: Array<{
    id: number;
    studentId: string;
    amount: number;
    paymentMode: string;
    date: string;
    student: {
      name: string;
    };
  }>;
}

export default function Dashboard() {
  // Fetch dashboard stats with auto-refresh every 30 seconds
  const { data, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: dashboardService.getStats,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 20000, // Consider data stale after 20 seconds
  });

  if (error) {
    return (
      <Alert severity="error">
        Failed to load dashboard data. Please try refreshing the page.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome back! Here's what's happening today.
      </Typography>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          {isLoading ? (
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3 }} />
          ) : (
            <StatCard
              title="Total Students"
              value={data?.students.total.toLocaleString() || '0'}
              icon={<PeopleIcon sx={{ fontSize: 40 }} />}
              color="#1976d2"
              bgcolor="#e3f2fd"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {isLoading ? (
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3 }} />
          ) : (
            <StatCard
              title="Today's Collection"
              value={`₹${(data?.fees.todayCollection || 0).toLocaleString()}`}
              icon={<MoneyIcon sx={{ fontSize: 40 }} />}
              color="#2e7d32"
              bgcolor="#e8f5e9"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {isLoading ? (
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3 }} />
          ) : (
            <StatCard
              title="Monthly Collection"
              value={`₹${(data?.fees.monthCollection || 0).toLocaleString()}`}
              icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
              color="#ed6c02"
              bgcolor="#fff4e5"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {isLoading ? (
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3 }} />
          ) : (
            <StatCard
              title="Active Students"
              value={data?.students.active.toLocaleString() || '0'}
              icon={<PersonAddIcon sx={{ fontSize: 40 }} />}
              color="#9c27b0"
              bgcolor="#f3e5f5"
            />
          )}
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Card
        elevation={2}
        sx={{
          borderRadius: 3,
          transition: 'box-shadow 0.3s',
          '&:hover': {
            elevation: 4,
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" component="h2" fontWeight={600} gutterBottom>
            Recent Activity
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Latest admissions and fee payments
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {isLoading ? (
            <Box>
              {[1, 2, 3].map((i) => (
                <Box key={i} sx={{ mb: 2 }}>
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="30%" />
                </Box>
              ))}
            </Box>
          ) : (
            <List disablePadding>
              {/* Recent Admissions */}
              {data?.recentAdmissions.slice(0, 3).map((admission, index) => (
                <Box key={`admission-${admission.id}`}>
                  <ListItem
                    disablePadding
                    sx={{
                      py: 2,
                      '&:hover': {
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                        px: 1,
                        mx: -1,
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: 'primary.light',
                        }}
                      >
                        <DotIcon
                          sx={{
                            fontSize: 16,
                            color: 'primary.dark',
                          }}
                        />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body1" fontWeight={500}>
                          New admission
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {admission.name} admitted to Class {admission.className}-{admission.section}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {format(new Date(admission.createdAt), 'MMM dd, yyyy h:mm a')}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  <Divider />
                </Box>
              ))}

              {/* Recent Fee Payments */}
              {data?.recentFees.slice(0, 2).map((fee) => (
                <Box key={`fee-${fee.id}`}>
                  <ListItem
                    disablePadding
                    sx={{
                      py: 2,
                      '&:hover': {
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                        px: 1,
                        mx: -1,
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: 'success.light',
                        }}
                      >
                        <DotIcon
                          sx={{
                            fontSize: 16,
                            color: 'success.dark',
                          }}
                        />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body1" fontWeight={500}>
                          Fee collected
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            ₹{fee.amount.toLocaleString()} from {fee.student.name} ({fee.paymentMode})
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {format(new Date(fee.date), 'MMM dd, yyyy')}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {data.recentFees.indexOf(fee) < data.recentFees.slice(0, 2).length - 1 && <Divider />}
                </Box>
              ))}

              {(!data?.recentAdmissions?.length && !data?.recentFees?.length) && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                  No recent activity
                </Typography>
              )}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bgcolor: string;
}

function StatCard({ title, value, icon, color, bgcolor }: StatCardProps) {
  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        borderRadius: 3,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom fontWeight={500}>
              {title}
            </Typography>
            <Typography variant="h4" component="p" fontWeight={700} sx={{ color }}>
              {value}
            </Typography>
          </Box>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor,
              color,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}
