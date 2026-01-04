import { PrismaService } from '../prisma.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/user.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    private parsePermissions;
    private serializePermissions;
    findAll(includeInactive?: boolean): Promise<{
        users: {
            permissions: string[];
            id: number;
            username: string;
            role: import("@prisma/client").$Enums.UserRole;
            name: string;
            email: string | null;
            phone: string | null;
            active: boolean;
            lastLogin: Date | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
    findOne(id: number): Promise<{
        permissions: string[];
        id: number;
        username: string;
        role: import("@prisma/client").$Enums.UserRole;
        name: string;
        email: string | null;
        phone: string | null;
        active: boolean;
        lastLogin: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(createUserDto: CreateUserDto): Promise<{
        permissions: string[];
        id: number;
        username: string;
        role: import("@prisma/client").$Enums.UserRole;
        name: string;
        email: string | null;
        phone: string | null;
        active: boolean;
        createdAt: Date;
    }>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<{
        permissions: string[];
        id: number;
        username: string;
        role: import("@prisma/client").$Enums.UserRole;
        name: string;
        email: string | null;
        phone: string | null;
        active: boolean;
        updatedAt: Date;
    }>;
    changePassword(id: number, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    delete(id: number): Promise<{
        message: string;
    }>;
    updateLastLogin(id: number): Promise<void>;
}
