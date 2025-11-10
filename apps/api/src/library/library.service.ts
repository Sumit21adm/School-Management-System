import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LibraryService {
  constructor(private prisma: PrismaService) {}

  // ============ Books ============
  async findAllBooks(tenantId: string, filters?: { category?: string; search?: string }) {
    return this.prisma.libraryBook.findMany({
      where: {
        tenantId,
        ...(filters?.category && { category: filters.category }),
        ...(filters?.search && {
          OR: [
            { title: { contains: filters.search } },
            { author: { contains: filters.search } },
            { isbn: { contains: filters.search } },
          ],
        }),
      },
      orderBy: {
        title: 'asc',
      },
    });
  }

  async findBookById(id: string, tenantId: string) {
    return this.prisma.libraryBook.findFirst({
      where: { id, tenantId },
      include: {
        issues: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            issueDate: 'desc',
          },
        },
      },
    });
  }

  async createBook(tenantId: string, data: any) {
    return this.prisma.libraryBook.create({
      data: {
        tenantId,
        ...data,
      },
    });
  }

  async updateBook(id: string, tenantId: string, data: any) {
    return this.prisma.libraryBook.updateMany({
      where: { id, tenantId },
      data,
    });
  }

  async deleteBook(id: string, tenantId: string) {
    return this.prisma.libraryBook.deleteMany({
      where: { id, tenantId },
    });
  }

  // ============ Issues ============
  async findAllIssues(tenantId: string, filters?: { studentId?: string; status?: string }) {
    return this.prisma.libraryIssue.findMany({
      where: {
        tenantId,
        ...(filters?.studentId && { studentId: filters.studentId }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        book: true,
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        issueDate: 'desc',
      },
    });
  }

  async findIssueById(id: string, tenantId: string) {
    return this.prisma.libraryIssue.findFirst({
      where: { id, tenantId },
      include: {
        book: true,
        student: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async issueBook(tenantId: string, data: { bookId: string; studentId: string; dueDate: Date }) {
    // Check book availability
    const book = await this.prisma.libraryBook.findFirst({
      where: { id: data.bookId, tenantId },
    });

    if (!book || book.available <= 0) {
      throw new Error('Book not available');
    }

    // Create issue
    const issue = await this.prisma.libraryIssue.create({
      data: {
        tenantId,
        bookId: data.bookId,
        studentId: data.studentId,
        dueDate: data.dueDate,
        status: 'issued',
      },
    });

    // Update book availability
    await this.prisma.libraryBook.update({
      where: { id: data.bookId },
      data: {
        available: {
          decrement: 1,
        },
      },
    });

    return issue;
  }

  async returnBook(id: string, tenantId: string) {
    const issue = await this.prisma.libraryIssue.findFirst({
      where: { id, tenantId },
    });

    if (!issue || issue.status !== 'issued') {
      throw new Error('Invalid issue');
    }

    const now = new Date();
    const dueDate = new Date(issue.dueDate);
    let fineAmount = 0;

    // Calculate fine if overdue (e.g., $1 per day)
    if (now > dueDate) {
      const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      fineAmount = daysOverdue * 1;
    }

    // Update issue
    const updatedIssue = await this.prisma.libraryIssue.update({
      where: { id },
      data: {
        status: 'returned',
        returnDate: now,
        fineAmount,
      },
    });

    // Update book availability
    await this.prisma.libraryBook.update({
      where: { id: issue.bookId },
      data: {
        available: {
          increment: 1,
        },
      },
    });

    return updatedIssue;
  }

  async payFine(id: string, tenantId: string) {
    return this.prisma.libraryIssue.updateMany({
      where: { id, tenantId },
      data: {
        finePaid: true,
      },
    });
  }

  // ============ Statistics ============
  async getStats(tenantId: string) {
    const totalBooks = await this.prisma.libraryBook.count({
      where: { tenantId },
    });

    const availableBooks = await this.prisma.libraryBook.aggregate({
      where: { tenantId },
      _sum: {
        available: true,
      },
    });

    const issuedBooks = await this.prisma.libraryIssue.count({
      where: { tenantId, status: 'issued' },
    });

    const overdueBooks = await this.prisma.libraryIssue.count({
      where: {
        tenantId,
        status: 'issued',
        dueDate: {
          lt: new Date(),
        },
      },
    });

    return {
      totalBooks,
      availableBooks: availableBooks._sum.available || 0,
      issuedBooks,
      overdueBooks,
    };
  }

  // ============ CSV Export ============
  async exportBooksCSV(tenantId: string) {
    const books = await this.findAllBooks(tenantId);
    return books;
  }

  async exportIssuesCSV(tenantId: string) {
    const issues = await this.findAllIssues(tenantId);
    return issues;
  }
}
