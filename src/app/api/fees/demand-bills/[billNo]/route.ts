
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ billNo: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { billNo } = await params;

        const bill = await prisma.demandBill.findUnique({
            where: {
                billNo: billNo
            },
            include: {
                student: {
                    select: { name: true, className: true, section: true, fatherName: true }
                },
                billItems: {
                    include: { feeType: true }
                }
            }
        });

        if (!bill) {
            return new NextResponse('Bill not found', { status: 404 });
        }

        return NextResponse.json(bill);

    } catch (error) {
        console.error('Error fetching demand bill:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
