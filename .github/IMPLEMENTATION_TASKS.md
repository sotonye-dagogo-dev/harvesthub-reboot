# HarvestHub Implementation Tasks

## Completed ✅

1. **Top Ad Banner Made Non-Dismissible**
   - Removed close button and dismiss functionality
   - Banner now permanently visible until page reload
   - Fixed position property reference

2. **JWT Test Fixes**
   - Updated generateRefreshToken calls to include email and role parameters
   - All JWT tests now pass with async/await patterns

3. **Admin & Vendor Dashboard Data Loading**
   - Admin dashboard now shows real counts from mockData:
     - Total Users, Vendors, Products, Orders
     - Calculated Revenue from completed orders
     - Pending Reviews count
   - Vendor dashboard needs similar treatment (partial)

## In Progress ⏳

4. **Route Conflicts Resolved**
   - Removed duplicate (buyer)/profile/page.tsx
   - Removed duplicate (buyer)/wallet/page.tsx
   - Profile and wallet now at root level for all users

## Pending Tasks 📋

### High Priority

5. **Route Restructuring**
   - **Decision**: Keep pages in (buyer) directory as base, create role-specific pages in admin/vendor
   - Move general pages back to (buyer): products, cart, checkout, orders, wallet, profile
   - Keep admin-specific: dashboard, users management, vendor approval, banner management
   - Keep vendor-specific: dashboard, products management, orders management, analytics
   - Remove redundant routes (vendor-wallet, vendor-analytics in root)

6. **Add Product Discounts**
   - Add `discountPercentage?: number` to Product interface
   - Update mockProducts to include discounts (10-30% range)
   - Display discount badges on ProductCard
   - Show original/discounted price

7. **Fix Banner Interface**
   - Add `position: 'TOP' | 'HERO' | 'SIDEBAR'` to Banner interface in types.ts
   - Update mockBanners with position property
   - TopAdBanner filters by position: 'TOP'

8. **Horizontal Scrolling Overflow**
   - Add `overflow-x-auto scrollbar-hide` to horizontal sections
   - Ensure FilterSelector is scrollable on mobile
   - Test on various screen sizes

9. **Header/Footer on All Pages**
   - Wrap wallet/page.tsx with proper layout
   - Wrap profile/page.tsx with proper layout
   - Verify all pages have Header and Footer

10. **Store Creation for All Users**
    - Create /become-vendor page
    - Allow buyers/admins to create vendor profile
    - Form: store name, category, campus, description
    - Updates user role to VENDOR

11. **Back-to-Top Button**
    - Add scroll-to-top button in Footer component
    - Show when scrolled > 500px
    - Smooth scroll animation

### Medium Priority

12. **Implement Help Page Routes**
    - /faqs - FAQ page with accordion
    - /contact - Contact form
    - /about - About HarvestHub
    - /terms - Terms & Conditions
    - /privacy - Privacy Policy

13. **Admin Banner Management**
    - /admin/banners - List all banners
    - Create/Edit/Delete banner forms
    - Image upload, position selection
    - Active/Inactive toggle

14. **Admin Discount Management**
    - /admin/discounts - Discount campaigns
    - Bulk discount application
    - Time-limited offers
    - Product-specific discounts

15. **Vendor Routes**
    - /vendor/analytics - Sales analytics, charts
    - /vendor/products - Product management (create/edit)
    - /vendor/store-settings - Store profile, branding
    - Remove vendor-specific root-level routes

### Low Priority

16. **Enhanced Tests**
    - Component tests for new features
    - Integration tests for workflows
    - E2E tests for critical paths

17. **Performance Optimization**
    - Image optimization
    - Code splitting
    - Lazy loading

## Implementation Order

### Phase 1: Critical Fixes (Do Now)

1. Fix Banner interface - add position property
2. Route restructuring - consolidate pages
3. Add Header/Footer to wallet/profile pages
4. Add product discounts to mockData

### Phase 2: Feature Completion (Next)

1. Horizontal scrolling with overflow
2. Back-to-top button
3. Store creation for all users
4. Help page routes implementation

### Phase 3: Admin Features

1. Banner management
2. Discount management
3. User management enhancements

### Phase 4: Vendor Features

1. Analytics page
2. Product management improvements
3. Store settings

### Phase 5: Polish

1. Test suite expansion
2. Performance optimization
3. Accessibility improvements

## Notes

- All changes should maintain TypeScript strict mode compliance
- Ensure responsive design for all new features
- Follow existing code patterns and conventions
- Update tests for modified components
- Document major architectural decisions
