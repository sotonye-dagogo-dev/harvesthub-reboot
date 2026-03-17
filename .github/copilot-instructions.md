# GitHub Copilot Instructions for HarvestHub E-Commerce Platform

## Project Overview

HarvestHub is a comprehensive e-commerce marketplace platform that enables buyers and vendors to connect through a secure, feature-rich digital ecosystem. The platform includes vendor storefronts, product listings, an integrated wallet system, promotional banners, pickup/delivery options, and church-affiliated vendor support. Built with modern web technologies and designed for scalability, HarvestHub aims to create a trusted marketplace that serves the Nigerian market with a focus on Lagos-based vendors and church community integration. The repo is configured for automated ai-assisted development; refer to `.ai-system/` for safe agent guidance and procedures.

NOTE: Primary AI agent guidance and operational procedures have been migrated into the `.ai-system/` directory. Agents should consult `.ai-system/` (especially `.ai-system/agents/general-instructions.md`) before following guidance in this file to avoid conflicting instructions.

## Development Approach

**⚡ CRITICAL**: This project is being built by **refactoring an existing Martgram codebase** to accelerate development. This means:

- Leverage existing components (signup flow, providers, types) where appropriate
- Update dependencies from Next.js 14 → 15, React 18 → 19
- Transform incrementally rather than rebuilding from scratch
- Maintain referential integrity from the start with relational mock data
- Prioritize comprehensive types and empty state handling to avoid bugs

## Note

- Make sure to follow the coding standards and architectural guidelines outlined in the project documentation.
- Make use of plan and project context files for reference. Provide as close to production-ready code as possible.
- Leave nothing unimplemented but with flexibility and consideration of scalability.
- Store any summary files in the '.github/summaries' directory for organization.
- When an error/issue is encountered, find and fix all instances of that error/issue throughout the entire codebase.

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + Ant Design (antd)
- **State Management**: React Context API + Zustand (for complex state)
- **API**: Mock backend (TypeScript-based, migration-ready)
- **Authentication**: JWT tokens with httpOnly cookies
- **Database (Future)**: PostgreSQL with Prisma ORM
- **Caching (Future)**: Redis (Upstash)
- **File Storage (Future)**: Cloudinary
- **Payment (Future)**: Paystack, Flutterwave

## Code Style Guidelines

### TypeScript

- Use strict TypeScript settings
- Always define proper types/interfaces (no `any`)
- Use type inference where appropriate
- Prefer `interface` over `type` for object shapes
- Use proper generics for reusable components
- Apart from component interfaces, globally define all types and interfaces in `lib/types.ts` file
- No need to manually import custom types and interfaces in files, as they are already included in `tsconfig.json`

### React/Next.js

- Use App Router exclusively (not Pages Router)
- Prefer Server Components by default
- Mark Client Components with `'use client'` directive only when needed
- Use proper loading.tsx, error.tsx, and not-found.tsx patterns
- Implement proper metadata exports
- Use Server Actions for mutations

### Styling

- Use Tailwind CSS utility classes expertly for layout and custom styles
- Reduce vanilla CSS to absolute bare minimum by using '[]' in tailwind classes when needed and @apply directive in global CSS
- Use Ant Design components for common UI elements
- Combine Tailwind and Ant Design styles as needed
- Mobile-first responsive design
- Ensure dark mode support using Tailwind's dark mode classes

### Color Scheme

- **Primary Color**: Neon Purple (`#9333ea` - purple-600 / `#a855f7` - purple-500)
- **Accent Colors**:
  - Purple-700 (`#7e22ce`) for darker variants
  - Purple-400 (`#c084fc`) for lighter variants
  - Purple-300 (`#d8b4fe`) for backgrounds
- **Dark Mode**: Use purple variants with appropriate opacity and contrast
- **Light Mode**: Use purple with white/gray backgrounds
- **Semantic Colors**:
  - Success: Green-500 (`#22c55e`)
  - Warning: Amber-500 (`#f59e0b`)
  - Error: Red-500 (`#ef4444`)
  - Info: Blue-500 (`#3b82f6`)

### SEO

- Optimize metadata for SEO
- Implement Open Graph tags for social sharing
- Generate a sitemap
- Use semantic HTML

### Future: PWA Features (Phase 17+)

**Note**: PWA functionality is deferred to later phases. Focus on core features first.

- Service workers for offline support (future)
- Installable app capability (future)
- Push notifications (future)
- Progressive enhancement approach

### Component Structure

```typescript
// Example structure
interface ComponentProps {
  // Props definition
}

export function ComponentName({ prop }: ComponentProps) {
  // Component logic
}
```

### File Naming

- Components: PascalCase (e.g., `ProductCard.tsx`)
- Utilities: camelCase (e.g., `formatCurrency.ts`)
- API routes: lowercase with hyphens (e.g., `products`)

### Ant Design Usage

- Import components from 'antd'
- Use Ant Design theme configuration with purple primary color
- Combine with Tailwind for custom styling
- Use Ant Design icons from '@ant-design/icons'
- Leverage Ant Design's Form, Table, Modal, Upload, and Carousel components

### API Patterns

- Use Server Actions for mutations
- Use async Server Components for data fetching
- Mock data structure should match production API shape
- Handle loading and error states properly
- Implement proper error handling and user feedback

## Common Patterns

### Empty State Handling ⚡ CRITICAL

**Always handle empty/null data gracefully to prevent bugs**:

```typescript
// Always check for null/undefined
const user = await db.users.findById(id);
if (!user) {
  return { error: "User not found" };
}

// Use optional chaining
const vendorName = user?.vendor?.storeName ?? "Unknown Store";

// Handle empty arrays
const products = await db.products.findAll();
if (products.length === 0) {
  return <EmptyProductsState />;
}

// Provide defaults with nullish coalescing
const balance = wallet?.balance ?? 0;
```

### Authentication

```typescript
// Check auth in Server Components
import { cookies } from "next/headers";

const token = cookies().get("accessToken");
```

### Data Fetching

```typescript
// Server Component
async function getData() {
  const res = await fetch("http://localhost:3001/endpoint");
  return res.json();
}
```

### Form Handling

- Use Ant Design Form components
- Implement proper validation with Zod schemas
- Use Server Actions for submissions
- Provide clear error messages
- Auto-fill country code (+234) for phone numbers

## Directory Structure Preferences

```
app/
├── (auth)/
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   └── layout.tsx
├── (buyer)/
│   ├── page.tsx (home)
│   ├── products/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   ├── wallet/
│   ├── profile/
│   └── layout.tsx
├── (vendor)/
│   ├── dashboard/
│   ├── products/
│   ├── orders/
│   ├── analytics/
│   ├── wallet/
│   ├── store-settings/
│   └── layout.tsx
├── (admin)/
│   ├── dashboard/
│   ├── vendors/
│   ├── products/
│   ├── orders/
│   ├── users/
│   ├── banners/
│   ├── analytics/
│   └── layout.tsx
├── api/
│   ├── auth/
│   ├── users/
│   ├── vendors/
│   ├── products/
│   ├── orders/
│   ├── cart/
│   ├── wallet/
│   ├── banners/
│   └── reviews/
├── components/
│   ├── ui/
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   ├── Table/
│   │   └── Modal/
│   └── features/
│       ├── auth/
│       ├── products/
│       ├── cart/
│       ├── orders/
│       ├── wallet/
│       ├── banners/
│       └── navigation/
├── lib/
│   ├── utils/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── currency.ts
│   ├── types.ts
│   ├── constants/
│   │   └── index.ts
- **Critical**: Test all empty state scenarios
- **Critical**: Test null/undefined data handling
- Verify relational data integrity in mock backend
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCart.ts
│   │   └── useWallet.ts
│   └── data/
│       ├── mockData.ts
│       └── database.ts
├── providers/
│   ├── AntdProvider.tsx
│   ├── AuthProvider.tsx
│   ├── ThemeProvider.tsx
│   └── CartProvider.tsx
├── styles/
│   └── globals.css
└── layout.tsx
```

## Testing Approach

- Write tests for utilities
- Test component logic, not implementation details
- Mock external dependencies
- Use meaningful test descriptions
- Test role-based access control thoroughly

## Performance Considerations

- Use Next.js Image component for all images
- Implement proper code splitting
- Use dynamic imports for heavy components
- Optimize bundle size
- Implement proper pagination for product lists
- Use virtual scrolling for long lists
- Optimize images with Cloudinary transformations

## Accessibility

- Use semantic HTML
- Implement proper ARIA labels
- Ensure keyboard navigation
- Use Ant Design's built-in accessibility features
- Test with screen readers
- Maintain proper color contrast ratios

## State Management

- Use React Context for global state (auth, theme, user role)
- Use Zustand for complex client state (cart, wallet)
- Use local state with hooks for component-specific state
- Avoid unnecessary re-renders by memoizing components and values
- Use Server Actions for server state mutations

## Backend Architecture

### Current (Phase 3-4): Mock Backend

- TypeScript-based mock data in `app/lib/data/mockData.ts`
- In-memory database service in `app/lib/data/database.ts`
- Next.js API routes in `app/api/`
- No persistence across restarts
- Structure matches production database schema

### Production (Phase 5+): Database Integration

#### Prisma ORM

- Use Prisma Client for all database operations
- Never write raw SQL (Prisma prevents SQL injection)
- Always use singleton pattern: `import { prisma } from '@/lib/db/prisma'`
- Use transactions for multi-step operations
- Select only needed fields: `select: { id: true, name: true }`
- Use proper relations: `include: { vendor: true, reviews: true }`
- Implement cursor-based pagination, not offset-based

```typescript
// Good: Cursor-based pagination
const products = await prisma.product.findMany({
  take: 20,
  cursor: cursor ? { id: cursor } : undefined,
  skip: cursor ? 1 : 0,
  orderBy: { createdAt: "desc" },
});
```

#### Cloudinary Image Management

- Upload product images using `uploadImage()` from `lib/utils/cloudinary.ts`
- Always delete old images before uploading new ones
- Store Cloudinary URLs in database, not local paths
- Use appropriate upload preset (product, vendor, banner)
- Validate files client-side before upload
- Handle upload failures gracefully

#### Redis Caching

- Check cache before database queries
- Set appropriate TTLs (5-30 minutes)
- Invalidate cache on writes
- Use structured cache keys: `{resource}:{id}:{variant}`

#### Rate Limiting

- Apply rate limits to all API routes
- Use `rateLimitByUser()` for authenticated routes
- Use `rateLimitByIP()` for public routes
- Return 429 status with Retry-After header

#### Security Best Practices

- Always hash passwords with bcrypt (10+ salt rounds)
- Never log sensitive data (passwords, tokens, phone numbers)
- Validate all inputs with Zod schemas
- Use parameterized queries (Prisma does this)
- Implement CORS for production domain only
- Set secure cookie flags in production
- Rate limit all endpoints
- Sanitize user-generated content
- Implement role-based access control at API level

#### Error Handling

- Use try-catch for all async operations
- Log errors with context (user ID, request ID)
- Return user-friendly error messages
- Don't expose stack traces in production
- Handle Prisma errors specifically

#### Performance Guidelines

- Use indexes for frequently queried fields
- Avoid N+1 queries (use `include` or `select` with relations)
- Implement pagination on all list endpoints
- Cache expensive queries
- Use connection pooling (Prisma default)
- Monitor slow queries in production
- Use database-level constraints (unique, foreign keys)

## Role-Based Features

### Admin

- Full visibility into all vendors, products, and users
- Manage promotional banners
- Approve/reject vendor registrations
- Monitor platform analytics
- Handle disputes and refunds
- Manage platform settings

### Vendor

- Create and manage product listings
- Manage store settings and branding
- Process orders and manage inventory
- View sales analytics
- Manage wallet (withdrawals)
- Set store categories
- Specify pickup/delivery options
- Set campus/location information

### Buyer

- Browse and search products
- Add products to cart
- Place orders with pickup or delivery options
- Manage wallet (deposits, payments)
- Track order status
- Leave product reviews
- Manage profile and preferences
- View order history

## Data Privacy & Compliance

- Respect user privacy in all features
- Implement proper data access controls
- Ensure vendors can only access their own data
- Provide users control over their data
- Implement audit logs for sensitive operations
- Follow data protection best practices
- GDPR/NDPR compliance considerations

## Nigerian Market Specifics

### Location Support

- Default country code: +234 (Nigeria)
- Auto-fill country code for phone/WhatsApp numbers
- Lagos campus locations:
  - Lekki (Headquarters)
  - Victoria Island
  - Ikeja
  - Festac
  - Ajah
  - Outside Lagos (Other States)
- Location-based vendor filtering
- Delivery zones based on Lagos areas

### Payment Integration

- Paystack for card payments
- Flutterwave as backup
- Bank transfer support
- USSD payment options
- Support for NGN currency
- Wallet top-up and withdrawal

### Delivery & Pickup

- Church pickup options:
  - Sunday Service (First/Second)
  - Midweek Service
  - Special Events
- Home delivery with address
- Campus-based pickup points
- Delivery time slots
- Delivery fee calculation by zone

### Vendor Categories

- Farm Produce
- Fashion & Apparel
- Food & Beverages
- Beauty & Cosmetics
- Electronics & Gadgets
- Home & Kitchen
- Books & Stationery
- Services
- Crafts & Handmade
- Others

## Feature Priorities

### Phase 1 (MVP)

- User authentication and roles
- Product listing and browsing
- Shopping cart
- Basic checkout
- Mock wallet system
- Promotional banner display

### Phase 2

- Vendor storefront management
- Order management
- Delivery/pickup options
- Product reviews
- Search and filters

### Phase 3

- Wallet transactions (deposit/withdraw)
- Payment gateway integration
- Order tracking
- Notifications
- Analytics dashboards

### Future Enhancements

- Group buying features
- Service marketplace
- Wholesale section
- AI recommendations
- Mobile app (React Native)
