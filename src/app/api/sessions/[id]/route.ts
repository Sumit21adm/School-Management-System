import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET single session by ID
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const sessionId = parseInt(id);

        if (isNaN(sessionId)) {
            return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
        }

        const academicSession = await prisma.academicSession.findUnique({
            where: { id: sessionId },
            include: {
                _count: {
                    select: { students: true }
                }
            }
        });

        if (!academicSession) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json(academicSession);
    } catch (error) {
        console.error('Error fetching session:', error);
        return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
    }
}

// PUT update session
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const sessionId = parseInt(id);

        if (isNaN(sessionId)) {
            return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
        }

        const existingSession = await prisma.academicSession.findUnique({
            where: { id: sessionId },
        });

        if (!existingSession) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        const body = await request.json();
        const { name, startDate, endDate, isSetupMode } = body;

        // Validate dates if provided
        if (startDate && endDate) {
            if (new Date(endDate) <= new Date(startDate)) {
                return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
            }
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (startDate) updateData.startDate = new Date(startDate);
        if (endDate) updateData.endDate = new Date(endDate);
        if (isSetupMode !== undefined) updateData.isSetupMode = isSetupMode;

        const updated = await prisma.academicSession.update({
            where: { id: sessionId },
            data: updateData,
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating session:', error);
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }
}

// PATCH activate session (deactivates all others)
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const sessionId = parseInt(id);

        if (isNaN(sessionId)) {
            return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
        }

        const existingSession = await prisma.academicSession.findUnique({
            where: { id: sessionId },
        });

        if (!existingSession) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Use transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Deactivate all sessions
            await tx.academicSession.updateMany({
                where: { isActive: true },
                data: { isActive: false },
            });

            // Activate target session
            const activated = await tx.academicSession.update({
                where: { id: sessionId },
                data: {
                    isActive: true,
                    isSetupMode: false, // Activated sessions exit setup mode
                },
            });

            return activated;
        });

        return NextResponse.json({
            message: 'Session activated successfully',
            session: result,
        });
    } catch (error) {
        console.error('Error activating session:', error);
        return NextResponse.json({ error: 'Failed to activate session' }, { status: 500 });
    }
}

// DELETE session (with safety checks)
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const sessionId = parseInt(id);

        if (isNaN(sessionId)) {
            return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
        }

        const existingSession = await prisma.academicSession.findUnique({
            where: { id: sessionId },
            include: {
                _count: {
                    select: { students: true }
                }
            }
        });

        if (!existingSession) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // Cannot delete active session
        if (existingSession.isActive) {
            return NextResponse.json({ error: 'Cannot delete active session. Activate another session first.' }, { status: 400 });
        }

        // Check for associated students
        if (existingSession._count.students > 0) {
            return NextResponse.json({
                error: `Cannot delete session with ${existingSession._count.students} enrolled students`
            }, { status: 400 });
        }

        await prisma.academicSession.delete({
            where: { id: sessionId },
        });

        return NextResponse.json({ message: 'Session deleted successfully' });
    } catch (error) {
        console.error('Error deleting session:', error);
        return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }
}
