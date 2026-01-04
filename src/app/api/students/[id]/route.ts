import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// GET specific student
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const student = await prisma.studentDetails.findFirst({
            where: {
                OR: [
                    { studentId: id },
                    { id: isNaN(parseInt(id)) ? undefined : parseInt(id) },
                ],
            },
            include: {
                session: true,
                discounts: { include: { feeType: true } },
                feeTransactions: { orderBy: { date: 'desc' }, take: 10 },
            },
        });

        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        return NextResponse.json(student);
    } catch (error) {
        console.error('Error fetching student:', error);
        return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 });
    }
}

// PUT update student
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const formData = await request.formData();

        // Handle Photo Upload
        const file = formData.get('photo') as File | null;
        let photoUrl: string | undefined;

        if (file) {
            try {
                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);

                // Create uploads directory if it doesn't exist
                const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'students');
                await mkdir(uploadDir, { recursive: true });

                const filename = `${id}-${Date.now()}${path.extname(file.name)}`;
                const filepath = path.join(uploadDir, filename);

                await writeFile(filepath, buffer);
                photoUrl = `/uploads/students/${filename}`;
            } catch (error) {
                console.error('Error uploading file:', error);
            }
        }

        // Extract fields safely
        const body: any = {};
        formData.forEach((value, key) => {
            if (key !== 'photo') {
                body[key] = value;
            }
        });

        // Helper to safe parse integers
        const safeInt = (intStr: any) => intStr ? parseInt(intStr) : undefined;

        // Construct update data
        const updateData: any = {
            name: body.name,
            fatherName: body.fatherName,
            motherName: body.motherName,
            dob: body.dob ? new Date(body.dob) : undefined,
            gender: body.gender,
            className: body.className,
            section: body.section,
            address: body.address,
            phone: body.phone,
            email: body.email || null,
            status: body.status,
            aadharCardNo: body.aadharCardNo || null,
            fatherOccupation: body.fatherOccupation || null,
            motherOccupation: body.motherOccupation || null,
            whatsAppNo: body.whatsAppNo || null,
            category: body.category || 'NA',
            religion: body.religion || null,
            apaarId: body.apaarId || null,
            sessionId: safeInt(body.sessionId),
        };

        if (photoUrl) {
            updateData.photoUrl = photoUrl;
        }

        const numericId = parseInt(id);

        if (isNaN(numericId)) {
            return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
        }

        const student = await prisma.studentDetails.update({
            where: { id: numericId },
            data: updateData,
        });

        return NextResponse.json(student);
    } catch (error) {
        console.error('Error updating student:', error);
        return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
    }
}

// DELETE student (soft delete - change status to archived)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const numericId = parseInt(id);

        if (isNaN(numericId)) {
            return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
        }

        await prisma.studentDetails.update({
            where: { id: numericId },
            data: { status: 'archived' },
        });

        return NextResponse.json({ message: 'Student archived successfully' });
    } catch (error) {
        console.error('Error archiving student:', error);
        return NextResponse.json({ error: 'Failed to archive student' }, { status: 500 });
    }
}
