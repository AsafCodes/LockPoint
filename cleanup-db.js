const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndClean() {
    const units = await prisma.unit.findMany();
    console.log('Total Units:', units.length);

    // Group units by name
    const byName = {};
    for (const u of units) {
        if (!byName[u.name]) byName[u.name] = [];
        byName[u.name].push(u);
    }

    const validIds = [
        'cmd-north', 'bde-7', 'bde-35', 'bn-71', 'bn-72', 'coy-alpha', 'plt-1', 'plt-2'
    ];

    let deleted = 0;
    for (const u of units) {
        if (!validIds.includes(u.id)) {
            console.log(`Will delete duplicate/old unit: ${u.id} (${u.name})`);

            // Re-assign users to the valid unit
            const validUnit = validIds.find(id => id.includes(u.type === 'command' ? 'cmd' : (u.type === 'brigade' ? 'bde' : '')));

            try {
                // Must handle foreign key constraints
                await prisma.geofenceZone.deleteMany({ where: { unitId: u.id } });
                await prisma.user.updateMany({
                    where: { unitId: u.id },
                    data: { unitId: 'cmd-north' } // fallback
                });
                await prisma.unit.delete({ where: { id: u.id } });
                deleted++;
            } catch (e) {
                console.error(`Failed to delete ${u.id}: ${e.message}`);
            }
        }
    }
    console.log(`Deleted ${deleted} duplicate units.`);
}

checkAndClean().finally(() => process.exit(0));
