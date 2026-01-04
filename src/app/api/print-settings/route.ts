import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET print settings
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let settings = await prisma.printSettings.findFirst();

        // Create default settings if none exist
        if (!settings) {
            settings = await prisma.printSettings.create({
                data: {
                    schoolName: 'School Name',
                    schoolAddress: 'School Address',
                },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching print settings:', error);
        return NextResponse.json({ error: 'Failed to fetch print settings' }, { status: 500 });
    }
}

// PUT update print settings
export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        let settings = await prisma.printSettings.findFirst();

        if (settings) {
            settings = await prisma.printSettings.update({
                where: { id: settings.id },
                data: body,
            });
        } else {
            settings = await prisma.printSettings.create({
                data: body,
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error updating print settings:', error);
        return NextResponse.json({ error: 'Failed to update print settings' }, { status: 500 });
    }
}
