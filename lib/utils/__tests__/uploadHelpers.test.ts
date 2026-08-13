import { describe, it, expect, vi, afterEach } from 'vitest';
import { deleteUploadedAsset } from '@/lib/utils/uploadHelpers';

describe('deleteUploadedAsset', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls DELETE /api/upload with the publicId, folderType, and guest scope', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ deleted: true, publicId: 'pub-1' }),
    } as Response);

    const result = await deleteUploadedAsset({
      publicId: 'myharvesthub/verification-docs/guest-abc/doc1',
      folderType: 'verification-doc',
      guestUploadId: 'abc',
    });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [unknown, RequestInit | undefined];
    expect(String(url)).toContain('/api/upload?');
    expect(String(url)).toContain('publicId=myharvesthub%2Fverification-docs%2Fguest-abc%2Fdoc1');
    expect(String(url)).toContain('folderType=verification-doc');
    expect(String(url)).toContain('guestUploadId=abc');
    expect(init?.method).toBe('DELETE');
  });

  it('returns the server error message when the delete fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Asset does not belong to this upload scope' }),
    } as Response);

    const result = await deleteUploadedAsset({ publicId: 'x', folderType: 'verification-doc' });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Asset does not belong to this upload scope');
  });

  it('returns an error when the request itself throws', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));

    const result = await deleteUploadedAsset({ publicId: 'x', folderType: 'banner' });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('network down');
  });
});
