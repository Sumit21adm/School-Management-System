import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDown, FileSpreadsheet, FileText, Filter } from 'lucide-react';
import api from '../lib/api';

interface ReportFilters {
  type: string;
  format: string;
  startDate?: string;
  endDate?: string;
  classId?: string;
  sectionId?: string;
  status?: string;
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<ReportFilters>({
    type: 'students',
    format: 'csv',
  });

  const reportTypes = [
    { value: 'students', label: 'Students Report', icon: FileText },
    { value: 'attendance', label: 'Attendance Report', icon: FileSpreadsheet },
    { value: 'fees', label: 'Fees Report', icon: FileText },
    { value: 'exams', label: 'Exams Report', icon: FileSpreadsheet },
    { value: 'staff', label: 'Staff Report', icon: FileText },
  ];

  const handleGenerateReport = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/reports/generate', filters, {
        responseType: 'blob',
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${filters.type}-report.${filters.format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Report Builder</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <Filter className="w-5 h-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Report Configuration</h2>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Report Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reportTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => setFilters({ ...filters, type: type.value })}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      filters.type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-2 text-blue-600" />
                    <div className="font-medium text-gray-900">{type.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Export Format */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setFilters({ ...filters, format: 'csv' })}
                className={`flex items-center px-4 py-2 border-2 rounded-lg transition-all ${
                  filters.format === 'csv'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 mr-2" />
                CSV
              </button>
              <button
                onClick={() => setFilters({ ...filters, format: 'pdf' })}
                className={`flex items-center px-4 py-2 border-2 rounded-lg transition-all ${
                  filters.format === 'pdf'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <FileText className="w-5 h-5 mr-2" />
                PDF
              </button>
            </div>
          </div>

          {/* Date Range Filters (for attendance, fees, exams) */}
          {['attendance', 'fees', 'exams'].includes(filters.type) && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Status Filter (for students, fees, staff) */}
          {['students', 'fees', 'staff'].includes(filters.type) && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Filter (Optional)
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                {filters.type === 'fees' && (
                  <>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="overdue">Overdue</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-end">
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              <FileDown className="w-5 h-5 mr-2" />
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">About Reports</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• CSV format is best for importing data into spreadsheet applications</li>
            <li>• PDF format provides a professional, printable document</li>
            <li>• Use date filters to generate reports for specific time periods</li>
            <li>• All reports respect your tenant's data isolation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
