/**
 * Password Policy Service
 * Enforces password complexity rules for the ERP system.
 */

export interface PasswordPolicyResult {
    valid: boolean;
    errors: string[];
}

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

/**
 * Validates a password against the security policy.
 * Rules:
 *  - Minimum 8 characters
 *  - At least one uppercase letter
 *  - At least one lowercase letter
 *  - At least one digit
 *  - At least one special character (!@#$%^&*...)
 *  - Not excessively long (128 chars max)
 */
export function validatePassword(password: string): PasswordPolicyResult {
    const errors: string[] = [];
    const pw = String(password || '');

    if (pw.length < MIN_LENGTH) {
        errors.push(`Password must be at least ${MIN_LENGTH} characters`);
    }
    if (pw.length > MAX_LENGTH) {
        errors.push(`Password must be at most ${MAX_LENGTH} characters`);
    }
    if (!/[A-Z]/.test(pw)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(pw)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(pw)) {
        errors.push('Password must contain at least one digit');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pw)) {
        errors.push('Password must contain at least one special character');
    }

    return { valid: errors.length === 0, errors };
}

/** Quick check — returns true if password passes all rules */
export const isPasswordValid = (password: string): boolean => validatePassword(password).valid;
