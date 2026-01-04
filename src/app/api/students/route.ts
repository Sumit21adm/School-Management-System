import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// GET all students with optional filters
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const className = searchParams.get('class');
        const section = searchParams.get('section');
        const status = searchParams.get('status');
        const sessionId = searchParams.get('sessionId');

        console.log('[API] Students params:', { page, limit, search, className, section, status, sessionId });

        const where: any = {};

        if (className) where.className = className;
        if (section) where.section = section;
        if (status && status !== 'null') where.status = status;

        // Robust sessionId parsing
        if (sessionId && sessionId !== 'null' && sessionId !== 'undefined') {
            const parsedId = parseInt(sessionId);
            if (!isNaN(parsedId)) {
                where.sessionId = parsedId;
            }
        }

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { studentId: { contains: search } },
                { fatherName: { contains: search } },
                { phone: { contains: search } },
            ];
        }

        const skip = (page - 1) * limit;

        const sortBy = searchParams.get('sortBy');
        const order = searchParams.get('order') === 'desc' ? 'desc' : 'asc';

        const orderBy: any = {};
        if (sortBy === 'className') {
            orderBy.className = order;
        } else if (sortBy) {
            orderBy[sortBy] = order;
        } else {
            orderBy.name = 'asc';
        }

        const [data, total] = await Promise.all([
            prisma.studentDetails.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    session: true,
                },
            }),
            prisma.studentDetails.count({ where })
        ]);

        return NextResponse.json({
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }
}

// POST create new student
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();

        // Generate student ID
        const currentYear = new Date().getFullYear();
        const lastStudent = await prisma.studentDetails.findFirst({
            where: { studentId: { startsWith: `STU${currentYear}` } },
            orderBy: { studentId: 'desc' },
        });

        let nextNumber = 1;
        if (lastStudent) {
            const lastNumber = parseInt(lastStudent.studentId.slice(-4));
            nextNumber = lastNumber + 1;
        }
        const studentId = `STU${currentYear}${String(nextNumber).padStart(4, '0')}`;

        // Handle Photo Upload
        const file = formData.get('photo') as File | null;
        let photoUrl = '';

        if (file) {
            try {
                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);

                // Create uploads directory if it doesn't exist
                const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'students');
                await mkdir(uploadDir, { recursive: true });

                const filename = `${studentId}-${Date.now()}${path.extname(file.name)}`;
                const filepath = path.join(uploadDir, filename);

                await writeFile(filepath, buffer);
                photoUrl = `/uploads/students/${filename}`;
            } catch (error) {
                console.error('Error uploading file:', error);
                // Continue without photo if upload fails
            }
        }

        // Extract fields safely
        const body: any = {};
        formData.forEach((value, key) => {
            if (key !== 'photo') {
                body[key] = value;
            }
        });

        // Helper to safe parse dates
        const safeDate = (dateStr: any) => dateStr ? new Date(dateStr) : undefined;
        // Helper to safe parse integers
        const safeInt = (intStr: any) => intStr ? parseInt(intStr) : undefined;

        const student = await prisma.studentDetails.create({
            data: {
                studentId,
                name: body.name,
                fatherName: body.fatherName,
                motherName: body.motherName,
                dob: new Date(body.dob),
                gender: body.gender,
                className: body.className,
                section: body.section,
                admissionDate: new Date(body.admissionDate || new Date()),
                address: body.address,
                phone: body.phone,
                email: body.email || null,
                photoUrl: photoUrl || body.photoUrl || null,
                status: 'active',
                aadharCardNo: body.aadharCardNo || null,
                fatherOccupation: body.fatherOccupation || null,
                motherOccupation: body.motherOccupation || null,
                whatsAppNo: body.whatsAppNo || null,
                category: body.category || 'NA',
                religion: body.religion || null,
                apaarId: body.apaarId || null,
                fatherAadharNo: body.fatherAadharNo || null,
                fatherPanNo: body.fatherPanNo || null,
                motherAadharNo: body.motherAadharNo || null,
                motherPanNo: body.motherPanNo || null,
                guardianRelation: body.guardianRelation || null,
                guardianName: body.guardianName || null,
                guardianOccupation: body.guardianOccupation || null,
                guardianPhone: body.guardianPhone || null,
                guardianEmail: body.guardianEmail || null,
                guardianAadharNo: body.guardianAadharNo || null,
                guardianPanNo: body.guardianPanNo || null,
                guardianAddress: body.guardianAddress || null,
                sessionId: safeInt(body.sessionId),
            },
        });

        return NextResponse.json(student, { status: 201 });
    } catch (error) {
        console.error('Error creating student:', error);
        return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
    }
}
