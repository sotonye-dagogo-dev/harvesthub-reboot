import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  deleteUploadedAsset,
  getUploadErrorMessage,
} from '@/lib/utils/uploadHelpers';

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

describe('getUploadErrorMessage', () => {
  it('turns a size-limit message into concise copy with the max size hint', () => {
    const msg = getUploadErrorMessage(
      new Error('File size (6.2MB) exceeds the 5MB limit.'),
      { maxSizeMB: 5 }
    );
    expect(msg).toBe('File is too large (max 5MB).');
  });

  it('turns an unsupported-type message into concise copy listing accepted formats', () => {
    const msg = getUploadErrorMessage(
      new Error('File type "heic" is not allowed. Accepted formats: jpeg, jpg, png, webp, pdf'),
      { allowedFormats: ['jpeg', 'png', 'pdf'] }
    );
    expect(msg).toBe('Unsupported file type. Use JPG, PNG or PDF.');
  });

  it('passes through a short, specific server error message', () => {
    const msg = getUploadErrorMessage(new Error('File is corrupted and cannot be processed.'));
    expect(msg).toBe('File is corrupted and cannot be processed.');
  });

  it('maps network failures to a helpful connection message', () => {
    const msg = getUploadErrorMessage(new Error('Failed to fetch'));
    expect(msg).toBe('Network error. Please check your connection and try again.');
  });

  it('falls back when the error is opaque', () => {
    const msg = getUploadErrorMessage(new Error('disk explode stack trace something'),
      { fallback: 'Upload failed. Please try again.' });
    expect(msg).toBe('Upload failed. Please try again.');
  });

  it('returns the fallback for non-Error values', () => {
    const msg = getUploadErrorMessage(null);
    expect(msg).toBe('Upload failed. Please try again.');
  });
});
