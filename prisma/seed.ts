// ─────────────────────────────────────────────────────────────
// LockPoint — Database Seed Script
// ─────────────────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function main() {
    console.log('🌱 Seeding LockPoint database...');

    // ── Clean slate: delete old data in FK-safe order ─────────
    // This prevents duplicate trees when re-seeding a DB that
    // already contains auto-generated CUID-based units.
    console.log('  🧹 Cleaning old data...');
    await prisma.notification.deleteMany();
    await prisma.geofenceEvent.deleteMany();
    await prisma.geofenceZone.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();
    await prisma.unit.deleteMany();
    console.log('  ✅ Old data cleared');

    // Hash the default password for all demo users
    const commonPasswordHash = await bcrypt.hash('LP1234', SALT_ROUNDS);

    // ── Units (Hierarchy) ────────────────────────────────────

    const bn7490 = await prisma.unit.upsert({
        where: { id: 'bn-7490' },
        update: {},
        create: { id: 'bn-7490', name: 'גדוד 7490', type: 'battalion' },
    });

    const coyTaagad = await prisma.unit.upsert({
        where: { id: 'coy-taagad' },
        update: {},
        create: { id: 'coy-taagad', name: 'תאגד', type: 'company', parentId: bn7490.id },
    });

    const coyLog = await prisma.unit.upsert({
        where: { id: 'coy-log' },
        update: {},
        create: { id: 'coy-log', name: 'לוגיסטיקה', type: 'company', parentId: bn7490.id },
    });

    const coyKesher = await prisma.unit.upsert({
        where: { id: 'coy-kesher' },
        update: {},
        create: { id: 'coy-kesher', name: 'קשר', type: 'company', parentId: bn7490.id },
    });

    const coyMafgad = await prisma.unit.upsert({
        where: { id: 'coy-mafgad' },
        update: {},
        create: { id: 'coy-mafgad', name: 'מפגד', type: 'company', parentId: bn7490.id },
    });

    console.log('  ✅ Units created');

    // ── Users ────────────────────────────────────────────────

    // 1. אסף שוחט (C-001) - רואה גדוד 7490 ומטה
    const asafC = await prisma.user.upsert({
        where: { serviceNumber: '8494326' },
        update: {},
        create: {
            serviceNumber: '8494326',
            passwordHash: commonPasswordHash,
            firstName: 'אסף',
            lastName: 'שוחט',
            role: 'commander',
            rankCode: 'רס"ל',
            rankLabel: 'רב סמל',
            rankLevel: 4,
            unitId: bn7490.id, // Attached to Battalion to see it and below
            currentStatus: 'in_base',
        },
    });

    // 2. ישראל קייסי (C-001) - רואה מפלוגת לוגיסטיקה
    const israelC = await prisma.user.upsert({
        where: { serviceNumber: '7523495' },
        update: {},
        create: {
            serviceNumber: '7523495',
            passwordHash: commonPasswordHash,
            firstName: 'ישראל',
            lastName: 'קייסי',
            role: 'commander',
            rankCode: 'סרן',
            rankLabel: 'סרן',
            rankLevel: 6,
            unitId: coyLog.id,
            currentStatus: 'in_base',
        },
    });

    // 3. אסף לבנון (S-001)
    await prisma.user.upsert({
        where: { serviceNumber: '5127011' },
        update: {},
        create: {
            serviceNumber: '5127011',
            passwordHash: commonPasswordHash,
            firstName: 'אסף',
            lastName: 'לבנון',
            role: 'soldier',
            rankCode: 'רס"ר',
            rankLabel: 'רב סמל ראשון',
            rankLevel: 5,
            unitId: coyLog.id,
            currentStatus: 'in_base',
            lastKnownLat: 32.0853,
            lastKnownLng: 34.7818,
            lastLocationUpdate: new Date(),
        },
    });

    // 4. אליהו דני (S-001 implied)
    await prisma.user.upsert({
        where: { serviceNumber: '4605914' },
        update: {},
        create: {
            serviceNumber: '4605914',
            passwordHash: commonPasswordHash,
            firstName: 'אליהו',
            lastName: 'דני',
            role: 'soldier',
            rankCode: 'רס"ב',
            rankLabel: 'רב סמל בכיר',
            rankLevel: 7,
            unitId: coyLog.id,
            currentStatus: 'out_of_base',
            lastKnownLat: 32.0900,
            lastKnownLng: 34.7900,
            lastLocationUpdate: new Date(Date.now() - 300_000),
        },
    });

    // 5. מאיר דידי (S-001)
    await prisma.user.upsert({
        where: { serviceNumber: '8224770' },
        update: {},
        create: {
            serviceNumber: '8224770',
            passwordHash: commonPasswordHash,
            firstName: 'מאיר',
            lastName: 'דידי',
            role: 'soldier',
            rankCode: 'רס"ל',
            rankLabel: 'רב סמל',
            rankLevel: 4,
            unitId: coyLog.id,
            currentStatus: 'in_base',
        },
    });

    // 6. יאיר עזרה ברקוביץ' (S-001)
    await prisma.user.upsert({
        where: { serviceNumber: '7347745' },
        update: {},
        create: {
            serviceNumber: '7347745',
            passwordHash: commonPasswordHash,
            firstName: 'יאיר עזרה',
            lastName: 'ברקוביץ\'',
            role: 'soldier',
            rankCode: 'רס"ל',
            rankLabel: 'רב סמל',
            rankLevel: 4,
            unitId: coyLog.id,
            currentStatus: 'unknown',
        },
    });

    // 7. שאולי שאולוב (C-001) - רואה גדוד 7490 ומטה
    const shauliC = await prisma.user.upsert({
        where: { serviceNumber: '7652679' },
        update: {},
        create: {
            serviceNumber: '7652679',
            passwordHash: commonPasswordHash,
            firstName: 'שאולי',
            lastName: 'שאולוב',
            role: 'commander',
            rankCode: 'סרן',
            rankLabel: 'סרן',
            rankLevel: 6,
            unitId: bn7490.id,
            currentStatus: 'in_base',
        },
    });

    // 8. אסף שוחט (master / SC-001) - רואה גדוד 7490 ומטה
    const masterSc = await prisma.user.upsert({
        where: { serviceNumber: 'master' },
        update: {},
        create: {
            serviceNumber: 'master',
            passwordHash: commonPasswordHash,
            firstName: 'אסף',
            lastName: 'שוחט',
            role: 'senior_commander',
            rankCode: 'רס"ל',
            rankLabel: 'רב סמל',
            rankLevel: 4,
            unitId: bn7490.id,
            currentStatus: 'in_base',
        },
    });

    console.log('  ✅ Users created');

    // ── Link commanders to units ─────────────────────────────

    // Master is the senior commander of the battalion
    await prisma.unit.update({ where: { id: bn7490.id }, data: { commanderId: masterSc.id } });

    // Israel is the commander of the logistics company
    await prisma.unit.update({ where: { id: coyLog.id }, data: { commanderId: israelC.id } });

    console.log('  ✅ Commanders linked');

    // ── Geofence Zones ───────────────────────────────────────
    // Geofence zones are designated by the Senior Commander (SC-001)
    // and apply to the units under their command.

    await prisma.geofenceZone.upsert({
        where: { id: 'zone-1' },
        update: {},
        create: {
            id: 'zone-1',
            name: 'גדוד 7490 — מחנה ראשי',
            shapeType: 'circle',
            centerLat: 32.08,
            centerLng: 34.78,
            radiusMeters: 500,
            isActive: true,
            unitId: bn7490.id, // Attached to Battalion (SC-001's level)
            createdBy: masterSc.id,
        },
    });

    await prisma.geofenceZone.upsert({
        where: { id: 'zone-2' },
        update: {},
        create: {
            id: 'zone-2',
            name: 'מתחם אימונים ומטווחים',
            shapeType: 'circle',
            centerLat: 32.10,
            centerLng: 34.80,
            radiusMeters: 300,
            isActive: true,
            unitId: bn7490.id, // Attached to Battalion (SC-001's level)
            createdBy: masterSc.id,
        },
    });

    console.log('  ✅ Geofence zones created');
    console.log('');
    console.log('🎉 Seed complete!');
    console.log('\n');
    console.log('Development Test Credentials (Password for all: LP1234):');
    console.log('  master  (SC-001)  — אסף שוחט (רואה הכל)');
    console.log('  8494326 (C-001)   — אסף שוחט (מפקד גדוד)');
    console.log('  7652679 (C-001)   — שאולי שאולוב (מפקד גדוד)');
    console.log('  7523495 (C-001)   — ישראל קייסי (מפקד לוגיסטיקה)');
    console.log('  5127011 (S-001)   — אסף לבנון (חייל לוגיסטיקה)');
    console.log('  4605914 (S-001)   — אליהו דני (חייל לוגיסטיקה)');
    console.log('  8224770 (S-001)   — מאיר דידי (חייל לוגיסטיקה)');
    console.log('  7347745 (S-001)   — יאיר עזרה ברקוביץ\' (חייל לוגיסטיקה)');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
