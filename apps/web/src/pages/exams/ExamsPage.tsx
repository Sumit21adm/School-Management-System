import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Calendar,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  Home,
  GraduationCap,
  ClipboardList,
  Bell,
  Plus,
  Edit,
} from 'lucide-react';

export default function ExamsPage() {
  const navigate = useNavigate();
  const [sidebarOpen] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const modules = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Students', icon: GraduationCap, path: '/students' },
    { name: 'Teachers', icon: Users, path: '/teachers' },
    { name: 'Attendance', icon: ClipboardList, path: '/attendance/mark' },
    { name: 'Announcements', icon: Bell, path: '/announcements' },
    { name: 'Classes', icon: BookOpen, path: '/classes' },
    { name: 'Exams', icon: FileText, path: '/exams', active: true },
    { name: 'Fees', icon: DollarSign, path: '/fees' },
    { name: 'Calendar', icon: Calendar, path: '/calendar' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/v1/exams', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setExams(data);
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-md transition-all duration-300`}>
        <div className="p-4 border-b">
          <h1 className={`font-bold text-xl text-blue-600 ${!sidebarOpen && 'text-center'}`}>
            {sidebarOpen ? 'SMS' : 'S'}
          </h1>
        </div>
        <nav className="p-4 space-y-2">
          {modules.map((module) => (
            <button
              key={module.name}
              onClick={() => navigate(module.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                module.active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <module.icon className="w-5 h-5" />
              {sidebarOpen && <span>{module.name}</span>}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Exams Management</h1>
              <p className="text-gray-600 mt-2">Create and manage exam schedules</p>
            </div>
            <button
              onClick={() => navigate('/exams/new')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Exam
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading exams...</p>
            </div>
          ) : exams.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Exams Yet</h3>
              <p className="text-gray-500 mb-6">Get started by creating your first exam</p>
              <button
                onClick={() => navigate('/exams/new')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Exam
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {exams.map((exam) => (
                <div key={exam.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800">{exam.name}</h3>
                      <p className="text-gray-600 mt-1">{exam.term}</p>
                      <div className="mt-3 flex gap-4 text-sm text-gray-500">
                        <span>Academic Year: {exam.academicYear?.name}</span>
                        {exam.startDate && (
                          <span>Start: {new Date(exam.startDate).toLocaleDateString()}</span>
                        )}
                        {exam.endDate && (
                          <span>End: {new Date(exam.endDate).toLocaleDateString()}</span>
                        )}
                        <span className="text-blue-600">{exam._count?.papers || 0} Papers</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/exams/${exam.id}/papers`)}
                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        View Papers
                      </button>
                      <button
                        onClick={() => navigate(`/exams/${exam.id}/edit`)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
