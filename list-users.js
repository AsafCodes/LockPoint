const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                serviceNumber: true,
                firstName: true,
                lastName: true,
                role: true,
                unit: {
                    select: { name: true }
                }
            }
        });

        console.log('--- ALL USERS ---');
        users.forEach(u => {
            console.log(`${u.serviceNumber}: ${u.firstName} ${u.lastName} (${u.role}) - ${u.unit.name}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
