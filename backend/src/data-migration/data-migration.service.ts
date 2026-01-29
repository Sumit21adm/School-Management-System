import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
    ImportStudentDto,
    ImportFeeReceiptDto,
    ImportDemandBillDto,
    ImportDiscountDto,
    ValidationResultDto,
    ValidationErrorDto,
    ImportResultDto,
} from './dto/data-migration.dto';

/**
 * Parse date from DD-MM-YYYY format to Date object
 * Also accepts YYYY-MM-DD for backwards compatibility
 */
function parseDateDDMMYYYY(dateStr: string): Date | null {
    if (!dateStr) return null;

    // Try DD-MM-YYYY format first
    const ddmmyyyy = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddmmyyyy) {
        const [, day, month, year] = ddmmyyyy;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Try YYYY-MM-DD format (backwards compatibility)
    const yyyymmdd = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yyyymmdd) {
        const [, year, month, day] = yyyymmdd;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Try standard Date parsing as fallback
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Validate if date string is in DD-MM-YYYY format
 */
function isValidDateFormat(dateStr: string): boolean {
    if (!dateStr) return false;
    // Accept DD-MM-YYYY or YYYY-MM-DD
    return /^(\d{1,2})-(\d{1,2})-(\d{4})$/.test(dateStr) ||
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/.test(dateStr);
}


/**
 * Sanitize text input, treating 'None', 'N/A', etc. as null
 */
function sanitizeText(text: string | undefined | null): string | null {
    if (!text) return null;
    const trimmed = text.toString().trim();
    if (!trimmed) return null;
    if (['none', 'null', 'n/a', '-', 'na', 'nan'].includes(trimmed.toLowerCase())) {
        return null;
    }
    return trimmed;
}

@Injectable()
export class DataMigrationService {
    constructor(private prisma: PrismaService) { }

    // ============================================
    // TEMPLATE GENERATION
    // ============================================

    /**
     * Generate a complete multi-sheet Excel template
     */
    async generateCompleteTemplate(): Promise<Buffer> {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();

        workbook.creator = 'School Management System';
        workbook.created = new Date();

        // Fetch reference data for dropdowns
        const [classes, feeTypes, routes, allSessions, activeSession] = await Promise.all([
            this.prisma.schoolClass.findMany({ include: { sections: true } }),
            this.prisma.feeType.findMany(),
            this.prisma.route.findMany({ include: { stops: true } }),
            this.prisma.academicSession.findMany({ orderBy: { startDate: 'desc' } }),
            this.prisma.academicSession.findFirst({ where: { isActive: true } }),
        ]);

        const sections = classes.flatMap(c => c.sections.map(s => ({ ...s, class: c })));
        const routeStops = routes.flatMap(r => r.stops.map(s => ({ ...s, route: r })));

        // 1. Instructions Sheet
        this.createInstructionsSheet(workbook);

        // 2. Reference Data Sheet
        this.createReferenceDataSheet(workbook, classes, sections, feeTypes, routes, routeStops, activeSession, allSessions);

        // 3. Students Sheet
        this.createStudentsSheet(workbook, classes, routes);

        // 4. Fee Receipts Sheet
        this.createFeeReceiptsSheet(workbook, feeTypes);

        // 5. Demand Bills Sheet
        this.createDemandBillsSheet(workbook, feeTypes);

        // 6. Discounts Sheet
        this.createDiscountsSheet(workbook, feeTypes, allSessions);

        // 7. Academic History Sheet
        this.createAcademicHistorySheet(workbook, classes);

        return await workbook.xlsx.writeBuffer();
    }

    private createInstructionsSheet(workbook: any) {
        const sheet = workbook.addWorksheet('Instructions', {
            properties: { tabColor: { argb: 'FF4CAF50' } }
        });

        sheet.columns = [{ width: 100 }];

        const instructions = [
            '📋 DATA MIGRATION TEMPLATE - INSTRUCTIONS',
            '',
            '=== IMPORTANT: READ BEFORE IMPORTING ===',
            '',
            '1. PREPARATION STEPS:',
            '   • Ensure all Classes and Sections are created in the system',
            '   • Ensure all Fee Types are created in the system',
            '   • Ensure all Transport Routes and Stops are created (if importing transport)',
            '   • Ensure an Academic Session is active',
            '',
            '2. IMPORT ORDER:',
            '   Import data in this exact order:',
            '   Step 1: Students (Students sheet)',
            '   Step 2: Fee Receipts (Fee_Receipts sheet) - requires students to exist',
            '   Step 3: Demand Bills (Demand_Bills sheet) - requires students to exist',
            '   Step 4: Discounts (Discounts sheet) - requires students to exist',
            '',
            '3. DATA FORMATTING RULES:',
            '   • Dates: Use DD-MM-YYYY format (e.g., 15-04-2024)',
            '   • Phone Numbers: 10-15 digits, no spaces or dashes',
            '   • Aadhar Numbers: Exactly 12 digits',
            '   • PAN Numbers: Format AAAAA0000A (5 letters, 4 digits, 1 letter)',
            '   • Amounts: Numbers only, no currency symbols',
            '',
            '4. COLUMNS GUIDE:',
            '   • Students: Student ID, Name, Father Name, Mother Name, DOB, Gender, Class, Section, Roll No...',
            '   • Fee Receipts: Student ID, Receipt No, Date, Fee Type, Amount, Net Amount, Modes...',
            '     (Note: If a "Fee Type" does not exist, it will be AUTO-CREATED with a warning)',
            '   • Demand Bills: Student ID, Bill No, Bill Date, Due Date, Month, Year, Fee Type, Amount, Net Amount, Status',
            '     (Note: Missing "Fee Types" will also be auto-created here)',
            '   • Discounts: Student ID, Fee Type, Discount Type, Discount Value, Session Name (Optional)',
            '     (Note: Use "Session Name" to assign discount to a specific historical session. Default is Active Session)',
            '   • Academic History: Student ID, Session, Class, Section, Roll No, Status',
            '',
            '5. REFERENCE DATA:',
            '   • Check the "Reference_Data" sheet for valid values for Classes, Sections, Fee Types, Routes, and Sessions',
            '   • Use exact values from Reference Data - case sensitive!',
            '',
            '6. VALIDATION:',
            '   • Use "Validate" option before importing to check for errors',
            '   • Fix all errors before proceeding with actual import',
            '',
            '7. OPENING BALANCES:',
            '   • Use "Previous Dues" column in Students sheet to import outstanding balances',
            '   • Use "Advance Balance" column for any advance payments already made',
            '',
            '=== TROUBLESHOOTING ===',
            '• "Class not found" - Ensure class name matches exactly with Reference_Data sheet',
            '• "Student not found" - Import students before importing fee records',
            '• "Fee Type not found" - It will be auto-created now, but check spelling to avoid duplicates',
            '• "Duplicate ID" - Student ID or Receipt No already exists in system',
        ];

        instructions.forEach((text, index) => {
            const row = sheet.addRow([text]);
            if (text.startsWith('===') || text.startsWith('📋')) {
                row.font = { bold: true, size: 14 };
                row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
            } else if (text.match(/^\d+\./)) {
                row.font = { bold: true, size: 12 };
            }
        });
    }

    private createReferenceDataSheet(
        workbook: any,
        classes: any[],
        sections: any[],
        feeTypes: any[],
        routes: any[],
        routeStops: any[],
        activeSession: any,
        allSessions: any[] = []
    ) {
        const sheet = workbook.addWorksheet('Reference_Data', {
            properties: { tabColor: { argb: 'FF2196F3' } }
        });

        // Column headers
        sheet.columns = [
            { header: 'Classes', key: 'classes', width: 15 },
            { header: 'Sections', key: 'sections', width: 20 },
            { header: 'Fee Types', key: 'feeTypes', width: 25 },
            { header: 'Routes', key: 'routes', width: 25 },
            { header: 'Route Stops', key: 'stops', width: 30 },
            { header: 'Academic Sessions', key: 'sessions', width: 25 }, // New Column
            { header: 'Gender Options', key: 'gender', width: 15 },
            { header: 'Status Options', key: 'status', width: 15 },
            { header: 'Payment Modes', key: 'paymentModes', width: 15 },
            { header: 'Discount Types', key: 'discountTypes', width: 15 },
            { header: 'Bill Status', key: 'billStatus', width: 15 },
        ];

        // Style header row
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBBDEFB' } };

        // Add session info
        sheet.addRow([`Active Session: ${activeSession?.name || 'NONE - Create one first!'}`]);

        // Populate data columns
        const maxRows = Math.max(classes.length, feeTypes.length, routes.length, routeStops.length, allSessions.length, 10);

        const genderOptions = ['male', 'female', 'other'];
        const statusOptions = ['active', 'inactive', 'passed', 'alumni'];
        const paymentModes = ['cash', 'upi', 'card', 'cheque', 'online'];
        const discountTypes = ['PERCENTAGE', 'FIXED'];
        const billStatuses = ['PENDING', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'];

        for (let i = 0; i < maxRows; i++) {
            sheet.addRow([
                classes[i]?.name || '',
                sections[i] ? `${sections[i].class?.name}-${sections[i].name}` : '',
                feeTypes[i]?.name || '',
                routes[i] ? `${routes[i].routeCode}: ${routes[i].routeName}` : '',
                routeStops[i] ? `${routeStops[i].route?.routeCode} - ${routeStops[i].stopName}` : '',
                allSessions[i]?.name || '',
                genderOptions[i] || '',
                statusOptions[i] || '',
                paymentModes[i] || '',
                discountTypes[i] || '',
                billStatuses[i] || '',
            ]);
        }
    }

    private createStudentsSheet(workbook: any, classes: any[], routes: any[]) {
        const sheet = workbook.addWorksheet('Students', {
            properties: { tabColor: { argb: 'FF9C27B0' } }
        });

        sheet.columns = [
            { header: 'Student ID *', key: 'studentId', width: 15 },
            { header: 'Name *', key: 'name', width: 20 },
            { header: 'Father Name *', key: 'fatherName', width: 20 },
            { header: 'Mother Name *', key: 'motherName', width: 20 },
            { header: 'DOB (DD-MM-YYYY) *', key: 'dob', width: 18 },
            { header: 'Gender *', key: 'gender', width: 10 },
            { header: 'Class *', key: 'className', width: 10 },
            { header: 'Section *', key: 'section', width: 10 },
            { header: 'Roll Number', key: 'rollNumber', width: 12 },
            { header: 'Admission Date (DD-MM-YYYY) *', key: 'admissionDate', width: 22 },
            { header: 'Address *', key: 'address', width: 30 },
            { header: 'Phone *', key: 'phone', width: 15 },
            { header: 'WhatsApp No', key: 'whatsAppNo', width: 15 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Category', key: 'category', width: 12 },
            { header: 'Religion', key: 'religion', width: 12 },
            { header: 'Student Aadhar', key: 'aadharCardNo', width: 15 },
            { header: 'APAAR ID', key: 'apaarId', width: 15 },
            { header: 'Father Occupation', key: 'fatherOccupation', width: 18 },
            { header: 'Father Aadhar', key: 'fatherAadharNo', width: 15 },
            { header: 'Father PAN', key: 'fatherPanNo', width: 12 },
            { header: 'Mother Occupation', key: 'motherOccupation', width: 18 },
            { header: 'Mother Aadhar', key: 'motherAadharNo', width: 15 },
            { header: 'Mother PAN', key: 'motherPanNo', width: 12 },
            { header: 'Guardian Relation', key: 'guardianRelation', width: 18 },
            { header: 'Guardian Name', key: 'guardianName', width: 20 },
            { header: 'Guardian Phone', key: 'guardianPhone', width: 15 },
            { header: 'Guardian Email', key: 'guardianEmail', width: 25 },
            { header: 'Route Code', key: 'routeCode', width: 12 },
            { header: 'Pickup Stop', key: 'pickupStop', width: 20 },
            { header: 'Drop Stop', key: 'dropStop', width: 20 },
            { header: 'Transport Type', key: 'transportType', width: 15 },
            { header: 'Previous Dues', key: 'previousDues', width: 15 },
            { header: 'Advance Balance', key: 'advanceBalance', width: 15 },
            { header: 'Session Name', key: 'sessionName', width: 20 },
        ];

        // Style header row
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE1BEE7' } };

        // Add data validations for dropdowns
        const classNames = classes.map(c => c.name).join(',');
        const routeCodes = routes.map(r => r.routeCode).join(',');

        // Gender dropdown
        sheet.dataValidations.add('F2:F1000', {
            type: 'list',
            formulae: ['"male,female,other"'],
            showErrorMessage: true,
            errorTitle: 'Invalid Gender',
            error: 'Please select: male, female, or other'
        });

        // Class dropdown
        if (classNames) {
            sheet.dataValidations.add('G2:G1000', {
                type: 'list',
                formulae: [`"${classNames}"`],
                showErrorMessage: true,
                errorTitle: 'Invalid Class',
                error: 'Please select a valid class from Reference_Data sheet'
            });
        }

        // Status dropdown
        sheet.dataValidations.add('O2:O1000', {
            type: 'list',
            formulae: ['"active,inactive,passed,alumni"'],
            showErrorMessage: true,
        });

        // Transport Type dropdown
        sheet.dataValidations.add('AG2:AG1000', {
            type: 'list',
            formulae: ['"pickup,drop,both"'],
            showErrorMessage: true,
        });

        // Add sample row
        sheet.addRow({
            studentId: 'STU2024001',
            name: 'Rahul Kumar',
            fatherName: 'Rajesh Kumar',
            motherName: 'Priya Kumar',
            dob: '15-03-2015',
            gender: 'male',
            className: classes[0]?.name || '1',
            section: 'A',
            rollNumber: '1',
            admissionDate: '01-04-2024',
            address: '123 Main Street, City Name',
            phone: '9876543210',
            whatsAppNo: '9876543210',
            email: 'parent@example.com',
            status: 'active',
            category: 'General',
            religion: 'Hindu',
            previousDues: 0,
            advanceBalance: 0,
        });

        // Style sample row differently
        sheet.getRow(2).font = { italic: true, color: { argb: 'FF666666' } };
    }

    private createFeeReceiptsSheet(workbook: any, feeTypes: any[]) {
        const sheet = workbook.addWorksheet('Fee_Receipts', {
            properties: { tabColor: { argb: 'FFFF9800' } }
        });

        sheet.columns = [
            { header: 'Student ID *', key: 'studentId', width: 15 },
            { header: 'Receipt No *', key: 'receiptNo', width: 18 },
            { header: 'Receipt Date (DD-MM-YYYY) *', key: 'receiptDate', width: 22 },
            { header: 'Fee Type *', key: 'feeTypeName', width: 20 },
            { header: 'Amount *', key: 'amount', width: 12 },
            { header: 'Discount', key: 'discount', width: 12 },
            { header: 'Net Amount *', key: 'netAmount', width: 12 },
            { header: 'Payment Mode *', key: 'paymentMode', width: 15 },
            { header: 'Payment Ref', key: 'paymentRef', width: 20 },
            { header: 'Collected By', key: 'collectedBy', width: 15 },
            { header: 'Remarks', key: 'remarks', width: 25 },
            { header: 'Bill No (if against bill)', key: 'billNo', width: 20 },
        ];

        // Style header
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0B2' } };

        // Fee Type dropdown
        const feeTypeNames = feeTypes.map(f => f.name).join(',');
        if (feeTypeNames) {
            sheet.dataValidations.add('D2:D1000', {
                type: 'list',
                formulae: [`"${feeTypeNames}"`],
                showErrorMessage: true,
                errorTitle: 'Invalid Fee Type',
                error: 'Please select a valid fee type from Reference_Data sheet'
            });
        }

        // Payment Mode dropdown
        sheet.dataValidations.add('H2:H1000', {
            type: 'list',
            formulae: ['"cash,upi,card,cheque,online"'],
            showErrorMessage: true,
        });

        // Sample row
        sheet.addRow({
            studentId: 'STU2024001',
            receiptNo: 'REC/2024/0001',
            receiptDate: '15-05-2024',
            feeTypeName: feeTypes[0]?.name || 'Tuition Fee',
            amount: 2500,
            discount: 0,
            netAmount: 2500,
            paymentMode: 'cash',
            paymentRef: '',
            collectedBy: 'Office',
            remarks: 'April Fee',
            billNo: '',
        });

        sheet.getRow(2).font = { italic: true, color: { argb: 'FF666666' } };
    }

    private createDemandBillsSheet(workbook: any, feeTypes: any[]) {
        const sheet = workbook.addWorksheet('Demand_Bills', {
            properties: { tabColor: { argb: 'FF3F51B5' } }
        });

        sheet.columns = [
            { header: 'Student ID *', key: 'studentId', width: 15 },
            { header: 'Bill No *', key: 'billNo', width: 18 },
            { header: 'Bill Date (DD-MM-YYYY) *', key: 'billDate', width: 22 },
            { header: 'Due Date (DD-MM-YYYY) *', key: 'dueDate', width: 22 },
            { header: 'Month (1-12) *', key: 'month', width: 12 },
            { header: 'Year *', key: 'year', width: 10 },
            { header: 'Fee Type *', key: 'feeTypeName', width: 20 },
            { header: 'Amount *', key: 'amount', width: 12 },
            { header: 'Discount', key: 'discount', width: 12 },
            { header: 'Previous Dues', key: 'previousDues', width: 15 },
            { header: 'Late Fee', key: 'lateFee', width: 12 },
            { header: 'Net Amount *', key: 'netAmount', width: 12 },
            { header: 'Paid Amount', key: 'paidAmount', width: 12 },
            { header: 'Status *', key: 'status', width: 15 },
        ];

        // Style header
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC5CAE9' } };

        // Fee Type dropdown
        const feeTypeNames = feeTypes.map(f => f.name).join(',');
        if (feeTypeNames) {
            sheet.dataValidations.add('G2:G1000', {
                type: 'list',
                formulae: [`"${feeTypeNames}"`],
                showErrorMessage: true,
            });
        }

        // Status dropdown
        sheet.dataValidations.add('N2:N1000', {
            type: 'list',
            formulae: ['"PENDING,SENT,PARTIALLY_PAID,PAID,OVERDUE,CANCELLED"'],
            showErrorMessage: true,
        });

        // Sample row
        sheet.addRow({
            studentId: 'STU2024001',
            billNo: 'BILL/2024/0001',
            billDate: '01-04-2024',
            dueDate: '15-04-2024',
            month: 4,
            year: 2024,
            feeTypeName: feeTypes[0]?.name || 'Tuition Fee',
            amount: 2500,
            discount: 0,
            previousDues: 0,
            lateFee: 0,
            netAmount: 2500,
            paidAmount: 2500,
            status: 'PAID',
        });

        sheet.getRow(2).font = { italic: true, color: { argb: 'FF666666' } };
    }

    private createDiscountsSheet(workbook: any, feeTypes: any[], sessions: any[] = []) {
        const sheet = workbook.addWorksheet('Discounts', {
            properties: { tabColor: { argb: 'FF009688' } }
        });

        sheet.columns = [
            { header: 'Student ID *', key: 'studentId', width: 15 },
            { header: 'Fee Type *', key: 'feeTypeName', width: 20 },
            { header: 'Discount Type *', key: 'discountType', width: 15 },
            { header: 'Discount Value *', key: 'discountValue', width: 15 },
            { header: 'Reason', key: 'reason', width: 30 },
            { header: 'Approved By', key: 'approvedBy', width: 20 },
            { header: 'Session Name', key: 'sessionName', width: 20 }, // New Column
        ];

        // Style header
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB2DFDB' } };

        // Fee Type dropdown
        const feeTypeNames = feeTypes.map(f => f.name).join(',');
        if (feeTypeNames) {
            sheet.dataValidations.add('B2:B1000', {
                type: 'list',
                formulae: [`"${feeTypeNames}"`],
                showErrorMessage: true,
            });
        }

        // Discount Type dropdown
        sheet.dataValidations.add('C2:C1000', {
            type: 'list',
            formulae: ['"PERCENTAGE,FIXED"'],
            showErrorMessage: true,
        });

        // Session Name dropdown (Referencing Reference_Data sheet)
        // Column F is the new Session Name column in Reference_Data (A=Classes, B=Sections, C=Types, D=Routes, E=Stops, F=Sessions)
        if (sessions.length > 0) {
            sheet.dataValidations.add('G2:G1000', {
                type: 'list',
                formulae: ['Reference_Data!$F$2:$F$100'],
                showErrorMessage: true,
                errorTitle: 'Invalid Session',
                error: 'Please select a valid Session Name from the list'
            });
        }

        // Sample row
        sheet.addRow({
            studentId: 'STU2024001',
            feeTypeName: feeTypes[0]?.name || 'Tuition Fee',
            discountType: 'PERCENTAGE',
            discountValue: 10,
            reason: 'Staff Ward Discount',
            approvedBy: 'Principal',
            sessionName: sessions[0]?.name || '', // Sample session
        });

        sheet.getRow(2).font = { italic: true, color: { argb: 'FF666666' } };
    }

    private createAcademicHistorySheet(workbook: any, classes: any[]) {
        const sheet = workbook.addWorksheet('Academic_History', {
            properties: { tabColor: { argb: 'FF607D8B' } }
        });

        sheet.columns = [
            { header: 'Student ID *', key: 'studentId', width: 15 },
            { header: 'Session *', key: 'sessionName', width: 15 },
            { header: 'Class *', key: 'className', width: 10 },
            { header: 'Section *', key: 'section', width: 10 },
            { header: 'Roll Number', key: 'rollNumber', width: 12 },
            { header: 'Status *', key: 'status', width: 15 },
            { header: 'Final Result', key: 'finalResult', width: 15 },
        ];

        // Style header
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCFD8DC' } };

        // Class dropdown
        const classNames = classes.map(c => c.name).join(',');
        if (classNames) {
            sheet.dataValidations.add('C2:C1000', {
                type: 'list',
                formulae: [`"${classNames}"`],
                showErrorMessage: true,
            });
        }

        // Status dropdown
        sheet.dataValidations.add('F2:F1000', {
            type: 'list',
            formulae: ['"promoted,passed,detained,active"'],
            showErrorMessage: true,
        });

        // Sample row
        sheet.addRow({
            studentId: 'STU2024001',
            sessionName: '2023-2024',
            className: classes[0]?.name || '1',
            section: 'A',
            rollNumber: '10',
            status: 'promoted',
            finalResult: '85%',
        });

        sheet.getRow(2).font = { italic: true, color: { argb: 'FF666666' } };
    }

    // ============================================
    // VALIDATION
    // ============================================

    async validateStudentsImport(file: Express.Multer.File): Promise<ValidationResultDto> {
        const { Readable } = require('stream');
        const ExcelJS = require('exceljs');

        try {
            const stream = Readable.from(file.buffer);
            const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(stream, {
                sharedStrings: 'cache',
                hyperlinks: 'ignore',
                worksheets: 'emit',
                styles: 'ignore',
            });

            const errors: ValidationErrorDto[] = [];
            const warnings: ValidationErrorDto[] = [];
            let totalRows = 0;
            let studentsSheetFound = false;

            // Fetch reference data for validation
            const [classes, existingStudents, allSessions] = await Promise.all([
                this.prisma.schoolClass.findMany({ where: { isActive: true } }),
                this.prisma.studentDetails.findMany({
                    select: {
                        studentId: true,
                        // name: true, // Not strictly needed for unique checks unless we match by name
                        aadharCardNo: true,
                        className: true,
                        section: true,
                        rollNumber: true,
                        sessionId: true,
                    },
                    where: { status: 'active' }
                }),
                this.prisma.academicSession.findMany(),
            ]);

            const sessionIdToName = new Map(allSessions.map(s => [s.id, s.name]));
            // const classNames = new Set(classes.map(c => c.name)); // Unused?

            // Create lookup for existing Session-Class-Section-RollNo -> StudentID
            const existingRollMap = new Map<string, string>();
            existingStudents.forEach(s => {
                if (s.className && s.section && s.rollNumber) {
                    const sessionName = s.sessionId ? (sessionIdToName.get(s.sessionId) || '') : '';
                    const key = `${sessionName}-${s.className}-${s.section}-${s.rollNumber}`.toLowerCase();
                    existingRollMap.set(key, s.studentId);
                }
            });

            const fileAadhars = new Set<string>();
            const fileRollKeys = new Set<string>();
            const existingAadhars = new Set(existingStudents.map(s => s.aadharCardNo).filter(Boolean) as string[]);

            for await (const worksheetReader of workbookReader) {
                let isTargetSheet = false;
                let headerChecked = false;
                let sessionColIdx = -1;

                for await (const row of worksheetReader) {
                    if (row.number === 1) {
                        // Header Analysis
                        const headers: string[] = [];
                        if (Array.isArray(row.values)) {
                            row.values.forEach((val: any, idx: number) => {
                                const header = String(val).trim();
                                if (header) headers.push(header);
                                if (header === 'Session Name') sessionColIdx = idx;
                            });
                        }

                        const headerStr = headers.join(',').toLowerCase();
                        if (headerStr.includes('student id') && headerStr.includes('father name')) {
                            isTargetSheet = true;
                            studentsSheetFound = true;
                        }

                        headerChecked = true;
                        continue;
                    }

                    if (!isTargetSheet) continue;

                    totalRows++;
                    const getVal = (idx: number) => {
                        const cell = row.getCell(idx);
                        return cell && cell.text ? cell.text.trim() : (cell.value ? String(cell.value).trim() : '');
                    };

                    const rowNumber = row.number;
                    const studentId = getVal(1);
                    const className = getVal(7);
                    const section = this.parseSection(getVal(8)) || 'A';
                    const rollNumber = sanitizeText(getVal(9));
                    const aadhar = sanitizeText(getVal(18));
                    const sessionName = sessionColIdx > 0 ? getVal(sessionColIdx) : ''; // How to validate session?
                    // Default to active session if missing?

                    // Roll Number Validation
                    if (className && section && rollNumber) {
                        const key = `${sessionName}-${className}-${section}-${rollNumber}`.toLowerCase();

                        if (fileRollKeys.has(key)) {
                            warnings.push({ row: rowNumber, field: 'rollNumber', value: rollNumber, message: `Duplicate Roll Number '${rollNumber}' in file. Will be auto-corrected.` });
                        }
                        fileRollKeys.add(key);

                        // Check Pre-existing
                        // Note: existingRollMap keys rely on sessionName from DB. 
                        // File sessionName might differ. 
                        // Ideally we resolve sessionName to ID and use that for key, but here we only have strings.
                        // We'll skip strict session-based check for now or assume match.

                        // Simplified check: if exact key match
                        if (existingRollMap.has(key)) {
                            const existingOwnerId = existingRollMap.get(key);
                            if (existingOwnerId !== studentId) {
                                warnings.push({ row: rowNumber, field: 'rollNumber', value: rollNumber, message: `Roll Number '${rollNumber}' already taken in system. Will be auto-corrected.` });
                            }
                        }
                    }

                    // Aadhar Validation
                    if (aadhar) {
                        if (fileAadhars.has(aadhar)) {
                            errors.push({ row: rowNumber, field: 'aadharCardNo', value: aadhar, message: `Duplicate Aadhar Number '${aadhar}' in file` });
                        }
                        if (existingAadhars.has(aadhar)) {
                            // If existing student is SAME as current (update case), ignore?
                            // But here checks logic is generic. 
                            // For import, we usually skip existing IDs.
                            // If ID exists, we don't error on Aadhar usually.
                            // Let's assume strict uniqueness for new students.
                        }
                        fileAadhars.add(aadhar);
                    }
                }
            }

            return {
                isValid: errors.length === 0,
                totalRows,
                validRows: totalRows - new Set(errors.map(e => e.row)).size,
                errorCount: errors.length,
                errors,
                warnings,
            };

        } catch (error: any) {
            console.error('Validation Error:', error);
            return {
                isValid: false,
                totalRows: 0,
                validRows: 0,
                errorCount: 1,
                errors: [{
                    row: 0,
                    field: 'file',
                    value: '',
                    message: `Critical Validation Error: ${error.message || 'Unknown error'}`
                }],
                warnings: [],
            };
        }
    }

    async validateDemandBillsImport(file: Express.Multer.File): Promise<ValidationResultDto> {
        const { Readable } = require('stream');
        const ExcelJS = require('exceljs');

        try {
            const stream = Readable.from(file.buffer);
            const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(stream, {
                sharedStrings: 'cache',
                hyperlinks: 'ignore',
                worksheets: 'emit',
                styles: 'ignore',
            });

            const errors: ValidationErrorDto[] = [];
            const warnings: ValidationErrorDto[] = [];
            let totalRows = 0;
            let targetSheetFound = false;

            // Fetch reference data
            const [students, feeTypes, allSessions] = await Promise.all([
                this.prisma.studentDetails.findMany({ select: { studentId: true } }),
                this.prisma.feeType.findMany(),
                this.prisma.academicSession.findMany(),
            ]);

            const studentSet = new Set(students.map(s => s.studentId));
            const feeTypeMap = new Set(feeTypes.map(f => f.name));

            // Fetch existing bill numbers from database to check for true duplicates
            const existingBills = await this.prisma.demandBill.findMany({ select: { billNo: true } });
            const existingBillNos = new Set(existingBills.map(b => b.billNo));

            // Track unique bill numbers in file (for info only, not error since grouping is allowed)
            const fileBillNos = new Set<string>();

            for await (const worksheetReader of workbookReader) {
                let isTargetSheet = false;
                let headerChecked = false;
                let sessionColIdx = -1;

                for await (const row of worksheetReader) {
                    if (row.number === 1) {
                        const headers: string[] = [];
                        if (Array.isArray(row.values)) {
                            row.values.forEach((val: any, idx: number) => {
                                const header = String(val).trim();
                                if (header) headers.push(header);
                                if (header === 'Session Name') sessionColIdx = idx;
                            });
                        }

                        const headerStr = headers.join(',').toLowerCase();
                        if (headerStr.includes('bill no') && headerStr.includes('month')) {
                            isTargetSheet = true;
                            targetSheetFound = true;
                        }
                        headerChecked = true;
                        continue;
                    }

                    if (!isTargetSheet) continue;
                    totalRows++;

                    const getVal = (idx: number) => {
                        const cell = row.getCell(idx);
                        return cell && cell.text ? cell.text.trim() : (cell.value ? String(cell.value).trim() : '');
                    };

                    const rowNumber = row.number;
                    const studentId = getVal(1);
                    const billNo = getVal(2);
                    const feeTypeName = getVal(7);
                    const status = getVal(14).toUpperCase();

                    if (!studentId || !billNo || !feeTypeName) {
                        errors.push({ row: rowNumber, field: 'required', value: '', message: 'Missing Student ID, Bill No, or Fee Type' });
                        continue;
                    }

                    if (!studentSet.has(studentId)) {
                        errors.push({ row: rowNumber, field: 'studentId', value: studentId, message: 'Student ID not found' });
                    }

                    // Check if billNo already exists in database (only report once per billNo)
                    if (existingBillNos.has(billNo) && !fileBillNos.has(billNo)) {
                        errors.push({ row: rowNumber, field: 'billNo', value: billNo, message: 'Bill No already exists in system' });
                    }
                    // Note: Multiple rows with same billNo in file is ALLOWED (they are grouped as one bill with multiple line items)
                    fileBillNos.add(billNo);

                    // Check Fee Type (Warning only as it auto-creates)
                    if (!feeTypeMap.has(feeTypeName)) {
                        warnings.push({ row: rowNumber, field: 'feeTypeName', value: feeTypeName, message: 'New Fee Type will be created' });
                    }

                    // Check Status Enum
                    const validStatuses = ['PENDING', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'];
                    if (status && !validStatuses.includes(status)) {
                        errors.push({ row: rowNumber, field: 'status', value: status, message: `Invalid Status. Allowed: ${validStatuses.join(', ')}` });
                    }
                }
            }

            return {
                isValid: errors.length === 0,
                totalRows,
                validRows: totalRows - new Set(errors.map(e => e.row)).size,
                errorCount: errors.length,
                errors,
                warnings,
            };

        } catch (error: any) {
            console.error('Validation Error:', error);
            return {
                isValid: false,
                totalRows: 0,
                validRows: 0,
                errorCount: 1,
                errors: [{
                    row: 0,
                    field: 'file',
                    value: '',
                    message: `Critical Validation Error: ${error.message || 'Unknown error'}`
                }],
                warnings: [],
            };
        }
    }

    // ============================================
    // HELPERS FOR DATA CLEANING
    // ============================================

    /**
     * Parse Section from "Class-A" or "A" format
     * Returns the part after the last hyphen if present
     */
    private parseSection(raw: string): string | null {
        if (!raw) return null;
        if (raw.includes('-')) {
            const parts = raw.split('-');
            return parts[parts.length - 1].trim(); // Take last part
        }
        return raw.trim();
    }

    /**
     * Parse Route Code from "R10: Route Name" or "R10" format
     * Returns the part before the first colon
     */
    private parseRouteCode(raw: string): string | null {
        if (!raw) return null;
        if (raw.includes(':')) {
            return raw.split(':')[0].trim();
        }
        return raw.trim();
    }

    /**
     * Parse Route Stop from "R10 - Market" or "Market" format
     * Returns the part after the first hyphen
     */
    private parseRouteStop(raw: string): string | null {
        if (!raw) return null;
        if (raw.includes(' - ')) {
            const parts = raw.split(' - ');
            if (parts.length > 1) {
                return parts.slice(1).join(' - ').trim(); // Join rest in case of multiple hyphens
            }
        }
        return raw.trim();
    }

    private parseDate(dateStr: string): Date | null {
        return parseDateDDMMYYYY(dateStr);
    }
    // ============================================


    // ============================================
    // IMPORT OPERATIONS
    // ============================================

    async importStudents(file: Express.Multer.File, options?: { skipOnError?: boolean }): Promise<ImportResultDto> {
        // First validate
        const validation = await this.validateStudentsImport(file);
        if (!validation.isValid && !options?.skipOnError) {
            return {
                success: false,
                totalRows: validation.totalRows,
                imported: 0,
                skipped: validation.totalRows,
                errors: validation.errors,
            };
        }


        const { Readable } = require('stream');
        const ExcelJS = require('exceljs');
        const stream = Readable.from(file.buffer);
        const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(stream, {
            sharedStrings: 'cache',
            hyperlinks: 'ignore',
            worksheets: 'emit',
            styles: 'ignore',
        });

        // Fetch Reference Data
        const activeSession = await this.prisma.academicSession.findFirst({ where: { isActive: true } });
        if (!activeSession) {
            return {
                success: false,
                totalRows: 0,
                imported: 0,
                skipped: 0,
                errors: [{ row: 0, field: 'session', value: '', message: 'No active academic session found' }],
                details: [],
            };
        }

        const routes = await this.prisma.route.findMany({
            where: { status: 'active' },
            include: { stops: true },
        });
        const routeMap = new Map(routes.map(r => [r.routeCode, r]));

        const allSessions = await this.prisma.academicSession.findMany();
        const sessionMap = new Map(allSessions.map(s => [s.name, s]));

        // Prefetch used roll numbers
        const allStudentDetails = await this.prisma.studentDetails.findMany({
            select: { sessionId: true, className: true, section: true, rollNumber: true }
        });

        const usedRollNumbers = new Map<string, Set<string>>();
        allStudentDetails.forEach(s => {
            if (s.sessionId && s.className && s.section && s.rollNumber) {
                const key = `${s.sessionId}-${s.className}-${s.section}`.toLowerCase();
                if (!usedRollNumbers.has(key)) {
                    usedRollNumbers.set(key, new Set());
                }
                usedRollNumbers.get(key)!.add(s.rollNumber.toLowerCase());
            }
        });

        const errors: ValidationErrorDto[] = [];
        const importDetails: any[] = [];
        let imported = 0;
        let skipped = 0;
        let totalRows = 0;

        for await (const worksheetReader of workbookReader) {
            let isTargetSheet = false;
            let headerChecked = false;
            let sessionColIdx = -1;

            for await (const row of worksheetReader) {
                if (row.number === 1) {
                    // Header Row Analysis
                    const headers: string[] = [];
                    if (Array.isArray(row.values)) {
                        row.values.forEach((val: any, idx: number) => {
                            const header = String(val).trim();
                            if (header) headers.push(header);
                            if (header === 'Session Name') {
                                sessionColIdx = idx;
                            }
                        });
                    }

                    // Check if this is the Students sheet based on headers
                    // Look for key columns: "Student ID" and "Name"
                    const headerStr = headers.join(',').toLowerCase();
                    if (headerStr.includes('student id') && headerStr.includes('father name')) {
                        isTargetSheet = true;
                    }

                    headerChecked = true;
                    continue;
                }

                if (!isTargetSheet) continue; // Skip rows if this is not the target sheet

                totalRows++;
                const rowNumber = row.number;

                const getVal = (idx: number) => {
                    const cell = row.getCell(idx);
                    return cell && cell.text ? cell.text.trim() : (cell.value ? String(cell.value).trim() : '');
                };

                try {
                    const studentId = getVal(1);
                    const name = getVal(2) || '';
                    const fatherName = getVal(3) || '';

                    if (!studentId) {
                        skipped++;
                        importDetails.push({ row: rowNumber, status: 'skipped', reason: 'Missing Student ID' });
                        continue;
                    }

                    // Check existing
                    const existing = await this.prisma.studentDetails.findUnique({ where: { studentId } });
                    if (existing) {
                        const nameMatch = existing.name?.toLowerCase().trim() === name.toLowerCase().trim();
                        const fatherMatch = existing.fatherName?.toLowerCase().trim() === fatherName.toLowerCase().trim();

                        if (nameMatch && fatherMatch) {
                            skipped++;
                            // Track duplicate for reporting
                            importDetails.push({ row: rowNumber, status: 'skipped', studentId, reason: `Already exists (duplicate)` });
                            continue;
                        }

                        if (options?.skipOnError) {
                            skipped++;
                            importDetails.push({ row: rowNumber, status: 'skipped', studentId, reason: `Duplicate ID: Conflicts with '${existing.name}'` });
                            continue;
                        }
                        errors.push({ row: rowNumber, field: 'studentId', value: studentId, message: `Already exists (System: ${existing.name})` });
                        importDetails.push({ row: rowNumber, status: 'failed', studentId, reason: `Duplicate ID error` });
                        continue;
                    }

                    const className = getVal(7) || '';
                    let status = getVal(15).toLowerCase() || 'active';
                    if (className === 'PASS OUT' || className === 'Pass Out') {
                        status = 'alumni';
                    }

                    const rawSection = getVal(8);
                    const cleanSection = this.parseSection(rawSection) || 'A';

                    const dobStr = getVal(5);
                    const admDateStr = getVal(10);
                    const dob = parseDateDDMMYYYY(dobStr) || new Date(); // Helper function assumed global
                    const admDate = parseDateDDMMYYYY(admDateStr) || new Date();

                    const studentData = {
                        studentId,
                        name,
                        fatherName,
                        motherName: getVal(4) || '',
                        dob,
                        gender: getVal(6).toLowerCase() || 'male',
                        className,
                        section: cleanSection,
                        rollNumber: sanitizeText(getVal(9)), // Helper function assumed global
                        admissionDate: admDate,
                        address: getVal(11) || '',
                        phone: getVal(12) || '',
                        whatsAppNo: sanitizeText(getVal(13)),
                        email: sanitizeText(getVal(14)),
                        status,
                        category: getVal(16) || 'NA',
                        religion: sanitizeText(getVal(17)),
                        aadharCardNo: sanitizeText(getVal(18)),
                        apaarId: sanitizeText(getVal(19)),
                        fatherOccupation: sanitizeText(getVal(20)),
                        fatherAadharNo: sanitizeText(getVal(21)),
                        fatherPanNo: sanitizeText(getVal(22)),
                        motherOccupation: sanitizeText(getVal(23)),
                        motherAadharNo: sanitizeText(getVal(24)),
                        motherPanNo: sanitizeText(getVal(25)),
                        guardianRelation: sanitizeText(getVal(26)),
                        guardianName: sanitizeText(getVal(27)),
                        guardianPhone: sanitizeText(getVal(28)),
                        guardianEmail: sanitizeText(getVal(29)),
                        sessionId: (() => {
                            const fileSessionName = sessionColIdx > 0 ? getVal(sessionColIdx) : '';
                            if (fileSessionName && sessionMap.has(fileSessionName)) {
                                return sessionMap.get(fileSessionName)!.id;
                            }
                            return activeSession.id;
                        })(),
                    };

                    // Auto-increment logic
                    if (studentData.sessionId && studentData.className && studentData.section && studentData.rollNumber) {
                        const key = `${studentData.sessionId}-${studentData.className}-${studentData.section}`.toLowerCase();
                        if (!usedRollNumbers.has(key)) {
                            usedRollNumbers.set(key, new Set());
                        }
                        const usedSet = usedRollNumbers.get(key)!;
                        let currentRoll = studentData.rollNumber;

                        if (usedSet.has(currentRoll.toLowerCase())) {
                            let attempts = 0;
                            let suffixCode = 65;
                            while (usedSet.has(currentRoll.toLowerCase()) && attempts < 100) {
                                const suffix = String.fromCharCode(suffixCode);
                                currentRoll = `${studentData.rollNumber}${suffix}`;
                                suffixCode++;
                                attempts++;
                                if (suffixCode > 90) currentRoll = `${studentData.rollNumber}-${attempts}`;
                            }
                            if (currentRoll !== studentData.rollNumber) {
                                studentData.rollNumber = currentRoll;
                                importDetails.push({ row: rowNumber, status: 'warning', studentId, reason: `Roll updated to ${currentRoll}` });
                            }
                        }
                        usedSet.add(studentData.rollNumber.toLowerCase());
                    }

                    await this.prisma.studentDetails.create({ data: studentData });

                    // Transport
                    const rawRouteCode = getVal(30);
                    const routeCode = this.parseRouteCode(rawRouteCode);
                    if (routeCode) {
                        const route = routeMap.get(routeCode);
                        if (route) {
                            const pickupStopName = this.parseRouteStop(getVal(31));
                            const dropStopName = this.parseRouteStop(getVal(32));
                            const transportType = getVal(33) || 'both';

                            const pickupStop = route.stops.find((s: any) => s.stopName === pickupStopName);
                            const dropStop = route.stops.find((s: any) => s.stopName === dropStopName);

                            await this.prisma.studentTransport.create({
                                data: {
                                    studentId,
                                    routeId: route.id,
                                    pickupStopId: pickupStop?.id || null,
                                    dropStopId: dropStop?.id || null,
                                    transportType,
                                    startDate: new Date(),
                                    status: 'active',
                                },
                            });
                        }
                    }

                    // Opening Balance
                    const previousDues = parseFloat(getVal(34)) || 0;
                    if (previousDues > 0) {
                        const now = new Date();
                        await this.prisma.demandBill.create({
                            data: {
                                billNo: `OB-${studentId}-${Date.now()}`,
                                studentId,
                                sessionId: activeSession.id,
                                month: now.getMonth() + 1,
                                year: now.getFullYear(),
                                billDate: now,
                                dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
                                totalAmount: previousDues,
                                previousDues: previousDues,
                                netAmount: previousDues,
                                status: 'PENDING',
                            },
                        });
                    }

                    imported++;

                } catch (error: any) {
                    const isDuplicate = error.code === 'P2002' || error.message?.includes('Unique constraint');
                    if (isDuplicate) {
                        skipped++;
                        continue;
                    }
                    errors.push({ row: rowNumber, field: 'general', value: '', message: error.message || 'Error' });
                    importDetails.push({ row: rowNumber, status: 'failed', reason: error.message });
                    if (!options?.skipOnError) {
                        // In streaming, stopping abruptly is messy, maybe better to accumulate errors and stop if critical?
                        // But original logic returned immediately.
                        return {
                            success: false,
                            totalRows,
                            imported,
                            skipped,
                            errors,
                            details: importDetails,
                        };
                    }
                    skipped++;
                }
            }
        }

        return {
            success: errors.length === 0,
            totalRows,
            imported,
            skipped,
            errors,
            details: importDetails,
        };
    }
    async importFeeReceipts(file: Express.Multer.File, options?: { skipOnError?: boolean }): Promise<ImportResultDto> {
        const { Readable } = require('stream');
        const ExcelJS = require('exceljs');
        const stream = Readable.from(file.buffer);
        const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(stream, {
            sharedStrings: 'cache',
            hyperlinks: 'ignore',
            worksheets: 'emit',
            styles: 'ignore',
        });

        const activeSession = await this.prisma.academicSession.findFirst({ where: { isActive: true } });
        if (!activeSession) {
            return {
                success: false,
                totalRows: 0,
                imported: 0,
                skipped: 0,
                errors: [{ row: 0, field: 'session', value: '', message: 'No active academic session found' }]
            };
        }

        const feeTypes = await this.prisma.feeType.findMany();
        const feeTypeMap = new Map(feeTypes.map(f => [f.name, f]));
        const allSessions = await this.prisma.academicSession.findMany();
        const sessionMap = new Map(allSessions.map(s => [s.name, s]));

        const errors: ValidationErrorDto[] = [];
        const importDetails: any[] = [];
        let totalRows = 0;
        const stats = { imported: 0, skipped: 0 };

        let currentBatch: any[] = [];
        let currentReceiptNo: string | null = null;

        for await (const worksheetReader of workbookReader) {
            let isTargetSheet = false;
            let headerChecked = false;
            let sessionColIdx = -1;

            for await (const row of worksheetReader) {
                if (row.number === 1) {
                    const headers: string[] = [];
                    if (Array.isArray(row.values)) {
                        row.values.forEach((val: any, idx: number) => {
                            const header = String(val).trim();
                            if (header) headers.push(header);
                            if (header === 'Session Name') sessionColIdx = idx;
                        });
                    }

                    // Identify Fee Receipts sheet: "Receipt No" and "Amount"
                    const headerStr = headers.join(',').toLowerCase();
                    if (headerStr.includes('receipt no') && headerStr.includes('amount')) {
                        isTargetSheet = true;
                    }

                    headerChecked = true;
                    continue;
                }

                if (!isTargetSheet) continue;

                totalRows++;
                const getVal = (idx: number) => {
                    const cell = row.getCell(idx);
                    return cell && cell.text ? cell.text.trim() : (cell.value ? String(cell.value).trim() : '');
                };

                const receiptNo = getVal(2);
                if (!receiptNo) continue;

                const rowData = {
                    rowNumber: row.number,
                    studentId: getVal(1),
                    receiptNo,
                    receiptDate: getVal(3),
                    feeTypeName: getVal(4),
                    amount: parseFloat(getVal(5)) || 0,
                    discount: parseFloat(getVal(6)) || 0,
                    netAmount: parseFloat(getVal(7)) || 0,
                    paymentMode: getVal(8).toLowerCase() || 'cash',
                    paymentRef: getVal(9),
                    collectedBy: getVal(10),
                    remarks: getVal(11),
                    sessionName: sessionColIdx > 0 ? getVal(sessionColIdx) : '',
                };

                if (currentReceiptNo && receiptNo !== currentReceiptNo) {
                    await this.processReceiptBatch(currentBatch, activeSession, sessionMap, feeTypeMap, errors, stats);
                    currentBatch = [];
                }
                currentBatch.push(rowData);
                currentReceiptNo = receiptNo;
            }
            if (currentBatch.length > 0) {
                await this.processReceiptBatch(currentBatch, activeSession, sessionMap, feeTypeMap, errors, stats);
                currentBatch = [];
                currentReceiptNo = null;
            }
        }

        return {
            success: errors.length === 0,
            totalRows,
            imported: stats.imported,
            skipped: stats.skipped,
            errors,
            details: importDetails
        };
    }

    async importDemandBills(file: Express.Multer.File, options?: { skipOnError?: boolean }): Promise<ImportResultDto> {
        const { Readable } = require('stream');
        const ExcelJS = require('exceljs');
        const stream = Readable.from(file.buffer);
        const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(stream, {
            sharedStrings: 'cache',
            hyperlinks: 'ignore',
            worksheets: 'emit',
            styles: 'ignore',
        });

        const activeSession = await this.prisma.academicSession.findFirst({ where: { isActive: true } });
        if (!activeSession) {
            return {
                success: false,
                totalRows: 0,
                imported: 0,
                skipped: 0,
                errors: [{ row: 0, field: 'session', value: '', message: 'No active academic session found' }]
            };
        }

        const feeTypes = await this.prisma.feeType.findMany();
        const feeTypeMap = new Map(feeTypes.map(f => [f.name, f]));
        const allSessions = await this.prisma.academicSession.findMany();
        const sessionMap = new Map(allSessions.map(s => [s.name, s]));

        const errors: ValidationErrorDto[] = [];
        let totalRows = 0;
        const stats = { imported: 0, skipped: 0 };

        let currentBatch: any[] = [];
        let currentBillNo: string | null = null;

        for await (const worksheetReader of workbookReader) {
            let isTargetSheet = false;
            let headerChecked = false;
            let sessionColIdx = -1;

            for await (const row of worksheetReader) {
                if (row.number === 1) {
                    const headers: string[] = [];
                    if (Array.isArray(row.values)) {
                        row.values.forEach((val: any, idx: number) => {
                            const header = String(val).trim();
                            if (header) headers.push(header);
                            if (header === 'Session Name') sessionColIdx = idx;
                        });
                    }

                    // Identify Demand Bills sheet: "Bill No" and "Month"
                    const headerStr = headers.join(',').toLowerCase();
                    if (headerStr.includes('bill no') && headerStr.includes('month')) {
                        isTargetSheet = true;
                    }

                    headerChecked = true;
                    continue;
                }

                if (!isTargetSheet) continue;
                totalRows++;
                const getVal = (idx: number) => {
                    const cell = row.getCell(idx);
                    return cell && cell.text ? cell.text.trim() : (cell.value ? String(cell.value).trim() : '');
                };

                const billNo = getVal(2);
                if (!billNo) continue;

                const rowData = {
                    rowNumber: row.number,
                    studentId: getVal(1),
                    billNo,
                    billDate: getVal(3),
                    dueDate: getVal(4),
                    month: parseInt(getVal(5)) || 1,
                    year: parseInt(getVal(6)) || new Date().getFullYear(),
                    feeTypeName: getVal(7),
                    amount: parseFloat(getVal(8)) || 0,
                    discount: parseFloat(getVal(9)) || 0,
                    previousDues: parseFloat(getVal(10)) || 0,
                    lateFee: parseFloat(getVal(11)) || 0,
                    netAmount: parseFloat(getVal(12)) || 0,
                    paidAmount: parseFloat(getVal(13)) || 0,
                    status: getVal(14).toUpperCase() || 'PENDING',
                    sessionName: sessionColIdx > 0 ? getVal(sessionColIdx) : '',
                };

                if (currentBillNo && billNo !== currentBillNo) {
                    try {
                        await this.processDemandBillBatch(currentBatch, activeSession, sessionMap, feeTypeMap, errors, stats);
                    } catch (batchError: any) {
                        // Catch batch processing error
                        console.error('Batch Error:', batchError);
                        errors.push({ row: currentBatch[0]?.rowNumber || 0, field: 'batch', value: 'batch', message: batchError.message || 'Batch processing failed' });
                    }
                    currentBatch = [];
                }
                currentBatch.push(rowData);
                currentBillNo = billNo;
            }
            if (currentBatch.length > 0) {
                try {
                    await this.processDemandBillBatch(currentBatch, activeSession, sessionMap, feeTypeMap, errors, stats);
                } catch (batchError: any) {
                    // Catch batch processing error
                    console.error('Batch Error:', batchError);
                    errors.push({ row: currentBatch[0]?.rowNumber || 0, field: 'batch', value: 'batch', message: batchError.message || 'Batch processing failed' });
                }
                currentBatch = [];
                currentBillNo = null;
            }
        }

        return {
            success: errors.length === 0,
            totalRows,
            imported: stats.imported,
            skipped: stats.skipped,
            errors,
        };
    }

    // Helper: Parse Date (DD-MM-YYYY)
    private parseDateHelper(dateStr: string): Date | null {
        if (!dateStr) return null;
        try {
            const parts = dateStr.split(/[-/.]/);
            if (parts.length === 3) {
                // Assume DD-MM-YYYY
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                const date = new Date(year, month, day);
                if (!isNaN(date.getTime())) return date;
            }
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) return date;
            return null;
        } catch (e) {
            return null;
        }
    }

    private async processReceiptBatch(batch: any[], activeSession: any, sessionMap: Map<string, any>, feeTypeMap: Map<string, any>, errors: ValidationErrorDto[], stats: any) { // Removed separate simple import/skip args
        const first = batch[0];
        const { receiptNo, studentId } = first; // Assuming all same

        // Validate Student
        const student = await this.prisma.studentDetails.findUnique({ where: { studentId } });
        if (!student) {
            errors.push({ row: first.rowNumber, field: 'studentId', value: studentId, message: 'Student not found' });
            stats.skipped += batch.length;
            return;
        }

        // Validate Duplicate Receipt
        const existing = await this.prisma.feeTransaction.findUnique({ where: { receiptNo } });
        if (existing) {
            errors.push({ row: first.rowNumber, field: 'receiptNo', value: receiptNo, message: 'Receipt already exists' });
            stats.skipped += batch.length;
            return;
        }

        // Prepare items
        const paymentDetailsCreate: any[] = [];
        let totalAmount = 0;

        for (const item of batch) {
            let feeType = feeTypeMap.get(item.feeTypeName);
            if (!feeType) {
                // Auto create logic (simplified)
                try {
                    feeType = await this.prisma.feeType.create({ data: { name: item.feeTypeName, description: 'Auto', isActive: true, isDefault: false, isRecurring: false } });
                    feeTypeMap.set(item.feeTypeName, feeType);
                } catch (e) {
                    feeType = await this.prisma.feeType.findFirst({ where: { name: item.feeTypeName } }) ?? undefined;
                }
            }
            if (!feeType) {
                errors.push({ row: item.rowNumber, field: 'feeTypeName', value: item.feeTypeName, message: 'Fee Type not found' });
                continue;
            }

            paymentDetailsCreate.push({
                feeTypeId: feeType.id,
                amount: item.amount,
                discountAmount: item.discount,
                netAmount: item.netAmount
            });
            totalAmount += item.netAmount;
        }

        if (paymentDetailsCreate.length === 0) {
            stats.skipped += batch.length;
            return;
        }

        let targetSessionId = activeSession.id;
        if (first.sessionName && sessionMap.has(first.sessionName)) targetSessionId = sessionMap.get(first.sessionName).id;

        const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        await this.prisma.feeTransaction.create({
            data: {
                transactionId,
                studentId,
                sessionId: targetSessionId,
                receiptNo,
                amount: totalAmount,
                description: 'Imported',
                date: this.parseDateHelper(first.receiptDate) || new Date(),
                yearId: targetSessionId,
                remarks: first.remarks,
                collectedBy: first.collectedBy,
                paymentDetails: { create: paymentDetailsCreate },
                paymentModeDetails: {
                    create: {
                        paymentMode: first.paymentMode || 'cash',
                        amount: totalAmount,
                        reference: first.paymentRef
                    }
                }
            }
        });
        stats.imported += batch.length;
    }

    private async processDemandBillBatch(batch: any[], activeSession: any, sessionMap: Map<string, any>, feeTypeMap: Map<string, any>, errors: ValidationErrorDto[], stats: any) {
        const first = batch[0];
        const { billNo, studentId } = first;

        const student = await this.prisma.studentDetails.findUnique({ where: { studentId } });
        if (!student) {
            errors.push({ row: first.rowNumber, field: 'studentId', value: studentId, message: 'Student not found' });
            stats.skipped += batch.length;
            return;
        }

        const existing = await this.prisma.demandBill.findUnique({ where: { billNo } });
        if (existing) {
            errors.push({ row: first.rowNumber, field: 'billNo', value: billNo, message: 'Bill exists' });
            stats.skipped += batch.length;
            return;
        }

        let targetSessionId = activeSession.id;
        if (first.sessionName && sessionMap.has(first.sessionName)) targetSessionId = sessionMap.get(first.sessionName).id;

        const billItemsCreate: any[] = [];
        let totalAmount = 0;
        let totalDiscount = 0;
        let totalNet = 0;

        for (const item of batch) {
            let feeType = feeTypeMap.get(item.feeTypeName);
            if (!feeType) {
                try {
                    feeType = await this.prisma.feeType.create({ data: { name: item.feeTypeName, description: 'Auto', isActive: true, isDefault: false, isRecurring: false } });
                    feeTypeMap.set(item.feeTypeName, feeType);
                } catch (e) {
                    feeType = await this.prisma.feeType.findFirst({ where: { name: item.feeTypeName } }) ?? undefined;
                }
            }
            if (!feeType) continue; // Skip item if fee type issue

            billItemsCreate.push({
                feeTypeId: feeType.id,
                amount: item.amount,
                discountAmount: item.discount,
                description: 'Imported'
            });
            totalAmount += item.amount;
            totalDiscount += item.discount;
            totalNet += item.netAmount;
        }

        if (billItemsCreate.length === 0) {
            stats.skipped += batch.length;
            return;
        }

        const finalBillAmount = totalNet + first.lateFee + first.previousDues;

        await this.prisma.demandBill.create({
            data: {
                billNo,
                studentId,
                sessionId: targetSessionId,
                month: first.month,
                year: first.year,
                billDate: this.parseDateHelper(first.billDate) || new Date(),
                dueDate: this.parseDateHelper(first.dueDate) || new Date(),
                totalAmount,
                previousDues: first.previousDues,
                lateFee: first.lateFee,
                discount: totalDiscount,
                netAmount: finalBillAmount,
                paidAmount: first.paidAmount,
                status: first.status as any,
                billItems: { create: billItemsCreate }
            }
        });
        stats.imported += batch.length;
    }

    async importDiscounts(file: Express.Multer.File, options?: { skipOnError?: boolean }): Promise<ImportResultDto> {
        const { Readable } = require('stream');
        const ExcelJS = require('exceljs');
        const stream = Readable.from(file.buffer);
        const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(stream, {
            sharedStrings: 'cache',
            hyperlinks: 'ignore',
            worksheets: 'emit',
            styles: 'ignore',
        });

        const activeSession = await this.prisma.academicSession.findFirst({ where: { isActive: true } });
        if (!activeSession) {
            return {
                success: false,
                totalRows: 0,
                imported: 0,
                skipped: 0,
                errors: [{ row: 0, field: 'session', value: '', message: 'No active academic session found' }],
            };
        }

        const feeTypes = await this.prisma.feeType.findMany();
        const feeTypeMap = new Map(feeTypes.map(f => [f.name, f]));
        const allSessions = await this.prisma.academicSession.findMany();
        const sessionMap = new Map(allSessions.map(s => [s.name, s]));

        const errors: ValidationErrorDto[] = [];
        let imported = 0;
        let skipped = 0;
        let totalRows = 0;

        for await (const worksheetReader of workbookReader) {
            let isTargetSheet = false;
            let headerChecked = false;
            let sessionColIdx = -1;

            for await (const row of worksheetReader) {
                if (row.number === 1) {
                    const headers: string[] = [];
                    if (Array.isArray(row.values)) {
                        row.values.forEach((val: any, idx: number) => {
                            const header = String(val).trim();
                            if (header) headers.push(header);
                            if (header === 'Session Name') sessionColIdx = idx;
                        });
                    }

                    // Identify Discounts sheet: "Discount Type" and "Reason"
                    const headerStr = headers.join(',').toLowerCase();
                    if (headerStr.includes('discount type') && headerStr.includes('reason')) {
                        isTargetSheet = true;
                    }

                    headerChecked = true;
                    continue;
                }

                if (!isTargetSheet) continue;
                totalRows++;

                const getVal = (idx: number) => {
                    const cell = row.getCell(idx);
                    return cell && cell.text ? cell.text.trim() : (cell.value ? String(cell.value).trim() : '');
                };

                const studentId = getVal(1);
                const feeTypeName = getVal(2);
                if (!studentId || !feeTypeName) {
                    skipped++;
                    continue;
                }

                try {
                    const discountType = getVal(3).toUpperCase() || 'FIXED';
                    const discountValue = parseFloat(getVal(4)) || 0;
                    const reason = getVal(5);
                    const approvedBy = getVal(6);

                    const student = await this.prisma.studentDetails.findUnique({ where: { studentId } });
                    if (!student) {
                        errors.push({ row: row.number, field: 'studentId', value: studentId, message: 'Student not found' });
                        skipped++;
                        continue;
                    }

                    const feeType = feeTypeMap.get(feeTypeName);
                    if (!feeType) {
                        errors.push({ row: row.number, field: 'feeTypeName', value: feeTypeName, message: 'Fee Type not found' });
                        skipped++;
                        continue;
                    }

                    const sessionName = sessionColIdx > 0 ? getVal(sessionColIdx) : '';
                    let targetSessionId = activeSession.id;
                    if (sessionName && sessionMap.has(sessionName)) {
                        targetSessionId = sessionMap.get(sessionName)!.id;
                    }

                    await this.prisma.studentFeeDiscount.upsert({
                        where: {
                            studentId_feeTypeId_sessionId: {
                                studentId,
                                feeTypeId: feeType.id,
                                sessionId: targetSessionId,
                            },
                        },
                        update: {
                            discountType: discountType as any,
                            discountValue,
                            reason,
                            approvedBy,
                        },
                        create: {
                            studentId,
                            feeTypeId: feeType.id,
                            sessionId: targetSessionId,
                            discountType: discountType as any,
                            discountValue,
                            reason,
                            approvedBy,
                        },
                    });
                    imported++;

                } catch (error: any) {
                    errors.push({ row: row.number, field: 'general', value: '', message: error.message });
                    skipped++;
                }
            }
        }

        return {
            success: errors.length === 0,
            totalRows,
            imported,
            skipped,
            errors,
        };
    }
    async importAcademicHistory(file: Express.Multer.File, options?: { skipOnError?: boolean }): Promise<ImportResultDto> {
        const { Readable } = require('stream');
        const ExcelJS = require('exceljs');
        const stream = Readable.from(file.buffer);
        const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(stream, {
            sharedStrings: 'cache',
            hyperlinks: 'ignore',
            worksheets: 'emit',
            styles: 'ignore',
        });

        // Fetch sessions and students for validation
        const [sessions, students] = await Promise.all([
            this.prisma.academicSession.findMany(),
            this.prisma.studentDetails.findMany({ select: { studentId: true } }),
        ]);

        const sessionMap = new Map(sessions.map(s => [s.name, s]));
        const studentSet = new Set(students.map(s => s.studentId));

        const errors: ValidationErrorDto[] = [];
        let imported = 0;
        let skipped = 0;
        let totalRows = 0;

        for await (const worksheetReader of workbookReader) {
            let isTargetSheet = false;
            let headerChecked = false;

            for await (const row of worksheetReader) {
                if (row.number === 1) {
                    const headers: string[] = [];
                    if (Array.isArray(row.values)) {
                        row.values.forEach((val: any) => {
                            const header = String(val).trim();
                            if (header) headers.push(header);
                        });
                    }

                    // Identify Academic History sheet: "Final Result" and "Status" (and maybe "Student ID")
                    const headerStr = headers.join(',').toLowerCase();
                    if (headerStr.includes('final result') && headerStr.includes('status') && headerStr.includes('student id')) {
                        isTargetSheet = true;
                    }

                    headerChecked = true;
                    continue;
                }

                if (!isTargetSheet) continue;
                totalRows++;

                const getVal = (idx: number) => {
                    const cell = row.getCell(idx);
                    return cell && cell.text ? cell.text.trim() : (cell.value ? String(cell.value).trim() : '');
                };

                const studentId = getVal(1);
                const sessionName = getVal(2);
                const className = getVal(3);
                const section = getVal(4);
                const rollNumber = sanitizeText(getVal(5));
                const status = getVal(6).toLowerCase() || 'promoted';
                const finalResult = sanitizeText(getVal(7));

                if (!studentId || !sessionName || !className || !section) {
                    errors.push({ row: row.number, field: 'required', value: '', message: 'Missing required fields' });
                    skipped++;
                    continue;
                }

                if (!studentSet.has(studentId)) {
                    errors.push({ row: row.number, field: 'studentId', value: studentId, message: 'Student not found in system' });
                    skipped++;
                    continue;
                }

                const session = sessionMap.get(sessionName);
                if (!session) {
                    errors.push({ row: row.number, field: 'sessionName', value: sessionName, message: 'Session not found. Create it first.' });
                    skipped++;
                    continue;
                }

                try {
                    await this.prisma.studentAcademicHistory.upsert({
                        where: {
                            studentId_sessionId: {
                                studentId,
                                sessionId: session.id,
                            },
                        },
                        update: {
                            className,
                            section,
                            rollNo: rollNumber,
                            status,
                            finalResult,
                        },
                        create: {
                            studentId,
                            sessionId: session.id,
                            className,
                            section,
                            rollNo: rollNumber,
                            status,
                            finalResult,
                        },
                    });
                    imported++;
                } catch (error: any) {
                    errors.push({ row: row.number, field: 'general', value: '', message: error.message });
                    skipped++;
                }
            }
        }

        return {
            success: errors.length === 0,
            totalRows,
            imported,
            skipped,
            errors,
        };
    }
}
