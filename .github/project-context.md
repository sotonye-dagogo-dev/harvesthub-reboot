# HarvestHub E-Commerce Platform - Project Context

## Project Vision

HarvestHub is a comprehensive e-commerce marketplace designed to connect buyers and vendors through a secure, modern digital platform. Built specifically for the Nigerian market with a focus on Lagos-based vendors and church community integration, HarvestHub provides a trusted ecosystem where vendors can establish digital storefronts, manage products, and fulfill orders while buyers enjoy a seamless shopping experience with flexible delivery and pickup options.

The platform emphasizes community trust, integrated wallet functionality for smooth transactions, and church-affiliated vendor support through pickup options at church services. HarvestHub aims to empower small businesses and vendors within the Christian community and beyond, creating economic opportunities while maintaining high standards of service and security.

## Core Features

### 1. User Management & Access Control

- **Three-Tier Role System**: Admin (platform management), Vendor (store owners), Buyer (customers)
- **Comprehensive Registration**: Role-based signup with vendor verification
- **Profile Management**: User profiles with personal info, addresses, preferences
- **Authentication**: JWT-based auth with httpOnly cookies and token refresh
- **Role-Based Access Control**: Enforced at routing, API, and UI levels

### 2. Product Management

- **Product Listings**: Title, description, price, images, variants (size, color)
- **Categories**: Farm Produce, Fashion, Food & Beverages, Beauty, Electronics, etc.
- **Inventory Tracking**: Stock levels, low stock alerts
- **Product Status**: Active, inactive, out of stock
- **Product Variants**: Multiple options per product (size, color, etc.)
- **Product Images**: Multiple images per product with main image selection

### 3. Vendor Storefronts

- **Vendor Registration**:
  - Store category selection
  - WhatsApp contact with auto +234 prefix
  - Campus/location selection (Lagos areas or Outside Lagos)
  - Business verification
  - Admin approval workflow
- **Store Customization**: Store name, logo, banner, description
- **Store Settings**: Business hours, policies, pickup/delivery options
- **Store Analytics**: Sales reports, product performance, customer insights
- **Store Categories**: Farm Produce, Fashion, Food, Beauty, etc.

### 4. Shopping Cart & Checkout

- **Cart Management**: Add, update, remove items with quantity selection
- **Cart Persistence**: Cart saved across sessions
- **Checkout Flow**:
  - Cart review
  - Delivery method selection (pickup or delivery)
  - Address entry (for delivery)
  - Payment method selection
  - Order confirmation
- **Multi-vendor Cart**: Handle products from multiple vendors

### 5. Order Management

- **Order Processing**:
  - Order creation and confirmation
  - Status tracking (pending, confirmed, ready, completed, cancelled)
  - Order history for buyers
  - Incoming orders for vendors
- **Order Details**: Items, quantities, prices, delivery info, status
- **Order Tracking**: Real-time status updates and notifications
- **Order Fulfillment**: Vendor marks orders ready for pickup/delivery
- **Cancellations**: Buyer can cancel before processing, refund to wallet

### 6. Delivery & Pickup Options

- **Church Pickup**:
  - Sunday Service (First/Second)
  - Midweek Service
  - Special Events
  - Campus selection (Oregun HQ, Lekki, VI, Ikeja, Festac, Ajah)
- **Home Delivery**:
  - Address entry with location details
  - Delivery zone calculation
  - Delivery fee based on location
  - Estimated delivery time
- **Vendor Settings**: Each vendor sets available pickup/delivery options

### 7. Wallet System

- **Buyer Wallet**:
  - Deposit funds (mock integration initially)
  - Pay for orders with wallet balance
  - View transaction history
  - Receive refunds to wallet
- **Vendor Wallet**:
  - Receive payments from sales
  - Request withdrawals
  - View earnings and commissions
  - Transaction history
- **Admin Wallet Controls**:
  - Approve/reject withdrawal requests
  - Process refunds
  - Monitor all transactions
  - Manual adjustments when needed
- **Transaction Types**: Deposit, withdrawal, payment, refund, commission

### 8. Promotional Banners

- **Banner Display**: Auto-rotating carousel on home page
- **Banner Management (Admin)**:
  - Create banners with image, title, link
  - Schedule banners (start/end dates)
  - Set banner priority/order
  - Active/inactive status
  - Click tracking analytics
- **Banner Types**: Product promotions, vendor spotlights, seasonal offers

### 9. Product Reviews & Ratings

- **Review System**:
  - 1-5 star ratings
  - Written reviews
  - Optional review photos
  - Review after purchase only
- **Review Display**:
  - Product page reviews
  - Average rating calculation
  - Rating distribution
  - Helpful votes
  - Sort/filter reviews (recent, helpful, rating)
- **Review Moderation**: Admin can moderate inappropriate reviews

### 10. Search & Discovery

- **Search Functionality**:
  - Product search by name, description, category
  - Vendor search
  - Search autocomplete
  - Search history
- **Filtering**:
  - Category filters
  - Price range
  - Vendor filter
  - Location filter (Lagos areas)
  - Rating filter
- **Sorting**: Price (low to high, high to low), popularity, rating, newest
- **Product Discovery**: Featured products, trending, new arrivals, recommendations

### 11. Notifications System

- **Notification Types**:
  - Order confirmation and updates
  - Payment confirmations
  - Delivery/pickup reminders
  - Vendor application status
  - New order alerts (vendors)
  - Low stock alerts (vendors)
  - Promotional notifications
- **Notification Channels**: In-app notifications (with future SMS/email support)
- **Notification Preferences**: Users control notification types

### 12. Admin Dashboard

- **Platform Overview**:
  - Total sales and revenue
  - Active vendors and buyers
  - Total products and orders
  - System health metrics
- **Vendor Management**:
  - Approve/reject vendor applications
  - Suspend/activate vendors
  - Monitor vendor performance
  - Set commission rates
- **Content Management**:
  - Manage promotional banners
  - Product moderation
  - Review moderation
- **Platform Settings**:
  - Campus/location management
  - Delivery zones setup
  - Category management
  - Payment gateway config

## Technical Architecture

### Frontend Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript (strict mode, no `any`)
- **UI Library**: Ant Design 5.x
- **Styling**: Tailwind CSS 3.x with custom purple theme
- **State Management**:
  - React Context (auth, theme)
  - Zustand (cart, complex client state)
  - Server State (Server Components, Server Actions)
- **Validation**: Zod schemas
- **Date Handling**: date-fns
- **Icons**: Ant Design Icons

### Authentication & Authorization

- **Strategy**: JWT tokens (access + refresh)
- **Storage**: httpOnly cookies for secure token storage
- **Flow**:
  1. User login → Server validates → JWT tokens generated
  2. Access token (15min expiry) stored in httpOnly cookie
  3. Refresh token (7 days expiry) stored in httpOnly cookie
  4. Automatic token refresh before expiry
- **Role-Based Access Control (RBAC)**:
  - Middleware protection for routes
  - API endpoint authorization
  - UI component conditional rendering
- **Password Security**: bcryptjs hashing (10+ salt rounds)

### State Management Patterns

#### Auth State (React Context)

```typescript
interface AuthState {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (credentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

#### Cart State (Zustand)

```typescript
interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product, quantity) => void;
  updateItem: (itemId, quantity) => void;
  removeItem: (itemId) => void;
  clearCart: () => void;
}
```

#### Theme State (React Context)

```typescript
interface ThemeState {
  mode: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (mode) => void;
}
```

### Data Flow Architecture

```
User Action
    ↓
Server Action / API Route
    ↓
Mock DB / Prisma (production)
    ↓
Data Validation (Zod)
    ↓
Business Logic
    ↓
Response
    ↓
UI Update (optimistic or after response)
    ↓
Revalidation
```

### Theme System

#### Color Palette

- **Primary**: Neon Purple (#9333ea, #a855f7)
- **Dark Variants**: Purple-700 (#7e22ce), Purple-800 (#6b21a8)
- **Light Variants**: Purple-400 (#c084fc), Purple-300 (#d8b4fe)
- **Success**: Green-500 (#22c55e)
- **Warning**: Amber-500 (#f59e0b)
- **Error**: Red-500 (#ef4444)
- **Info**: Blue-500 (#3b82f6)

#### Dark Mode

- Tailwind dark mode with class strategy
- Dark backgrounds: Gray-900, Gray-800
- Dark text: Gray-100, Gray-200
- Purple accents adjusted for dark backgrounds

## Mock Backend Structure (Phases 1-13)

### TypeScript Mock Database

Located in `app/lib/data/mockData.ts`:

```typescript
// Sample structure
export const users: User[] = [
  {
    id: "1",
    email: "admin@harvesthub.com",
    password: "$2a$10$...", // bcrypt hashed
    firstName: "Admin",
    lastName: "User",
    role: "ADMIN",
    phone: "+2348012345678",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // ... vendors and buyers
];

export const products: Product[] = [...];
export const vendors: Vendor[] = [...];
export const orders: Order[] = [...];
export const carts: Cart[] = [...];
export const wallets: Wallet[] = [...];
export const transactions: Transaction[] = [...];
export const banners: Banner[] = [...];
export const reviews: Review[] = [...];
export const addresses: Address[] = [...];
```

### In-Memory Database Service

Located in `app/lib/data/database.ts`:

```typescript
export const db = {
  users: {
    findById: (id: string) => User | undefined,
    findByEmail: (email: string) => User | undefined,
    create: (data: CreateUserInput) => User,
    update: (id: string, data: UpdateUserInput) => User,
    delete: (id: string) => boolean,
    findAll: () => User[],
  },
  products: {
    findById: (id: string) => Product | undefined,
    findAll: (filters?: ProductFilters) => Product[],
    create: (data: CreateProductInput) => Product,
    update: (id: string, data: UpdateProductInput) => Product,
    delete: (id: string) => boolean,
    search: (query: string) => Product[],
  },
  // ... other resources
};
```

### Next.js API Routes

All endpoints follow RESTful conventions in `/app/api/`:

- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Vendors**: `/api/vendors/*`
- **Products**: `/api/products/*`
- **Cart**: `/api/cart/*`
- **Orders**: `/api/orders/*`
- **Wallet**: `/api/wallet/*`
- **Banners**: `/api/banners/*`
- **Reviews**: `/api/reviews/*`

## Production Database Architecture (Phase 15+)

### Database Stack

- **ORM**: Prisma 5.x
- **Database**: PostgreSQL 14+
- **Caching**: Redis (Upstash)
- **File Storage**: Cloudinary

### Database Models

#### User Model

```prisma
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  password        String
  firstName       String
  lastName        String
  phone           String?
  whatsappPhone   String?
  role            UserRole  @default(BUYER)
  avatar          String?   // Cloudinary URL
  isActive        Boolean   @default(true)
  isVerified      Boolean   @default(false)

  // Relations
  vendor          Vendor?
  addresses       Address[]
  orders          Order[]
  cart            Cart?
  wallet          Wallet?
  reviews         Review[]
  notifications   Notification[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([email])
  @@index([role])
}

enum UserRole {
  ADMIN
  VENDOR
  BUYER
}
```

#### Vendor Model

```prisma
model Vendor {
  id              String    @id @default(uuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id])

  storeName       String
  storeSlug       String    @unique
  description     String?
  category        VendorCategory
  logo            String?   // Cloudinary URL
  banner          String?   // Cloudinary URL
  whatsappPhone   String
  campus          Campus
  isOutsideLagos  Boolean   @default(false)

  isApproved      Boolean   @default(false)
  isActive        Boolean   @default(true)

  // Settings
  allowsPickup    Boolean   @default(true)
  allowsDelivery  Boolean   @default(true)
  deliveryZones   String[]

  // Relations
  products        Product[]
  orders          Order[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([userId])
  @@index([storeSlug])
  @@index([category])
  @@index([campus])
}

enum VendorCategory {
  FARM_PRODUCE
  FASHION_APPAREL
  FOOD_BEVERAGES
  BEAUTY_COSMETICS
  ELECTRONICS
  HOME_KITCHEN
  BOOKS_STATIONERY
  SERVICES
  CRAFTS
  OTHERS
}

enum Campus {
  OREGUN_HQ
  LEKKI
  VICTORIA_ISLAND
  IKEJA
  FESTAC
  AJAH
  OUTSIDE_LAGOS
}
```

#### Product Model

```prisma
model Product {
  id              String    @id @default(uuid())
  vendorId        String
  vendor          Vendor    @relation(fields: [vendorId], references: [id])

  name            String
  slug            String    @unique
  description     String
  category        ProductCategory

  price           Decimal   @db.Decimal(10, 2)
  comparePrice    Decimal?  @db.Decimal(10, 2)

  images          String[]  // Cloudinary URLs
  mainImage       String

  stock           Int       @default(0)
  sku             String?

  // Variants (JSON field or separate table)
  variants        Json?

  isActive        Boolean   @default(true)
  isFeatured      Boolean   @default(false)

  // Relations
  cartItems       CartItem[]
  orderItems      OrderItem[]
  reviews         Review[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([vendorId])
  @@index([slug])
  @@index([category])
  @@index([isActive, isFeatured])
}

enum ProductCategory {
  FARM_PRODUCE
  FASHION_APPAREL
  FOOD_BEVERAGES
  BEAUTY_COSMETICS
  ELECTRONICS
  HOME_KITCHEN
  BOOKS_STATIONERY
  SERVICES
  CRAFTS
  OTHERS
}
```

#### Order Model

```prisma
model Order {
  id              String      @id @default(uuid())
  orderNumber     String      @unique

  buyerId         String
  buyer           User        @relation(fields: [buyerId], references: [id])

  vendorId        String
  vendor          Vendor      @relation(fields: [vendorId], references: [id])

  items           OrderItem[]

  subtotal        Decimal     @db.Decimal(10, 2)
  deliveryFee     Decimal     @db.Decimal(10, 2) @default(0)
  total           Decimal     @db.Decimal(10, 2)

  status          OrderStatus @default(PENDING)
  paymentStatus   PaymentStatus @default(PENDING)
  paymentMethod   PaymentMethod

  // Delivery
  deliveryMethod  DeliveryMethod
  deliveryAddress Address?    @relation(fields: [addressId], references: [id])
  addressId       String?
  pickupLocation  Campus?
  pickupService   PickupService?

  notes           String?

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([buyerId])
  @@index([vendorId])
  @@index([orderNumber])
  @@index([status])
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  READY
  COMPLETED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

enum PaymentMethod {
  WALLET
  CARD
  BANK_TRANSFER
  USSD
}

enum DeliveryMethod {
  PICKUP
  DELIVERY
}

enum PickupService {
  SUNDAY_FIRST
  SUNDAY_SECOND
  MIDWEEK
  SPECIAL_EVENT
}
```

#### Wallet & Transaction Models

```prisma
model Wallet {
  id              String        @id @default(uuid())
  userId          String        @unique
  user            User          @relation(fields: [userId], references: [id])

  balance         Decimal       @db.Decimal(10, 2) @default(0)

  transactions    Transaction[]

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([userId])
}

model Transaction {
  id              String          @id @default(uuid())
  walletId        String
  wallet          Wallet          @relation(fields: [walletId], references: [id])

  type            TransactionType
  amount          Decimal         @db.Decimal(10, 2)
  balanceBefore   Decimal         @db.Decimal(10, 2)
  balanceAfter    Decimal         @db.Decimal(10, 2)

  reference       String          @unique
  description     String

  relatedOrderId  String?
  status          TransactionStatus @default(COMPLETED)

  createdAt       DateTime        @default(now())

  @@index([walletId])
  @@index([reference])
  @@index([createdAt])
}

enum TransactionType {
  DEPOSIT
  WITHDRAWAL
  PAYMENT
  REFUND
  COMMISSION
  PAYOUT
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
  REVERSED
}
```

#### Review Model

```prisma
model Review {
  id              String    @id @default(uuid())

  productId       String
  product         Product   @relation(fields: [productId], references: [id])

  userId          String
  user            User      @relation(fields: [userId], references: [id])

  rating          Int       // 1-5
  comment         String?
  images          String[]  // Cloudinary URLs

  helpfulCount    Int       @default(0)

  isApproved      Boolean   @default(true)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([productId, userId]) // One review per user per product
  @@index([productId])
  @@index([userId])
  @@index([rating])
}
```

#### Banner Model

```prisma
model Banner {
  id              String    @id @default(uuid())

  title           String
  image           String    // Cloudinary URL
  link            String?

  priority        Int       @default(0)

  isActive        Boolean   @default(true)
  startDate       DateTime?
  endDate         DateTime?

  clicks          Int       @default(0)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([isActive, priority])
  @@index([startDate, endDate])
}
```

## Nigerian Market Specifics

### Location & Logistics

#### Lagos Campus Locations

1. **Oregun (Headquarters)** - Main campus
2. **Lekki** - Lekki Peninsula area
3. **Victoria Island** - VI business district
4. **Ikeja** - Ikeja and environs
5. **Festac** - Festac Town
6. **Ajah** - Ajah and Badore area
7. **Outside Lagos** - Other Nigerian states

#### Delivery Zones

- **Zone 1**: Within 5km of campus (₦500-1000)
- **Zone 2**: 5-10km from campus (₦1000-1500)
- **Zone 3**: 10-20km from campus (₦1500-2500)
- **Zone 4**: Outside Lagos (custom quotes)

#### Pickup Services

- **Sunday Service (First)**: 7:00 AM - 9:30 AM
- **Sunday Service (Second)**: 9:30 AM - 12:00 PM
- **Midweek Service**: Wednesday 6:00 PM - 8:00 PM
- **Special Events**: As scheduled

### Phone Number Handling

- **Country Code**: Auto-prefix +234 for all Nigerian numbers
- **WhatsApp Integration**: Direct WhatsApp contact links
- **Format**: +234 XXX XXX XXXX
- **Validation**: Ensure 11 digits after +234

### Payment Methods (Future Integration)

#### Paystack (Primary)

- Card payments (Visa, Mastercard, Verve)
- Bank transfers
- USSD
- Mobile money

#### Flutterwave (Backup)

- Similar payment options
- International card support

#### Wallet

- Instant payment
- Balance management
- Refund handling

### Currency

- **Currency**: Nigerian Naira (₦, NGN)
- **Format**: ₦1,234.56
- **Minimum Transaction**: ₦100

## Security Considerations

### Authentication Security

- Password hashing with bcrypt (10+ salt rounds)
- JWT access tokens (15min expiry)
- JWT refresh tokens (7 days expiry)
- httpOnly cookies (prevent XSS)
- Secure cookie flag in production
- CSRF protection

### API Security

- Rate limiting per endpoint
- Input validation with Zod
- SQL injection prevention (Prisma ORM)
- XSS prevention (sanitize user input)
- CORS configuration
- API key protection

### Data Privacy

- Role-based data access
- Vendors access only their data
- Buyers access only their data
- Admin auditing logs
- Secure password reset flow
- Email verification

### Payment Security

- PCI DSS compliant gateways
- No card data storage
- Secure webhook verification
- Transaction logging
- Refund safeguards

## Performance Optimizations

### Frontend Optimizations

- Server Components by default
- Dynamic imports for heavy components
- Image optimization with Next.js Image
- Code splitting by route
- Memoization of expensive computations
- Virtual scrolling for long lists

### Backend Optimizations

- Database indexing on frequently queried fields
- Cursor-based pagination
- Redis caching for expensive queries
- N+1 query prevention with Prisma includes
- Connection pooling
- Rate limiting to prevent abuse

### Asset Optimizations

- Cloudinary image transformations
- Lazy loading images
- WebP format support
- SVG for icons
- Font optimization

## Scalability Considerations

### Horizontal Scaling

- Stateless API design
- JWT tokens (no session storage)
- Redis for shared cache
- CDN for static assets
- Load balancer ready

### Database Scaling

- Read replicas for analytics
- Connection pooling
- Query optimization
- Proper indexing strategy
- Archiving old data

### Future Microservices

- Payment service
- Notification service
- Search service (Elasticsearch)
- Analytics service
- Image processing service

## Testing Strategy

### Unit Tests

- Utility functions
- Validation schemas
- Data transformations
- Business logic

### Integration Tests

- API endpoints
- Authentication flow
- Payment processing
- Order workflow

### E2E Tests

- User registration and login
- Product browsing and purchase
- Vendor product management
- Admin approval workflows

### Performance Tests

- Lighthouse CI
- Core Web Vitals
- Bundle size monitoring
- API response times

## Development Workflow

### Git Workflow

- Main branch (production)
- Develop branch (staging)
- Feature branches (feature/feature-name)
- Pull requests with reviews
- Semantic versioning

### Code Quality

- ESLint for linting
- Prettier for formatting
- TypeScript strict mode
- Pre-commit hooks (husky + lint-staged)
- Code reviews

### CI/CD Pipeline

- Automated tests on PR
- Build verification
- Deploy preview on PR
- Auto-deploy to production on merge
- Rollback capability

## Future Enhancements

### Phase 20+

- **Group Buying**: Bulk discounts, community deals
- **Service Marketplace**: Book services like Fiverr
- **Wholesale Section**: B2B orders with MOQ
- **AI Recommendations**: Personalized product suggestions
- **Advanced Analytics**: Vendor dashboards, buyer insights
- **Multi-language**: Support for other Nigerian languages
- **Mobile App**: React Native iOS/Android apps
- **Subscription Products**: Recurring purchases
- **Loyalty Program**: Points and rewards
- **Referral System**: Invite friends, earn rewards
- **Live Chat**: Real-time buyer-vendor communication
- **Video Shopping**: Live product demonstrations

---

**Last Updated**: January 24, 2026
**Current Phase**: Phase 1 - Foundation Setup
**Target MVP Launch**: Phase 13 completion
