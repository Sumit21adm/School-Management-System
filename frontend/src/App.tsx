import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';
import CssBaseline from '@mui/material/CssBaseline';
import { getTheme } from './theme';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdmissionList from './pages/admissions/AdmissionList';
import AdmissionForm from './pages/admissions/AdmissionForm';
import FeeCollection from './pages/fees/FeeCollection';
import FeeReports from './pages/fees/FeeReports';

import EnhancedFeeCollection from './pages/fees/EnhancedFeeCollection';
import DemandBillGeneration from './pages/fees/DemandBillGeneration';
import FeeStructure from './pages/settings/FeeStructure';
import SessionsManagement from './pages/settings/SessionsManagement';
import SchoolSettings from './pages/settings/SchoolSettings';
import StudentDiscountsPage from './pages/students/StudentDiscountsPage';
import StudentPromotions from './pages/promotions/StudentPromotions';
import { processSyncQueue } from './lib/db';
import { SessionProvider } from './contexts/SessionContext';
import { ColorModeProvider, useColorMode } from './contexts/ThemeContext';

import ExamList from './pages/examination/ExamList';
import ExamDetails from './pages/examination/ExamDetails';
import ExamConfiguration from './pages/examination/ExamConfiguration';
import UserManagement from './pages/settings/UserManagement';
import ClassManagement from './pages/settings/ClassManagement';
import BackupRestore from './pages/settings/BackupRestore';
import SubjectList from './pages/subjects/SubjectList';

import VehicleList from './pages/transport/VehicleList';
import DriverList from './pages/transport/DriverList';
import RouteList from './pages/transport/RouteList';
import TransportAssignments from './pages/transport/TransportAssignments';
import TransportReports from './pages/transport/TransportReports';
import FareSlabs from './pages/transport/FareSlabs';

import StaffList from './pages/staff/StaffList';

import ClassDetails from './pages/Classes/ClassDetails';

function AppContent() {

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('authToken');
  });

  const { mode } = useColorMode();
  const theme = useMemo(() => getTheme(mode), [mode]);

  // Handle logout - clear all auth data and redirect
  const handleLogout = useCallback(() => {
    // Clear all auth-related localStorage items
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedSessionId');

    // Update authentication state
    setIsAuthenticated(false);

    // Replace current history entry to prevent back-button access
    window.history.replaceState(null, '', '/');
  }, []);

  useEffect(() => {
    // Setup sync interval for offline changes
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        processSyncQueue().catch(console.error);
      }
    }, 30000); // Sync every 30 seconds

    // Setup online/offline listeners
    const handleOnline = () => {
      console.log('Back online - syncing...');
      processSyncQueue().catch(console.error);
    };

    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <SessionProvider>
          <Routes>
            <Route path="/login" element={
              !isAuthenticated ? (
                <Login onLogin={() => setIsAuthenticated(true)} />
              ) : (
                <Navigate to="/" replace />
              )
            } />

            {/* Protected Routes */}
            <Route element={isAuthenticated ? <Layout onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
              <Route path="/" element={<Dashboard />} />

              {/* Admissions Routes */}
              <Route path="/admissions" element={<AdmissionList />} />
              <Route path="/admissions/new" element={<AdmissionForm />} />
              <Route path="/admissions/edit/:id" element={<AdmissionForm />} />

              {/* Fee Management Routes */}
              <Route path="/fees/collection" element={<FeeCollection />} />
              <Route path="/fees/reports" element={<FeeReports />} />
              <Route path="/fees/collection-enhanced" element={<EnhancedFeeCollection />} />
              <Route path="/fees/demand-bills" element={<DemandBillGeneration />} />

              {/* Examination Routes */}
              <Route path="/exams" element={<ExamList />} />
              <Route path="/exams/:id" element={<ExamDetails />} />
              <Route path="/examination/configuration" element={<ExamConfiguration />} />

              {/* Settings Routes */}
              <Route path="/settings/fee-structure" element={<FeeStructure />} />
              <Route path="/settings/sessions" element={<SessionsManagement />} />
              <Route path="/settings/print" element={<SchoolSettings />} />
              <Route path="/settings/users" element={<UserManagement />} />
              <Route path="/settings/classes" element={<ClassManagement />} />
              <Route path="/settings/backup" element={<BackupRestore />} />
              <Route path="/classes/:id" element={<ClassDetails />} />
              <Route path="/promotions" element={<StudentPromotions />} />
              <Route path="/settings/subjects" element={<SubjectList />} />

              {/* Student Routes */}
              <Route path="/students/:studentId/discounts" element={<StudentDiscountsPage />} />

              {/* Transport Routes */}
              <Route path="/transport/vehicles" element={<VehicleList />} />
              <Route path="/transport/drivers" element={<DriverList />} />
              <Route path="/transport/routes" element={<RouteList />} />
              <Route path="/transport/assignments" element={<TransportAssignments />} />
              <Route path="/transport/reports" element={<TransportReports />} />
              <Route path="/transport/fare-slabs" element={<FareSlabs />} />

              {/* Staff Routes */}
              <Route path="/staff" element={<StaffList />} />
            </Route>

            {/* Catch all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SessionProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <ColorModeProvider>
      <AppContent />
    </ColorModeProvider>
  );
}

export default App;

