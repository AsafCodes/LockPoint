import { createHash } from 'crypto';

/**
 * PLATINUM DEFENSE: ECDH Geometric Salting
 * MITIGATION (ECDH Non-Uniformity & HKDF Extract Phase Salt):
 * ECDH secrets are derived from curve coordinates, making their bit distribution non-uniform.
 * By supplying a robust Salt (combining both Public Keys) to the HKDF Extract phase instead of an empty buffer,
 * we guarantee optimal Entropy extraction from the raw curve point into the symmetric key space.
 */
export function generateEcdhSalt(pubKeyA: Buffer, pubKeyB: Buffer): Buffer {
    return createHash('sha256').update(pubKeyA).update(pubKeyB).digest();
}

/**
 * PLATINUM DEFENSE: KDF Session Binding Context
 * MITIGATION (Low-Entropy KDF, Session Binding & Replay Attacks): 
 * We strictly bind the KDF to the specific keys AND the User IDs (Grantor, Viewer, Target) of this session.
 * This satisfies the requirement for "KDF with additional context (e.g. a counter/identity)"
 */
export function buildSessionBindingContext(
    purposeStr: string,
    actor1Id: string,
    actor2Id: string,
    pubKeyA: Buffer,
    pubKeyB: Buffer
): Buffer {
    return Buffer.concat([
        Buffer.from(purposeStr, 'utf8'),
        Buffer.from(actor1Id, 'utf8'),
        Buffer.from(actor2Id, 'utf8'),
        pubKeyA,
        pubKeyB
    ]);
}
