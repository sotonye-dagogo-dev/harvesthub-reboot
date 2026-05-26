import type { InputJsonValue } from '@prisma/client/runtime/client.js';

import { prisma } from '@/lib/db/prisma';

export type CisWebhookPayload = {
    eventType: string;
    sourcePlatform: string;
    subjectId?: string;
    externalUserId?: string;
    payload?: Record<string, unknown>;
};

export type CisWebhookPersistenceResult = {
    identityId: string | null;
    linkedUserId: string | null;
};

const EMAIL_KEYS = ['email', 'userEmail', 'contactEmail'];
const PHONE_KEYS = ['phone', 'phoneNumber', 'mobile', 'whatsappNumber'];
const FIRST_NAME_KEYS = ['firstName', 'givenName'];
const LAST_NAME_KEYS = ['lastName', 'surname', 'familyName'];
const DISPLAY_NAME_KEYS = ['displayName', 'fullName', 'name'];
const ROLE_KEYS = ['role', 'userRole'];
const STATUS_KEYS = ['status', 'state', 'lifecycleStatus'];

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function readStringFrom(source: Record<string, unknown> | undefined, keys: string[]): string | null {
    if (!source) {
        return null;
    }

    for (const key of keys) {
        const candidate = readString(source[key]);
        if (candidate) {
            return candidate;
        }
    }

    return null;
}

function extractProfile(payload?: Record<string, unknown>) {
    const nestedUser = isRecord(payload?.user) ? payload?.user : undefined;
    const nestedProfile = isRecord(payload?.profile) ? payload?.profile : undefined;
    const source = nestedUser ?? nestedProfile ?? payload;

    const firstName = readStringFrom(source, FIRST_NAME_KEYS);
    const lastName = readStringFrom(source, LAST_NAME_KEYS);
    const displayName = readStringFrom(source, DISPLAY_NAME_KEYS);

    return {
        email: readStringFrom(source, EMAIL_KEYS),
        phone: readStringFrom(source, PHONE_KEYS),
        firstName,
        lastName,
        displayName:
            displayName ??
            (firstName && lastName
                ? `${firstName} ${lastName}`
                : firstName ?? lastName ?? null),
        role: readStringFrom(source, ROLE_KEYS),
        status: readStringFrom(source, STATUS_KEYS),
    };
}

function toJsonValue(payload?: Record<string, unknown>): InputJsonValue | null {
    if (!payload) {
        return null;
    }

    return payload as InputJsonValue;
}

async function resolveLinkedUserId(externalUserId: string | null, email: string | null): Promise<string | null> {
    if (externalUserId) {
        const user = await prisma.user.findUnique({ where: { id: externalUserId } });
        if (user) {
            return user.id;
        }
    }

    if (email) {
        const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
        if (user) {
            return user.id;
        }
    }

    return null;
}

export async function recordCisWebhookEvent(
    input: CisWebhookPayload
): Promise<CisWebhookPersistenceResult> {
    const subjectId = input.subjectId ?? null;
    const externalUserId = input.externalUserId ?? null;
    const payloadJson = toJsonValue(input.payload ?? undefined);
    const profile = extractProfile(input.payload);
    const now = new Date();

    let linkedUserId: string | null = null;
    if (subjectId && (externalUserId || profile.email)) {
        linkedUserId = await resolveLinkedUserId(externalUserId, profile.email ?? null);
    }

    let identityId: string | null = null;
    if (subjectId) {
        const identity = await prisma.cisIdentity.upsert({
            where: {
                cisSubjectId_sourcePlatform: {
                    cisSubjectId: subjectId,
                    sourcePlatform: input.sourcePlatform,
                },
            },
            create: {
                cisSubjectId: subjectId,
                sourcePlatform: input.sourcePlatform,
                externalUserId,
                linkedUserId,
                email: profile.email,
                phone: profile.phone,
                displayName: profile.displayName,
                role: profile.role,
                status: profile.status,
                payload: payloadJson ?? undefined,
                lastEventType: input.eventType,
                lastEventAt: now,
            },
            update: {
                externalUserId: externalUserId ?? undefined,
                linkedUserId: linkedUserId ?? undefined,
                email: profile.email ?? undefined,
                phone: profile.phone ?? undefined,
                displayName: profile.displayName ?? undefined,
                role: profile.role ?? undefined,
                status: profile.status ?? undefined,
                payload: payloadJson ?? undefined,
                lastEventType: input.eventType,
                lastEventAt: now,
            },
        });

        identityId = identity.id;
    }

    await prisma.cisWebhookEvent.create({
        data: {
            identityId,
            eventType: input.eventType,
            sourcePlatform: input.sourcePlatform,
            subjectId,
            externalUserId,
            payload: payloadJson ?? undefined,
            receivedAt: now,
        },
    });

    return { identityId, linkedUserId: identityId ? linkedUserId : null };
}
