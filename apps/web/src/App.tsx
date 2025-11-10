import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import LibraryPage from './pages/LibraryPage';
import TransportPage from './pages/TransportPage';
import HostelPage from './pages/HostelPage';
import StudentsListPage from './pages/StudentsListPage';
import StudentDetailPage from './pages/StudentDetailPage';
import StudentFormPage from './pages/StudentFormPage';
import StudentImportPage from './pages/StudentImportPage';
import GuardiansListPage from './pages/GuardiansListPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import AttendanceMarkingPage from './pages/AttendanceMarkingPage';
import AttendanceReportsPage from './pages/AttendanceReportsPage';
import ExamsPage from './pages/exams/ExamsPage';
import MarksEntryPage from './pages/exams/MarksEntryPage';
import PromotionsPage from './pages/exams/PromotionsPage';
import FeesPage from './pages/fees/FeesPage';
import ClassesPage from './pages/ClassesPage';
import TeachersPage from './pages/TeachersPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<MainLayout><DashboardPage /></MainLayout>} />
        
        {/* Students Routes */}
        <Route path="/students" element={<MainLayout><StudentsListPage /></MainLayout>} />
        <Route path="/students/new" element={<MainLayout><StudentFormPage /></MainLayout>} />
        <Route path="/students/import" element={<MainLayout><StudentImportPage /></MainLayout>} />
        <Route path="/students/:id" element={<MainLayout><StudentDetailPage /></MainLayout>} />
        <Route path="/students/:id/edit" element={<MainLayout><StudentFormPage /></MainLayout>} />
        
        {/* Guardians Routes */}
        <Route path="/guardians" element={<MainLayout><GuardiansListPage /></MainLayout>} />
        
        {/* Announcements Routes */}
        <Route path="/announcements" element={<MainLayout><AnnouncementsPage /></MainLayout>} />
        
        {/* Attendance Routes */}
        <Route path="/attendance/mark" element={<MainLayout><AttendanceMarkingPage /></MainLayout>} />
        <Route path="/attendance/reports" element={<MainLayout><AttendanceReportsPage /></MainLayout>} />
        
        {/* Exams Routes */}
        <Route path="/exams" element={<MainLayout><ExamsPage /></MainLayout>} />
        <Route path="/exams/marks" element={<MainLayout><MarksEntryPage /></MainLayout>} />
        <Route path="/promotions" element={<MainLayout><PromotionsPage /></MainLayout>} />
        
        {/* Fees Routes */}
        <Route path="/fees" element={<MainLayout><FeesPage /></MainLayout>} />
        
        {/* Classes Routes */}
        <Route path="/classes" element={<MainLayout><ClassesPage /></MainLayout>} />
        
        {/* Teachers Routes */}
        <Route path="/teachers" element={<MainLayout><TeachersPage /></MainLayout>} />
        
        {/* Calendar Routes */}
        <Route path="/calendar" element={<MainLayout><CalendarPage /></MainLayout>} />
        
        {/* Settings Routes */}
        <Route path="/settings" element={<MainLayout><SettingsPage /></MainLayout>} />
        
        {/* Other Routes */}
        <Route path="/reports" element={<MainLayout><ReportsPage /></MainLayout>} />
        <Route path="/library" element={<MainLayout><LibraryPage /></MainLayout>} />
        <Route path="/transport" element={<MainLayout><TransportPage /></MainLayout>} />
        <Route path="/hostel" element={<MainLayout><HostelPage /></MainLayout>} />
        
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
