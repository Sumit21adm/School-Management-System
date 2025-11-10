import api from '../lib/api';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  category: string;
  quantity: number;
  availableQuantity: number;
  price?: number;
  location?: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BookIssue {
  id: string;
  bookId: string;
  studentId: string;
  issuedDate: string;
  dueDate: string;
  returnedDate?: string;
  fine?: number;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE';
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateBookDto {
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  category: string;
  quantity: number;
  price?: number;
  location?: string;
  description?: string;
}

export interface IssueBookDto {
  bookId: string;
  studentId: string;
  issuedDate: string;
  dueDate: string;
  remarks?: string;
}

export const libraryService = {
  /**
   * Get all books
   */
  getBooks: async (query?: { category?: string; search?: string }): Promise<Book[]> => {
    const params = new URLSearchParams();
    if (query?.category) params.append('category', query.category);
    if (query?.search) params.append('search', query.search);

    const response = await api.get(`/library/books?${params.toString()}`);
    return response.data;
  },

  /**
   * Get book by ID
   */
  getBookById: async (id: string): Promise<Book> => {
    const response = await api.get(`/library/books/${id}`);
    return response.data;
  },

  /**
   * Create new book
   */
  createBook: async (data: CreateBookDto): Promise<Book> => {
    const response = await api.post('/library/books', data);
    return response.data;
  },

  /**
   * Update book
   */
  updateBook: async (id: string, data: Partial<CreateBookDto>): Promise<Book> => {
    const response = await api.put(`/library/books/${id}`, data);
    return response.data;
  },

  /**
   * Delete book
   */
  deleteBook: async (id: string): Promise<void> => {
    await api.delete(`/library/books/${id}`);
  },

  /**
   * Get all book issues
   */
  getIssues: async (query?: { studentId?: string; status?: string }): Promise<BookIssue[]> => {
    const params = new URLSearchParams();
    if (query?.studentId) params.append('studentId', query.studentId);
    if (query?.status) params.append('status', query.status);

    const response = await api.get(`/library/issues?${params.toString()}`);
    return response.data;
  },

  /**
   * Issue a book
   */
  issueBook: async (data: IssueBookDto): Promise<BookIssue> => {
    const response = await api.post('/library/issues', data);
    return response.data;
  },

  /**
   * Return a book
   */
  returnBook: async (issueId: string, fine?: number): Promise<BookIssue> => {
    const response = await api.post(`/library/issues/${issueId}/return`, { fine });
    return response.data;
  },

  /**
   * Get student's issued books
   */
  getStudentIssues: async (studentId: string): Promise<BookIssue[]> => {
    const response = await api.get(`/library/students/${studentId}/issues`);
    return response.data;
  },

  /**
   * Get overdue books
   */
  getOverdueBooks: async (): Promise<BookIssue[]> => {
    const response = await api.get('/library/issues?status=OVERDUE');
    return response.data;
  },
};

export default libraryService;
