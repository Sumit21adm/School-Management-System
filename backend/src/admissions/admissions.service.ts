import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdmissionsService {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.StudentDetailsCreateInput) {
        return this.prisma.studentDetails.create({
            data,
        });
    }

    async findAll(params: { search?: string; className?: string; section?: string; status?: string; sessionId?: number; page?: number; limit?: number; sortBy?: string; order?: 'asc' | 'desc' }) {
        const { search, className, section, status, sessionId, page = 1, limit = 10, sortBy, order = 'asc' } = params;
        const skip = (page - 1) * limit;

        const mode = process.env.PRISMA_MODE === 'insensitive' ? 'insensitive' : undefined;

        const where: any = {
            AND: [
                className ? { className } : {},
                section ? { section } : {},
                sessionId ? { sessionId } : {},
                search ? {
                    OR: [
                        { name: { contains: search, ...(mode && { mode: mode as any }) } },
                        { studentId: { contains: search, ...(mode && { mode: mode as any }) } },
                    ]
                } : {},
                status ? { status } : {} // Only filter by status if explicitly provided
            ]
        };

        let orderBy: any = { createdAt: 'desc' };
        if (sortBy) {
            // Handle nested fields if necessary, or just top-level
            // Assuming simple top-level fields for now
            orderBy = { [sortBy]: order };
        }

        const [data, total] = await Promise.all([
            this.prisma.studentDetails.findMany({
                where,
                skip,
                take: +limit,
                orderBy,
                include: {
                    session: true, // Include session data
                }
            }),
            this.prisma.studentDetails.count({ where }),
        ]);

        return {
            data,
            meta: {
                total,
                page: +page,
                lastPage: Math.ceil(total / limit),
            }
        };
    }

    async findOne(id: number) {
        return this.prisma.studentDetails.findUnique({
            where: { id },
            include: {
                feeTransactions: true,
                academicHistory: {
                    include: {
                        session: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                session: true,
                transport: {
                    include: {
                        route: true,
                        pickupStop: true,
                        dropStop: true
                    }
                }
            },
        });
    }

    async getAvailableSections(className: string) {
        const sections = await this.prisma.studentDetails.findMany({
            where: {
                className,
                status: 'active',
            },
            select: {
                section: true,
            },
            distinct: ['section'],
        });

        return sections.map(s => s.section).filter(Boolean).sort();
    }

    async update(id: number, data: Prisma.StudentDetailsUpdateInput) {
        return this.prisma.studentDetails.update({
            where: { id },
            data,
        });
    }

    async exportStudents(params: { class?: string; section?: string; format: 'excel' | 'pdf' }) {
        const { class: className, section, format } = params;

        const where: Prisma.StudentDetailsWhereInput = {
            AND: [
                className ? { className } : {},
                section ? { section } : {},
                { status: 'active' }
            ]
        };

        const students = await this.prisma.studentDetails.findMany({
            where,
            orderBy: [{ className: 'asc' }, { section: 'asc' }, { name: 'asc' }],
        });

        if (format === 'excel') {
            const ExcelJS = require('exceljs');
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Students');

            worksheet.columns = [
                { header: 'Student ID', key: 'studentId', width: 15 },
                { header: 'Name', key: 'name', width: 20 },
                { header: 'Class', key: 'className', width: 10 },
                { header: 'Section', key: 'section', width: 10 },
                { header: 'Father Name', key: 'fatherName', width: 20 },
                { header: 'Phone', key: 'phone', width: 15 },
                { header: 'DOB', key: 'dob', width: 15 },
                { header: 'Gender', key: 'gender', width: 10 },
            ];

            students.forEach(student => {
                worksheet.addRow({
                    ...student,
                    dob: student.dob ? new Date(student.dob).toLocaleDateString() : '',
                });
            });

            return await workbook.xlsx.writeBuffer();
        } else if (format === 'pdf') {
            const PDFDocument = require('pdfkit');
            const doc = new PDFDocument();
            const buffers: any[] = [];

            doc.on('data', buffers.push.bind(buffers));

            // Header
            doc.fontSize(20).text('Student List', { align: 'center' });
            doc.moveDown();

            if (className) doc.fontSize(12).text(`Class: ${className}`);
            if (section) doc.fontSize(12).text(`Section: ${section}`);
            doc.moveDown();

            // Table Header
            let y = doc.y;
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('ID', 50, y);
            doc.text('Name', 150, y);
            doc.text('Class', 300, y);
            doc.text('Father Name', 380, y);
            doc.text('Phone', 500, y);

            doc.moveDown();
            doc.font('Helvetica');

            // Table Rows
            students.forEach(student => {
                y = doc.y;
                if (y > 700) {
                    doc.addPage();
                    y = 50;
                }

                doc.text(student.studentId, 50, y);
                doc.text(student.name, 150, y);
                doc.text(`${student.className}-${student.section}`, 300, y);
                doc.text(student.fatherName, 380, y);
                doc.text(student.phone, 500, y);
                doc.moveDown();
            });

            doc.end();

            return new Promise((resolve) => {
                doc.on('end', () => {
                    resolve(Buffer.concat(buffers));
                });
            });
        }
    }

    async remove(id: number) {
        const student = await this.prisma.studentDetails.findUnique({ where: { id } });
        if (!student) throw new Error('Student not found');

        if (student.status === 'archived') {
            // Check for dependencies
            const [transactions, bills, results, academics, discounts, transport] = await Promise.all([
                this.prisma.feeTransaction.count({ where: { studentId: student.studentId } }),
                this.prisma.demandBill.count({ where: { studentId: student.studentId } }),
                this.prisma.examResult.count({ where: { studentId: student.studentId } }),
                this.prisma.studentAcademicHistory.count({ where: { studentId: student.studentId } }),
                this.prisma.studentFeeDiscount.count({ where: { studentId: student.studentId } }),
                this.prisma.studentTransport.findUnique({ where: { studentId: student.studentId } }),
            ]);

            const hasDependencies = transactions > 0 || bills > 0 || results > 0 || academics > 0 || discounts > 0 || transport;

            if (!hasDependencies) {
                return this.prisma.studentDetails.delete({ where: { id } });
            } else {
                throw new ConflictException('Cannot delete student with existing records (Fees, Exams, etc.).');
            }
        }

        // Soft delete
        return this.prisma.studentDetails.update({
            where: { id },
            data: { status: 'archived' },
        });
    }

    async restore(id: number) {
        return this.prisma.studentDetails.update({
            where: { id },
            data: { status: 'active' },
        });
    }

    async generateTemplate() {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Template');

        worksheet.columns = [
            { header: 'Student ID', key: 'studentId', width: 15 },
            { header: 'Name', key: 'name', width: 20 },
            { header: 'Father Name', key: 'fatherName', width: 20 },
            { header: 'Mother Name', key: 'motherName', width: 20 },
            { header: 'DOB (YYYY-MM-DD)', key: 'dob', width: 15 },
            { header: 'Gender', key: 'gender', width: 10 },
            { header: 'Class', key: 'className', width: 10 },
            { header: 'Section', key: 'section', width: 10 },
            { header: 'Admission Date (YYYY-MM-DD)', key: 'admissionDate', width: 20 },
            { header: 'Address', key: 'address', width: 30 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Previous Dues', key: 'previousDues', width: 15 },
            { header: 'Advance Balance', key: 'advanceBalance', width: 15 },
        ];

        // Add a sample row
        worksheet.addRow({
            studentId: 'STU001',
            name: 'John Doe',
            fatherName: 'Richard Doe',
            motherName: 'Jane Doe',
            dob: '2010-01-01',
            gender: 'Male',
            className: '10',
            section: 'A',
            admissionDate: '2025-04-01',
            address: '123 Main St, City',
            phone: '9876543210',
            email: 'john@example.com',
            previousDues: 0,
            advanceBalance: 0
        });

        return await workbook.xlsx.writeBuffer();
    }

    async importStudents(file: Express.Multer.File) {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer);
        const worksheet = workbook.getWorksheet(1);

        // Fetch active session
        const activeSession = await this.prisma.academicSession.findFirst({
            where: { isActive: true },
        });

        if (!activeSession) {
            return { success: false, errors: ['No active academic session found. Please activate a session first.'], imported: 0 };
        }

        const students: any[] = [];
        const errors: string[] = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const rowData = {
                studentId: row.getCell(1).text,
                name: row.getCell(2).text,
                fatherName: row.getCell(3).text,
                motherName: row.getCell(4).text,
                dob: row.getCell(5).text,
                gender: row.getCell(6).text,
                className: row.getCell(7).text,
                section: row.getCell(8).text,
                admissionDate: row.getCell(9).text,
                address: row.getCell(10).text,
                phone: row.getCell(11).text,
                email: row.getCell(12).text,
                previousDues: parseFloat(row.getCell(13).text || '0'),
                advanceBalance: parseFloat(row.getCell(14).text || '0'),
            };

            // Basic validation
            if (!rowData.studentId || !rowData.name || !rowData.className) {
                errors.push(`Row ${rowNumber}: Missing required fields (ID, Name, Class)`);
                return;
            }

            try {
                students.push({
                    studentId: rowData.studentId,
                    name: rowData.name,
                    fatherName: rowData.fatherName,
                    motherName: rowData.motherName,
                    dob: new Date(rowData.dob),
                    gender: rowData.gender,
                    className: rowData.className,
                    section: rowData.section,
                    admissionDate: new Date(rowData.admissionDate),
                    address: rowData.address,
                    phone: rowData.phone,
                    email: rowData.email,
                    status: 'active',
                    sessionId: activeSession.id, // Link to active session
                    _meta: { // Temporary storage for fee data
                        previousDues: isNaN(rowData.previousDues) ? 0 : rowData.previousDues,
                        advanceBalance: isNaN(rowData.advanceBalance) ? 0 : rowData.advanceBalance
                    }
                });
            } catch (e) {
                errors.push(`Row ${rowNumber}: Invalid data format (Check Dates)`);
            }
        });

        if (errors.length > 0) {
            return { success: false, errors, imported: 0 };
        }

        // Fetch 'Advance Payment' fee type if needed
        const advanceFeeType = await this.prisma.feeType.findUnique({
            where: { name: 'Advance Payment' }
        });

        // Fetch a default fee type for Opening Balance bills (e.g., Tuition Fee or first available)
        const defaultFeeType = await this.prisma.feeType.findFirst({
            where: { name: 'Tuition Fee' }
        }) || await this.prisma.feeType.findFirst();

        let importedCount = 0;
        for (const studentData of students) {
            try {
                // Check if student exists
                const existing = await this.prisma.studentDetails.findUnique({
                    where: { studentId: studentData.studentId }
                });

                if (!existing) {
                    const { _meta, ...dbData } = studentData;

                    // Create Student
                    await this.prisma.studentDetails.create({ data: dbData });

                    // Handle Previous Dues (Opening Balance Bill)
                    if (_meta.previousDues > 0) {
                        const now = new Date();
                        // Generate a unique bill number
                        const billNo = `OB-${studentData.studentId}-${Date.now()}`;

                        await this.prisma.demandBill.create({
                            data: {
                                billNo,
                                studentId: studentData.studentId,
                                sessionId: activeSession.id,
                                month: now.getMonth() + 1,
                                year: now.getFullYear(),
                                billDate: now,
                                dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
                                totalAmount: _meta.previousDues,
                                previousDues: _meta.previousDues,
                                netAmount: _meta.previousDues,
                                status: 'PENDING',
                                billItems: {
                                    create: {
                                        // We need a fee type for "Opening Balance" or similar. 
                                        // For now, attaching to the bill as 'previousDues' handles the logic, 
                                        // but bill items require a feeTypeId.
                                        // Let's assume ID 1 or find a generic one.
                                        // Ideally, 'Tuition Fee' or 'Arrears'.
                                        // To satisfy the schema, let's try to find a default fee type.
                                        feeTypeId: defaultFeeType?.id || 1, // Fallback to 1 if absolutely nothing found
                                        amount: 0, // checking previousDues on Bill level
                                        description: 'Opening Balance Import'
                                    }
                                }
                            }
                        });
                    }

                    // Handle Advance Balance
                    if (_meta.advanceBalance > 0 && advanceFeeType) {
                        const now = new Date();
                        const transactionId = `TRX-ADV-${studentData.studentId}-${Date.now()}`;
                        const receiptNo = `REC-ADV-${studentData.studentId}-${Date.now()}`;

                        await this.prisma.feeTransaction.create({
                            data: {
                                transactionId,
                                studentId: studentData.studentId,
                                sessionId: activeSession.id,
                                receiptNo,
                                amount: _meta.advanceBalance,
                                description: 'Imported Advance Balance',
                                date: now,
                                yearId: now.getFullYear(),
                                paymentDetails: {
                                    create: {
                                        feeTypeId: advanceFeeType.id,
                                        amount: _meta.advanceBalance,
                                        netAmount: _meta.advanceBalance
                                    }
                                }
                            }
                        });
                    }

                    importedCount++;
                }
            } catch (e) {
                console.error(`Failed to import student ${studentData.studentId}`, e);
            }
        }

        return { success: true, imported: importedCount, total: students.length };
    }

    async getDashboardStats() {
        const [active, alumni, archived] = await Promise.all([
            this.prisma.studentDetails.count({ where: { status: 'active' } }),
            this.prisma.studentDetails.count({ where: { status: 'alumni' } }),
            this.prisma.studentDetails.count({ where: { status: 'archived' } }),
        ]);

        // Safer approach: Fetch active students and filter in JS
        // This avoids MySQL/SQLite syntax differences with Raw Query
        const activeStudents = await this.prisma.studentDetails.findMany({
            where: { status: 'active' },
            select: { id: true, studentId: true, name: true, className: true, section: true, dob: true }
        });

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentDay = today.getDate();

        const birthdayList = activeStudents
            .filter(student => {
                if (!student.dob) return false;
                const dob = new Date(student.dob);
                return dob.getMonth() === currentMonth && dob.getDate() === currentDay;
            })
            .map(student => {
                const birthDate = new Date(student.dob);
                let age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                return { ...student, age };
            });

        return {
            stats: {
                active,
                alumni,
                archived,
                birthdayCount: birthdayList.length,
            },
            birthdays: birthdayList
        };
    }
}
