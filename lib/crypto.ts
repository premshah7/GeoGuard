import crypto from 'crypto';

const SECRET = process.env.AUTH_SECRET || 'fallback-secret';

export function generateQrToken(sessionId: number) {
    const timestamp = Date.now();
    // Valid for 10 seconds (with 2s grace for network latency = 12s total check window)
    const payload = `${sessionId}:${timestamp}`;
    const hmac = crypto.createHmac('sha256', SECRET);
    hmac.update(payload);
    const signature = hmac.digest('hex');

    return `${payload}:${signature}`;
}

export function verifyQrToken(token: string) {
    try {
        const [sessionIdStr, timestampStr, signature] = token.split(':');
        const sessionId = parseInt(sessionIdStr);
        const timestamp = parseInt(timestampStr);

        // 1. Check Signature
        const payload = `${sessionIdStr}:${timestampStr}`;
        const hmac = crypto.createHmac('sha256', SECRET);
        hmac.update(payload);
        const expectedSignature = hmac.digest('hex');

        if (signature !== expectedSignature) return { valid: false, error: 'Invalid signature' };

        // 2. Check Expiry (10s window + 5s grace for clock skew/latency)
        const now = Date.now();
        const diff = now - timestamp;

        if (diff > 15000 || diff < -2000) { // Allow slight future time for clock skew
            return { valid: false, error: 'Token expired' };
        }

        return { valid: true, sessionId };
    } catch (error) {
        return { valid: false, error: 'Malformed token' };
    }
}
