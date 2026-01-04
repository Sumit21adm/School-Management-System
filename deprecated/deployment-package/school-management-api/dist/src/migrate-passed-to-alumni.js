"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
async function main() {
    const prisma = new client_1.PrismaClient();
    try {
        const result = await prisma.studentDetails.updateMany({
            where: {
                status: 'passed',
            },
            data: {
                status: 'alumni',
            },
        });
        console.log(`Updated ${result.count} students from 'passed' to 'alumni'.`);
    }
    catch (error) {
        console.error('Error migrating statuses:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=migrate-passed-to-alumni.js.map