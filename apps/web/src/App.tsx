import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AttendanceMarkingPage from './pages/AttendanceMarkingPage';
import AttendanceReportsPage from './pages/AttendanceReportsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/attendance/mark" element={<AttendanceMarkingPage />} />
        <Route path="/attendance/reports" element={<AttendanceReportsPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

