import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, HttpException, HttpStatus, Header } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LibraryService } from './library.service';

@Controller('library')
@UseGuards(AuthGuard('jwt'))
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  // ============ Books ============
  @Get('books')
  findAllBooks(
    @Request() req: any,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.libraryService.findAllBooks(req.user.tenantId, { category, search });
  }

  @Get('books/:id')
  findBookById(@Param('id') id: string, @Request() req: any) {
    return this.libraryService.findBookById(id, req.user.tenantId);
  }

  @Post('books')
  createBook(@Request() req: any, @Body() body: any) {
    return this.libraryService.createBook(req.user.tenantId, body);
  }

  @Put('books/:id')
  updateBook(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.libraryService.updateBook(id, req.user.tenantId, body);
  }

  @Delete('books/:id')
  deleteBook(@Param('id') id: string, @Request() req: any) {
    return this.libraryService.deleteBook(id, req.user.tenantId);
  }

  // ============ Issues ============
  @Get('issues')
  findAllIssues(
    @Request() req: any,
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
  ) {
    return this.libraryService.findAllIssues(req.user.tenantId, { studentId, status });
  }

  @Get('issues/:id')
  findIssueById(@Param('id') id: string, @Request() req: any) {
    return this.libraryService.findIssueById(id, req.user.tenantId);
  }

  @Post('issues')
  async issueBook(@Request() req: any, @Body() body: any) {
    try {
      return await this.libraryService.issueBook(req.user.tenantId, body);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('issues/:id/return')
  async returnBook(@Param('id') id: string, @Request() req: any) {
    try {
      return await this.libraryService.returnBook(id, req.user.tenantId);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('issues/:id/pay-fine')
  payFine(@Param('id') id: string, @Request() req: any) {
    return this.libraryService.payFine(id, req.user.tenantId);
  }

  // ============ Statistics ============
  @Get('stats')
  getStats(@Request() req: any) {
    return this.libraryService.getStats(req.user.tenantId);
  }

  // ============ CSV Export ============
  @Get('export/books')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="library-books.csv"')
  async exportBooksCSV(@Request() req: any) {
    const books = await this.libraryService.exportBooksCSV(req.user.tenantId);
    return this.convertToCSV(books, ['id', 'isbn', 'title', 'author', 'publisher', 'category', 'totalCopies', 'available', 'location']);
  }

  @Get('export/issues')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="library-issues.csv"')
  async exportIssuesCSV(@Request() req: any) {
    const issues = await this.libraryService.exportIssuesCSV(req.user.tenantId);
    const flatIssues = issues.map((issue: any) => ({
      id: issue.id,
      bookTitle: issue.book.title,
      studentName: `${issue.student.user.firstName} ${issue.student.user.lastName}`,
      issueDate: issue.issueDate,
      dueDate: issue.dueDate,
      returnDate: issue.returnDate || '',
      status: issue.status,
      fineAmount: issue.fineAmount,
      finePaid: issue.finePaid,
    }));
    return this.convertToCSV(flatIssues, ['id', 'bookTitle', 'studentName', 'issueDate', 'dueDate', 'returnDate', 'status', 'fineAmount', 'finePaid']);
  }

  private convertToCSV(data: any[], headers: string[]): string {
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',');
    });
    return [csvHeaders, ...csvRows].join('\n');
  }
}
