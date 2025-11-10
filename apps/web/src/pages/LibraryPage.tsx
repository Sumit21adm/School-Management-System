import { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Download, ArrowLeft } from 'lucide-react';

interface Book {
  id: string;
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  category?: string;
  totalCopies: number;
  available: number;
  location?: string;
}

interface Issue {
  id: string;
  book: Book;
  student: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: string;
  fineAmount: number;
  finePaid: boolean;
}

export default function LibraryPage() {
  const [view, setView] = useState<'books' | 'issues'>('books');
  const [books, setBooks] = useState<Book[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE = 'http://localhost:3001/api/v1';
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (view === 'books') {
      fetchBooks();
    } else {
      fetchIssues();
    }
  }, [view]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/library/books?search=${searchTerm}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setBooks(data);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
    setLoading(false);
  };

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/library/issues`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setIssues(data);
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
    setLoading(false);
  };

  const handleReturnBook = async (issueId: string) => {
    try {
      await fetch(`${API_BASE}/library/issues/${issueId}/return`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchIssues();
    } catch (error) {
      console.error('Error returning book:', error);
    }
  };

  const handleExport = async () => {
    const endpoint = view === 'books' ? 'books' : 'issues';
    try {
      const response = await fetch(`${API_BASE}/library/export/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `library-${endpoint}.csv`;
      a.click();
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.history.back()}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-semibold text-gray-800">Library Management</h1>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setView('books')}
              className={`px-6 py-3 font-medium ${
                view === 'books'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Books Catalog
            </button>
            <button
              onClick={() => setView('issues')}
              className={`px-6 py-3 font-medium ${
                view === 'issues'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Issue/Return
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={view === 'books' ? 'Search books by title, author, or ISBN...' : 'Search issues...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && view === 'books' && fetchBooks()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => alert('Add new book form would open here')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add {view === 'books' ? 'Book' : 'Issue'}</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : view === 'books' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ISBN</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {books.map((book) => (
                      <tr key={book.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{book.isbn || '-'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{book.title}</td>
                        <td className="px-4 py-3 text-sm">{book.author}</td>
                        <td className="px-4 py-3 text-sm">{book.category || '-'}</td>
                        <td className="px-4 py-3 text-sm">{book.totalCopies}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            book.available > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {book.available}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{book.location || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {books.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No books found</div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fine</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {issues.map((issue) => (
                      <tr key={issue.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{issue.book.title}</td>
                        <td className="px-4 py-3 text-sm">
                          {issue.student.user.firstName} {issue.student.user.lastName}
                        </td>
                        <td className="px-4 py-3 text-sm">{new Date(issue.issueDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm">{new Date(issue.dueDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            issue.status === 'returned' ? 'bg-green-100 text-green-800' :
                            issue.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {issue.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {issue.fineAmount > 0 ? `$${issue.fineAmount}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {issue.status === 'issued' && (
                            <button
                              onClick={() => handleReturnBook(issue.id)}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              Return
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {issues.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No issues found</div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
