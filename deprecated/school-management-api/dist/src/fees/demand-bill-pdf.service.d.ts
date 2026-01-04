import { PrismaService } from '../prisma.service';
export declare class DemandBillPdfService {
    private prisma;
    constructor(prisma: PrismaService);
    generateDemandBillPdf(billNo: string): Promise<Buffer>;
    private drawDemandBillContent;
    generateBatchPdf(billNumbers: string[]): Promise<Buffer>;
}
