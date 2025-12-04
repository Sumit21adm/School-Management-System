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
} from '@mui/material';
import {
  People as PeopleIcon,
  CurrencyRupee as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  FiberManualRecord as DotIcon,
} from '@mui/icons-material';

export default function Dashboard() {
  // Mock data - will be replaced with real API calls
  const stats = {
    totalStudents: 1250,
    todayCollection: 45000,
    pendingDues: 125000,
    upcomingExams: 3,
  };

  const recentActivities = [
    {
      title: 'New admission',
      description: 'Rajesh Kumar admitted to Class 10-A',
      time: '5 minutes ago',
      color: 'primary',
    },
    {
      title: 'Fee collected',
      description: '₹8,500 collected from student ID 2467',
      time: '15 minutes ago',
      color: 'success',
    },
    {
      title: 'Exam created',
      description: 'Mid-term exam scheduled for Class 8',
      time: '1 hour ago',
      color: 'info',
    },
  ];

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
          <StatCard
            title="Total Students"
            value={stats.totalStudents.toLocaleString()}
            icon={<PeopleIcon sx={{ fontSize: 40 }} />}
            color="#1976d2"
            bgcolor="#e3f2fd"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Collection"
            value={`₹${stats.todayCollection.toLocaleString()}`}
            icon={<MoneyIcon sx={{ fontSize: 40 }} />}
            color="#2e7d32"
            bgcolor="#e8f5e9"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Dues"
            value={`₹${stats.pendingDues.toLocaleString()}`}
            icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
            color="#d32f2f"
            bgcolor="#ffebee"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Upcoming Exams"
            value={stats.upcomingExams.toString()}
            icon={<SchoolIcon sx={{ fontSize: 40 }} />}
            color="#9c27b0"
            bgcolor="#f3e5f5"
          />
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
            Latest updates and activities
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <List disablePadding>
            {recentActivities.map((activity, index) => (
              <Box key={index}>
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
                        bgcolor: `${activity.color}.light`,
                      }}
                    >
                      <DotIcon
                        sx={{
                          fontSize: 16,
                          color: `${activity.color}.dark`,
                        }}
                      />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body1" fontWeight={500}>
                        {activity.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {activity.description}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {activity.time}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < recentActivities.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
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
