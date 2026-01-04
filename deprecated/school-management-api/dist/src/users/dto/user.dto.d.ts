export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    ADMIN = "ADMIN",
    ACCOUNTANT = "ACCOUNTANT",
    TEACHER = "TEACHER",
    COORDINATOR = "COORDINATOR",
    RECEPTIONIST = "RECEPTIONIST",
    SECURITY = "SECURITY",
    PARENT = "PARENT",
    STUDENT = "STUDENT"
}
export declare class CreateUserDto {
    username: string;
    password: string;
    name: string;
    role: UserRole;
    email?: string;
    phone?: string;
    permissions?: string[];
}
export declare class UpdateUserDto {
    name?: string;
    role?: UserRole;
    email?: string;
    phone?: string;
    active?: boolean;
    permissions?: string[];
}
export declare class ChangePasswordDto {
    newPassword: string;
}
