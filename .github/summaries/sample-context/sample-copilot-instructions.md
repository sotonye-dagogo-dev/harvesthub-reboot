# GitHub Copilot Instructions for Harvesters Small Groups CRM

## Project Overview

Harvesters Small Groups CRM is a centralized, data-driven web application that enables Harvesters International Christian Centre to effectively manage small group meetings, track member engagement, and support pastoral care through structured insights, accountability, and informed decision-making. Built for Harvesters' vision of changing lives by pioneering thriving churches across Nigeria, the United Kingdom, and the United States of America.

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
- **State Management**: React Context API
- **API**: Mock backend (TypeScript-based, migration-ready)
- **Authentication**: JWT tokens with httpOnly cookies
- **Database (Future)**: PostgreSQL with Prisma ORM
- **Caching (Future)**: Redis
- **File Storage (Future)**: Cloudinary

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
- Ensure dark mode support

### SEO

- Optimize metadata for SEO
- Implement Open Graph tags for social sharing
- Generate a sitemap

### PWA Features

- Implement service workers for offline support
- Ensure the app is installable on devices
- Set up push notifications for meeting reminders and updates

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

- Components: PascalCase (e.g., `GroupCard.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- API routes: lowercase with hyphens (e.g., `group-members`)

### Ant Design Usage

- Import components from 'antd'
- Use Ant Design theme configuration
- Combine with Tailwind for custom styling
- Use Ant Design icons from '@ant-design/icons'
- Leverage Ant Design's Form, Table, Modal, and DatePicker components

### API Patterns

- Use Server Actions for mutations
- Use async Server Components for data fetching
- Mock data structure should match production API shape
- Handle loading and error states properly
- Implement proper error handling and user feedback

## Common Patterns

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
- Implement proper validation
- Use Server Actions for submissions
- Provide clear error messages

## Directory Structure Preferences

```
app/
├── (auth)/
│   ├── login/
│   ├── register/
│   └── layout.tsx
├── (superadmin)/
│   ├── dashboard/
│   ├── groups/
│   ├── members/
│   ├── analytics/
│   └── layout.tsx
├── (leader)/
│   ├── dashboard/
│   ├── my-group/
│   ├── meetings/
│   ├── members/
│   └── layout.tsx
├── (member)/
│   ├── dashboard/
│   ├── my-group/
│   ├── history/
│   └── layout.tsx
├── api/
│   ├── auth/
│   ├── users/
│   ├── groups/
│   ├── meetings/
│   ├── interactions/
│   └── analytics/
├── components/
│   ├── ui/
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   └── Table/
│   └── features/
│       ├── auth/
│       ├── groups/
│       ├── meetings/
│       ├── members/
│       └── navigation/
├── lib/
│   ├── utils/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── format.ts
│   │   └── validation.ts
│   ├── types.ts
│   ├── constants/
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useGroup.ts
│   └── data/
│       ├── mockData.ts
│       └── database.ts
├── providers/
│   ├── AntdProvider.tsx
│   └── AuthProvider.tsx
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

- Use Next.js Image component
- Implement proper code splitting
- Use dynamic imports for heavy components
- Optimize bundle size
- Implement proper pagination for lists

## Accessibility

- Use semantic HTML
- Implement proper ARIA labels
- Ensure keyboard navigation
- Use Ant Design's built-in accessibility features
- Test with screen readers

## State Management

- Use React Context for global state (auth, theme, user role)
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

### Production (Phase 5): Database Integration

#### Prisma ORM

- Use Prisma Client for all database operations
- Never write raw SQL (Prisma prevents SQL injection)
- Always use singleton pattern: `import { prisma } from '@/lib/db/prisma'`
- Use transactions for multi-step operations
- Select only needed fields: `select: { id: true, name: true }`
- Use proper relations: `include: { leader: true, members: true }`
- Implement cursor-based pagination, not offset-based

```typescript
// Good: Cursor-based pagination
const meetings = await prisma.meeting.findMany({
  take: 20,
  cursor: cursor ? { id: cursor } : undefined,
  skip: cursor ? 1 : 0,
  orderBy: { createdAt: "desc" },
});

// Bad: Offset-based pagination (slow at scale)
const meetings = await prisma.meeting.findMany({
  take: 20,
  skip: page * 20, // Don't do this
});
```

#### Cloudinary Image Management

- Upload meeting screenshots using `uploadImage()` from `lib/utils/cloudinary.ts`
- Always delete old images before uploading new ones
- Store Cloudinary URLs in database, not local paths
- Use appropriate upload preset (avatar or meetingImage)
- Validate files client-side before upload
- Handle upload failures gracefully

```typescript
// Image upload pattern
try {
  // Validate
  const validation = validateImageFile(file);
  if (!validation.valid) throw new Error(validation.error);

  // Convert to base64
  const base64 = await fileToBase64(file);

  // Upload
  const result = await uploadImage(base64, "meetingImage");

  // Store URL in database
  await prisma.meeting.update({
    where: { id: meetingId },
    data: { screenshotUrl: result.url },
  });
} catch (error) {
  // Handle error
}
```

#### Redis Caching

- Check cache before database queries
- Set appropriate TTLs (5-30 minutes)
- Invalidate cache on writes
- Use structured cache keys: `{resource}:{id}:{variant}`

```typescript
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache/redis';

// Cache pattern
const cacheKey = CACHE_KEYS.groupMembers(groupId);
const cached = await cache.get(cacheKey);

if (cached) return cached;

const data = await prisma.member.findMany({...});
await cache.set(cacheKey, data, CACHE_TTL.members);

return data;
```

#### Rate Limiting

- Apply rate limits to all API routes
- Use `rateLimitByUser()` for authenticated routes
- Use `rateLimitByIP()` for public routes
- Return 429 status with Retry-After header

```typescript
import { rateLimitByUser } from "@/lib/utils/rateLimiter";

const rateLimit = await rateLimitByUser(userId, {
  maxRequests: 10,
  windowSeconds: 3600, // 1 hour
});

if (!rateLimit.success) {
  return NextResponse.json(
    { error: "Rate limit exceeded" },
    { status: 429, headers: { "Retry-After": String(rateLimit.reset) } }
  );
}
```

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

```typescript
try {
  // Database operation
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Resource already exists" },
        { status: 409 }
      );
    }
  }
  console.error("Database error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

#### Performance Guidelines

- Use indexes for frequently queried fields
- Avoid N+1 queries (use `include` or `select` with relations)
- Implement pagination on all list endpoints
- Cache expensive queries
- Use connection pooling (Prisma default)
- Monitor slow queries in production
- Use database-level constraints (unique, foreign keys)

#### Migration Strategy

- Never modify Prisma schema directly in production
- Always create migration: `npx prisma migrate dev`
- Review generated SQL before applying
- Test migrations on staging first
- Use `prisma migrate deploy` for production
- Keep migrations in version control
- Document breaking changes

## Role-Based Features

### Superadmin

- Full visibility into all groups and users
- Assign and revoke group leader roles
- Create or manage groups
- Monitor overall engagement metrics
- Ensure data integrity and compliance

### Group Leader

- Create and manage subgroup meetings
- Track attendance and member participation
- Log meeting and communication activities
- Approve or reject membership requests
- Monitor subgroup performance

### Member

- Maintain personal profile information
- Request to join or change subgroups
- Participate in meetings
- View personal participation history

## Data Privacy & Compliance

- Respect user privacy in all features
- Implement proper data access controls
- Ensure leaders can only access their group's data
- Provide members control over their data
- Implement audit logs for sensitive operations
- Follow church data protection policies
