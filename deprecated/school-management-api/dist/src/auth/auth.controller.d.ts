import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: {
        username: string;
        password: string;
    }): Promise<{
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
    getProfile(req: any): Promise<{
        id: number;
        username: string;
        role: import("@prisma/client").$Enums.UserRole;
        name: string;
        email: string | null;
        active: boolean;
    } | null>;
}
