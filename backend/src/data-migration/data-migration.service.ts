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
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer);

        const worksheet = workbook.getWorksheet('Students') || workbook.getWorksheet(1);
        if (!worksheet) {
            return {
                isValid: false,
                totalRows: 0,
                validRows: 0,
                errorCount: 1,
                errors: [{ row: 0, field: 'file', value: '', message: 'No "Students" sheet found in workbook' }],
                warnings: [],
            };
        }

        const errors: ValidationErrorDto[] = [];
        const warnings: ValidationErrorDto[] = [];
        let totalRows = 0;

        // Fetch reference data for validation
        const [classes, existingStudents, allSessions] = await Promise.all([
            this.prisma.schoolClass.findMany({ where: { isActive: true } }),
            this.prisma.studentDetails.findMany({
                select: {
                    studentId: true,
                    name: true,
                    fatherName: true,
                    aadharCardNo: true,
                    className: true,
                    section: true,
                    rollNumber: true,
                    sessionId: true, // Include session for roll key
                },
                where: { status: 'active' } // Check active students primarily
            }),
            this.prisma.academicSession.findMany(), // Fetch all sessions
        ]);

        // Create session ID -> Name map
        const sessionIdToName = new Map(allSessions.map(s => [s.id, s.name]));

        const classNames = new Set(classes.map(c => c.name));
        const existingIds = new Set(existingStudents.map(s => s.studentId));
        // Create map for smart duplicate detection
        const existingStudentMap = new Map(existingStudents.map(s => [s.studentId, s]));

        const existingAadhars = new Set(existingStudents.map(s => s.aadharCardNo).filter(Boolean));

        // Create lookup for existing Session-Class-Section-RollNo
        const existingRollKeys = new Set(
            existingStudents
                .filter(s => s.className && s.section && s.rollNumber)
                .map(s => {
                    const sessionName = s.sessionId ? (sessionIdToName.get(s.sessionId) || '') : '';
                    return `${sessionName}-${s.className}-${s.section}-${s.rollNumber}`.toLowerCase();
                })
        );

        const fileAadhars = new Set<string>();
        const fileRollKeys = new Set<string>();

        // Find Session Name Column dynamically
        let sessionColIdx = -1;
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell: any, colNumber: number) => {
            if (cell.text?.trim() === 'Session Name') {
                sessionColIdx = colNumber;
            }
        });

        worksheet.eachRow((row: any, rowNumber: number) => {
            if (rowNumber === 1) return; // Skip header
            totalRows++;

            const studentId = row.getCell(1).text?.trim();
            const name = row.getCell(2).text?.trim();
            const fatherName = row.getCell(3).text?.trim();
            const motherName = row.getCell(4).text?.trim();
            const dob = row.getCell(5).text?.trim();
            const gender = row.getCell(6).text?.trim()?.toLowerCase();
            const className = row.getCell(7).text?.trim();
            // CLEANING: Parse Section for validation consistency
            const rawSection = row.getCell(8).text?.trim();
            const section = this.parseSection(rawSection);
            const admissionDate = row.getCell(10).text?.trim();
            const address = row.getCell(11).text?.trim();
            const phone = row.getCell(12).text?.trim();

            // Required field validation
            if (!studentId) errors.push({ row: rowNumber, field: 'studentId', value: '', message: 'Student ID is required' });
            if (!name) errors.push({ row: rowNumber, field: 'name', value: '', message: 'Name is required' });
            if (!dob) errors.push({ row: rowNumber, field: 'dob', value: '', message: 'Date of Birth is required' });
            if (!gender) errors.push({ row: rowNumber, field: 'gender', value: '', message: 'Gender is required' });
            if (!className) errors.push({ row: rowNumber, field: 'className', value: '', message: 'Class is required' });
            if (!section) errors.push({ row: rowNumber, field: 'section', value: '', message: 'Section is required' });
            if (!admissionDate) errors.push({ row: rowNumber, field: 'admissionDate', value: '', message: 'Admission Date is required' });
            if (!address) errors.push({ row: rowNumber, field: 'address', value: '', message: 'Address is required' });
            if (!phone) errors.push({ row: rowNumber, field: 'phone', value: '', message: 'Phone is required' });

            // Format validation
            if (studentId && existingIds.has(studentId)) {
                // Smart Duplicate Check: If names match, treat as warning (skip), otherwise error
                const existing = existingStudentMap.get(studentId);
                const nameMatch = existing?.name?.toLowerCase().trim() === name?.toLowerCase().trim();
                const fatherMatch = existing?.fatherName?.toLowerCase().trim() === fatherName?.toLowerCase().trim();

                if (existing && nameMatch && fatherMatch) {
                    warnings.push({
                        row: rowNumber,
                        field: 'studentId',
                        value: studentId,
                        message: `Student '${name}' (ID: ${studentId}) already exists with matching data. Record will be skipped.`
                    });
                } else {
                    errors.push({
                        row: rowNumber,
                        field: 'studentId',
                        value: studentId,
                        message: `Student ID '${studentId}' exists but data mismatch (System: ${existing?.name}, File: ${name}).`
                    });
                }
            }

            if (gender && !['male', 'female', 'other'].includes(gender)) {
                errors.push({ row: rowNumber, field: 'gender', value: gender, message: 'Gender must be: male, female, or other' });
            }

            if (className && className !== 'PASS OUT' && !classNames.has(className)) {
                errors.push({ row: rowNumber, field: 'className', value: className, message: `Class '${className}' not found. Check Reference_Data sheet for valid classes.` });
            }

            if (dob && !isValidDateFormat(dob)) {
                errors.push({ row: rowNumber, field: 'dob', value: dob, message: 'Invalid date format. Use DD-MM-YYYY' });
            }

            if (admissionDate && !isValidDateFormat(admissionDate)) {
                errors.push({ row: rowNumber, field: 'admissionDate', value: admissionDate, message: 'Invalid date format. Use DD-MM-YYYY' });
            }

            if (phone && !/^\d{10,15}$/.test(phone)) {
                errors.push({ row: rowNumber, field: 'phone', value: phone, message: 'Phone must be 10-15 digits' });
            }

            // Track IDs for duplicate detection within file
            existingIds.add(studentId);

            // Roll Number Validation (within Session + Class + Section)
            const rollNumber = sanitizeText(row.getCell(9).text);
            const sessionName = sessionColIdx > 0 ? (row.getCell(sessionColIdx).text?.trim() || '') : '';
            if (className && section && rollNumber) {
                // Include session in key to allow same roll across different years
                const rollKey = `${sessionName}-${className}-${section}-${rollNumber}`.toLowerCase();

                if (fileRollKeys.has(rollKey)) {
                    errors.push({ row: rowNumber, field: 'rollNumber', value: rollNumber, message: `Duplicate Roll Number '${rollNumber}' for Class '${className}' Section '${section}' Session '${sessionName}' in file` });
                }

                if (existingRollKeys.has(rollKey)) {
                    errors.push({ row: rowNumber, field: 'rollNumber', value: rollNumber, message: `Roll Number '${rollNumber}' already exists for Class '${className}' Section '${section}' Session '${sessionName}'` });
                }

                fileRollKeys.add(rollKey);
            }

            // Aadhar Validation
            const aadhar = sanitizeText(row.getCell(18).text);

            if (aadhar) {
                if (fileAadhars.has(aadhar)) {
                    errors.push({ row: rowNumber, field: 'aadharCardNo', value: aadhar, message: `Duplicate Aadhar Number '${aadhar}' in file` });
                }
                if (existingAadhars.has(aadhar)) {
                    errors.push({ row: rowNumber, field: 'aadharCardNo', value: aadhar, message: `Aadhar Number '${aadhar}' already exists in system` });
                }
                fileAadhars.add(aadhar);
            }
        });

        return {
            isValid: errors.length === 0,
            totalRows,
            validRows: totalRows - new Set(errors.map(e => e.row)).size,
            errorCount: errors.length,
            errors,
            warnings,
        };
    }

    // ============================================
    // HELPERS FOR DATA CLEANING
    // ============================================

    /**
     * Parse Section from "Class-Section" format (e.g., "XI-Science-A" -> "A")
     * If no hyphen, returns original string.
     */
    private parseSection(value: string | undefined): string {
        if (!value) return '';
        const trimmed = value.trim();
        if (trimmed.includes('-')) {
            // Take the last part (e.g. XI-Science-A -> A)
            return trimmed.split('-').pop()!.trim();
        }
        return trimmed;
    }

    /**
     * Parse Route Code from "Code: Name" format (e.g., "R1: City Route" -> "R1")
     */
    private parseRouteCode(value: string | undefined): string | null {
        if (!value) return null;
        const trimmed = value.trim();
        if (trimmed.includes(':')) {
            return trimmed.split(':')[0].trim();
        }
        return trimmed;
    }

    /**
     * Parse Route Stop from "RouteCode - StopName" format (e.g., "R1 - Market" -> "Market")
     */
    private parseRouteStop(value: string | undefined): string | null {
        if (!value) return null;
        const trimmed = value.trim();
        // Check for " - " separator which is used in Reference Data
        if (trimmed.includes(' - ')) {
            // Return everything after the first " - "
            const parts = trimmed.split(' - ');
            return parts.slice(1).join(' - ').trim();
        }
        return trimmed;
    }

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

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer);
        const worksheet = workbook.getWorksheet('Students') || workbook.getWorksheet(1);

        // Fetch active session
        const activeSession = await this.prisma.academicSession.findFirst({ where: { isActive: true } });
        if (!activeSession) {
            return {
                success: false,
                totalRows: validation.totalRows,
                imported: 0,
                skipped: validation.totalRows,
                errors: [{ row: 0, field: 'session', value: '', message: 'No active academic session found' }],
            };
        }

        // Fetch routes for transport assignment
        const routes = await this.prisma.route.findMany({
            where: { status: 'active' },
            include: { stops: true },
        });
        const routeMap = new Map(routes.map(r => [r.routeCode, r]));

        // Fetch all sessions for lookup
        const allSessions = await this.prisma.academicSession.findMany();
        const sessionMap = new Map(allSessions.map(s => [s.name, s]));

        const errors: ValidationErrorDto[] = [];
        const importDetails: any[] = []; // Collect detailed report
        let imported = 0;
        let skipped = 0;

        // Process each row
        const rows: any[] = [];
        worksheet.eachRow((row: any, rowNumber: number) => {
            if (rowNumber === 1) return; // Skip header
            rows.push({ row, rowNumber });
        });

        for (const { row, rowNumber } of rows) {
            try {
                const studentId = row.getCell(1).text?.trim();
                const name = row.getCell(2).text?.trim() || '';
                const fatherName = row.getCell(3).text?.trim() || '';

                if (!studentId) {
                    skipped++;
                    importDetails.push({ row: rowNumber, status: 'skipped', reason: 'Missing Student ID' });
                    continue;
                }

                // Check if already exists
                const existing = await this.prisma.studentDetails.findUnique({ where: { studentId } });
                if (existing) {
                    // Smart Skip: If data matches, just skip silently (as verified duplicate)
                    const nameMatch = existing.name?.toLowerCase().trim() === name.toLowerCase().trim();
                    const fatherMatch = existing.fatherName?.toLowerCase().trim() === fatherName.toLowerCase().trim();

                    if (nameMatch && fatherMatch) {
                        skipped++;
                        importDetails.push({ row: rowNumber, status: 'skipped', studentId, reason: `Duplicate: Matched existing student '${existing.name}'` });
                        continue;
                    }

                    if (options?.skipOnError) {
                        skipped++;
                        importDetails.push({ row: rowNumber, status: 'skipped', studentId, reason: `Duplicate ID: Conflicts with '${existing.name}' (Name mismatch)` });
                        continue;
                    }
                    errors.push({ row: rowNumber, field: 'studentId', value: studentId, message: `Already exists (System: ${existing.name}, File: ${name})` });
                    importDetails.push({ row: rowNumber, status: 'failed', studentId, reason: `Duplicate ID error` });
                    continue;
                }

                // Parse remaining fields
                const className = row.getCell(7).text?.trim() || '';
                let status = row.getCell(15).text?.trim() || 'active';

                // Auto-set status to alumni if class is PASS OUT
                if (className === 'PASS OUT' || className === 'Pass Out') {
                    status = 'alumni';
                }

                // CLEANING: Parse Section
                const rawSection = row.getCell(8).text?.trim();
                const cleanSection = this.parseSection(rawSection) || 'A';

                const studentData = {
                    studentId,
                    name,
                    fatherName: fatherName || '',
                    motherName: row.getCell(4).text?.trim() || '',
                    dob: parseDateDDMMYYYY(row.getCell(5).text?.trim()) || new Date(),
                    gender: row.getCell(6).text?.trim()?.toLowerCase() || 'male',
                    className,
                    section: cleanSection, // Use cleaned section
                    rollNumber: sanitizeText(row.getCell(9).text),
                    admissionDate: parseDateDDMMYYYY(row.getCell(10).text?.trim()) || new Date(),
                    address: row.getCell(11).text?.trim() || '',
                    phone: row.getCell(12).text?.trim() || '',
                    whatsAppNo: sanitizeText(row.getCell(13).text),
                    email: sanitizeText(row.getCell(14).text),
                    status,
                    category: row.getCell(16).text?.trim() || 'NA',
                    religion: sanitizeText(row.getCell(17).text),
                    aadharCardNo: sanitizeText(row.getCell(18).text),
                    apaarId: sanitizeText(row.getCell(19).text),
                    fatherOccupation: sanitizeText(row.getCell(20).text),
                    fatherAadharNo: sanitizeText(row.getCell(21).text),
                    fatherPanNo: sanitizeText(row.getCell(22).text),
                    motherOccupation: sanitizeText(row.getCell(23).text),
                    motherAadharNo: sanitizeText(row.getCell(24).text),
                    motherPanNo: sanitizeText(row.getCell(25).text),
                    guardianRelation: sanitizeText(row.getCell(26).text),
                    guardianName: sanitizeText(row.getCell(27).text),
                    guardianPhone: sanitizeText(row.getCell(28).text),
                    guardianEmail: sanitizeText(row.getCell(29).text),
                    sessionId: (() => {
                        const fileSessionName = row.getCell(30).text?.trim();
                        if (fileSessionName && sessionMap.has(fileSessionName)) {
                            return sessionMap.get(fileSessionName)!.id;
                        }
                        // Fallback to active session if not found in file
                        return activeSession.id;
                    })(),
                };

                // Create student
                await this.prisma.studentDetails.create({ data: studentData });

                // Handle transport if specified
                // CLEANING: Parse Route Code
                const rawRouteCode = row.getCell(30).text?.trim();
                const routeCode = this.parseRouteCode(rawRouteCode);

                if (routeCode) {
                    const route = routeMap.get(routeCode);
                    if (route) {
                        // CLEANING: Parse Stops
                        const rawPickupStop = row.getCell(31).text?.trim();
                        const rawDropStop = row.getCell(32).text?.trim();

                        const pickupStopName = this.parseRouteStop(rawPickupStop);
                        const dropStopName = this.parseRouteStop(rawDropStop);
                        const transportType = row.getCell(33).text?.trim() || 'both';

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

                // Handle opening balance (previous dues)
                const previousDues = parseFloat(row.getCell(34).text) || 0;
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
                // Check if it's a duplicate/unique constraint error - skip gracefully
                const isDuplicateError = error.code === 'P2002' ||
                    error.message?.includes('Unique constraint');

                if (isDuplicateError) {
                    // Skip duplicates silently or as warnings
                    skipped++;
                    importDetails.push({ row: rowNumber, status: 'skipped', reason: `Unique constraint failed: ${error.message}` });
                    continue; // Don't add to errors, just skip
                }

                errors.push({
                    row: rowNumber,
                    field: 'general',
                    value: '',
                    message: error.message || 'Unknown error during import',
                });
                importDetails.push({ row: rowNumber, status: 'failed', reason: error.message || 'Unknown error' });
                if (!options?.skipOnError) {
                    return {
                        success: false,
                        totalRows: rows.length,
                        imported,
                        skipped,
                        errors,
                        details: importDetails,
                    };
                }
                skipped++;
            }
        }

        return {
            success: errors.length === 0,
            totalRows: rows.length,
            imported,
            skipped,
            errors,
            details: importDetails,
        };
    }

    async importFeeReceipts(file: Express.Multer.File, options?: { skipOnError?: boolean }): Promise<ImportResultDto> {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer);
        const worksheet = workbook.getWorksheet('Fee_Receipts') || workbook.getWorksheet(1);

        if (!worksheet) {
            return {
                success: false,
                totalRows: 0,
                imported: 0,
                skipped: 0,
                errors: [{ row: 0, field: 'file', value: '', message: 'No "Fee_Receipts" sheet found' }],
            };
        }

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

        const errors: ValidationErrorDto[] = [];
        let imported = 0;
        let skipped = 0;
        let totalRows = 0;

        worksheet.eachRow(async (row: any, rowNumber: number) => {
            if (rowNumber === 1) return;
            totalRows++;
        });

        const rows: any[] = [];
        worksheet.eachRow((row: any, rowNumber: number) => {
            if (rowNumber === 1) return;
            rows.push({ row, rowNumber });
        });

        // Find Session Name Column dynamically
        let sessionColIdx = -1;
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell: any, colNumber: number) => {
            if (cell.text?.trim() === 'Session Name') {
                sessionColIdx = colNumber;
            }
        });

        // Fetch sessions map
        const allSessions = await this.prisma.academicSession.findMany();
        const sessionMap = new Map(allSessions.map(s => [s.name, s]));

        // Group rows by receiptNo
        const receiptGroups = new Map<string, {
            receiptNo: string;
            studentId: string;
            receiptDate: string;
            paymentMode: string;
            paymentRef: string;
            collectedBy: string;
            remarks: string;
            sessionName: string; // Add session tracking
            items: any[];
            rowNumbers: number[];
        }>();

        for (const { row, rowNumber } of rows) {
            const receiptNo = row.getCell(2).text?.trim();
            if (!receiptNo) continue;

            if (!receiptGroups.has(receiptNo)) {
                receiptGroups.set(receiptNo, {
                    receiptNo,
                    studentId: row.getCell(1).text?.trim(),
                    receiptDate: row.getCell(3).text?.trim(),
                    paymentMode: row.getCell(8).text?.trim()?.toLowerCase() || 'cash',
                    paymentRef: row.getCell(9).text?.trim() || null,
                    collectedBy: row.getCell(10).text?.trim() || null,
                    remarks: row.getCell(11).text?.trim() || null,
                    sessionName: sessionColIdx > 0 ? row.getCell(sessionColIdx).text?.trim() : '',
                    items: [],
                    rowNumbers: []
                });
            }
            const group = receiptGroups.get(receiptNo)!;

            // Add item details
            group.items.push({
                feeTypeName: row.getCell(4).text?.trim(),
                amount: parseFloat(row.getCell(5).text) || 0,
                discount: parseFloat(row.getCell(6).text) || 0,
                netAmount: parseFloat(row.getCell(7).text) || 0,
                rowNumber
            });
            group.rowNumbers.push(rowNumber);
        }

        // Process Groups
        for (const group of receiptGroups.values()) {
            const { receiptNo, studentId, items, rowNumbers } = group;
            const firstRowNumber = rowNumbers[0];

            try {
                // Validate Header fields (from first row)
                if (!studentId || !receiptNo) {
                    errors.push({ row: firstRowNumber, field: 'required', value: '', message: 'Missing studentId or receiptNo' });
                    skipped += items.length;
                    continue;
                }

                // Check student
                const student = await this.prisma.studentDetails.findUnique({ where: { studentId } });
                if (!student) {
                    errors.push({ row: firstRowNumber, field: 'studentId', value: studentId, message: 'Student not found' });
                    skipped += items.length;
                    continue;
                }

                // Check duplicate receipt (Real check)
                const existing = await this.prisma.feeTransaction.findUnique({ where: { receiptNo } });
                if (existing) {
                    errors.push({ row: firstRowNumber, field: 'receiptNo', value: receiptNo, message: 'Receipt already exists' });
                    skipped += items.length;
                    continue;
                }

                // Build Payment Details & Calculate Totals
                const paymentDetailsCreate: any[] = [];
                let totalAmount = 0;

                for (const item of items) {
                    let feeType = feeTypeMap.get(item.feeTypeName);
                    if (!feeType) {
                        // Auto-create missing fee type
                        try {
                            const created = await this.prisma.feeType.create({
                                data: {
                                    name: item.feeTypeName,
                                    description: 'Auto-created during migration',
                                    isActive: true,
                                    isDefault: false,
                                    isRecurring: false,
                                }
                            });
                            feeType = created;
                            feeTypeMap.set(item.feeTypeName, created);
                            errors.push({
                                row: item.rowNumber,
                                field: 'feeTypeName',
                                value: item.feeTypeName,
                                message: `Fee Type '${item.feeTypeName}' was auto-created`
                            });
                        } catch (createError: any) {
                            // If creation fails (e.g. duplicate), try to find it again
                            feeType = await this.prisma.feeType.findFirst({
                                where: { name: item.feeTypeName }
                            }) ?? undefined;
                            if (!feeType) {
                                errors.push({ row: item.rowNumber, field: 'feeTypeName', value: item.feeTypeName, message: 'Fee Type not found and could not be created' });
                                continue;
                            }
                            feeTypeMap.set(item.feeTypeName, feeType);
                        }
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
                    skipped += items.length;
                    continue; // No valid items
                }

                // Resolve Session ID
                let targetSessionId = activeSession.id;
                if (group.sessionName && sessionMap.has(group.sessionName)) {
                    targetSessionId = sessionMap.get(group.sessionName)!.id;
                }

                // Create Transaction
                const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                await this.prisma.feeTransaction.create({
                    data: {
                        transactionId,
                        studentId,
                        sessionId: targetSessionId,
                        receiptNo,
                        amount: totalAmount, // Sum of net amounts
                        description: `Imported Receipt - ${items.length} items`,
                        date: parseDateDDMMYYYY(group.receiptDate) || new Date(),
                        yearId: targetSessionId,
                        remarks: group.remarks,
                        collectedBy: group.collectedBy,
                        paymentDetails: {
                            create: paymentDetailsCreate
                        },
                        paymentModeDetails: {
                            create: {
                                paymentMode: group.paymentMode,
                                amount: totalAmount,
                                reference: group.paymentRef
                            }
                        }
                    }
                });

                imported += items.length; // Count all rows as imported

            } catch (error: any) {
                errors.push({ row: firstRowNumber, field: 'general', value: '', message: error.message });
                skipped += items.length;
            }
        }

        return {
            success: errors.length === 0,
            totalRows: rows.length,
            imported,
            skipped,
            errors,
        };
    }

    async importDemandBills(file: Express.Multer.File, options?: { skipOnError?: boolean }): Promise<ImportResultDto> {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer);
        const worksheet = workbook.getWorksheet('Demand_Bills') || workbook.getWorksheet(1);

        if (!worksheet) {
            return {
                success: false,
                totalRows: 0,
                imported: 0,
                skipped: 0,
                errors: [{ row: 0, field: 'file', value: '', message: 'No "Demand_Bills" sheet found' }],
            };
        }

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

        // Fetch sessions map
        const allSessions = await this.prisma.academicSession.findMany();
        const sessionMap = new Map(allSessions.map(s => [s.name, s]));

        const errors: ValidationErrorDto[] = [];
        let imported = 0;
        let skipped = 0;

        const rows: any[] = [];
        worksheet.eachRow((row: any, rowNumber: number) => {
            if (rowNumber === 1) return;
            rows.push({ row, rowNumber });
        });

        // Find Session Name Column dynamically
        let sessionColIdx = -1;
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell: any, colNumber: number) => {
            if (cell.text?.trim() === 'Session Name') {
                sessionColIdx = colNumber;
            }
        });

        for (const { row, rowNumber } of rows) {
            try {
                const studentId = row.getCell(1).text?.trim();
                const billNo = row.getCell(2).text?.trim();
                const billDate = row.getCell(3).text?.trim();
                const dueDate = row.getCell(4).text?.trim();
                const month = parseInt(row.getCell(5).text) || 1;
                const year = parseInt(row.getCell(6).text) || new Date().getFullYear();
                const feeTypeName = row.getCell(7).text?.trim();
                const amount = parseFloat(row.getCell(8).text) || 0;
                const discount = parseFloat(row.getCell(9).text) || 0;
                const previousDues = parseFloat(row.getCell(10).text) || 0;
                const lateFee = parseFloat(row.getCell(11).text) || 0;
                const netAmount = parseFloat(row.getCell(12).text) || 0;
                const paidAmount = parseFloat(row.getCell(13).text) || 0;
                const status = row.getCell(14).text?.trim()?.toUpperCase() || 'PENDING';
                const sessionName = sessionColIdx > 0 ? row.getCell(sessionColIdx).text?.trim() : '';

                if (!studentId || !billNo || !feeTypeName) {
                    errors.push({ row: rowNumber, field: 'required', value: '', message: 'Missing required fields' });
                    skipped++;
                    continue;
                }

                const student = await this.prisma.studentDetails.findUnique({ where: { studentId } });
                if (!student) {
                    errors.push({ row: rowNumber, field: 'studentId', value: studentId, message: 'Student not found' });
                    skipped++;
                    continue;
                }

                let feeType = feeTypeMap.get(feeTypeName);
                if (!feeType) {
                    // Auto-create missing fee type
                    try {
                        const created = await this.prisma.feeType.create({
                            data: {
                                name: feeTypeName,
                                description: 'Auto-created during migration',
                                isActive: true,
                                isDefault: false,
                                isRecurring: false,
                            }
                        });
                        feeType = created;
                        feeTypeMap.set(feeTypeName, created);
                        errors.push({
                            row: rowNumber,
                            field: 'feeTypeName',
                            value: feeTypeName,
                            message: `Fee Type '${feeTypeName}' was auto-created`
                        });
                    } catch (createError: any) {
                        // If creation fails (e.g. duplicate), try to find it again
                        feeType = await this.prisma.feeType.findFirst({
                            where: { name: feeTypeName }
                        }) ?? undefined;
                        if (!feeType) {
                            errors.push({ row: rowNumber, field: 'feeTypeName', value: feeTypeName, message: 'Fee Type not found and could not be created' });
                            skipped++;
                            continue;
                        }
                        feeTypeMap.set(feeTypeName, feeType);
                    }
                }

                const existingBill = await this.prisma.demandBill.findUnique({ where: { billNo } });
                if (existingBill) {
                    errors.push({ row: rowNumber, field: 'billNo', value: billNo, message: 'Bill number already exists' });
                    skipped++;
                    continue;
                }

                // Resolve Session ID
                let targetSessionId = activeSession.id;
                if (sessionName && sessionMap.has(sessionName)) {
                    targetSessionId = sessionMap.get(sessionName)!.id;
                }

                await this.prisma.demandBill.create({
                    data: {
                        billNo,
                        studentId,
                        sessionId: targetSessionId,
                        month,
                        year,
                        billDate: parseDateDDMMYYYY(billDate) || new Date(),
                        dueDate: parseDateDDMMYYYY(dueDate) || new Date(),
                        totalAmount: amount,
                        previousDues,
                        lateFee,
                        discount,
                        netAmount,
                        paidAmount,
                        status: status as any,
                        billItems: {
                            create: {
                                feeTypeId: feeType.id,
                                amount,
                                discountAmount: discount,
                                description: `${feeTypeName} - Imported`,
                            },
                        },
                    },
                });

                imported++;
            } catch (error: any) {
                errors.push({ row: rowNumber, field: 'general', value: '', message: error.message });
                if (!options?.skipOnError) {
                    return {
                        success: false,
                        totalRows: rows.length,
                        imported,
                        skipped,
                        errors,
                    };
                }
                skipped++;
            }
        }

        return {
            success: errors.length === 0,
            totalRows: rows.length,
            imported,
            skipped,
            errors,
        };
    }

    async importDiscounts(file: Express.Multer.File, options?: { skipOnError?: boolean }): Promise<ImportResultDto> {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer);
        const worksheet = workbook.getWorksheet('Discounts') || workbook.getWorksheet(1);

        if (!worksheet) {
            return {
                success: false,
                totalRows: 0,
                imported: 0,
                skipped: 0,
                errors: [{ row: 0, field: 'file', value: '', message: 'No "Discounts" sheet found' }],
            };
        }

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

        // Fetch all sessions for lookup
        const allSessions = await this.prisma.academicSession.findMany();
        const sessionMap = new Map(allSessions.map(s => [s.name, s]));

        const errors: ValidationErrorDto[] = [];
        let imported = 0;
        let skipped = 0;

        const rows: any[] = [];
        worksheet.eachRow((row: any, rowNumber: number) => {
            if (rowNumber === 1) return;
            rows.push({ row, rowNumber });
        });

        // Find Session Name Column dynamically
        let sessionColIdx = -1;
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell: any, colNumber: number) => {
            if (cell.text?.trim() === 'Session Name') {
                sessionColIdx = colNumber;
            }
        });

        for (const { row, rowNumber } of rows) {
            try {
                const studentId = row.getCell(1).text?.trim();
                const feeTypeName = row.getCell(2).text?.trim();
                const discountType = row.getCell(3).text?.trim()?.toUpperCase() || 'FIXED';
                const discountValue = parseFloat(row.getCell(4).text) || 0;
                const reason = row.getCell(5).text?.trim() || null;
                const approvedBy = row.getCell(6).text?.trim() || null;

                if (!studentId || !feeTypeName) {
                    errors.push({ row: rowNumber, field: 'required', value: '', message: 'Missing required fields' });
                    skipped++;
                    continue;
                }

                const student = await this.prisma.studentDetails.findUnique({ where: { studentId } });
                if (!student) {
                    errors.push({ row: rowNumber, field: 'studentId', value: studentId, message: 'Student not found' });
                    skipped++;
                    continue;
                }

                const feeType = feeTypeMap.get(feeTypeName);
                if (!feeType) {
                    errors.push({ row: rowNumber, field: 'feeTypeName', value: feeTypeName, message: 'Fee Type not found' });
                    skipped++;
                    continue;
                }

                // Resolve Session ID from Session Name column (fallback to active session)
                const sessionName = sessionColIdx > 0 ? row.getCell(sessionColIdx).text?.trim() : '';
                let targetSessionId = activeSession.id;
                if (sessionName && sessionMap.has(sessionName)) {
                    targetSessionId = sessionMap.get(sessionName)!.id;
                }

                // Upsert discount (update if exists, create if not)
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
                errors.push({ row: rowNumber, field: 'general', value: '', message: error.message });
                if (!options?.skipOnError) {
                    return {
                        success: false,
                        totalRows: rows.length,
                        imported,
                        skipped,
                        errors,
                    };
                }
                skipped++;
            }
        }

        return {
            success: errors.length === 0,
            totalRows: rows.length,
            imported,
            skipped,
            errors,
        };
    }
    async importAcademicHistory(file: Express.Multer.File, options?: { skipOnError?: boolean }): Promise<ImportResultDto> {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer);
        const worksheet = workbook.getWorksheet('Academic_History') || workbook.getWorksheet(1);

        if (!worksheet) {
            return {
                success: false,
                totalRows: 0,
                imported: 0,
                skipped: 0,
                errors: [{ row: 0, field: 'file', value: '', message: 'No "Academic_History" sheet found' }],
            };
        }

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

        const rows: any[] = [];
        worksheet.eachRow((row: any, rowNumber: number) => {
            if (rowNumber === 1) return;
            rows.push({ row, rowNumber });
        });

        for (const { row, rowNumber } of rows) {
            try {
                const studentId = row.getCell(1).text?.trim();
                const sessionName = row.getCell(2).text?.trim();
                const className = row.getCell(3).text?.trim();
                const section = row.getCell(4).text?.trim();
                const rollNumber = sanitizeText(row.getCell(5).text);
                const status = row.getCell(6).text?.trim()?.toLowerCase() || 'promoted';
                const finalResult = sanitizeText(row.getCell(7).text);

                if (!studentId || !sessionName || !className || !section) {
                    errors.push({ row: rowNumber, field: 'required', value: '', message: 'Missing required fields' });
                    skipped++;
                    continue;
                }

                if (!studentSet.has(studentId)) {
                    errors.push({ row: rowNumber, field: 'studentId', value: studentId, message: 'Student not found in system' });
                    skipped++;
                    continue;
                }

                const session = sessionMap.get(sessionName);
                if (!session) {
                    errors.push({ row: rowNumber, field: 'sessionName', value: sessionName, message: 'Session not found. Create it first.' });
                    skipped++;
                    continue;
                }

                // Upsert history record
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
                errors.push({ row: rowNumber, field: 'general', value: '', message: error.message });
                if (!options?.skipOnError) {
                    return {
                        success: false,
                        totalRows: rows.length,
                        imported,
                        skipped,
                        errors,
                    };
                }
                skipped++;
            }
        }

        return {
            success: errors.length === 0,
            totalRows: rows.length,
            imported,
            skipped,
            errors,
        };
    }
}
