import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET single subject
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const subjectId = parseInt(id);

        if (isNaN(subjectId)) {
            return NextResponse.json({ error: 'Invalid subject ID' }, { status: 400 });
        }

        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
            include: {
                classSubjects: {
                    include: { class: true },
                },
            },
        });

        if (!subject) {
            return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
        }

        return NextResponse.json(subject);
    } catch (error) {
        console.error('Error fetching subject:', error);
        return NextResponse.json({ error: 'Failed to fetch subject' }, { status: 500 });
    }
}

// PUT update subject
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const subjectId = parseInt(id);

        if (isNaN(subjectId)) {
            return NextResponse.json({ error: 'Invalid subject ID' }, { status: 400 });
        }

        const existing = await prisma.subject.findUnique({
            where: { id: subjectId },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
        }

        const body = await request.json();
        const { name, code, description, color, isActive } = body;

        const updated = await prisma.subject.update({
            where: { id: subjectId },
            data: {
                ...(name !== undefined && { name }),
                ...(code !== undefined && { code }),
                ...(description !== undefined && { description }),
                ...(color !== undefined && { color }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating subject:', error);
        return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 });
    }
}

// DELETE subject (soft delete by setting isActive to false)
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const subjectId = parseInt(id);

        if (isNaN(subjectId)) {
            return NextResponse.json({ error: 'Invalid subject ID' }, { status: 400 });
        }

        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
        });

        if (!subject) {
            return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
        }

        // Soft delete - mark as inactive
        await prisma.subject.update({
            where: { id: subjectId },
            data: { isActive: false },
        });

        return NextResponse.json({ message: 'Subject deactivated successfully' });
    } catch (error) {
        console.error('Error deleting subject:', error);
        return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
    }
}
