import crypto from 'crypto';

import { env } from '@/lib/config/env';

function normaliseSignature(signature: string | null): string | null {
    if (!signature) {
        return null;
    }

    const trimmed = signature.trim();
    if (trimmed.startsWith('sha256=')) {
        return trimmed.slice('sha256='.length);
    }

    return trimmed.length > 0 ? trimmed : null;
}

export const cisConfig = {
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'MyHarvestHub',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
    apiUrl: env.cisApiUrl || null,
    platformSlug: env.cisPlatformSlug,
    clientId: env.cisClientId || null,
    clientSecret: env.cisClientSecret || null,
    webhookSecret: env.cisWebhookSecret || null,
    webhookPath: env.cisWebhookPath,
    webhookAllowedSkewSeconds: env.cisWebhookAllowedSkewSeconds,
    ready: Boolean(env.cisApiUrl && env.cisClientId && env.cisClientSecret && env.cisWebhookSecret),
} as const;

export function buildCisWebhookSignature(timestamp: string, payload: string): string {
    if (!cisConfig.webhookSecret) {
        return '';
    }

    return crypto.createHmac('sha256', cisConfig.webhookSecret).update(`${timestamp}.${payload}`).digest('hex');
}

export function verifyCisWebhookSignature(params: {
    payload: string;
    signature: string | null;
    timestamp: string | null;
}): boolean {
    if (!cisConfig.webhookSecret) {
        return false;
    }

    const normalizedSignature = normaliseSignature(params.signature);
    const numericTimestamp = params.timestamp ? Number.parseInt(params.timestamp, 10) : Number.NaN;

    if (!normalizedSignature || Number.isNaN(numericTimestamp)) {
        return false;
    }

    const ageSeconds = Math.abs(Date.now() - numericTimestamp) / 1000;
    if (ageSeconds > cisConfig.webhookAllowedSkewSeconds) {
        return false;
    }

    const expectedSignature = params.timestamp ? buildCisWebhookSignature(params.timestamp, params.payload) : "";
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const providedBuffer = Buffer.from(normalizedSignature, 'hex');

    if (expectedBuffer.length !== providedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}