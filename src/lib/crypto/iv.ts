import { randomBytes } from 'crypto';

/**
 * PLATINUM DEFENSE: Hybrid IV Generation
 * MITIGATION (System Starvation, VM Snapshot Replay & Two-Time Pad):
 * If the PRNG correlates (entropy dead) AND the VM is restored from snapshot (freezing process.hrtime),
 * we use a Tri-Fold Hybrid IV: Wall-Clock (Date.now()) + Monotonic Uptime (hrtime) + PRNG (randomBytes).
 * Hypervisors sync Wall-Clock on resume, so Date.now() shifts even if RAM/PRNG is frozen, saving us from Two-Time Pad.
 */
export function generateHybridIv(): Buffer {
    const iv = Buffer.alloc(12);
    const wallClockMs = BigInt(Date.now()); // Real-world time from Hypervisor (~42 bits)
    const monoNano = process.hrtime.bigint() & BigInt(0x3FFFFF); // Fast changing nanoseconds (22 bits max)
    const hybridTime = (wallClockMs << BigInt(22)) | monoNano; // 64-bit combination
    iv.writeBigUInt64BE(hybridTime, 0);
    randomBytes(4).copy(iv, 8); // 4 bytes of randomness
    return iv;
}
