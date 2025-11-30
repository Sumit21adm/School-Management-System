import { Injectable } from '@nestjs/common';
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

    async findAll(params: { search?: string; className?: string; status?: string; page?: number; limit?: number }) {
        const { search, className, status = 'active', page = 1, limit = 10 } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.StudentDetailsWhereInput = {
            AND: [
                className ? { className } : {},
                search ? {
                    OR: [
                        { name: { contains: search } },
                        { studentId: { contains: search } },
                    ]
                } : {},
                { status } // Filter by status (default 'active')
            ]
        };

        const [data, total] = await Promise.all([
            this.prisma.studentDetails.findMany({
                where,
                skip,
                take: +limit,
                orderBy: { createdAt: 'desc' },
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
                examResults: true,
                transportAssignments: true,
                hostelAssignments: true,
            },
        });
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
        return this.prisma.studentDetails.update({
            where: { id },
            data: { status: 'archived' },
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
            email: 'john@example.com'
        });

        return await workbook.xlsx.writeBuffer();
    }

    async importStudents(file: Express.Multer.File) {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer);
        const worksheet = workbook.getWorksheet(1);

        const students: Prisma.StudentDetailsCreateInput[] = [];
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
            };

            // Basic validation
            if (!rowData.studentId || !rowData.name || !rowData.className) {
                errors.push(`Row ${rowNumber}: Missing required fields`);
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
                    status: 'active'
                });
            } catch (e) {
                errors.push(`Row ${rowNumber}: Invalid data format`);
            }
        });

        if (errors.length > 0) {
            return { success: false, errors, imported: 0 };
        }

        let importedCount = 0;
        for (const student of students) {
            try {
                // Check if student exists
                const existing = await this.prisma.studentDetails.findUnique({
                    where: { studentId: student.studentId }
                });

                if (!existing) {
                    await this.prisma.studentDetails.create({ data: student });
                    importedCount++;
                }
            } catch (e) {
                console.error(`Failed to import student ${student.studentId}`, e);
            }
        }

        return { success: true, imported: importedCount, total: students.length };
    }
}
