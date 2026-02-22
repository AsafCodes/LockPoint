import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth/password';

const prisma = new PrismaClient();

async function main() {
    console.log('🔒 Securing Alpha Database...');

    // 1. Change all existing 'demo' passwords to a secure default
    // In a real scenario, users would be forced to change this on first login
    const secureHash = await hashPassword('Lockpoint2026!');

    const updateResult = await prisma.user.updateMany({
        where: {
            // We don't want to actually check the hash of 'demo' because we know all of them are demo in the seed
            // But just update all of them for the alpha release
        },
        data: {
            passwordHash: secureHash,
        },
    });

    console.log(`✅ Secured ${updateResult.count} existing accounts.`);

    // 2. Create the true Admin Senior Commander account
    const cmdNorth = await prisma.unit.findFirst({ where: { type: 'command' } });

    if (cmdNorth) {
        const admin = await prisma.user.upsert({
            where: { serviceNumber: 'ADMIN-001' },
            update: {
                passwordHash: await hashPassword('AlphaAdmin!Lockpoint'),
            },
            create: {
                id: 'admin_1',
                serviceNumber: 'ADMIN-001',
                passwordHash: await hashPassword('AlphaAdmin!Lockpoint'),
                firstName: 'מנהל',
                lastName: 'מערכת',
                role: 'senior_commander',
                rankCode: 'אלוף',
                rankLabel: 'אלוף',
                rankLevel: 9,
                unitId: cmdNorth.id,
                currentStatus: 'in_base',
            },
        });
        console.log(`✅ Created Alpha Admin: ${admin.serviceNumber} / AlphaAdmin!Lockpoint`);
    }

    console.log('🎉 Database is secured and Alpha-ready.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
