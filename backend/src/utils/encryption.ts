import * as crypto from 'crypto';

/**
 * Simple AES-256-GCM encryption utility for storing sensitive data in database.
 * Uses a secret key derived from JWT_SECRET environment variable.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment variable
 * Uses JWT_SECRET as the base, derives a 32-byte key using SHA-256
 */
function getEncryptionKey(): Buffer {
    const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt a string value
 * @param plaintext The string to encrypt
 * @returns Base64 encoded encrypted string (includes IV and auth tag)
 */
export function encrypt(plaintext: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine IV + authTag + encrypted data
    const combined = Buffer.concat([
        iv,
        authTag,
        Buffer.from(encrypted, 'hex')
    ]);

    return combined.toString('base64');
}

/**
 * Decrypt a string value
 * @param encryptedBase64 Base64 encoded encrypted string
 * @returns Decrypted plaintext string
 */
export function decrypt(encryptedBase64: string): string {
    try {
        const key = getEncryptionKey();
        const combined = Buffer.from(encryptedBase64, 'base64');

        // Extract IV, auth tag, and encrypted data
        const iv = combined.subarray(0, IV_LENGTH);
        const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
        const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        throw new Error('Failed to decrypt value - data may be corrupted or key changed');
    }
}

/**
 * Check if a value looks like it's encrypted (Base64 encoded with correct length)
 */
export function isEncrypted(value: string): boolean {
    try {
        const decoded = Buffer.from(value, 'base64');
        // Minimum length: IV (16) + AuthTag (16) + at least 1 byte of data
        return decoded.length >= IV_LENGTH + AUTH_TAG_LENGTH + 1;
    } catch {
        return false;
    }
}
