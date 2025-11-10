import { useState } from 'react';
import { Link } from 'react-router-dom';
import { studentsService } from '../services/students.service';
import type { ImportStudentRow, ImportResult } from '../types';
import { ArrowLeft, Upload, Download, CheckCircle, XCircle } from 'lucide-react';

export default function StudentImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [defaultPassword, setDefaultPassword] = useState('Student@123');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const parseCSV = (text: string): ImportStudentRow[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map((h) => h.trim());

    return lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || undefined;
      });
      return row as ImportStudentRow;
    });
  };

  const handleImport = async () => {
    if (!file) {
      alert('Please select a file');
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      const students = parseCSV(text);

      const importResult = await studentsService.importStudents({
        students,
        defaultPassword,
      });

      setResult(importResult);
    } catch (error: any) {
      console.error('Import failed:', error);
      alert(error.response?.data?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `admissionNo,firstName,lastName,email,phone,dob,gender,bloodGroup,address,className,sectionName
STU001,John,Doe,john.doe@example.com,1234567890,2010-05-15,male,A+,123 Main St,Grade 1,A
STU002,Jane,Smith,jane.smith@example.com,9876543210,2010-08-20,female,B+,456 Oak Ave,Grade 1,B`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link
            to="/students"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Import Students</h1>
            <p className="text-gray-600">Upload a CSV file to bulk import students</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Instructions</h3>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li>Download the template CSV file below</li>
            <li>Fill in your student data following the format</li>
            <li>Required fields: admissionNo, firstName, lastName, email</li>
            <li>Optional fields: phone, dob, gender, bloodGroup, address, className, sectionName</li>
            <li>Upload the completed CSV file</li>
          </ul>
          <button
            onClick={downloadTemplate}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </button>
        </div>

        {/* Upload Form */}
        {!result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload CSV File</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {file && <p className="mt-2 text-sm text-gray-600">Selected: {file.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={defaultPassword}
                  onChange={(e) => setDefaultPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter default password for all students"
                />
                <p className="mt-1 text-sm text-gray-500">
                  All imported students will be assigned this password
                </p>
              </div>

              <button
                onClick={handleImport}
                disabled={!file || loading}
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Upload className="w-5 h-5 mr-2" />
                {loading ? 'Importing...' : 'Import Students'}
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Import Results</h2>

            <div className="mb-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">{result.success.length} Successful</span>
                </div>
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  <span className="font-semibold">{result.errors.length} Failed</span>
                </div>
              </div>
            </div>

            {/* Successful Imports */}
            {result.success.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Successfully Imported</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Admission No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.success.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.admissionNo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.email}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Failed Imports */}
            {result.errors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Failed Imports</h3>
                <div className="border border-red-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-red-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Admission No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.errors.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.admissionNo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.email}
                          </td>
                          <td className="px-6 py-4 text-sm text-red-600">{item.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Import More
              </button>
              <Link
                to="/students"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Go to Students
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
