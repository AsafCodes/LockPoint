const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulate() {
    console.log("1. Finding S-001 (יונתן לוי)...");
    const soldier = await prisma.user.findFirst({
        where: { serviceNumber: 'S-001' }
    });

    if (!soldier) {
        console.log("Soldier not found!");
        return process.exit(1);
    }

    console.log(`Current status: ${soldier.currentStatus}`);

    console.log("2. Teleporting S-001 far away from the active zones (Tel Aviv beach)...");
    // Tel Aviv beach coordinate (definitely outside the bases)
    await prisma.user.update({
        where: { id: soldier.id },
        data: {
            lastKnownLat: 32.0792,
            lastKnownLng: 34.7656,
            currentStatus: 'in_base' // Deliberately stale/incorrect status
        }
    });

    console.log("S-001 is now 'in_base' but physically located outside.");
    console.log("3. Test Ready! Run the following URL in your browser to trigger the Cron Job:");
    console.log("   http://localhost:3000/api/cron/check-alerts");
    console.log("   You should see Rule D correct their status to 'out_of_base'.");
}

simulate().finally(() => prisma.$disconnect());
