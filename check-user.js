const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();
    const serviceNumber = '4605914';

    try {
        const user = await prisma.user.findUnique({
            where: { serviceNumber },
            include: {
                unit: true
            }
        });

        if (!user) {
            console.log(`User ${serviceNumber} not found.`);
            return;
        }

        console.log('--- USER DATA ---');
        console.log(`Name: ${user.firstName} ${user.lastName}`);
        console.log(`Role: ${user.role}`);
        console.log(`System Status: ${user.currentStatus}`);
        console.log(`Location: Lat ${user.lastKnownLat}, Lng ${user.lastKnownLng}`);
        console.log(`Last Update: ${user.lastLocationUpdate}`);
        console.log(`Unit: ${user.unit.name} (ID: ${user.unit.id})`);

        const zones = await prisma.geofenceZone.findMany({
            where: {
                unitId: user.unitId,
                isActive: true
            }
        });

        console.log('\n--- ACTIVE GEOFENCES FOR UNIT ---');
        if (zones.length === 0) {
            console.log('No active zones found for this unit.');
        }

        for (const zone of zones) {
            console.log(`\nZone: ${zone.name} (ID: ${zone.id})`);
            console.log(`Shape: ${zone.shapeType}`);
            console.log(`Center: Lat ${zone.centerLat}, Lng ${zone.centerLng}`);
            console.log(`Radius: ${zone.radiusMeters}`);
            console.log(`Vertices: ${zone.vertices}`);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
