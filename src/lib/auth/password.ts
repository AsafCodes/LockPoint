// ─────────────────────────────────────────────────────────────
// LockPoint — Password Hashing (bcrypt)
// ─────────────────────────────────────────────────────────────

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/** Hash a plaintext password */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/** Verify a password against a hash (constant-time) */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}
