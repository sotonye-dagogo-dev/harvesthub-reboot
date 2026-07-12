# app/api/upload/route.ts

## Purpose

Central managed upload endpoint for authenticated and scoped guest media uploads.

## Responsibilities

- Validate upload intent/folder type and enforce allowed modes.
- Apply IP/auth constraints and rate limiting.
- Persist or return managed asset metadata as configured.

## Inputs

- Multipart payload from uploader components.
- Folder type metadata (for example ad, payment-proof, verification-doc, bug-report).

## Outputs

- Canonical managed asset URL plus upload metadata (publicId, dimensions, type where available).

## Risks

- Relaxing folder controls can expose abuse vectors.
- Consumers must not bypass this route with raw third-party URLs for governed fields.
