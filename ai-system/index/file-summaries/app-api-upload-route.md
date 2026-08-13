# app/api/upload/route.ts

## Purpose

Central managed upload endpoint for authenticated and scoped guest media uploads.

## Responsibilities

- Validate upload intent/folder type and enforce allowed modes.
- Apply IP/auth constraints and rate limiting.
- Persist or return managed asset metadata as configured.
- `DELETE /api/upload` — owner-scoped asset destruction: destroys a Cloudinary asset by `publicId`
  only when it falls inside the requester's folder scope (authenticated = the user's own folder;
  guest = `guest-<guestUploadId>`), enforced via `lib/services/cloudinary.ts::isAssetInFolder`.

## Inputs

- Multipart payload from uploader components.
- Folder type metadata (for example ad, payment-proof, verification-doc, bug-report).
- `DELETE`: `publicId`, `folderType`, optional `guestUploadId`.

## Outputs

- Canonical managed asset URL plus upload metadata (publicId, dimensions, type where available).
- `DELETE`: `{ ok: true }` on success, 4xx when the asset is outside the caller's folder scope or not
  found.

## Risks

- Relaxing folder controls can expose abuse vectors.
- Consumers must not bypass this route with raw third-party URLs for governed fields.
- Deleting assets must stay scope-confined so one user cannot destroy another's files.
