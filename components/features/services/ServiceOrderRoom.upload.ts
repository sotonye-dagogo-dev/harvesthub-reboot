/**
 * Order-room attachment uploads (chat + requirement FILE answers).
 *
 * Shared change pending: `app/api/upload/route.ts` validates `folderType`
 * against a hardcoded `VALID_FOLDER_TYPES` list (union in
 * `lib/utils/uploadConfig.ts`) that has no `order-attachment` entry, and that
 * file is outside this task's partition. The helper therefore posts the
 * intended folder and turns the server's rejection into an actionable message;
 * once the shared folder lands (FolderType union + VALID_FOLDER_TYPES + one
 * `resolveFolder` case) this starts working with no client change.
 */
export const ORDER_ATTACHMENT_FOLDER = 'order-attachment';

export type OrderAttachment = {
    url: string;
    name: string;
    type: string;
};

export async function uploadOrderAttachment(
    file: File,
    scope?: { userId?: string; vendorId?: string },
): Promise<OrderAttachment> {
    const form = new FormData();
    form.append('file', file);
    form.append('folderType', ORDER_ATTACHMENT_FOLDER);
    if (scope?.userId) form.append('userId', scope.userId);
    if (scope?.vendorId) form.append('vendorId', scope.vendorId);

    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        url?: string;
        error?: string;
    };

    if (!res.ok || !data?.success || !data.url) {
        if (res.status === 400 && /folderType/i.test(data?.error || '')) {
            throw new Error(
                'Attachment uploads are unavailable until the shared order-attachment upload folder is registered.',
            );
        }
        throw new Error(data?.error || 'Unable to upload attachment.');
    }

    return { url: data.url, name: file.name, type: file.type };
}
