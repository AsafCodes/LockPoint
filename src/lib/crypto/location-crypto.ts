/**
 * Commander Location Cryptography — Client-Side (Browser/Capacitor)
 * 
 * 🚨 SECURITY NOTICE 🚨
 * We STRICTLY use the native Web Crypto API (window.crypto.subtle).
 * We ABSOLUTELY DO NOT use 3rd-party Pure-JS libraries (like crypto-js, elliptic) 
 * to avoid V8 Timing Attacks, Garbage Collection side-channels, and Low-Entropy generators.
 * The underlying math is executed in optimized, constant-time C/C++ in the browser engine.
 */

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Perform HKDF Extract & Expand using Web Crypto API.
 * Maps to the server's secureHkdfSync output.
 */
async function deriveHkdfKey(
    sharedSecret: CryptoKey,
    saltBuffer: ArrayBuffer,
    infoBuffer: ArrayBuffer
): Promise<CryptoKey> {
    // HKDF using SHA-256
    return window.crypto.subtle.deriveKey(
        {
            name: 'HKDF',
            hash: 'SHA-256',
            salt: saltBuffer,
            info: infoBuffer,
        },
        sharedSecret, // The raw ECDH derived bits
        { name: 'AES-GCM', length: 256 }, // Target algorithm
        false, // Non-extractable memory
        ['decrypt']
    );
}

/**
 * Generates the HKDF extract salt using the exact identical formula to 
 * the server's `generateEcdhSalt`.
 */
async function generateClientEcdhSalt(pubA: ArrayBuffer, pubB: ArrayBuffer): Promise<ArrayBuffer> {
    const combined = new Uint8Array(pubA.byteLength + pubB.byteLength);
    combined.set(new Uint8Array(pubA), 0);
    combined.set(new Uint8Array(pubB), pubA.byteLength);

    return window.crypto.subtle.digest(
        { name: 'SHA-256' },
        combined
    );
}

/**
 * Builds the exact same HKDF Info Context used on the server.
 */
function buildClientSessionContext(
    domainTag: string,
    grantorId: string,
    targetId: string,
    key1: ArrayBuffer,
    key2: ArrayBuffer
): ArrayBuffer {
    const enc = new TextEncoder();
    const tagBytes = enc.encode(domainTag);
    const gIdBytes = enc.encode(grantorId);
    const tIdBytes = enc.encode(targetId);

    const totalLen =
        tagBytes.length + 1 +
        gIdBytes.length + 1 +
        tIdBytes.length + 1 +
        key1.byteLength +
        key2.byteLength;

    const context = new Uint8Array(totalLen);
    let offset = 0;

    context.set(tagBytes, offset); offset += tagBytes.length;
    context[offset++] = 0; // null separator

    context.set(gIdBytes, offset); offset += gIdBytes.length;
    context[offset++] = 0; // null separator

    context.set(tIdBytes, offset); offset += tIdBytes.length;
    context[offset++] = 0; // null separator

    context.set(new Uint8Array(key1), offset); offset += key1.byteLength;
    context.set(new Uint8Array(key2), offset);

    return context.buffer;
}

/**
 * Core Decryption Flow for Commander Locations
 * 
 * 1. Derives the Unwrap Key (Wrap Key) from the Ephemeral Public Key.
 * 2. Decrypts the Viewing Key.
 * 3. Uses the Viewing Key to decrypt the coordinates.
 */
export async function decryptCommanderLocation(
    encryptedLatBase64: string,
    encryptedLngBase64: string,
    nonceHex: string,
    serverEphemeralPubKeyBase64: string,
    encryptedViewKeyBase64: string,
    viewerPrivateKeyBase64: string, // Kept strictly local in IndexedDB/Secure Storage
    viewerPublicKeyBase64: string,
    grantorId: string,
    targetCommanderId: string
): Promise<{ lat: number, lng: number } | null> {
    try {
        // 1. Import Viewer's Private Key (PKCS8/JWK usually, but assuming raw for this example)
        // Note: Real implementations will load a non-extractable JWK from IndexedDB.
        // For demonstration, we assume we have the key handles.

        // ... (Implementation continues here once exact IndexedDB format is known from §9.10) ...

        console.log('[LocationCrypto] Native WebCrypto Decryption Init');
        // Placeholder return to allow front-end to build before §9.10 is injected.
        return null;

    } catch (error) {
        console.error('[LocationCrypto] Failed to decrypt location (Hardware mismatch or Invalid Key?)', error);
        return null;
    }
}
