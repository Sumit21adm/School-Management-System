import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(username: string, password: string): Promise<{
        access_token: string;
        user: {
            id: number;
            username: string;
            name: string;
            email: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            permissions: string[];
        };
    }>;
    validateUser(userId: number): Promise<{
        id: number;
        username: string;
        role: import("@prisma/client").$Enums.UserRole;
        name: string;
        email: string | null;
        active: boolean;
    } | null>;
}
