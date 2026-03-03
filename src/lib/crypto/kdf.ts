import { hkdfSync } from 'crypto';

const ALLOWED_KDF_HASHES = new Set(['sha256', 'sha384', 'sha512']);

/**
 * PLATINUM SECURITY ENFORCEMENT
 * A hardened wrapper around Node's built-in `hkdfSync` that strictly forbids weak hash 
 * functions (like MD5 or SHA1) from being used in Key Derivation Functions.
 * This prevents Downgrade Attacks on the cryptographic core.
 */
export function secureHkdfSync(
    hash: string,
    ikm: string | NodeJS.ArrayBufferView,
    salt: string | NodeJS.ArrayBufferView,
    info: string | NodeJS.ArrayBufferView,
    length: number
): ArrayBuffer {
    if (!ALLOWED_KDF_HASHES.has(hash.toLowerCase())) {
        throw new Error(`[Security Violation] The hash algorithm '${hash}' is explicitly forbidden for KDF operations. Only SHA-2 / SHA-3 family hashes are permitted.`);
    }
    return hkdfSync(hash, ikm, salt, info, length);
}
