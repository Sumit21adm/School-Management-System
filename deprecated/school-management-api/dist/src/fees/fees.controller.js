"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeesController = void 0;
const common_1 = require("@nestjs/common");
const fees_service_1 = require("./fees.service");
const fee_collection_dto_1 = require("./dto/fee-collection.dto");
const demand_bill_dto_1 = require("./dto/demand-bill.dto");
const receipt_pdf_service_1 = require("./receipt-pdf.service");
const demand_bill_pdf_service_1 = require("./demand-bill-pdf.service");
const prisma_service_1 = require("../prisma.service");
let FeesController = class FeesController {
    feesService;
    receiptPdfService;
    demandBillPdfService;
    prisma;
    constructor(feesService, receiptPdfService, demandBillPdfService, prisma) {
        this.feesService = feesService;
        this.receiptPdfService = receiptPdfService;
        this.demandBillPdfService = demandBillPdfService;
        this.prisma = prisma;
    }
    async collectFee(dto) {
        return this.feesService.collectFee(dto);
    }
    async getStudentStatement(dto) {
        return this.feesService.getStudentStatement(dto);
    }
    async generateDemandBills(dto) {
        return this.feesService.generateDemandBills(dto);
    }
    async getBillGenerationHistory(sessionId) {
        return this.feesService.getBillGenerationHistory(sessionId);
    }
    async getStudentDashboard(studentId, sessionId) {
        return this.feesService.getStudentDashboard(studentId, sessionId);
    }
    async getYearlyFeeBook(studentId, sessionId) {
        return this.feesService.getYearlyFeeBook(studentId, sessionId);
    }
    async getTransactions(query) {
        return this.feesService.getTransactions(query);
    }
    async getReceiptPdf(receiptNo, res) {
        try {
            const transaction = await this.prisma.feeTransaction.findUnique({
                where: { receiptNo },
                select: { studentId: true, date: true },
            });
            const pdfBuffer = await this.receiptPdfService.generateReceiptByReceiptNo(receiptNo);
            const dateStr = transaction?.date
                ? new Date(transaction.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '')
                : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '');
            const studentId = transaction?.studentId || 'UNKNOWN';
            const filename = `Receipt-${studentId}-${dateStr}.pdf`;
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`,
                'Content-Length': pdfBuffer.length,
            });
            res.send(pdfBuffer);
        }
        catch (error) {
            throw new common_1.NotFoundException('Receipt not found');
        }
    }
    async getDemandBillPdf(billNo, res) {
        try {
            const bill = await this.prisma.demandBill.findUnique({
                where: { billNo },
                select: { studentId: true, billDate: true, month: true, year: true },
            });
            const pdfBuffer = await this.demandBillPdfService.generateDemandBillPdf(billNo);
            const monthYear = bill ? `${String(bill.month).padStart(2, '0')}${bill.year}` : '';
            const studentId = bill?.studentId || 'UNKNOWN';
            const filename = `DemandBill-${studentId}-${monthYear}.pdf`;
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`,
                'Content-Length': pdfBuffer.length,
            });
            res.send(pdfBuffer);
        }
        catch (error) {
            console.error('[FeesController] Error generating PDF:', error);
            throw new common_1.NotFoundException(error.message || 'Demand bill not found');
        }
    }
    async getBatchDemandBillPdf(body, res) {
        console.log('Batch PDF Request received for bill numbers:', body.billNumbers.length);
        try {
            const pdfBuffer = await this.demandBillPdfService.generateBatchPdf(body.billNumbers);
            console.log('Batch PDF generated successfully, size:', pdfBuffer.length);
            let filenameBase = 'DemandBills';
            if (body.period) {
                filenameBase += `-${body.period}`;
            }
            if (body.classInfo) {
                filenameBase += `-${body.classInfo}`;
            }
            if (body.billType) {
                const type = body.billType.replace(/\s+/g, '');
                filenameBase += `-${type}`;
            }
            const cleanFilename = filenameBase.replace(/[^a-zA-Z0-9-_]/g, '-');
            const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '');
            const filename = `${cleanFilename}-${dateStr}.pdf`;
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`,
                'Content-Length': pdfBuffer.length,
            });
            res.send(pdfBuffer);
        }
        catch (error) {
            console.error('Batch PDF Generation Error:', error);
            throw new common_1.NotFoundException(error.message || 'Demand bills not found');
        }
    }
};
exports.FeesController = FeesController;
__decorate([
    (0, common_1.Post)('collect'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fee_collection_dto_1.CollectFeeDto]),
    __metadata("design:returntype", Promise)
], FeesController.prototype, "collectFee", null);
__decorate([
    (0, common_1.Post)('statement'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fee_collection_dto_1.FeeStatementDto]),
    __metadata("design:returntype", Promise)
], FeesController.prototype, "getStudentStatement", null);
__decorate([
    (0, common_1.Post)('demand-bills/generate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [demand_bill_dto_1.GenerateDemandBillDto]),
    __metadata("design:returntype", Promise)
], FeesController.prototype, "generateDemandBills", null);
__decorate([
    (0, common_1.Get)('demand-bills/history/:sessionId'),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], FeesController.prototype, "getBillGenerationHistory", null);
__decorate([
    (0, common_1.Get)('dashboard/:studentId/session/:sessionId'),
    __param(0, (0, common_1.Param)('studentId')),
    __param(1, (0, common_1.Param)('sessionId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], FeesController.prototype, "getStudentDashboard", null);
__decorate([
    (0, common_1.Get)('fee-book/:studentId/session/:sessionId'),
    __param(0, (0, common_1.Param)('studentId')),
    __param(1, (0, common_1.Param)('sessionId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], FeesController.prototype, "getYearlyFeeBook", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FeesController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Get)('receipt/:receiptNo/pdf'),
    __param(0, (0, common_1.Param)('receiptNo')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FeesController.prototype, "getReceiptPdf", null);
__decorate([
    (0, common_1.Get)('demand-bill/:billNo/pdf'),
    __param(0, (0, common_1.Param)('billNo')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FeesController.prototype, "getDemandBillPdf", null);
__decorate([
    (0, common_1.Post)('demand-bills/batch-pdf'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FeesController.prototype, "getBatchDemandBillPdf", null);
exports.FeesController = FeesController = __decorate([
    (0, common_1.Controller)('fees'),
    __metadata("design:paramtypes", [fees_service_1.FeesService,
        receipt_pdf_service_1.ReceiptPdfService,
        demand_bill_pdf_service_1.DemandBillPdfService,
        prisma_service_1.PrismaService])
], FeesController);
//# sourceMappingURL=fees.controller.js.map