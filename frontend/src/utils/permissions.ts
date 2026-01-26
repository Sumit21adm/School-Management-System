// Permission Types
export interface PermissionItem {
    key: string;
    label: string;
}

export interface PermissionModule {
    module: string;
    permissions: PermissionItem[];
}

// Permission Modules Definition
export const PERMISSION_MODULES: PermissionModule[] = [
    {
        module: 'Dashboard',
        permissions: [
            { key: 'dashboard_view', label: 'View Dashboard' },
            { key: 'dashboard_stats', label: 'View Statistics' },
        ],
    },
    {
        module: 'Student Admissions',
        permissions: [
            { key: 'admissions_view', label: 'View Students' },
            { key: 'admissions_create', label: 'Add New Students' },
            { key: 'admissions_edit', label: 'Edit Students' },
            { key: 'admissions_delete', label: 'Delete Students' },
            { key: 'admissions_import', label: 'Import Students' },
            { key: 'admissions_export', label: 'Export Students' },
        ],
    },
    {
        module: 'Promotions',
        permissions: [
            { key: 'promotions_view', label: 'View Promotions' },
            { key: 'promotions_execute', label: 'Execute Promotions' },
        ],
    },
    {
        module: 'Fee Collection',
        permissions: [
            { key: 'fees_view', label: 'View Fee Records' },
            { key: 'fees_collect', label: 'Collect Fees' },
            { key: 'fees_receipt', label: 'Print Receipts' },
            { key: 'fees_refund', label: 'Process Refunds' },
        ],
    },
    {
        module: 'Demand Bills',
        permissions: [
            { key: 'demand_bills_view', label: 'View Demand Bills' },
            { key: 'demand_bills_generate', label: 'Generate Bills' },
            { key: 'demand_bills_print', label: 'Print Bills' },
            { key: 'demand_bills_delete', label: 'Delete Bill Batches' },
        ],
    },
    {
        module: 'Fee Structure',
        permissions: [
            { key: 'fee_structure_view', label: 'View Fee Structure' },
            { key: 'fee_structure_edit', label: 'Edit Fee Structure' },
            { key: 'fee_types_manage', label: 'Manage Fee Types' },
        ],
    },
    {
        module: 'Examinations',
        permissions: [
            { key: 'exams_view', label: 'View Exams' },
            { key: 'exams_create', label: 'Create Exams' },
            { key: 'exams_edit', label: 'Edit Exams' },
            { key: 'exams_schedule', label: 'Manage Schedules' },
            { key: 'exam_config', label: 'Exam Configuration' },
        ],
    },
    {
        module: 'Settings',
        permissions: [
            { key: 'sessions_view', label: 'View Sessions' },
            { key: 'sessions_manage', label: 'Manage Sessions' },
            { key: 'school_settings', label: 'School Settings' },
            { key: 'users_view', label: 'View Users' },
            { key: 'users_manage', label: 'Manage Users' },
        ],
    },
    {
        module: 'Transport',
        permissions: [
            { key: 'transport_view', label: 'View Transport' },
            { key: 'transport_manage', label: 'Manage Transport' }, // Vehicles, Drivers, Routes
            { key: 'transport_assign', label: 'Assign Transport' },
        ],
    },
    {
        module: 'Attendance',
        permissions: [
            { key: 'attendance_mark', label: 'Mark Attendance' },
            { key: 'attendance_view', label: 'View Attendance' },
        ],
    },
];

// Default permissions for each role
export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
    // Full access roles
    SUPER_ADMIN: PERMISSION_MODULES.flatMap(m => m.permissions.map(p => p.key)),
    PRINCIPAL: PERMISSION_MODULES.flatMap(m => m.permissions.map(p => p.key)), // Principal has all permissions
    VICE_PRINCIPAL: PERMISSION_MODULES.flatMap(m => m.permissions.map(p => p.key)).filter(p => p !== 'users_manage'), // All except user management
    ADMIN: PERMISSION_MODULES.flatMap(m => m.permissions.map(p => p.key)).filter(p => p !== 'users_manage'),

    // Academic roles
    HEAD_OF_DEPARTMENT: [
        'dashboard_view', 'dashboard_stats',
        'admissions_view', 'admissions_create', 'admissions_edit',
        'promotions_view', 'promotions_execute',
        'exams_view', 'exams_create', 'exams_edit', 'exams_schedule', 'exam_config',
        'fees_view',
    ],
    COORDINATOR: [
        'dashboard_view', 'dashboard_stats',
        'admissions_view', 'admissions_create', 'admissions_edit',
        'promotions_view', 'promotions_execute',
        'exams_view', 'exams_create', 'exams_edit', 'exams_schedule', 'exam_config',
    ],
    SECTION_INCHARGE: [
        'dashboard_view', 'dashboard_stats',
        'admissions_view', 'admissions_edit',
        'exams_view', 'exams_create', 'exams_edit', 'exams_schedule',
    ],
    TEACHER: [
        'dashboard_view',
        'admissions_view',
        'exams_view', 'exams_create', 'exams_edit', 'exams_schedule',
    ],

    // Finance & Office roles
    ACCOUNTANT: [
        'dashboard_view', 'dashboard_stats',
        'fees_view', 'fees_collect', 'fees_receipt', 'fees_refund',
        'demand_bills_view', 'demand_bills_generate', 'demand_bills_print', 'demand_bills_delete',
        'fee_structure_view', 'fee_structure_edit', 'fee_types_manage',
    ],
    RECEPTIONIST: [
        'dashboard_view',
        'admissions_view', 'admissions_create', 'admissions_edit',
        'fees_view', 'fees_collect', 'fees_receipt',
    ],
    LIBRARIAN: [
        'dashboard_view',
        'admissions_view',
    ],
    LAB_ASSISTANT: [
        'dashboard_view',
    ],
    OFFICE_STAFF: [
        'dashboard_view',
        'admissions_view',
        'fees_view',
    ],
    CLERK: [
        'dashboard_view',
        'admissions_view', 'admissions_create',
    ],

    // Transport & Support roles
    DRIVER: [
        'dashboard_view',
        'transport_view',
    ],
    CONDUCTOR: [
        'dashboard_view',
        'transport_view',
    ],
    SECURITY: [
        'dashboard_view',
        'admissions_view',
    ],
    PEON: [
        'dashboard_view',
    ],

    // External users
    PARENT: ['dashboard_view'],
    STUDENT: ['dashboard_view'],
};

// Get current user permissions from localStorage
export const getCurrentUserPermissions = (): { role: string; permissions: string[]; name: string } => {
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (!user || typeof user !== 'object') return { role: '', permissions: [], name: 'User' };

            const userRole = (user.role || '').toUpperCase();
            const userPerms = user.permissions || [];
            // If user has no custom permissions, fall back to role defaults
            const permissions = userPerms.length > 0
                ? userPerms
                : (ROLE_DEFAULT_PERMISSIONS[userRole] || []);

            // SUPER_ADMIN always has all permissions implicitly, but explicit list is good for UI
            if (userRole === 'SUPER_ADMIN') {
                return {
                    role: userRole,
                    permissions: ['*'],
                    name: user.name || user.username || 'User',
                };
            }

            return {
                role: userRole,
                permissions: permissions,
                name: user.name || user.username || 'User',
            };
        }
    } catch (e) {
        console.error('Error parsing user from localStorage', e);
    }
    return { role: '', permissions: [], name: 'User' };
};

// Check if user has permission
export const hasPermission = (requiredPermission: string, userRole?: string, userPermissions?: string[]): boolean => {
    if (!userRole || !userPermissions) {
        const user = getCurrentUserPermissions();
        userRole = user.role;
        userPermissions = user.permissions;
    }

    if (userRole === 'SUPER_ADMIN') return true;
    if (userPermissions.includes('*')) return true; // Wildcard permission
    return userPermissions.includes(requiredPermission);
};
