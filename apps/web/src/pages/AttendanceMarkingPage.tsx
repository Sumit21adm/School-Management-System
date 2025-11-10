import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';
import { getInputClass, getSelectClass } from '../styles/formStyles';

interface Student {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
  admissionNo: string;
}

export default function AttendanceMarkingPage() {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sectionId, setSectionId] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch sections from API
    const fetchSections = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/v1/sections', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setSections(data);
        }
      } catch (error) {
        console.error('Failed to fetch sections:', error);
        setSections([]);
      }
    };
    
    fetchSections();
  }, []);

  useEffect(() => {
    if (sectionId) {
      setLoading(true);
      // Fetch students from API
      const fetchStudents = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:3001/api/v1/sections/${sectionId}/students`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setStudents(data);
            // Initialize all as present
            const initialAttendance: Record<string, string> = {};
            data.forEach((s: Student) => { initialAttendance[s.id] = 'P'; });
            setAttendance(initialAttendance);
          }
        } catch (error) {
          console.error('Failed to fetch students:', error);
          setStudents([]);
        } finally {
          setLoading(false);
        }
      };
      
      fetchStudents();
    }
  }, [sectionId]);

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const entries = Object.entries(attendance).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/v1/attendance/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date, sectionId, entries }),
      });
      
      if (response.ok) {
        alert('Attendance saved successfully!');
        navigate('/dashboard');
      } else {
        alert('Failed to save attendance');
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const statusButtons = [
    { value: 'P', label: 'Present', icon: CheckCircle, color: 'bg-green-500' },
    { value: 'A', label: 'Absent', icon: XCircle, color: 'bg-red-500' },
    { value: 'L', label: 'Leave', icon: Calendar, color: 'bg-yellow-500' },
    { value: 'H', label: 'Holiday', icon: Clock, color: 'bg-blue-500' },
  ];

  const stats = {
    present: Object.values(attendance).filter(s => s === 'P').length,
    absent: Object.values(attendance).filter(s => s === 'A').length,
    leave: Object.values(attendance).filter(s => s === 'L').length,
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
            <p className="text-sm text-gray-500">Record daily student attendance</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={getInputClass()}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Section
                </label>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className={getSelectClass()}
                  required
                >
                  <option value="">Select Section</option>
                  {sections.map(section => (
                    <option key={section.id} value={section.id}>
                      {section.class.name} - {section.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {sectionId && (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Present</p>
                  <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Leave</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.leave}</p>
                </div>
              </div>
            )}
          </div>

          {loading && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">Loading students...</p>
            </div>
          )}

          {!loading && students.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admission No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map(student => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.admissionNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.user.firstName} {student.user.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {statusButtons.map(btn => (
                            <button
                              key={btn.value}
                              type="button"
                              onClick={() => handleStatusChange(student.id, btn.value)}
                              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-white text-sm ${
                                attendance[student.id] === btn.value
                                  ? btn.color
                                  : 'bg-gray-300 hover:bg-gray-400'
                              }`}
                              title={btn.label}
                            >
                              <btn.icon className="w-4 h-4" />
                              <span>{btn.value}</span>
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && students.length > 0 && (
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
