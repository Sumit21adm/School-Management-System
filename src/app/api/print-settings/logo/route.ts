import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST upload logo
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('logo') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Only image files are allowed (JPEG, PNG, GIF, WebP)' }, { status: 400 });
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
        }

        // Create uploads directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
        await mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.name);
        const filename = `school-logo-${uniqueSuffix}${ext}`;
        const filepath = path.join(uploadDir, filename);

        // Write file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        const logoUrl = `/uploads/logos/${filename}`;

        // Update print settings with new logo URL
        let settings = await prisma.printSettings.findFirst();

        if (settings) {
            settings = await prisma.printSettings.update({
                where: { id: settings.id },
                data: { logoUrl },
            });
        } else {
            settings = await prisma.printSettings.create({
                data: {
                    schoolName: 'School Name',
                    schoolAddress: 'School Address',
                    logoUrl,
                },
            });
        }

        return NextResponse.json({
            message: 'Logo uploaded successfully',
            logoUrl,
        });
    } catch (error) {
        console.error('Error uploading logo:', error);
        return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 });
    }
}

// DELETE remove logo
export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const settings = await prisma.printSettings.findFirst();

        if (settings) {
            await prisma.printSettings.update({
                where: { id: settings.id },
                data: { logoUrl: null },
            });
        }

        return NextResponse.json({ message: 'Logo removed successfully' });
    } catch (error) {
        console.error('Error removing logo:', error);
        return NextResponse.json({ error: 'Failed to remove logo' }, { status: 500 });
    }
}
