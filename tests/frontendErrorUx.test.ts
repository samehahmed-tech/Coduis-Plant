import { describe, expect, it } from 'vitest';
import { getActionableErrorMessage } from '../services/api';

describe('frontend error UX mapping', () => {
    it('maps conflict code to actionable arabic guidance', () => {
        const message = getActionableErrorMessage({ code: 'ORDER_VERSION_CONFLICT' }, 'ar');
        expect(message).toContain('تم تعديله');
    });

    it('maps permission code to actionable english guidance', () => {
        const message = getActionableErrorMessage({ code: 'FORBIDDEN' }, 'en');
        expect(message).toContain('permission');
    });

    it('falls back to original message when code is unknown', () => {
        const message = getActionableErrorMessage({ code: 'SOME_UNKNOWN', message: 'Custom failure' }, 'en');
        expect(message).toBe('Custom failure');
    });
});
