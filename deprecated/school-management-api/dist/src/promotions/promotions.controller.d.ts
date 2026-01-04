import { PromotionsService } from './promotions.service';
import { PromoteStudentsDto } from './dto/promote-students.dto';
export declare class PromotionsController {
    private readonly promotionsService;
    constructor(promotionsService: PromotionsService);
    previewPromotion(currentSessionId: number, className: string, section: string): Promise<{
        students: {
            id: number;
            name: string;
            email: string | null;
            phone: string;
            createdAt: Date;
            updatedAt: Date;
            studentId: string;
            fatherName: string;
            motherName: string;
            dob: Date;
            gender: string;
            className: string;
            section: string;
            admissionDate: Date;
            address: string;
            photoUrl: string | null;
            status: string;
            aadharCardNo: string | null;
            fatherOccupation: string | null;
            motherOccupation: string | null;
            subjects: string | null;
            whatsAppNo: string | null;
            category: string;
            religion: string | null;
            apaarId: string | null;
            fatherAadharNo: string | null;
            fatherPanNo: string | null;
            motherAadharNo: string | null;
            motherPanNo: string | null;
            guardianRelation: string | null;
            guardianName: string | null;
            guardianOccupation: string | null;
            guardianPhone: string | null;
            guardianEmail: string | null;
            guardianAadharNo: string | null;
            guardianPanNo: string | null;
            guardianAddress: string | null;
            sessionId: number | null;
        }[];
        meta: {
            total: number;
            eligible: number;
            ineligible: number;
            currentClass: string;
            nextClass: string | null;
            isPassoutClass: boolean;
        };
    }>;
    executePromotion(promoteStudentsDto: PromoteStudentsDto): Promise<{
        success: boolean;
        promoted: number;
        failed: number;
        errors: any[];
    }>;
}
