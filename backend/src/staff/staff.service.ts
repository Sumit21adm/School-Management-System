import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class StaffService {
    constructor(private prisma: PrismaService) { }

    async create(createStaffDto: CreateStaffDto) {
        // Validate email is provided if loginAccess is true
        const loginAccess = createStaffDto.loginAccess !== undefined ? createStaffDto.loginAccess : true;
        if (loginAccess && !createStaffDto.email) {
            throw new ConflictException('Email is required when login access is enabled');
        }

        // 1. Check for duplicate email if login access is enabled (email will be used as username)
        if (loginAccess && createStaffDto.email) {
            const existing = await this.prisma.user.findUnique({ where: { username: createStaffDto.email } });
            if (existing) throw new ConflictException('A user with this email already exists');
        }

        // 2. Prepare Credentials
        let username: string;
        let hashedPassword: string;

        if (loginAccess) {
            // Use email as username for login
            username = createStaffDto.email!; // Email is required when loginAccess is true
            const password = createStaffDto.password || 'Welcome@123'; // Default password
            hashedPassword = await bcrypt.hash(password, 10);
        } else {
            // For users without login access, generate unique disabled username
            // Use timestamp and random suffix to ensure uniqueness
            username = `DISABLED_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            // Hash a disabled marker (prevents login)
            hashedPassword = await bcrypt.hash('DISABLED', 10);
        }

        // 3. Transaction
        return this.prisma.$transaction(async (tx) => {
            // Create User
            const user = await tx.user.create({
                data: {
                    username,
                    password: hashedPassword,
                    name: createStaffDto.name,
                    role: createStaffDto.role,
                    email: createStaffDto.email,
                    phone: createStaffDto.phone,
                    active: createStaffDto.active !== undefined ? createStaffDto.active : true,
                    loginAccess: createStaffDto.loginAccess !== undefined ? createStaffDto.loginAccess : true,
                    permissions: createStaffDto.permissions ? JSON.stringify(createStaffDto.permissions) : undefined,
                },
            });

            // Create StaffDetails
            await tx.staffDetails.create({
                data: {
                    userId: user.id,
                    designation: createStaffDto.designation,
                    department: createStaffDto.department,
                    joiningDate: createStaffDto.joiningDate,
                    bloodGroup: createStaffDto.bloodGroup,
                    qualification: createStaffDto.qualification,
                    experience: createStaffDto.experience,
                    basicSalary: createStaffDto.basicSalary,
                    bankName: createStaffDto.bankName,
                    accountNo: createStaffDto.accountNo,
                    ifscCode: createStaffDto.ifscCode,
                    panNo: createStaffDto.panNo,
                    aadharNo: createStaffDto.aadharNo,
                },
            });

            // Create TeacherProfile if role is TEACHER
            if (createStaffDto.role === UserRole.TEACHER) {
                await tx.teacherProfile.create({
                    data: {
                        userId: user.id,
                        qualification: createStaffDto.qualification,
                        experience: createStaffDto.experience,
                        specialization: createStaffDto.specialization,
                    },
                });
            }
            // Create DriverDetails if role is DRIVER
            if (createStaffDto.role === UserRole.DRIVER) {
                await tx.driverDetails.create({
                    data: {
                        userId: user.id,
                        licenseNumber: createStaffDto.licenseNumber,
                        licenseExpiry: createStaffDto.licenseExpiry,
                        badgeNumber: createStaffDto.badgeNumber,
                    },
                });
            }

            return user;
        });
    }

    async findAll(role?: UserRole, department?: string, page: number = 1, limit: number = 50, includeInactive: boolean = false, onlyInactive: boolean = false) {
        const where: any = {};

        // Filter logic:
        // 1. If onlyInactive is true -> show ONLY inactive users (active = false)
        // 2. If includeInactive is true -> show ALL users (no active filter)
        // 3. Default -> show ONLY active users (active = true)

        if (onlyInactive) {
            where.active = false;
        } else if (!includeInactive) {
            where.active = true;
        }
        // If includeInactive is true (and onlyInactive is false), we don't set where.active, so it returns both

        if (role) {
            where.role = role;
        } else {
            // By default, exclude STUDENTS and PARENTS if no specific role requested
            // assuming "Staff List" shouldn't show 1000 students
            where.role = {
                notIn: [UserRole.STUDENT, UserRole.PARENT]
            };
        }

        if (department) {
            where.staffDetails = { department };
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                include: {
                    staffDetails: true,
                    teacherProfile: true,
                    driverDetails: true,
                    drivenVehicles: { select: { id: true, vehicleNo: true, status: true } },
                },
                orderBy: { name: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where })
        ]);

        return { data, total, page, limit };
    }

    async findOne(id: number) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                staffDetails: true,
                teacherProfile: true,
                driverDetails: true,
                drivenVehicles: { select: { id: true, vehicleNo: true, status: true } },
            },
        });
        if (!user) throw new NotFoundException('Staff not found');
        return user;
    }

    async update(id: number, updateStaffDto: UpdateStaffDto) {
        try {
            // Validate email is provided if loginAccess is being enabled
            // First get current user to check if loginAccess is being enabled
            const currentUser = await this.prisma.user.findUnique({ where: { id } });
            if (!currentUser) {
                throw new NotFoundException('User not found');
            }

            // Check if loginAccess will be true after update
            const willHaveLoginAccess = updateStaffDto.loginAccess !== undefined
                ? updateStaffDto.loginAccess
                : currentUser.loginAccess;

            // If loginAccess will be enabled, email is required
            if (willHaveLoginAccess) {
                const finalEmail = updateStaffDto.email !== undefined ? updateStaffDto.email : currentUser.email;
                if (!finalEmail) {
                    throw new ConflictException('Email is required when login access is enabled');
                }
            }

            // Transactional Update
            return await this.prisma.$transaction(async (tx) => {
                console.log('StaffService.update received:', JSON.stringify(updateStaffDto));

                // Prepare user update data
                const userData: any = {
                    name: updateStaffDto.name,
                    email: updateStaffDto.email,
                    phone: updateStaffDto.phone,
                    role: updateStaffDto.role,
                };

                if (updateStaffDto.password) {
                    userData.password = await bcrypt.hash(updateStaffDto.password, 10);
                }

                if (updateStaffDto.active !== undefined) {
                    userData.active = updateStaffDto.active;
                }

                if (updateStaffDto.loginAccess !== undefined) {
                    userData.loginAccess = updateStaffDto.loginAccess;

                    // Update username based on login access status
                    if (updateStaffDto.loginAccess) {
                        // Enabling login access - set username to email
                        const finalEmail = updateStaffDto.email || currentUser.email;
                        userData.username = finalEmail;
                    } else {
                        // Disabling login access - set username to DISABLED
                        userData.username = `DISABLED_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                    }
                } else if (updateStaffDto.email && willHaveLoginAccess) {
                    // If email is being updated and user has login access, update username too
                    userData.username = updateStaffDto.email;
                }

                if (updateStaffDto.permissions) {
                    userData.permissions = JSON.stringify(updateStaffDto.permissions);
                }

                // Update User basic info
                await tx.user.update({
                    where: { id },
                    data: userData
                });

                // Update StaffDetails
                // We use upsert just in case it was missing for some reason (legacy data), or update
                await tx.staffDetails.upsert({
                    where: { userId: id },
                    create: {
                        userId: id,
                        designation: updateStaffDto.designation || 'Staff',
                        joiningDate: updateStaffDto.joiningDate || new Date(),
                        // ... map all fields (tedious but safe)
                        department: updateStaffDto.department,
                        basicSalary: updateStaffDto.basicSalary,
                        qualification: updateStaffDto.qualification,
                        experience: updateStaffDto.experience,
                        bloodGroup: updateStaffDto.bloodGroup,
                        bankName: updateStaffDto.bankName,
                        accountNo: updateStaffDto.accountNo,
                        ifscCode: updateStaffDto.ifscCode,
                        panNo: updateStaffDto.panNo,
                        aadharNo: updateStaffDto.aadharNo,
                    },
                    update: {
                        designation: updateStaffDto.designation,
                        department: updateStaffDto.department,
                        joiningDate: updateStaffDto.joiningDate,
                        qualification: updateStaffDto.qualification,
                        experience: updateStaffDto.experience,
                        bloodGroup: updateStaffDto.bloodGroup,
                        basicSalary: updateStaffDto.basicSalary,
                        bankName: updateStaffDto.bankName,
                        accountNo: updateStaffDto.accountNo,
                        ifscCode: updateStaffDto.ifscCode,
                        panNo: updateStaffDto.panNo,
                        aadharNo: updateStaffDto.aadharNo,
                    }
                });

                // Update TeacherProfile if role is TEACHER
                if (updateStaffDto.role === UserRole.TEACHER) {
                    await tx.teacherProfile.upsert({
                        where: { userId: id },
                        create: {
                            userId: id,
                            qualification: updateStaffDto.qualification,
                            experience: updateStaffDto.experience,
                            specialization: updateStaffDto.specialization,
                        },
                        update: {
                            qualification: updateStaffDto.qualification,
                            experience: updateStaffDto.experience,
                            specialization: updateStaffDto.specialization,
                        }
                    });
                }

                // Update DriverDetails if role is DRIVER
                if (updateStaffDto.role === UserRole.DRIVER) {
                    await tx.driverDetails.upsert({
                        where: { userId: id },
                        create: {
                            userId: id,
                            licenseNumber: updateStaffDto.licenseNumber,
                            licenseExpiry: updateStaffDto.licenseExpiry,
                            badgeNumber: updateStaffDto.badgeNumber,
                        },
                        update: {
                            licenseNumber: updateStaffDto.licenseNumber,
                            licenseExpiry: updateStaffDto.licenseExpiry,
                            badgeNumber: updateStaffDto.badgeNumber,
                        }
                    });
                }

                return tx.user.findUnique({ where: { id }, include: { staffDetails: true, teacherProfile: true, driverDetails: true } });
            });
        } catch (error) {
            console.error('[StaffService] Error updating staff:', error);
            throw error;
        }
    }

    async remove(id: number, permanent: boolean = false) {
        // Check if user exists and get role
        const userToCheck = await this.prisma.user.findUnique({
            where: { id },
            select: { role: true, active: true, name: true }
        });

        if (!userToCheck) {
            throw new NotFoundException('User not found');
        }

        if (userToCheck.role === UserRole.SUPER_ADMIN) {
            throw new ForbiddenException('System Administrator accounts cannot be deleted');
        }

        if (permanent) {
            // Hard delete - permanently remove from database
            // First delete related records (cascade delete)
            await this.prisma.$transaction(async (tx) => {
                // Delete profile-related records
                await tx.teacherProfile.deleteMany({ where: { userId: id } });
                await tx.driverDetails.deleteMany({ where: { userId: id } });
                await tx.staffDetails.deleteMany({ where: { userId: id } });

                // Delete assignment/allocation records
                await tx.classTeacherAssignment.deleteMany({ where: { teacherId: id } });
                await tx.subjectTeacherAllocation.deleteMany({ where: { teacherId: id } });
                await tx.classRoutine.deleteMany({ where: { teacherId: id } });

                // Delete attendance records
                await tx.staffAttendance.deleteMany({ where: { userId: id } });

                // Update vehicles to remove driver reference
                await tx.vehicle.updateMany({
                    where: { driverId: id },
                    data: { driverId: null }
                });

                // Finally delete the user
                await tx.user.delete({ where: { id } });
            });

            return { message: 'User permanently deleted', permanent: true };
        } else {
            // Soft delete - mark as inactive
            // First check if already inactive
            const user = await this.prisma.user.findUnique({
                where: { id },
                select: { active: true, name: true }
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            if (!user.active) {
                // User is already archived
                throw new ConflictException(
                    'This user is already archived. To permanently remove this user from the database, please check the "Permanently Delete" checkbox.'
                );
            }

            return this.prisma.user.update({
                where: { id },
                data: { active: false }
            });
        }
    }

    private generateUsername(name: string, phone: string): string {
        // First 3 characters of name (uppercase, letters only)
        const namePrefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();

        // First 4 digits of phone number
        const phoneDigits = phone.replace(/\D/g, '').substring(0, 4);

        return `${namePrefix}${phoneDigits}`;
    }
}
