# Banner Ratio Rebalance Evidence — 2026-04-14

## Scope

Runtime and preview contract updates for:
- `TOP` banner strip
- `HERO` carousel viewport
- `SIDEBAR` banner tile density and square ratio

## Contract Snapshots (Code-Level)

### Top Strip (`components/features/TopAdBanner.tsx`)
- Updated class contract: `aspect-[64/10] min-h-[28px] max-h-[44px]`
- Runtime target: approximately half previous top strip max height while preserving full-width image-first display.

### Hero Viewport (`components/features/BannerCarousel.tsx`)
- Updated class contract:
  - `h-[184px]`
  - `sm:h-[216px]`
  - `md:h-[268px]`
  - `lg:h-[300px]`
  - `xl:h-[332px]`
- Runtime target: approximately 1/6 shorter than prior contract at each breakpoint.

### Sidebar Rail (`app/components/HomeContent.tsx`)
- Increased visible sidebar cap from `slice(0, 3)` to `slice(0, 6)`.
- Updated tile shape to square: `aspect-square`.
- Updated responsive density contract with hero present: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-2`.

### Preview Parity (`components/features/BannerPlacementPreview.tsx`)
- Top preview:
  - desktop `max-h-[44px]`
  - mobile `max-h-[36px]`
- Hero preview:
  - desktop `aspect-[11/4]`
  - mobile `aspect-[2/1]`
- Sidebar preview:
  - `aspect-square max-h-[180px]`

## Verification Results

Executed focused tests:
- `components/__tests__/TopAdBanner.contract.test.tsx`
- `components/__tests__/BannerCarousel.visual-contract.test.tsx`
- `components/__tests__/BannerPlacementPreview.test.tsx`
- `app/components/__tests__/HomeContent.banner-layout.test.tsx`

Result:
- 4 files passed
- 10 tests passed

Validation gate:
- `npm run lint` passed
- `npx tsc --noEmit` passed
- `npm run audit:dead-links` passed
- `npm run audit:sidebar-routes` passed

## Notes

- This checkpoint captures code-level and test-level evidence for ratio changes.
- No image screenshot artifacts were generated in this CLI session.
