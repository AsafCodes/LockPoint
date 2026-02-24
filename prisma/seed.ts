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
    const commonPasswordHash = await bcrypt.hash('Lockpoint2026!', SALT_ROUNDS);

    // ── Units (Hierarchy) ────────────────────────────────────

    const cmdNorth = await prisma.unit.upsert({
        where: { id: 'cmd-north' },
        update: {},
        create: { id: 'cmd-north', name: 'פיקוד צפון', type: 'command' },
    });

    const bde7 = await prisma.unit.upsert({
        where: { id: 'bde-7' },
        update: {},
        create: { id: 'bde-7', name: 'חטיבה 7', type: 'brigade', parentId: cmdNorth.id },
    });

    const bde35 = await prisma.unit.upsert({
        where: { id: 'bde-35' },
        update: {},
        create: { id: 'bde-35', name: 'חטיבה 35', type: 'brigade', parentId: cmdNorth.id },
    });

    const bn71 = await prisma.unit.upsert({
        where: { id: 'bn-71' },
        update: {},
        create: { id: 'bn-71', name: 'גדוד 71', type: 'battalion', parentId: bde7.id },
    });

    const bn72 = await prisma.unit.upsert({
        where: { id: 'bn-72' },
        update: {},
        create: { id: 'bn-72', name: 'גדוד 72', type: 'battalion', parentId: bde7.id },
    });

    const coyAlpha = await prisma.unit.upsert({
        where: { id: 'coy-alpha' },
        update: {},
        create: { id: 'coy-alpha', name: 'פלוגה א\'', type: 'company', parentId: bn71.id },
    });

    const plt1 = await prisma.unit.upsert({
        where: { id: 'plt-1' },
        update: {},
        create: { id: 'plt-1', name: 'מחלקה 1', type: 'platoon', parentId: coyAlpha.id },
    });

    const plt2 = await prisma.unit.upsert({
        where: { id: 'plt-2' },
        update: {},
        create: { id: 'plt-2', name: 'מחלקה 2', type: 'platoon', parentId: coyAlpha.id },
    });

    console.log('  ✅ Units created');

    // ── Users ────────────────────────────────────────────────

    // Senior Commander
    const sc001 = await prisma.user.upsert({
        where: { serviceNumber: 'SC-001' },
        update: {},
        create: {
            serviceNumber: 'SC-001',
            passwordHash: commonPasswordHash,
            firstName: 'ארי',
            lastName: 'בן-דוד',
            role: 'senior_commander',
            rankCode: 'אל"מ',
            rankLabel: 'אלוף משנה',
            rankLevel: 8,
            unitId: cmdNorth.id,
            currentStatus: 'in_base',
        },
    });

    // Commander
    const c001 = await prisma.user.upsert({
        where: { serviceNumber: 'C-001' },
        update: {},
        create: {
            serviceNumber: 'C-001',
            passwordHash: commonPasswordHash,
            firstName: 'נועם',
            lastName: 'כהן',
            role: 'commander',
            rankCode: 'סרן',
            rankLabel: 'סרן',
            rankLevel: 6,
            unitId: coyAlpha.id,
            currentStatus: 'in_base',
        },
    });

    // Soldiers in platoon 1
    await prisma.user.upsert({
        where: { serviceNumber: 'S-001' },
        update: {},
        create: {
            serviceNumber: 'S-001',
            passwordHash: commonPasswordHash,
            firstName: 'יונתן',
            lastName: 'לוי',
            role: 'soldier',
            rankCode: 'רב"ט',
            rankLabel: 'רב טוראי',
            rankLevel: 3,
            unitId: plt1.id,
            currentStatus: 'in_base',
            lastKnownLat: 32.0853,
            lastKnownLng: 34.7818,
            lastLocationUpdate: new Date(),
        },
    });

    await prisma.user.upsert({
        where: { serviceNumber: 'S-102' },
        update: {},
        create: {
            serviceNumber: 'S-102',
            passwordHash: commonPasswordHash,
            firstName: 'דנה',
            lastName: 'כץ',
            role: 'soldier',
            rankCode: 'רב"ט',
            rankLabel: 'רב טוראי',
            rankLevel: 3,
            unitId: plt1.id,
            currentStatus: 'out_of_base',
            lastKnownLat: 32.0900,
            lastKnownLng: 34.7900,
            lastLocationUpdate: new Date(Date.now() - 300_000),
        },
    });

    await prisma.user.upsert({
        where: { serviceNumber: 'S-103' },
        update: {},
        create: {
            serviceNumber: 'S-103',
            passwordHash: commonPasswordHash,
            firstName: 'אייל',
            lastName: 'רוזן',
            role: 'soldier',
            rankCode: 'טור',
            rankLabel: 'טוראי',
            rankLevel: 1,
            unitId: plt1.id,
            currentStatus: 'in_base',
            lastKnownLat: 32.0855,
            lastKnownLng: 34.7820,
            lastLocationUpdate: new Date(Date.now() - 60_000),
        },
    });

    // Soldiers in platoon 2
    await prisma.user.upsert({
        where: { serviceNumber: 'S-104' },
        update: {},
        create: {
            serviceNumber: 'S-104',
            passwordHash: commonPasswordHash,
            firstName: 'מאיה',
            lastName: 'לוי',
            role: 'soldier',
            rankCode: 'סמל',
            rankLabel: 'סמל',
            rankLevel: 4,
            unitId: plt2.id,
            currentStatus: 'in_base',
            lastKnownLat: 32.0860,
            lastKnownLng: 34.7815,
            lastLocationUpdate: new Date(Date.now() - 45_000),
        },
    });

    await prisma.user.upsert({
        where: { serviceNumber: 'S-105' },
        update: {},
        create: {
            serviceNumber: 'S-105',
            passwordHash: commonPasswordHash,
            firstName: 'אורי',
            lastName: 'שטיין',
            role: 'soldier',
            rankCode: 'טור',
            rankLabel: 'טוראי ראשון',
            rankLevel: 2,
            unitId: plt2.id,
            currentStatus: 'unknown',
        },
    });

    console.log('  ✅ Users created');

    // ── Link commanders to units ─────────────────────────────

    await prisma.unit.update({ where: { id: cmdNorth.id }, data: { commanderId: sc001.id } });
    await prisma.unit.update({ where: { id: coyAlpha.id }, data: { commanderId: c001.id } });

    console.log('  ✅ Commanders linked');

    // ── Geofence Zones ───────────────────────────────────────

    await prisma.geofenceZone.upsert({
        where: { id: 'zone-1' },
        update: {},
        create: {
            id: 'zone-1',
            name: 'מחנה אלפא — היקף ראשי',
            shapeType: 'circle',
            centerLat: 32.08,
            centerLng: 34.78,
            radiusMeters: 500,
            isActive: true,
            unitId: coyAlpha.id,
            createdBy: sc001.id,
        },
    });

    await prisma.geofenceZone.upsert({
        where: { id: 'zone-2' },
        update: {},
        create: {
            id: 'zone-2',
            name: 'שטח אימונים בראבו',
            shapeType: 'circle',
            centerLat: 32.10,
            centerLng: 34.80,
            radiusMeters: 300,
            isActive: true,
            unitId: coyAlpha.id,
            createdBy: sc001.id,
        },
    });

    await prisma.geofenceZone.upsert({
        where: { id: 'zone-3' },
        update: {},
        create: {
            id: 'zone-3',
            name: 'מחסן אספקה צ\'ארלי',
            shapeType: 'circle',
            centerLat: 32.07,
            centerLng: 34.77,
            radiusMeters: 150,
            isActive: false,
            unitId: coyAlpha.id,
            createdBy: sc001.id,
        },
    });

    console.log('  ✅ Geofence zones created');
    console.log('');
    console.log('🎉 Seed complete!');
    console.log('\n');
    console.log('Default credentials:');
    console.log('  SC-001 / Lockpoint2026! (מפקד בכיר)');
    console.log('  C-001  / Lockpoint2026! (מפקד)');
    console.log('  S-001  / Lockpoint2026! (חייל)');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
