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
  ArrowUp,
  Eye,
} from 'lucide-react';

export default function PromotionsPage() {
  const navigate = useNavigate();
  const [sidebarOpen] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    fromClassId: '',
    toClassId: '',
    academicYearId: '',
    examId: '',
    minPercentage: 0,
  });
  const [preview, setPreview] = useState<any>(null);
  const [promoting, setPromoting] = useState(false);

  const modules = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Students', icon: GraduationCap, path: '/students' },
    { name: 'Teachers', icon: Users, path: '/teachers' },
    { name: 'Attendance', icon: ClipboardList, path: '/attendance/mark' },
    { name: 'Announcements', icon: Bell, path: '/announcements' },
    { name: 'Classes', icon: BookOpen, path: '/classes' },
    { name: 'Exams', icon: FileText, path: '/exams' },
    { name: 'Promotions', icon: ArrowUp, path: '/promotions', active: true },
    { name: 'Fees', icon: DollarSign, path: '/fees' },
    { name: 'Calendar', icon: Calendar, path: '/calendar' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch classes, exams, academic years
      const [classesRes, examsRes] = await Promise.all([
        fetch('http://localhost:3001/api/v1/classes', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:3001/api/v1/exams', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (classesRes.ok) setClasses(await classesRes.json());
      if (examsRes.ok) setExams(await examsRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handlePreview = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/v1/promotions/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setPreview(data);
      }
    } catch (error) {
      console.error('Failed to fetch preview:', error);
    }
  };

  const handlePromote = async () => {
    if (!confirm('Are you sure you want to promote these students?')) return;

    setPromoting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/v1/promotions/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully promoted ${result.promoted} students!`);
        setPreview(null);
        setFormData({
          fromClassId: '',
          toClassId: '',
          academicYearId: '',
          examId: '',
          minPercentage: 0,
        });
      } else {
        alert('Failed to promote students');
      }
    } catch (error) {
      console.error('Failed to promote students:', error);
      alert('Failed to promote students');
    } finally {
      setPromoting(false);
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Student Promotions</h1>
            <p className="text-gray-600 mt-2">Promote students to the next class</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Promotion Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Promotion Criteria</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Class</label>
                  <select
                    value={formData.fromClassId}
                    onChange={(e) => setFormData({ ...formData, fromClassId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Class</label>
                  <select
                    value={formData.toClassId}
                    onChange={(e) => setFormData({ ...formData, toClassId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Based on Exam (Optional)</label>
                  <select
                    value={formData.examId}
                    onChange={(e) => setFormData({ ...formData, examId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Students</option>
                    {exams.map((exam) => (
                      <option key={exam.id} value={exam.id}>{exam.name}</option>
                    ))}
                  </select>
                </div>

                {formData.examId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Percentage</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.minPercentage}
                      onChange={(e) => setFormData({ ...formData, minPercentage: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                <button
                  onClick={handlePreview}
                  disabled={!formData.fromClassId || !formData.toClassId}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  <Eye className="w-5 h-5" />
                  Preview Students
                </button>
              </div>
            </div>

            {/* Preview */}
            {preview && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Preview</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Total Students</p>
                      <p className="text-2xl font-bold text-gray-800">{preview.totalStudents}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Eligible for Promotion</p>
                      <p className="text-2xl font-bold text-green-600">{preview.eligibleForPromotion}</p>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    <h3 className="font-medium text-gray-700 mb-2">Eligible Students:</h3>
                    <div className="space-y-2">
                      {preview.students.map((student: any) => (
                        <div key={student.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-800">{student.name}</span>
                          <span className="text-xs text-gray-600">{student.admissionNo}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handlePromote}
                    disabled={promoting}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                  >
                    <ArrowUp className="w-5 h-5" />
                    {promoting ? 'Promoting...' : 'Promote Students'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
