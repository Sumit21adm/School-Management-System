import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentsService } from '../services/students.service';
import type { Student } from '../types';
import { ArrowLeft, Edit, Download, UserPlus } from 'lucide-react';

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadStudent();
    }
  }, [id]);

  const loadStudent = async () => {
    try {
      setLoading(true);
      const data = await studentsService.getById(id!);
      setStudent(data);
    } catch (error) {
      console.error('Failed to load student:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkGuardian = async (guardianId: string) => {
    if (!confirm('Are you sure you want to unlink this guardian?')) return;

    try {
      await studentsService.unlinkGuardian(id!, guardianId);
      loadStudent();
    } catch (error) {
      console.error('Failed to unlink guardian:', error);
      alert('Failed to unlink guardian');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading student details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Student not found</p>
            <Link to="/students" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
              Back to Students
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/students"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {student.user.firstName} {student.user.lastName}
              </h1>
              <p className="text-gray-600">Admission No: {student.admissionNo}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => studentsService.downloadIdCard(student.id)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download className="w-4 h-4 mr-2" />
              ID Card
            </button>
            <Link
              to={`/students/${student.id}/edit`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </div>
        </div>

        {/* Student Information */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
              <p className="text-gray-900">{student.user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
              <p className="text-gray-900">{student.user.phone || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
              <p className="text-gray-900">
                {student.dob ? new Date(student.dob).toLocaleDateString() : '-'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Gender</label>
              <p className="text-gray-900 capitalize">{student.gender || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Blood Group</label>
              <p className="text-gray-900">{student.bloodGroup || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  student.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : student.status === 'inactive'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {student.status}
              </span>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
              <p className="text-gray-900">{student.address || '-'}</p>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Academic Information</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Class</label>
              <p className="text-gray-900">
                {student.section
                  ? `${student.section.class.name} - ${student.section.name}`
                  : 'Not assigned'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Admission Date
              </label>
              <p className="text-gray-900">
                {new Date(student.admissionDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Guardians */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Guardians</h2>
            <Link
              to={`/students/${student.id}/link-guardian`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Link Guardian
            </Link>
          </div>
          <div className="p-6">
            {!student.guardians || student.guardians.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No guardians linked</p>
            ) : (
              <div className="space-y-4">
                {student.guardians.map((sg) => (
                  <div
                    key={sg.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 font-semibold">
                          {sg.guardian?.user.firstName[0]}
                          {sg.guardian?.user.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {sg.guardian?.user.firstName} {sg.guardian?.user.lastName}
                          {sg.isPrimary && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Primary
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">{sg.relation}</p>
                        <p className="text-sm text-gray-500">{sg.guardian?.user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnlinkGuardian(sg.guardianId)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Unlink
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
