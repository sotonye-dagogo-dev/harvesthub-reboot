import { describe, expect, it } from 'vitest';
import { isAssetInFolder, getVerificationDocFolder, CLOUDINARY_ROOT_FOLDER } from '@/lib/services/cloudinary';

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
