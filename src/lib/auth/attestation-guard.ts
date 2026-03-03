// ─────────────────────────────────────────────────────────────
// LockPoint — Hardware Attestation Guard
// ─────────────────────────────────────────────────────────────

import { createVerify } from 'crypto';
import { prisma } from '@/lib/db';

export interface LocationProof {
    signatureHex: string;
    timestamp: number;
    lat: number;
    lng: number;
}

/**
 * HARD GATE — rejects commander location writes unless:
 * 1. User has a registered devicePublicKey (from §9.10 registration)
 * 2. Request includes a valid LocationProof with ECDSA signature
 * 3. Signature verifies against the stored public key
 *
 * Returns 403 if ANY condition fails. No fallback. No stub.
 */
export async function enforceCommanderAttestation(
    userId: string,
    proof?: LocationProof
): Promise<{ allowed: boolean; error?: string }> {
    if (!proof) {
        return {
            allowed: false,
            error: 'חובה לספק הוכחת מיקום חתומה חומרתית (LocationProof) עבור קצינים.',
        };
    }

    // 1. Fetch the commander's public key from the DB
    const commander = await prisma.user.findUnique({
        where: { id: userId },
        select: { devicePublicKey: true },
    });

    if (!commander?.devicePublicKey) {
        return {
            allowed: false,
            error: 'המכשיר שלך טרם נרשם במערכת (Missing devicePublicKey). חובה להשלים רישום חומרתי (§9.10).',
        };
    }

    // 2. Prevent Replay Attacks (Timestamp must be within last 5 minutes)
    const now = Date.now();
    const proofAgeMs = Math.abs(now - proof.timestamp);
    if (proofAgeMs > 5 * 60 * 1000) {
        return {
            allowed: false,
            error: 'חתימת המיקום פגת תוקף (Replay Attack Protection). הטלפון אינו מסונכרן.',
        };
    }

    // 3. Reconstruct the exact string that was signed on the device
    const payloadToSign = `${userId}:${proof.timestamp}:${proof.lat}:${proof.lng}`;

    // 4. Verify the ECDSA signature using Node's Native Crypto
    try {
        const verify = createVerify('SHA256');
        verify.update(payloadToSign);
        verify.end();

        // Assuming devicePublicKey is stored as base64 DER/PEM
        // In actual production (§9.10), standard PEM format or JWK export converted to PEM is used.
        const publicKeyPem = Buffer.from(commander.devicePublicKey, 'base64').toString('utf-8');

        // Check buffer structure natively
        const isValid = verify.verify(publicKeyPem, proof.signatureHex, 'hex');

        if (!isValid) {
            return {
                allowed: false,
                error: 'חתימת האבטחה (ECDSA) אינה תואמת למיקום זה. דיווח המיקום נדחה (Attestation Failed).',
            };
        }

        return { allowed: true };
    } catch (err: any) {
        console.error('[AttestationGuard] Signature verification failed:', err.message);
        return {
            allowed: false,
            error: 'שגיאה קריפטוגרפית באימות חתימת החומרה. המפתח חסר או פגום.',
        };
    }
}

// ─────────────────────────────────────────────────────────────
// PLATINUM DEFENSE: Grant Replay Attack Prevention
// ─────────────────────────────────────────────────────────────

export interface GrantProof {
    signatureHex: string;
    timestamp: number;
    nonce: string; // Adds entropy & limits replay window
    grantedToId: string;
    targetCommanderId: string;
}

/**
 * HARD GATE — rejects visibility grant creation unless:
 * 1. User has a registered devicePublicKey
 * 2. Request includes a valid GrantProof with ECDSA signature
 * 3. Timestamp is within bounds (Replay Prevention)
 */
export async function enforceGrantAttestation(
    grantorId: string,
    proof?: GrantProof
): Promise<{ allowed: boolean; error?: string }> {
    if (!proof) {
        return {
            allowed: false,
            error: 'חובה לספק הוכחת הענקה חתומה חומרתית (GrantProof). חסימת חריגת אבטחה.',
        };
    }

    const commander = await prisma.user.findUnique({
        where: { id: grantorId },
        select: { devicePublicKey: true },
    });

    if (!commander?.devicePublicKey) {
        return { allowed: false, error: 'המכשיר שלך טרם נרשם במערכת (Missing devicePublicKey).' };
    }

    // Anti-Replay Threshold
    const now = Date.now();
    const proofAgeMs = Math.abs(now - proof.timestamp);
    if (proofAgeMs > 5 * 60 * 1000) {
        return { allowed: false, error: 'חתימת ההענקה פגת תוקף (Replay Attack Protection).' };
    }

    // Nonce must be at least 16 chars for proper entropy
    if (!proof.nonce || proof.nonce.length < 16) {
        return { allowed: false, error: 'חסר Nonce או שאורכו קצר מדי למניעת Replay Attacks.' };
    }

    const payloadToSign = `${grantorId}:${proof.timestamp}:${proof.nonce}:${proof.grantedToId}:${proof.targetCommanderId}`;

    try {
        const verify = createVerify('SHA256');
        verify.update(payloadToSign);
        verify.end();

        const publicKeyPem = Buffer.from(commander.devicePublicKey, 'base64').toString('utf-8');
        const isValid = verify.verify(publicKeyPem, proof.signatureHex, 'hex');

        if (!isValid) {
            return { allowed: false, error: 'חתימת האבטחה (ECDSA) אינה תואמת לנתוני ההענקה. הגישה נדחתה.' };
        }

        return { allowed: true };
    } catch (err: any) {
        console.error('[AttestationGuard] Grant Signature verification failed:', err.message);
        return { allowed: false, error: 'שגיאה קריפטוגרפית באימות חתימת הענקת הגישה.' };
    }
}
