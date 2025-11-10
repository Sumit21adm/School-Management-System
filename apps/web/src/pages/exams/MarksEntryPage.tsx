import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Save,
  ArrowLeft,
} from 'lucide-react';

export default function MarksEntryPage() {
  const navigate = useNavigate();
  const { examPaperId } = useParams();
  const [sidebarOpen] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    fetchMarks();
  }, [examPaperId]);

  const fetchMarks = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch existing marks
      const response = await fetch(`http://localhost:3001/api/v1/exams/papers/${examPaperId}/marks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const marksMap: Record<string, any> = {};
        data.forEach((mark: any) => {
          marksMap[mark.studentId] = {
            marks: mark.marks,
            grade: mark.grade,
            remarks: mark.remarks,
          };
        });
        setMarks(marksMap);
        
        if (data.length > 0) {
          setStudents(data.map((m: any) => m.student));
        }
      }
    } catch (error) {
      console.error('Failed to fetch marks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarksChange = (studentId: string, value: string) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marks: value ? parseFloat(value) : 0,
      },
    }));
  };

  const handleGradeChange = (studentId: string, value: string) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        grade: value,
      },
    }));
  };

  const handleRemarksChange = (studentId: string, value: string) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const marksArray = Object.entries(marks).map(([studentId, data]) => ({
        studentId,
        marks: data.marks || 0,
        grade: data.grade,
        remarks: data.remarks,
      }));

      const response = await fetch('http://localhost:3001/api/v1/exams/marks/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          examPaperId,
          marks: marksArray,
        }),
      });

      if (response.ok) {
        alert('Marks saved successfully!');
        navigate(-1);
      } else {
        alert('Failed to save marks');
      }
    } catch (error) {
      console.error('Failed to save marks:', error);
      alert('Failed to save marks');
    } finally {
      setSaving(false);
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
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Enter Marks</h1>
                <p className="text-gray-600 mt-2">Enter marks for students</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Marks'}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Student Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Admission No</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Marks</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Grade</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {student.user.firstName} {student.user.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.admissionNo}</td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={marks[student.id]?.marks || ''}
                          onChange={(e) => handleMarksChange(student.id, e.target.value)}
                          className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={marks[student.id]?.grade || ''}
                          onChange={(e) => handleGradeChange(student.id, e.target.value)}
                          className="w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={marks[student.id]?.remarks || ''}
                          onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
