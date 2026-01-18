import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚌 Configuring Transport Fees...');

    // 1. Ensure 'Transport Fee' Type exists
    // This is required for the system to attach transport charges to bills
    const feeType = await prisma.feeType.upsert({
        where: { name: 'Transport Fee' },
        update: {},
        create: {
            name: 'Transport Fee',
            description: 'Monthly Transport Charges (Auto-calculated via Fare Slabs)',
            isDefault: false,
            isRecurring: true,
            frequency: 'Monthly'
        }
    });
    console.log(`✅ Fee Type Created/Found: ${feeType.name}`);

    // 2. Seed Default Fare Slabs
    // Currently the logic depends on distance.
    const slabs = [
        { minDistance: 0, maxDistance: 3, monthlyFee: 1000, description: 'Short Distance (0-3 km)' },
        { minDistance: 3, maxDistance: 8, monthlyFee: 1500, description: 'Medium Distance (3-8 km)' },
        { minDistance: 8, maxDistance: 15, monthlyFee: 2200, description: 'Long Distance (8-15 km)' },
        { minDistance: 15, maxDistance: 30, monthlyFee: 3000, description: 'Extended Distance (15+ km)' }
    ];

    for (const slab of slabs) {
        // Check if similar slab exists to avoid duplicates
        const existing = await prisma.transportFareSlab.findFirst({
            where: {
                minDistance: slab.minDistance,
                maxDistance: slab.maxDistance
            }
        });

        if (!existing) {
            await prisma.transportFareSlab.create({
                data: {
                    ...slab,
                    isActive: true
                }
            });
            console.log(`✅ Created Fare Slab: ${slab.description} (₹${slab.monthlyFee})`);
        } else {
            console.log(`ℹ️ Fare Slab already exists: ${slab.description}`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
