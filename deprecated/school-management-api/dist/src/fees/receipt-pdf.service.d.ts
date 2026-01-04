import { PrismaService } from '../prisma.service';
export declare class ReceiptPdfService {
    private prisma;
    constructor(prisma: PrismaService);
    generateReceipt(transactionId: number): Promise<Buffer>;
    private drawReceiptContent;
    private numberToWords;
    generateReceiptByReceiptNo(receiptNo: string): Promise<Buffer>;
}
