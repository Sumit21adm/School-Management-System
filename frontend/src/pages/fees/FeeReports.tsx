import { useState } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { classService } from '../../lib/api';
import { useSession } from '../../contexts/SessionContext';
import DailyCollectionReport from '../../components/fees/DailyCollectionReport';
import ClassOutstandingReport from '../../components/fees/ClassOutstandingReport';
import BillHistoryReport from '../../components/fees/BillHistoryReport';
import FeeTypeAnalysis from '../../components/fees/FeeTypeAnalysis';

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

export default function FeeReports() {
  const { selectedSession } = useSession();
  const [activeTab, setActiveTab] = useState(0);

  const { data: classes = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: classService.getAll,
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (isLoadingClasses || !selectedSession) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rectangular" height={400} sx={{ mt: 2, borderRadius: 2 }} />
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
          Session: {selectedSession.name}
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
              sessionId={selectedSession.id}
              classes={classes}
            />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <ClassOutstandingReport sessionId={selectedSession.id} />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <BillHistoryReport sessionId={selectedSession.id} />
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            <FeeTypeAnalysis
              sessionId={selectedSession.id}
              classes={classes}
            />
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
}
