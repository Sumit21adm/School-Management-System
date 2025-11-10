import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsListPage from './pages/StudentsListPage';
import StudentDetailPage from './pages/StudentDetailPage';
import StudentFormPage from './pages/StudentFormPage';
import StudentImportPage from './pages/StudentImportPage';
import GuardiansListPage from './pages/GuardiansListPage';
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
        
        {/* Students Routes */}
        <Route path="/students" element={<StudentsListPage />} />
        <Route path="/students/new" element={<StudentFormPage />} />
        <Route path="/students/import" element={<StudentImportPage />} />
        <Route path="/students/:id" element={<StudentDetailPage />} />
        <Route path="/students/:id/edit" element={<StudentFormPage />} />
        
        {/* Guardians Routes */}
        <Route path="/guardians" element={<GuardiansListPage />} />
        
        {/* Attendance Routes */}
        <Route path="/attendance/mark" element={<AttendanceMarkingPage />} />
        <Route path="/attendance/reports" element={<AttendanceReportsPage />} />
        
        {/* Announcements Route */}
        <Route path="/announcements" element={<AnnouncementsPage />} />
        
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

