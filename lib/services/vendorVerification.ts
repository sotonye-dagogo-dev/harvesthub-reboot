/**
 * Vendor verification requirements — shared by new-vendor signup (/api/auth/register) and
 * buyer → vendor upgrade (/api/users/me/convert-to-vendor), so both routes ask for the same things.
 *
 * Seller types:
 *  - INDIVIDUAL: individual / small seller. Needs a valid ID + utility bill. CAC is optional.
 *  - BUSINESS:   registered business. Needs a valid ID + CAC certificate + utility bill.
 * Requests that don't say which (older clients) are treated as BUSINESS, i.e. the stricter rule.
 */

export const SELLER_TYPES = ['INDIVIDUAL', 'BUSINESS'] as const;
export type SellerType = (typeof SELLER_TYPES)[number];

export const VERIFICATION_DOC_TYPES = ['ID', 'BUSINESS_REGISTRATION', 'UTILITY_BILL'] as const;
export type VerificationDocType = (typeof VERIFICATION_DOC_TYPES)[number];

export const ID_TYPES = ['NIN', 'DRIVERS_LICENSE', 'VOTERS_CARD', 'INTERNATIONAL_PASSPORT'] as const;

export function normalizeSellerType(value: unknown): SellerType {
    return value === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'BUSINESS';
}

export function requiredDocTypesFor(sellerType: SellerType): VerificationDocType[] {
    return sellerType === 'INDIVIDUAL' ? ['ID', 'UTILITY_BILL'] : ['ID', 'BUSINESS_REGISTRATION', 'UTILITY_BILL'];
}

export function missingDocsMessage(sellerType: SellerType): string {
    return sellerType === 'INDIVIDUAL'
        ? 'Please upload a valid ID and a utility bill. A CAC certificate is optional for individual sellers.'
        : 'Registered businesses must upload a valid ID, a CAC business registration certificate and a utility bill.';
}

type DocLike = { documentType?: unknown; url?: unknown };

export type VerificationCheck =
    | { ok: true; sellerType: SellerType; documents: Array<Record<string, unknown>> }
    | { ok: false; error: string; code: 'MISSING_DOCUMENTS' | 'INVALID_DOCUMENT_URL' | 'INVALID_ID_TYPE' };

/**
 * Validate uploaded verification documents for a seller type.
 * Only managed Cloudinary upload URLs are accepted.
 */
export function checkVerificationDocuments(input: {
    sellerType: unknown;
    documents: unknown;
    idType?: unknown;
}): VerificationCheck {
    const sellerType = normalizeSellerType(input.sellerType);
    const documents = (Array.isArray(input.documents) ? input.documents : []).filter(
        (doc): doc is Record<string, unknown> => Boolean(doc) && typeof doc === 'object'
    );

    const hasAll = requiredDocTypesFor(sellerType).every((required) =>
        documents.some((doc: DocLike) => doc.documentType === required)
    );
    if (!hasAll) return { ok: false, error: missingDocsMessage(sellerType), code: 'MISSING_DOCUMENTS' };

    const badUrl = documents.some((doc: DocLike) => {
        const url = typeof doc.url === 'string' ? doc.url : '';
        return !url.startsWith('https://res.cloudinary.com/');
    });
    if (badUrl) {
        return { ok: false, error: 'Verification documents must use managed Cloudinary upload URLs.', code: 'INVALID_DOCUMENT_URL' };
    }

    if (input.idType !== undefined && input.idType !== null && input.idType !== '' && !ID_TYPES.includes(input.idType as (typeof ID_TYPES)[number])) {
        return { ok: false, error: 'Please choose a valid ID type.', code: 'INVALID_ID_TYPE' };
    }

    return { ok: true, sellerType, documents };
}

/**
 * Membership vetting details (PRD 8.1): department or unit plus a referee, so Support can
 * check the vendor against workforce/department records.
 */
export type VettingDetails = { department: string; refereeName: string; refereePhone: string };

const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/;

export function checkVettingDetails(input: {
    department?: unknown;
    refereeName?: unknown;
    refereePhone?: unknown;
}): { ok: true; details: VettingDetails } | { ok: false; error: string; code: 'MISSING_VETTING_DETAILS' } {
    const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
    const department = clean(input.department, 120);
    const refereeName = clean(input.refereeName, 120);
    const refereePhone = clean(input.refereePhone, 20);
    if (!department || !refereeName || !refereePhone) {
        return {
            ok: false,
            error: 'Please add your department or unit and a referee (name and phone number).',
            code: 'MISSING_VETTING_DETAILS',
        };
    }
    if (!PHONE_PATTERN.test(refereePhone)) {
        return { ok: false, error: "Please enter a valid phone number for your referee.", code: 'MISSING_VETTING_DETAILS' };
    }
    return { ok: true, details: { department, refereeName, refereePhone } };
}
