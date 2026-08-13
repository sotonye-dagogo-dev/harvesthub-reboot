import { describe, expect, it } from 'vitest';
import {
    isAssetInFolder,
    getVerificationDocFolder,
    CLOUDINARY_ROOT_FOLDER,
    resolveUploadParams,
} from '@/lib/services/cloudinary';

describe('cloudinary scope guard', () => {
  it('accepts a public_id that lives under the folder scope', () => {
    const folder = getVerificationDocFolder('guest-abc');
    expect(isAssetInFolder(`${folder}/doc123`, folder)).toBe(true);
  });

  it('rejects a public_id outside the folder scope', () => {
    const folder = getVerificationDocFolder('guest-abc');
    expect(isAssetInFolder('myharvesthub/products/other/asset', folder)).toBe(false);
  });

  it('rejects a prefix-only match that is not an actual child', () => {
    const folder = `${CLOUDINARY_ROOT_FOLDER}/verification-docs/guest-ab`;
    // A sibling guest folder shares the prefix but is not a child asset.
    expect(isAssetInFolder(`${CLOUDINARY_ROOT_FOLDER}/verification-docs/guest-abc/doc`, folder)).toBe(false);
  });
});

describe('cloudinary resolveUploadParams', () => {
  const DOCUMENT_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'pdf'];
  const IMAGE_FORMATS = ['jpeg', 'jpg', 'png', 'webp'];

  it('maps image MIME types to the image resource type', () => {
    const params = resolveUploadParams(
      'data:image/png;base64,iVBORw0KGgo=',
      IMAGE_FORMATS
    );
    expect(params.ext).toBe('png');
    expect(params.resourceType).toBe('image');
    expect(params.transformation).toBeDefined();
  });

  it('maps PDFs to the image resource type so thumbnails keep working', () => {
    const params = resolveUploadParams(
      'data:application/pdf;base64,JVBERi0xLjQ=',
      DOCUMENT_FORMATS
    );
    expect(params.ext).toBe('pdf');
    expect(params.resourceType).toBe('image');
    expect(params.transformation).toBeDefined();
  });

  it('maps video MIME types to the video resource type', () => {
    const params = resolveUploadParams(
      'data:video/mp4;base64,AAAA',
      ['mp4', 'webm', 'mov']
    );
    expect(params.ext).toBe('mp4');
    expect(params.resourceType).toBe('video');
  });

  it('maps other document MIME types to the raw resource type without transformations', () => {
    const params = resolveUploadParams(
      'data:text/csv;base64,aCw=' ,
      ['csv']
    );
    expect(params.ext).toBe('csv');
    expect(params.resourceType).toBe('raw');
    expect(params.transformation).toBeUndefined();
  });

  it('rejects formats that are not in the allowed list', () => {
    expect(() =>
      resolveUploadParams('data:image/heic;base64,AAAA', IMAGE_FORMATS)
    ).toThrow(/not allowed/);
    expect(() =>
      resolveUploadParams('data:application/pdf;base64,AAAA', IMAGE_FORMATS)
    ).toThrow(/not allowed/);
  });

  it('rejects a malformed data URI', () => {
    expect(() => resolveUploadParams('not-a-data-uri', IMAGE_FORMATS)).toThrow(
      /Invalid file data URI/
    );
  });
});
