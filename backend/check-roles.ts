
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRoles() {
    console.log('Checking RoleSettings table...');
    const roles = await prisma.roleSettings.findMany();
    console.log(`Found ${roles.length} roles.`);
    console.table(roles);
}

checkRoles()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
