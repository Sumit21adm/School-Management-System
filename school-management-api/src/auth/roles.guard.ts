import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

// Role hierarchy - higher index = more permissions
const ROLE_HIERARCHY: Record<string, number> = {
    'SUPER_ADMIN': 100,
    'ADMIN': 90,
    'COORDINATOR': 70,
    'ACCOUNTANT': 60,
    'TEACHER': 50,
    'RECEPTIONIST': 40,
    'SECURITY': 20,
    'PARENT': 10,
    'STUDENT': 5,
};

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no roles are specified, allow access
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user || !user.role) {
            throw new ForbiddenException('Access denied: No user role found');
        }

        // Check if user has any of the required roles or a higher role
        const userRoleLevel = ROLE_HIERARCHY[user.role] || 0;

        const hasRole = requiredRoles.some(role => {
            const requiredLevel = ROLE_HIERARCHY[role] || 0;
            // Allow if user's role level is >= required level
            return userRoleLevel >= requiredLevel;
        });

        if (!hasRole) {
            throw new ForbiddenException(`Access denied: Requires one of these roles: ${requiredRoles.join(', ')}`);
        }

        return true;
    }
}
