import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdmissionList from './pages/admissions/AdmissionList';
import AdmissionForm from './pages/admissions/AdmissionForm';
import FeeCollection from './pages/fees/FeeCollection';
import FeeReports from './pages/fees/FeeReports';
import ExamManagement from './pages/exams/ExamManagement';
import MarksEntry from './pages/exams/MarksEntry';
import TransportManagement from './pages/transport/TransportManagement';
import { processSyncQueue } from './lib/db';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('authToken');
  });

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

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Login onLogin={() => setIsAuthenticated(true)} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout onLogout={() => setIsAuthenticated(false)}>
        <Routes>
          <Route path="/" element={<Dashboard />} />

          {/* Admission Routes */}
          <Route path="/admissions" element={<AdmissionList />} />
          <Route path="/admissions/new" element={<AdmissionForm />} />
          <Route path="/admissions/:id/edit" element={<AdmissionForm />} />

          {/* Fee Routes */}
          <Route path="/fees/collection" element={<FeeCollection />} />
          <Route path="/fees/reports" element={<FeeReports />} />

          {/* Exam Routes */}
          <Route path="/exams" element={<ExamManagement />} />
          <Route path="/exams/:id/marks" element={<MarksEntry />} />

          {/* Transport Routes */}
          <Route path="/transport" element={<TransportManagement />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
