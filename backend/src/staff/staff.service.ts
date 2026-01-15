import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class StaffService {
    constructor(private prisma: PrismaService) { }

    async create(createStaffDto: CreateStaffDto) {
        // 1. Check for duplicate logic (optional, Prisma will throw on unique constraint)
        if (createStaffDto.username) {
            const existing = await this.prisma.user.findUnique({ where: { username: createStaffDto.username } });
            if (existing) throw new ConflictException('Username already exists');
        }

        // 2. Prepare Credentials
        const username = createStaffDto.username || this.generateUsername(createStaffDto.name);
        const password = createStaffDto.password || 'Welcome@123'; // Default password
        const hashedPassword = await bcrypt.hash(password, 10);

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
                    active: true,
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

    async findAll(role?: UserRole, department?: string, page: number = 1, limit: number = 50) {
        const where: any = { active: true };

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
        // Transactional Update
        return this.prisma.$transaction(async (tx) => {
            // Update User basic info
            await tx.user.update({
                where: { id },
                data: {
                    name: updateStaffDto.name,
                    email: updateStaffDto.email,
                    phone: updateStaffDto.phone,
                    role: updateStaffDto.role,
                    // username/password usually updated via specific endpoints, but can include here
                }
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
    }

    async remove(id: number) {
        // Soft delete
        return this.prisma.user.update({
            where: { id },
            data: { active: false }
        });
    }

    private generateUsername(name: string): string {
        // Logic: Firstname + 4 random digits
        const sanitized = name.split(' ')[0].replace(/[^a-zA-Z]/g, '').toUpperCase();
        const random = Math.floor(1000 + Math.random() * 9000);
        return `${sanitized}${random}`;
    }
}
