import { prisma } from '../src/lib/db';
import { createECDH, createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { secureHkdfSync } from '../src/lib/crypto/kdf';
import { generateEcdhSalt, buildSessionBindingContext } from '../src/lib/crypto/ecdh';
import { POST } from '../src/app/api/commander-visibility/route';
import { NextRequest } from 'next/server';

import { signAccessToken } from '../src/lib/auth/jwt';

// Mocking NextRequest for local testing
function createMockRequest(body: any, token: string): NextRequest {
    return {
        json: async () => body,
        headers: new Headers({
            'x-forwarded-for': 'attacker-ip',
            'user-agent': 'mitm-script',
            'authorization': `Bearer ${token}`
        }),
    } as any;
}

async function runMitmTest() {
    console.log('🛡️  מתחיל סימולציית MITM: Commander Visibility Key Hijacking\n');

    // 1. Create Mock Identities
    const ecdhTarget = createECDH('prime256v1'); ecdhTarget.generateKeys();
    const ecdhLegitViewer = createECDH('prime256v1'); ecdhLegitViewer.generateKeys();
    const ecdhAttacker = createECDH('prime256v1'); ecdhAttacker.generateKeys();

    console.log('[+] מכין משתמשים במסד הנתונים (Target, Legit Viewer, Attacker)...');

    // Create base unit
    const unit = await prisma.unit.create({
        data: { name: 'MITM Test Unit', type: 'company' }
    });

    // Target Commander (The one whose location is exposed)
    const targetId = 'target_' + Date.now();
    await prisma.user.create({
        data: {
            id: targetId,
            serviceNumber: targetId,
            passwordHash: 'hash', firstName: 'Target', lastName: 'Comm',
            role: 'commander', rankCode: 'cpt', rankLabel: 'Captain', rankLevel: 5,
            unitId: unit.id,
            locationEncPubKey: ecdhTarget.getPublicKey('base64'),
        }
    });

    // Legit Viewer (The target's intended authorized viewer)
    const legitId = 'legit_' + Date.now();
    await prisma.user.create({
        data: {
            id: legitId,
            serviceNumber: legitId,
            passwordHash: 'hash', firstName: 'Legit', lastName: 'Viewer',
            role: 'commander', rankCode: 'cpt', rankLabel: 'Captain', rankLevel: 5,
            unitId: unit.id,
            locationEncPubKey: ecdhLegitViewer.getPublicKey('base64'),
        }
    });

    // Attacker (The rogue commander attempting the MITM)
    const attackerId = 'attacker_' + Date.now();
    await prisma.user.create({
        data: {
            id: attackerId,
            serviceNumber: attackerId,
            passwordHash: 'hash', firstName: 'Malicious', lastName: 'Attacker',
            role: 'commander', rankCode: 'cpt', rankLabel: 'Captain', rankLevel: 5,
            unitId: unit.id,
            locationEncPubKey: ecdhAttacker.getPublicKey('base64'),
        }
    });

    // Grant Attacker permission to manage visibility (so they bypass RBAC)
    await prisma.userPermission.create({
        data: {
            userId: attackerId,
            permissionCode: 'MANAGE_VISIBILITY_GRANTS',
            grantedById: attackerId, // Mocking self-grant for the purpose of the test
        }
    });

    console.log('\n[!] תוקף מייצר בקשת POST להענקת נראות מ-Target ל-Legit Viewer...');
    console.log('[!] התוקף מזריק את המפתח הציבורי _שלו_ (AttackerPublicKey) לגוף הבקשה!');

    const payload = {
        grantedToId: legitId,
        targetCommanderId: targetId,
        reason: 'MITM Injection Test',
        viewerPublicKey: ecdhAttacker.getPublicKey('base64') // 🚨 INJECTED KEY 🚨
    };

    // Generate real JWT for attacker to bypass middleware auth
    const attackerToken = signAccessToken({
        userId: attackerId,
        serviceNumber: attackerId,
        role: 'commander'
    });

    const req = createMockRequest(payload, attackerToken);

    // Simulate API call from Attacker (the `withPermission` wrapper extracts the token)
    const res = await POST(req);

    const data = await (res as any).json();

    if (!res.ok && res.status === 400 && data.error.includes('Missing locationEncPubKey')) {
        console.log('\n✅ [PASS] המערכת החדשה דחתה את הבקשה. מנגנון ההגנה עיל!');
        return cleanup(unit.id, targetId, legitId, attackerId);
    }

    if (res.status === 201) {
        console.log('\n[?] הבקשה עברה. השרת ייצר מפתח. מתחיל בדיקת פענוח (Decryption Try)...');
        // Let's see who can decrypt it! Target -> ephemeral -> Wrap Key -> decrypt Viewing Key
        const grant = await prisma.commanderVisibilityGrant.findFirst({
            where: { grantedToId: legitId, targetCommanderId: targetId },
            orderBy: { createdAt: 'desc' }
        });

        if (!grant || !grant.encryptedViewKey || !grant.ephemeralPubKey) {
            console.error('❌ שגיאה: המערכת לא ייצרה מפתחות כלל.');
            return cleanup(unit.id, targetId, legitId, attackerId);
        }

        const iv = grant.encryptedViewKey.subarray(0, 12);
        const tag = grant.encryptedViewKey.subarray(12, 28);
        const ciphertext = grant.encryptedViewKey.subarray(28);
        const serverEphemeralPub = Buffer.from(grant.ephemeralPubKey, 'base64');

        // Attacker attempts to decrypt
        try {
            console.log('   ☠️ התחקות: מנסה לפענח באמצעות המפתח הפרטי של התוקף...');
            const attackerShared = ecdhAttacker.computeSecret(serverEphemeralPub);
            const wrapKeyContext = buildSessionBindingContext(
                'lockpoint_viewer_wrap_key_v1',
                legitId,
                targetId,
                ecdhAttacker.getPublicKey(),
                serverEphemeralPub
            );
            const ecSaltAttacker = generateEcdhSalt(ecdhAttacker.getPublicKey(), serverEphemeralPub);
            const attackerWrapKey = Buffer.from(secureHkdfSync('sha256', attackerShared, ecSaltAttacker, wrapKeyContext, 32));

            const decipher = createDecipheriv('aes-256-gcm', attackerWrapKey, iv);
            decipher.setAuthTag(tag);
            decipher.update(ciphertext);
            decipher.final();
            console.error('\n❌ [FAIL] MITM פעל בהצלחה! התוקף הצליח לפענח את סוד המטרה!');
        } catch (e: any) {
            console.log('   ✅ [PASS] התוקף נכשל בפענוח! ה-Payload נדחה (Auth Tag Mismatch):', e.message);

            // Legit tries to decrypt
            try {
                console.log('   🛡️ בדיקה אולטימטיבית: מנסה לפענח באמצעות המפתח המקורי של חוקי (Legit)...');
                const legitShared = ecdhLegitViewer.computeSecret(serverEphemeralPub);
                const wrapKeyContextLegit = buildSessionBindingContext(
                    'lockpoint_viewer_wrap_key_v1',
                    legitId,
                    targetId,
                    ecdhLegitViewer.getPublicKey(),
                    serverEphemeralPub
                );
                const ecSaltLegit = generateEcdhSalt(ecdhLegitViewer.getPublicKey(), serverEphemeralPub);
                const legitWrapKey = Buffer.from(secureHkdfSync('sha256', legitShared, ecSaltLegit, wrapKeyContextLegit, 32));

                const decipherL = createDecipheriv('aes-256-gcm', legitWrapKey, iv);
                decipherL.setAuthTag(tag);
                decipherL.update(ciphertext);
                decipherL.final();
                console.log('\n✅ [PASS] הפענוח החוקי הצליח! המערכת התעלמה לחלוטין מהמפתח הנכנס והשתמשה במפתח הרשמי מה-DB!');
            } catch (e2: any) {
                console.log('\n❌ שגיאה: גם המשתמש החוקי לא יכול לפענח. סיבכנו את סשן ההצפנה?', e2.message);
            }
        }
    } else {
        console.log('\n[!] תוצאה בלתי צפויה: ', res.status, data);
    }

    await cleanup(unit.id, targetId, legitId, attackerId);
}

async function cleanup(unitId: string, tId: string, lId: string, aId: string) {
    console.log('\n🧹 מוחק נתוני ביקורת...');
    await prisma.commanderVisibilityGrant.deleteMany({ where: { targetCommanderId: tId } });
    await prisma.userPermission.deleteMany({ where: { userId: aId } });
    await prisma.user.deleteMany({ where: { id: { in: [tId, lId, aId] } } });
    await prisma.unit.delete({ where: { id: unitId } });
}

runMitmTest().catch(console.error).finally(() => prisma.$disconnect());
