'use client';

import { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Tabs,
    Tab,
    Skeleton,
} from '@mui/material';
import {
    Receipt,
    AccountBalance,
    History,
    PieChart,
} from '@mui/icons-material';
import DailyCollectionReport from '@/components/fees/DailyCollectionReport';
import ClassOutstandingReport from '@/components/fees/ClassOutstandingReport';
import BillHistoryReport from '@/components/fees/BillHistoryReport';
import FeeTypeAnalysis from '@/components/fees/FeeTypeAnalysis';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`report-tabpanel-${index}`}
            aria-labelledby={`report-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `report-tab-${index}`,
        'aria-controls': `report-tabpanel-${index}`,
    };
}

interface Session {
    id: number;
    name: string;
    isActive: boolean;
}

interface ClassItem {
    id: number;
    name: string;
    displayName?: string;
}

export default function FeeReports() {
    const [activeTab, setActiveTab] = useState(0);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [activeSession, setActiveSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch sessions
                const sessionsRes = await fetch('/api/sessions');
                if (sessionsRes.ok) {
                    const sessionsData = await sessionsRes.json();
                    setSessions(sessionsData);
                    const active = sessionsData.find((s: Session) => s.isActive);
                    setActiveSession(active || sessionsData[0]);
                }

                // Fetch classes
                const classesRes = await fetch('/api/classes');
                if (classesRes.ok) {
                    const classesData = await classesRes.json();
                    setClasses(classesData);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    if (isLoading) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                <Skeleton variant="text" width={200} height={40} />
                <Skeleton variant="rectangular" height={400} sx={{ mt: 2, borderRadius: 2 }} />
            </Container>
        );
    }

    if (!activeSession) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                        No active session found. Please create a session first.
                    </Typography>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" fontWeight={600}>
                    Fee Reports
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Session: {activeSession.name}
                </Typography>
            </Box>

            <Paper sx={{ borderRadius: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            '& .MuiTab-root': {
                                minHeight: 64,
                                textTransform: 'none',
                                fontSize: '0.95rem',
                            }
                        }}
                    >
                        <Tab
                            icon={<Receipt />}
                            iconPosition="start"
                            label="Daily Collection"
                            {...a11yProps(0)}
                        />
                        <Tab
                            icon={<AccountBalance />}
                            iconPosition="start"
                            label="Outstanding Dues"
                            {...a11yProps(1)}
                        />
                        <Tab
                            icon={<History />}
                            iconPosition="start"
                            label="Bill History"
                            {...a11yProps(2)}
                        />
                        <Tab
                            icon={<PieChart />}
                            iconPosition="start"
                            label="Fee Analysis"
                            {...a11yProps(3)}
                        />
                    </Tabs>
                </Box>

                <Box sx={{ p: 3 }}>
                    <TabPanel value={activeTab} index={0}>
                        <DailyCollectionReport
                            sessionId={activeSession.id}
                            classes={classes}
                        />
                    </TabPanel>
                    <TabPanel value={activeTab} index={1}>
                        <ClassOutstandingReport sessionId={activeSession.id} />
                    </TabPanel>
                    <TabPanel value={activeTab} index={2}>
                        <BillHistoryReport sessionId={activeSession.id} />
                    </TabPanel>
                    <TabPanel value={activeTab} index={3}>
                        <FeeTypeAnalysis
                            sessionId={activeSession.id}
                            classes={classes}
                        />
                    </TabPanel>
                </Box>
            </Paper>
        </Container>
    );
}
