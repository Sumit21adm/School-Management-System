import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { getInputClass } from '../../styles/formStyles';

export default function MarksEntryPage() {
  const navigate = useNavigate();
  const { examPaperId } = useParams();
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Enter Marks</h1>
                <p className="text-sm text-gray-500">Enter marks for students</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Marks'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                          className={`w-24 ${getInputClass()}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={marks[student.id]?.grade || ''}
                          onChange={(e) => handleGradeChange(student.id, e.target.value)}
                          className={`w-20 ${getInputClass()}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={marks[student.id]?.remarks || ''}
                          onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                          className={getInputClass()}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        )}
      </div>
    </div>
  );
}
