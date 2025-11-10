import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, FileText } from 'lucide-react';

export default function ExamsPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Exams Management</h1>
              <p className="text-sm text-gray-500">View and manage all exams</p>
            </div>
            <button
              onClick={() => {}}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Exam
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    </div>
  );
}
