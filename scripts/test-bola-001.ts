import { PrismaClient } from '@prisma/client';
import { DELETE } from '../src/app/api/zones/[id]/route';
import { signAccessToken } from '../src/lib/auth/jwt';

const prisma = new PrismaClient();

async function runTests() {
    console.log('🔄 Starting BOLA-001 Validation Tests...\n');

    let unitA, unitB, commanderA, zoneA, zoneB;

    try {
        console.log('📦 Setting up mock database records...');

        unitA = await prisma.unit.create({ data: { name: 'Test Unit A - Scope', type: 'platoon' } });
        unitB = await prisma.unit.create({ data: { name: 'Test Unit B - Out of Scope', type: 'platoon' } });

        commanderA = await prisma.user.create({
            data: {
                serviceNumber: `CMD_TEST_${Date.now()}`,
                passwordHash: 'mock',
                firstName: 'Test',
                lastName: 'Commander',
                role: 'senior_commander',
                rankCode: 'TEST',
                rankLabel: 'Test',
                rankLevel: 5,
                unitId: unitA.id,
                currentStatus: 'in_base'
            }
        });

        zoneA = await prisma.geofenceZone.create({
            data: {
                name: 'Zone A (Allowed)',
                shapeType: 'circle',
                isActive: true,
                unitId: unitA.id,
                createdBy: commanderA.id
            }
        });

        zoneB = await prisma.geofenceZone.create({
            data: {
                name: 'Zone B (Forbidden)',
                shapeType: 'circle',
                isActive: true,
                unitId: unitB.id,
                createdBy: commanderA.id
            }
        });

        console.log('✅ Mock data created successfully.\n');

        // Sign a real JWT for the mock commander
        const token = signAccessToken({
            userId: commanderA.id,
            serviceNumber: commanderA.serviceNumber,
            role: commanderA.role as 'senior_commander'
        });

        const createMockReq = (zoneId: string) => {
            return {
                nextUrl: { pathname: `/api/zones/${zoneId}` },
                headers: new Map([
                    ['authorization', `Bearer ${token}`],
                    ['x-forwarded-for', '127.0.0.1']
                ])
            } as any;
        };

        // TEST 1: Delete Zone B (Out of scope - should FAIL with 403)
        console.log('🧪 TEST 1: Attempt to delete Zone B (Out of unit scope)');
        const req1 = createMockReq(zoneB.id);
        const res1 = await DELETE(req1);
        const json1 = await res1.json();

        if (res1.status === 403 && json1.error.includes('מחוץ לתחום הפיקוד')) {
            console.log('✅ TEST 1 PASSED: Commander was successfully blocked (403 Forbidden).');
        } else {
            console.error('❌ TEST 1 FAILED:', res1.status, json1);
        }

        // TEST 2: Delete Zone A (In scope - should PASS with 200)
        console.log('\n🧪 TEST 2: Attempt to delete Zone A (Inside unit scope)');
        const req2 = createMockReq(zoneA.id);
        const res2 = await DELETE(req2);
        const json2 = await res2.json();

        if (res2.status === 200 && json2.deleted === true) {
            console.log("✅ TEST 2 PASSED: Commander successfully deleted their own unit's zone (200 OK).");
        } else {
            console.error('❌ TEST 2 FAILED:', res2.status, json2);
        }

        // TEST 3: Delete non-existent zone
        console.log('\n🧪 TEST 3: Attempt to delete non-existent zone');
        const req3 = createMockReq('invalid-id-123');
        const res3 = await DELETE(req3);
        const json3 = await res3.json();

        if (res3.status === 404) {
            console.log('✅ TEST 3 PASSED: Server gracefully returned 404 Not Found instead of crashing.');
        } else {
            console.error('❌ TEST 3 FAILED:', res3.status, json3);
        }

    } catch (err) {
        console.error('\n🚨 Test execution error:', err);
    } finally {
        console.log('\n🧹 Cleaning up test data...');
        if (zoneA) await prisma.geofenceZone.delete({ where: { id: zoneA.id } }).catch(() => { });
        if (zoneB) await prisma.geofenceZone.delete({ where: { id: zoneB.id } }).catch(() => { });
        if (commanderA) await prisma.user.delete({ where: { id: commanderA.id } }).catch(() => { });
        if (unitA) await prisma.unit.delete({ where: { id: unitA.id } }).catch(() => { });
        if (unitB) await prisma.unit.delete({ where: { id: unitB.id } }).catch(() => { });

        await prisma.$disconnect();
        console.log('🏁 Tests finished.');
    }
}

runTests();
