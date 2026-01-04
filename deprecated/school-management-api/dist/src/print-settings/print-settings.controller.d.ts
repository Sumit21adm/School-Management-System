import { PrintSettingsService } from './print-settings.service';
import { UpdatePrintSettingsDto } from './dto/print-settings.dto';
export declare class PrintSettingsController {
    private readonly printSettingsService;
    constructor(printSettingsService: PrintSettingsService);
    get(): Promise<{
        id: number;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        schoolName: string;
        schoolAddress: string;
        website: string | null;
        logoUrl: string | null;
        tagline: string | null;
        affiliationNo: string | null;
        affiliationNote: string | null;
        isoCertifiedNote: string | null;
        demandBillNote: string | null;
        feeReceiptNote: string | null;
        admitCardNote: string | null;
        transferCertNote: string | null;
        idCardNote: string | null;
    } | {
        id: null;
        schoolName: string;
        schoolAddress: string;
        phone: string;
        email: string;
        website: string;
        logoUrl: null;
        tagline: string;
    }>;
    update(updateDto: UpdatePrintSettingsDto): Promise<{
        id: number;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        schoolName: string;
        schoolAddress: string;
        website: string | null;
        logoUrl: string | null;
        tagline: string | null;
        affiliationNo: string | null;
        affiliationNote: string | null;
        isoCertifiedNote: string | null;
        demandBillNote: string | null;
        feeReceiptNote: string | null;
        admitCardNote: string | null;
        transferCertNote: string | null;
        idCardNote: string | null;
    }>;
    uploadLogo(file: Express.Multer.File): Promise<{
        message: string;
        logoUrl: string;
    }>;
}
