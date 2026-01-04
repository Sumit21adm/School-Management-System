'use client';

import { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    List,
    Divider,
    Avatar,
    Skeleton,
    Alert,
    Chip,
    Stack,
    FormControl,
    Select,
    MenuItem,
    InputLabel,
    Grid,
} from '@mui/material';

import {
    People as PeopleIcon,
    CurrencyRupee as MoneyIcon,
    TrendingUp as TrendingUpIcon,
    PersonAdd as PersonAddIcon,
    Receipt as ReceiptIcon,
    Event as EventIcon,
    School as SchoolIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/lib/api';
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
    recentDemandBills: Array<{
        id: number;
        billNo: string;
        totalAmount: number;
        dueDate: string;
        month: number;
        year: number;
        createdAt: string;
        student: {
            name: string;
            className: string;
            section: string;
        };
    }>;
    upcomingExams: Array<{
        id: number;
        name: string;
        startDate: string;
        endDate: string;
        status: string;
        examType: {
            name: string;
        };
    }>;
    lastUpdated: string;
    // Fallback fields
    totalStudents?: number;
    totalClasses?: number;
    totalCollections?: number;
    pendingFees?: number;
}

import { useSessionContext } from '@/contexts/SessionContext';

// ...

export default function DashboardPage() {
    const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
    const { selectedSessionId } = useSessionContext();

    const { data, isLoading, error } = useQuery<DashboardStats>({
        queryKey: ['dashboardStats', period, selectedSessionId],
        queryFn: () => dashboardService.getStats(period, selectedSessionId),
        refetchInterval: 15000,
        staleTime: 10000,
        enabled: !!selectedSessionId, // Wait for session to be loaded
    });

    if (error) {
        return (
            <Alert severity="error">
                Failed to load dashboard data. Please try refreshing the page.
            </Alert>
        );
    }

    const getPeriodLabel = () => {
        switch (period) {
            case 'today': return 'today';
            case 'week': return 'this week';
            case 'month': return 'this month';
        }
    };

    // Handle both old and new API response formats
    const stats = {
        totalStudents: data?.students?.total ?? data?.totalStudents ?? 0,
        activeStudents: data?.students?.active ?? data?.totalStudents ?? 0,
        todayCollection: data?.fees?.todayCollection ?? data?.totalCollections ?? 0,
        monthCollection: data?.fees?.monthCollection ?? data?.totalCollections ?? 0,
    };

    return (
        <Box sx={{ width: '100%' }}>
            {/* Dashboard Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Box>
                    <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
                        Dashboard
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Welcome back! Here&apos;s what&apos;s happening {getPeriodLabel()}.
                    </Typography>
                </Box>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel id="period-select-label">Period</InputLabel>
                    <Select
                        labelId="period-select-label"
                        value={period}
                        label="Period"
                        onChange={(e) => setPeriod(e.target.value as 'today' | 'week' | 'month')}
                    >
                        <MenuItem value="today">Today</MenuItem>
                        <MenuItem value="week">This Week</MenuItem>
                        <MenuItem value="month">This Month</MenuItem>
                    </Select>
                </FormControl>
            </Stack>

            {/* Stats Grid - Using Box with flexbox for MUI v7 compatibility */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4, mt: 2 }}>
                <Box sx={{ flex: '1 1 calc(25% - 18px)', minWidth: 220 }}>
                    {isLoading ? (
                        <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3 }} />
                    ) : (
                        <StatCard
                            title="Total Students"
                            value={stats.totalStudents.toLocaleString()}
                            icon={<PeopleIcon sx={{ fontSize: 40 }} />}
                            color="#1976d2"
                            bgcolor="#e3f2fd"
                        />
                    )}
                </Box>
                <Box sx={{ flex: '1 1 calc(25% - 18px)', minWidth: 220 }}>
                    {isLoading ? (
                        <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3 }} />
                    ) : (
                        <StatCard
                            title="Today's Collection"
                            value={`₹${stats.todayCollection.toLocaleString()}`}
                            icon={<MoneyIcon sx={{ fontSize: 40 }} />}
                            color="#2e7d32"
                            bgcolor="#e8f5e9"
                        />
                    )}
                </Box>
                <Box sx={{ flex: '1 1 calc(25% - 18px)', minWidth: 220 }}>
                    {isLoading ? (
                        <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3 }} />
                    ) : (
                        <StatCard
                            title="Monthly Collection"
                            value={`₹${stats.monthCollection.toLocaleString()}`}
                            icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
                            color="#ed6c02"
                            bgcolor="#fff4e5"
                        />
                    )}
                </Box>
                <Box sx={{ flex: '1 1 calc(25% - 18px)', minWidth: 220 }}>
                    {isLoading ? (
                        <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3 }} />
                    ) : (
                        <StatCard
                            title="Active Students"
                            value={stats.activeStudents.toLocaleString()}
                            icon={<PersonAddIcon sx={{ fontSize: 40 }} />}
                            color="#9c27b0"
                            bgcolor="#f3e5f5"
                        />
                    )}
                </Box>
            </Box>


            {/* Activity Sections */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, width: '100%' }}>
                {/* Recent Admissions */}
                <Box sx={{ flex: '1 1 calc(25% - 15px)', minWidth: 280 }}>
                    <ActivityCard
                        title="Recent Student Admissions"
                        icon={<SchoolIcon />}
                        color="primary"
                        isLoading={isLoading}
                    >
                        {data?.recentAdmissions?.length ? (
                            <List disablePadding>
                                {data.recentAdmissions.map((admission, index) => (
                                    <Box key={`admission-${admission.id ?? index}`}>
                                        <Box sx={{ py: 1.5 }}>
                                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
                                                {format(new Date(admission.createdAt), 'MMM dd, h:mm a')}
                                            </Typography>
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light', fontSize: 12 }}>
                                                    {admission.name.charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {admission.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Class {admission.className}-{admission.section}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Box>
                                        {index < data.recentAdmissions.length - 1 && <Divider />}
                                    </Box>
                                ))}
                            </List>
                        ) : (
                            <EmptyState message="No recent admissions" />
                        )}
                    </ActivityCard>
                </Box>

                {/* Recent Fee Collections */}
                <Box sx={{ flex: '1 1 calc(25% - 15px)', minWidth: 280 }}>
                    <ActivityCard
                        title="Recent Fee Collections"
                        icon={<MoneyIcon />}
                        color="success"
                        isLoading={isLoading}
                    >
                        {data?.recentFees?.length ? (
                            <List disablePadding>
                                {data.recentFees.map((fee, index) => (
                                    <Box key={`fee-${fee.id}`}>
                                        <Box sx={{ py: 1.5 }}>
                                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
                                                {format(new Date(fee.date), 'MMM dd, yyyy • h:mm a')}
                                            </Typography>
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <Avatar sx={{ width: 28, height: 28, bgcolor: 'success.light', fontSize: 12 }}>
                                                    ₹
                                                </Avatar>
                                                <Box sx={{ flex: 1 }}>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {fee.student.name}
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={600} color="success.main">
                                                            ₹{fee.amount.toLocaleString()}
                                                        </Typography>
                                                    </Stack>
                                                    <Chip label={fee.paymentMode} size="small" variant="outlined" sx={{ height: 18, fontSize: 9, mt: 0.5 }} />
                                                </Box>
                                            </Stack>
                                        </Box>
                                        {index < data.recentFees.length - 1 && <Divider />}
                                    </Box>
                                ))}
                            </List>
                        ) : (
                            <EmptyState message="No recent fee collections" />
                        )}
                    </ActivityCard>
                </Box>

                {/* Recent Demand Bills */}
                <Box sx={{ flex: '1 1 calc(25% - 15px)', minWidth: 280 }}>
                    <ActivityCard
                        title="Recent Demand Bills"
                        icon={<ReceiptIcon />}
                        color="warning"
                        isLoading={isLoading}
                    >
                        {data?.recentDemandBills?.length ? (
                            <List disablePadding>
                                {data.recentDemandBills.map((bill, index) => (
                                    <Box key={`bill-${bill.id}`}>
                                        <Box sx={{ py: 1.5 }}>
                                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
                                                Period: {format(new Date(bill.year, bill.month - 1), 'MMMM yyyy')}
                                            </Typography>
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <Avatar sx={{ width: 28, height: 28, bgcolor: 'warning.light', fontSize: 10 }}>
                                                    📄
                                                </Avatar>
                                                <Box sx={{ flex: 1 }}>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {bill.student.name}
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={600} color="warning.main">
                                                            ₹{bill.totalAmount.toLocaleString()}
                                                        </Typography>
                                                    </Stack>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Bill #{bill.billNo}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Box>
                                        {index < data.recentDemandBills.length - 1 && <Divider />}
                                    </Box>
                                ))}
                            </List>
                        ) : (
                            <EmptyState message="No recent demand bills" />
                        )}
                    </ActivityCard>
                </Box>

                {/* Upcoming Exams */}
                <Box sx={{ flex: '1 1 calc(25% - 15px)', minWidth: 280 }}>
                    <ActivityCard
                        title="Upcoming Exams"
                        icon={<EventIcon />}
                        color="error"
                        isLoading={isLoading}
                    >
                        {data?.upcomingExams?.length ? (
                            <List disablePadding>
                                {data.upcomingExams.map((exam, index) => (
                                    <Box key={`exam-${exam.id}`}>
                                        <Box sx={{ py: 1.5 }}>
                                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
                                                {format(new Date(exam.startDate), 'MMM dd')} - {format(new Date(exam.endDate), 'MMM dd, yyyy')}
                                            </Typography>
                                            <Stack direction="row" spacing={1.5} alignItems="center">
                                                <Avatar sx={{ width: 28, height: 28, bgcolor: 'error.light', fontSize: 10 }}>
                                                    📝
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {exam.name}
                                                    </Typography>
                                                    <Chip label={exam.examType?.name || 'Exam'} size="small" color="error" variant="outlined" sx={{ height: 18, fontSize: 9, mt: 0.5 }} />
                                                </Box>
                                            </Stack>
                                        </Box>
                                        {index < data.upcomingExams.length - 1 && <Divider />}
                                    </Box>
                                ))}
                            </List>
                        ) : (
                            <EmptyState message="No upcoming exams" />
                        )}
                    </ActivityCard>
                </Box>
            </Box>
        </Box>
    );
}

// Activity Card Component
interface ActivityCardProps {
    title: string;
    icon: React.ReactNode;
    color: 'primary' | 'success' | 'warning' | 'error';
    isLoading: boolean;
    children: React.ReactNode;
}

function ActivityCard({ title, icon, color, isLoading, children }: ActivityCardProps) {
    return (
        <Card
            elevation={0}
            variant="outlined"
            sx={{
                borderRadius: 3,
                transition: 'all 0.2s',
                '&:hover': {
                    borderColor: `${color}.main`,
                    boxShadow: 1,
                },
            }}
        >
            <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: `${color}.light`, color: `${color}.main` }}>
                        {icon}
                    </Avatar>
                    <Typography variant="subtitle1" fontWeight={600}>
                        {title}
                    </Typography>
                </Stack>
                <Divider sx={{ mb: 1 }} />
                <Box sx={{ flex: 1 }}>
                    {isLoading ? (
                        <Box>
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} variant="text" height={50} sx={{ mb: 1 }} />
                            ))}
                        </Box>
                    ) : (
                        children
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}

// Empty State Component
function EmptyState({ message }: { message: string }) {
    return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
                {message}
            </Typography>
        </Box>
    );
}

// Stat Card Component
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
