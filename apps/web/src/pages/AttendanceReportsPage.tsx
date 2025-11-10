import { useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { getInputClass, getSelectClass } from '../styles/formStyles';

export default function AttendanceReportsPage() {
  const [reportType, setReportType] = useState<'section' | 'student' | 'class'>('section');
  const [sectionId, setSectionId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [classId, setClassId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      let url = 'http://localhost:3001/api/v1/attendance/reports';
      const params = new URLSearchParams({
        type: reportType,
        fromDate,
        toDate,
      });
      
      if (reportType === 'section' && sectionId) params.append('sectionId', sectionId);
      if (reportType === 'student' && studentId) params.append('studentId', studentId);
      if (reportType === 'class' && classId) params.append('classId', classId);
      
      const response = await fetch(`${url}?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        alert('Failed to generate report');
        setReportData(null);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
            <p className="text-sm text-gray-500">View detailed attendance statistics and reports</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className={getSelectClass()}
              >
                <option value="section">By Section</option>
                <option value="student">By Student</option>
                <option value="class">By Class</option>
              </select>
            </div>

            {reportType === 'section' && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Section
                </label>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className={getSelectClass()}
                >
                  <option value="">Select Section</option>
                  <option value="1">Class 1-A</option>
                  <option value="2">Class 1-B</option>
                </select>
              </div>
            )}

            {reportType === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Student
                </label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className={getSelectClass()}
                >
                  <option value="">Select Student</option>
                  <option value="1">John Doe (ADM001)</option>
                  <option value="2">Jane Smith (ADM002)</option>
                </select>
              </div>
            )}

            {reportType === 'class' && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Class
                </label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className={getSelectClass()}
                >
                  <option value="">Select Class</option>
                  <option value="1">Class 1</option>
                  <option value="2">Class 2</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className={getInputClass()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={getInputClass()}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              <span>{loading ? 'Generating...' : 'Generate Report'}</span>
            </button>
          </div>
        </div>

        {reportData && reportType === 'section' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{reportData.sectionName}</h2>
                <p className="text-sm text-gray-600">Total Days: {reportData.totalDays}</p>
              </div>
              <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                <Download className="w-4 h-4 mr-2" />
                <span>Export</span>
              </button>
            </div>

            <div className="overflow-x-auto">
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
                      Present
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Absent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leave
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.students.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.student.admissionNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.student.user.firstName} {item.student.user.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                        {item.present}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                        {item.absent}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-semibold">
                        {item.leave}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {item.attendancePercentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportData && reportType === 'student' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {reportData.student.user.firstName} {reportData.student.user.lastName}
                </h2>
                <p className="text-sm text-gray-600">
                  {reportData.student.section.class.name} {reportData.student.section.name}
                </p>
              </div>
              <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                <Download className="w-4 h-4 mr-2" />
                <span>Export</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Days</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.stats.total}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Present</p>
                <p className="text-2xl font-bold text-green-600">{reportData.stats.present}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Absent</p>
                <p className="text-2xl font-bold text-red-600">{reportData.stats.absent}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Attendance %</p>
                <p className="text-2xl font-bold text-blue-600">{reportData.stats.attendancePercentage}%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
